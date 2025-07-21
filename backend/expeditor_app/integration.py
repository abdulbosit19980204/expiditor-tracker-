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
from expeditor_app.models import Check, CheckDetail, Sklad, City, Ekispiditor, Projects

logger = logging.getLogger(__name__)

class UpdateChecksView(APIView):
    # Cache WSDL client to avoid reloading
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            url = "http://192.168.1.241:5443/AVON_UT/AVON_UT.1cws?wsdl"
            transport = Transport(cache=InMemoryCache())
            cls._client = Client(wsdl=url, transport=transport)
        return cls._client

    def get(self, request):
        try:
            # Get SOAP client
            client = self.get_client()

            # Get last update date
            last_update = get_last_update_date()
            response = client.service.GetAllCurierInfo(last_update)

            if not response or not hasattr(response, 'Rows') or not response.Rows:
                logger.info("No data received from SOAP service")
                return Response({'detail': 'No data received'}, status=status.HTTP_204_NO_CONTENT)

            updated_count = 0

            with transaction.atomic():  # Ensure data consistency
                for row in response.Rows:
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
                            'yetkazilgan_vaqti': delivery_date,
                            'transport_number': getattr(row, 'auto', None),
                            'kkm_number': getattr(row, 'kkm', None),
                            'client_name': getattr(row, 'client', None),
                            'client_address': None,  # Not provided in response
                            'check_lat': float(row.latitude) if hasattr(row, 'latitude') and row.latitude else None,
                            'check_lon': float(row.longitude) if hasattr(row, 'longitude') and row.longitude else None,
                            'status': 'delivered',  # Adjust based on additional logic if needed
                            'updated_at': timezone.now()
                        }

                        # Update or create Projects
                        if hasattr(row, 'project') and row.project:
                            Projects.objects.update_or_create(
                                project_name=row.project,
                                defaults={
                                    'project_description': getattr(row, 'projectDescription', ''),
                                    'updated_at': timezone.now()
                                }
                            )

                        # Update or create City
                        if hasattr(row, 'city') and row.city:
                            City.objects.update_or_create(
                                city_name=row.city,
                                defaults={
                                    'city_code': getattr(row, 'cityCode', ''),
                                    'description': getattr(row, 'cityDescription', ''),
                                    'updated_at': timezone.now()
                                }
                            )

                        # Update or create Ekispiditor
                        if hasattr(row, 'curier') and row.curier:
                            Ekispiditor.objects.update_or_create(
                                ekispiditor_name=row.curier,
                                defaults={
                                    'transport_number': getattr(row, 'auto', ''),
                                    'phone_number': getattr(row, 'phone', '+998999999999'),
                                    'photo': getattr(row, 'photo', None),
                                    'is_active': True,
                                    'updated_at': timezone.now()
                                }
                            )

                        # Update or create Sklad
                        if hasattr(row, 'warehouse') and row.warehouse:
                            Sklad.objects.update_or_create(
                                sklad_name=row.warehouse,
                                defaults={
                                    'sklad_code': getattr(row, 'warehouseCode', ''),
                                    'description': getattr(row, 'warehouseDescription', ''),
                                    'updated_at': timezone.now()
                                }
                            )

                        # Update or create Check
                        Check.objects.update_or_create(
                            check_id=check_id,
                            defaults={k: v for k, v in check_data.items() if k != 'check_id'}
                        )

                        # Update or create CheckDetail
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

                        updated_count += 1

                    except Exception as inner_e:
                        logger.error(f"[ROW ERROR] Check ID: {check_id}, Error: {inner_e}")
                        continue

                # Save the last update date
                last_update_date = getattr(response, 'lastUpdateDateTime', None)
                if last_update_date:
                    save_last_update_date(str(last_update_date))

            return Response({
                'updated': updated_count,
                'last_update': str(last_update_date) if last_update_date else None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"[GLOBAL ERROR] {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
