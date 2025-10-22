import logging
from django.db import transaction
from django.utils import timezone
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from zeep import Client
from zeep.cache import InMemoryCache
from zeep.transports import Transport
from expeditor_app.utils import get_last_update_date, save_last_update_date
from expeditor_app.models import Check, CheckDetail, Sklad, City, Ekispiditor, Projects, ProblemCheck, IntegrationEndpoint

logger = logging.getLogger(__name__)

class UpdateChecksView(APIView):
    # Cache WSDL client to avoid reloading
    _client = None
    _client_lock = None

    @classmethod
    def get_client(cls, project_name: str = "AVON"):
        """Get cached zeep client for a given project.

        Resolves WSDL URL from IntegrationEndpoint, falling back to the
        previous default if not configured. Keeps a single cached client
        instance per process for simplicity.
        """
        if cls._client is None:
            import threading
            if cls._client_lock is None:
                cls._client_lock = threading.Lock()
            with cls._client_lock:
                if cls._client is None:
                    endpoint = IntegrationEndpoint.objects.filter(project_name=project_name, is_active=True).first()
                    url = endpoint.wsdl_url if endpoint else "http://192.168.1.241:5443/AVON_UT/AVON_UT.1cws?wsdl"
                    transport = Transport(
                        cache=InMemoryCache(),
                        timeout=30,
                        operation_timeout=60
                    )
                    cls._client = Client(wsdl=url, transport=transport)
        return cls._client

    def _process_batch(self, batch, existing_check_ids, existing_projects, 
                      existing_cities, existing_expeditors, existing_sklads,
                      counters: dict):
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
                check_obj, check_created = Check.objects.update_or_create(
                    check_id=check_id,
                    defaults={k: v for k, v in check_data.items() if k != 'check_id'}
                )
                if check_created:
                    counters['checks_created'] += 1
                else:
                    counters['checks_updated'] += 1

                detail_obj, created_detail = CheckDetail.objects.update_or_create(
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
                if created_detail:
                    counters['details_created'] += 1
                else:
                    counters['details_updated'] += 1

                # Lightweight problem detection without slowing imports
                issue_codes = []
                if not detail_obj or detail_obj.total_sum is None:
                    issue_codes.append('NO_TOTAL_SUM')
                if not detail_obj:
                    issue_codes.append('DETAIL_MISSING')
                if not check_data.get('ekispiditor'):
                    issue_codes.append('NO_EXPEDITOR')
                if (check_data.get('check_lat') is None) or (check_data.get('check_lon') is None):
                    issue_codes.append('NO_COORDS')

                for code in issue_codes:
                    ProblemCheck.objects.update_or_create(
                        check_id=check_id,
                        issue_code=code,
                        defaults={
                            'issue_message': f'{code} detected during import',
                            'resolved': False,
                        }
                    )

            except Exception as inner_e:
                logger.error(f"[ROW ERROR] Check ID: {getattr(row, 'receiptID', 'unknown')}, Error: {inner_e}")
                continue

        # Bulk create new records
        if projects_to_create:
            Projects.objects.bulk_create(projects_to_create, ignore_conflicts=True)
            counters['projects_created'] += len(projects_to_create)
            for p in projects_to_create:
                existing_projects[p.project_name] = p
        if cities_to_create:
            City.objects.bulk_create(cities_to_create, ignore_conflicts=True)
            counters['cities_created'] += len(cities_to_create)
            for c in cities_to_create:
                existing_cities[c.city_name] = c
        if expeditors_to_create:
            Ekispiditor.objects.bulk_create(expeditors_to_create, ignore_conflicts=True)
            counters['expeditors_created'] += len(expeditors_to_create)
            for e in expeditors_to_create:
                existing_expeditors[e.ekispiditor_name] = e
        if sklads_to_create:
            Sklad.objects.bulk_create(sklads_to_create, ignore_conflicts=True)
            counters['sklads_created'] += len(sklads_to_create)
            for s in sklads_to_create:
                existing_sklads[s.sklad_name] = s

    def get(self, request):
        try:
            # Get SOAP client
            client = self.get_client(project_name="AVON")

            # Get last update date
            last_update = get_last_update_date()
            response = client.service.GetAllCurierInfo(last_update)
            print("Response: " ,response)
            if not response or not hasattr(response, 'Rows') or not response.Rows:
                logger.info("No data received from SOAP service")
                return Response({'detail': 'No data received'}, status=status.HTTP_204_NO_CONTENT)

            updated_count = 0
            counters = {
                'checks_created': 0,
                'checks_updated': 0,
                'details_created': 0,
                'details_updated': 0,
                'projects_created': 0,
                'cities_created': 0,
                'expeditors_created': 0,
                'sklads_created': 0,
            }
            batch_size = 100  # Process in smaller batches for better memory management
            rows = list(response.Rows)
            
            # Pre-fetch existing records to avoid individual queries
            existing_check_ids = set(Check.objects.values_list('check_id', flat=True))
            existing_projects = {p.project_name: p for p in Projects.objects.all()}
            existing_cities = {c.city_name: c for c in City.objects.all()}
            existing_expeditors = {e.ekispiditor_name: e for e in Ekispiditor.objects.all()}
            existing_sklads = {s.sklad_name: s for s in Sklad.objects.all()}

            # Commit per batch to avoid long-running transactions
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i + batch_size]
                with transaction.atomic():
                    self._process_batch(
                        batch, existing_check_ids, existing_projects, 
                        existing_cities, existing_expeditors, existing_sklads,
                        counters
                    )
                updated_count += len(batch)

                # Save the last update date
                last_update_date = getattr(response, 'lastUpdateDateTime', None)
                if last_update_date:
                    save_last_update_date(str(last_update_date))

            return Response({
                'updated': updated_count,
                'created': counters['checks_created'] + counters['details_created'] + counters['projects_created'] + counters['cities_created'] + counters['expeditors_created'] + counters['sklads_created'],
                'counts': counters,
                'last_update': str(last_update_date) if last_update_date else None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"[GLOBAL ERROR] {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
