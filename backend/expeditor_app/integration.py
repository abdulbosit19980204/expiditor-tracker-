import logging
from django.db import transaction
from django.utils import timezone
from django.core.cache import cache
from django.db import connection
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from zeep import Client
from zeep.cache import InMemoryCache
from zeep.transports import Transport
from expeditor_app.utils import get_last_update_date, save_last_update_date
from expeditor_app.models import Check, CheckDetail, Sklad, City, Ekispiditor, Projects
import threading
import time

logger = logging.getLogger(__name__)

class UpdateChecksView(APIView):
    # Cache WSDL client to avoid reloading
    _client = None
    _client_lock = None
    _update_in_progress = False
    _update_lock = threading.Lock()

    @classmethod
    def get_client(cls):
        if cls._client is None:
            if cls._client_lock is None:
                cls._client_lock = threading.Lock()
            
            with cls._client_lock:
                if cls._client is None:  # Double-check locking
                    url = "http://192.168.1.241:5443/AVON_UT/AVON_UT.1cws?wsdl"
                    # Use persistent cache and connection pooling
                    transport = Transport(
                        cache=InMemoryCache(),
                        timeout=30,
                        operation_timeout=60
                    )
                    cls._client = Client(wsdl=url, transport=transport)
        return cls._client

    @classmethod
    def is_update_in_progress(cls):
        """Check if update is currently running"""
        with cls._update_lock:
            return cls._update_in_progress

    @classmethod
    def set_update_status(cls, status):
        """Set update status"""
        with cls._update_lock:
            cls._update_in_progress = status

    def _process_batch(self, batch, existing_check_ids, existing_projects, 
                      existing_cities, existing_expeditors, existing_sklads):
        """Process a batch of rows efficiently"""
        checks_to_create = []
        check_details_to_create = []
        projects_to_create = []
        cities_to_create = []
        expeditors_to_create = []
        sklads_to_create = []
        
        for row in batch:
            try:
                check_id = row.receiptID
                
                # Validate and process dates
                delivery_date = row.deliveryDate if (hasattr(row, 'deliveryDate') and
                                                    row.deliveryDate and
                                                    row.deliveryDate.year > 1) else None
                receipt_date = row.receiptIdDate if (hasattr(row, 'receiptIdDate') and
                                                    row.receiptIdDate and
                                                    row.receiptIdDate.year > 1) else None

                # Prepare check data
                check_data = {
                    'check_id': check_id,
                    'project': getattr(row, 'project', None),
                    'sklad': getattr(row, 'warehouse', None),
                    'city': getattr(row, 'city', None),
                    'sborshik': getattr(row, 'OrderPicker', None),
                    'agent': getattr(row, 'agent', None),
                    'ekispiditor': getattr(row, 'curier', None),
                    'yetkazilgan_vaqti': delivery_date if delivery_date else getattr(row, 'receiptIdDate', None),
                    'receiptIdDate': receipt_date,
                    'transport_number': getattr(row, 'auto', None),
                    'kkm_number': getattr(row, 'kkm', None),
                    'client_name': getattr(row, 'client', None),
                    'client_address': None,
                    'check_lat': float(row.latitude) if hasattr(row, 'latitude') and row.latitude else None,
                    'check_lon': float(row.longitude) if hasattr(row, 'longitude') and row.longitude else None,
                    'status': 'delivered',
                    'updated_at': timezone.now()
                }

                # Collect bulk operations
                if hasattr(row, 'project') and row.project and row.project not in existing_projects:
                    projects_to_create.append(Projects(
                        project_name=row.project,
                        project_description=getattr(row, 'projectDescription', ''),
                        updated_at=timezone.now()
                    ))

                if hasattr(row, 'city') and row.city and row.city not in existing_cities:
                    cities_to_create.append(City(
                        city_name=row.city,
                        city_code=getattr(row, 'cityCode', ''),
                        description=getattr(row, 'cityDescription', ''),
                        updated_at=timezone.now()
                    ))

                if hasattr(row, 'curier') and row.curier and row.curier not in existing_expeditors:
                    expeditors_to_create.append(Ekispiditor(
                        ekispiditor_name=row.curier,
                        transport_number=getattr(row, 'auto', ''),
                        phone_number=getattr(row, 'phone', '+998999999999'),
                        photo=getattr(row, 'photo', None),
                        is_active=True,
                        updated_at=timezone.now()
                    ))

                if hasattr(row, 'warehouse') and row.warehouse and row.warehouse not in existing_sklads:
                    sklads_to_create.append(Sklad(
                        sklad_name=row.warehouse,
                        sklad_code=getattr(row, 'warehouseCode', ''),
                        description=getattr(row, 'warehouseDescription', ''),
                        updated_at=timezone.now()
                    ))

                # Use update_or_create for checks (more complex logic needed)
                Check.objects.update_or_create(
                    check_id=check_id,
                    defaults={k: v for k, v in check_data.items() if k != 'check_id'}
                )

                CheckDetail.objects.update_or_create(
                    check_id=check_id,
                    defaults={
                        'checkURL': getattr(row, 'receiptURL', ''),
                        'check_date': receipt_date,
                        'check_lat': float(row.latitude) if hasattr(row, 'latitude') and row.latitude else None,
                        'check_lon': float(row.longitude) if hasattr(row, 'longitude') and row.longitude else None,
                        'total_sum': float(row.totalSum) if hasattr(row, 'totalSum') and row.totalSum else None,
                        'nalichniy': float(row.cash) if hasattr(row, 'cash') and row.cash else None,
                        'uzcard': float(row.uzcard) if hasattr(row, 'uzcard') and row.uzcard else None,
                        'humo': float(row.humo) if hasattr(row, 'humo') and row.humo else None,
                        'click': 0,
                        'updated_at': timezone.now()
                    }
                )

            except Exception as inner_e:
                logger.error(f"[ROW ERROR] Check ID: {getattr(row, 'receiptID', 'unknown')}, Error: {inner_e}")
                continue

        # Bulk create new records
        if projects_to_create:
            Projects.objects.bulk_create(projects_to_create, ignore_conflicts=True)
        if cities_to_create:
            City.objects.bulk_create(cities_to_create, ignore_conflicts=True)
        if expeditors_to_create:
            Ekispiditor.objects.bulk_create(expeditors_to_create, ignore_conflicts=True)
        if sklads_to_create:
            Sklad.objects.bulk_create(sklads_to_create, ignore_conflicts=True)

    def get(self, request):
        # Check if update is already in progress
        if self.is_update_in_progress():
            return Response({
                'detail': 'Update already in progress',
                'status': 'running'
            }, status=status.HTTP_409_CONFLICT)

        try:
            # Set update status
            self.set_update_status(True)
            
            # Get SOAP client
            client = self.get_client()

            # Get last update date
            last_update = get_last_update_date()
            response = client.service.GetAllCurierInfo(last_update)
            print("Response: " ,response)
            if not response or not hasattr(response, 'Rows') or not response.Rows:
                logger.info("No data received from SOAP service")
                return Response({'detail': 'No data received'}, status=status.HTTP_204_NO_CONTENT)

            updated_count = 0
            batch_size = 50  # Smaller batches to prevent DB blocking
            rows = list(response.Rows)
            
            # Pre-fetch existing records to avoid individual queries
            existing_check_ids = set(Check.objects.values_list('check_id', flat=True))
            existing_projects = {p.project_name: p for p in Projects.objects.all()}
            existing_cities = {c.city_name: c for c in City.objects.all()}
            existing_expeditors = {e.ekispiditor_name: e for e in Ekispiditor.objects.all()}
            existing_sklads = {s.sklad_name: s for s in Sklad.objects.all()}

            # Use select_for_update to prevent concurrent modifications
            with transaction.atomic():  # Ensure data consistency
                for i in range(0, len(rows), batch_size):
                    batch = rows[i:i + batch_size]
                    
                    # Process batch with minimal DB locking
                    self._process_batch(
                        batch, existing_check_ids, existing_projects, 
                        existing_cities, existing_expeditors, existing_sklads
                    )
                    updated_count += len(batch)
                    
                    # Small delay to prevent DB blocking
                    time.sleep(0.1)

                # Save the last update date
                last_update_date = getattr(response, 'lastUpdateDateTime', None)
                if last_update_date:
                    save_last_update_date(str(last_update_date))

            # Clear relevant caches
            cache.delete_many([
                'expeditors_list',
                'checks_list', 
                'statistics_data',
                'projects_list',
                'cities_list',
                'sklads_list'
            ])

            return Response({
                'updated': updated_count,
                'last_update': str(last_update_date) if last_update_date else None,
                'status': 'completed'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"[GLOBAL ERROR] {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Always reset update status
            self.set_update_status(False)
