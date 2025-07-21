from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from zeep import Client
from django.utils import timezone
from datetime import datetime
from expeditor_app.utils import get_last_update_date, save_last_update_date
from expeditor_app.models import Check, CheckDetail, Sklad, City, Ekispiditor, Projects

class UpdateChecksView(APIView):
    def get(self, request):
        try:
            url = "http://192.168.1.241:5443/AVON_UT/AVON_UT.1cws?wsdl"
            client = Client(wsdl=url)

            # Get the last update date
            last_update = get_last_update_date()
            # last_update = "2025-06-04"
            response = client.service.GetAllCurierInfo(last_update)
            print(response)
            if not response or not hasattr(response, 'Rows'):
                return Response({'detail': 'No data received'}, status=status.HTTP_204_NO_CONTENT)

            updated_count = 0

            for row in response.Rows:
                try:
                    check_id = row.receiptID

                    # Validate and process dates
                    delivery_date = None
                    if hasattr(row, 'deliveryDate') and row.deliveryDate and row.deliveryDate.year > 1:
                        delivery_date = row.deliveryDate

                    receipt_date = None
                    if hasattr(row, 'receiptIdDate') and row.receiptIdDate and row.receiptIdDate.year > 1:
                        receipt_date = row.receiptIdDate

                    # Prepare check data
                    check_data = {
                        'check_id': check_id,
                        'project': row.project if hasattr(row, 'project') else None,
                        'sklad': row.warehouse if hasattr(row, 'warehouse') else None,
                        'city': row.city if hasattr(row, 'city') else None,
                        'sborshik': row.OrderPicker if hasattr(row, 'OrderPicker') else None,
                        'agent': row.agent if hasattr(row, 'agent') else None,
                        'ekispiditor': row.curier if hasattr(row, 'curier') else None,
                        'yetkazilgan_vaqti': delivery_date,
                        'transport_number': row.auto if hasattr(row, 'auto') else None,
                        'kkm_number': row.kkm if hasattr(row, 'kkm') else None,
                        'client_name': row.client if hasattr(row, 'client') else None,
                        'client_address': None,  # Not provided in the response
                        'check_lat': float(row.latitude) if hasattr(row, 'latitude') and row.latitude else None,
                        'check_lon': float(row.longitude) if hasattr(row, 'longitude') and row.longitude else None,
                        'status': 'delivered'  # Assuming delivered based on deliveryDate; adjust logic if needed
                    }

                    # Update or create Projects
                    if hasattr(row, 'project') and row.project:
                        Projects.objects.update_or_create(
                            project_name=row.project,
                            defaults={
                                'project_description': getattr(row, 'projectDescription', '')
                            }
                        )

                    # Update or create City
                    if hasattr(row, 'city') and row.city:
                        City.objects.update_or_create(
                            city_name=row.city,
                            defaults={
                                'city_code': getattr(row, 'cityCode', ''),
                                'description': getattr(row, 'cityDescription', '')
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
                                'is_active': True
                            }
                        )

                    # Update or create Sklad
                    if hasattr(row, 'warehouse') and row.warehouse:
                        Sklad.objects.update_or_create(
                            sklad_name=row.warehouse,
                            defaults={
                                'sklad_code': getattr(row, 'warehouseCode', ''),
                                'description': getattr(row, 'warehouseDescription', '')
                            }
                        )

                    # Update or create Check
                    Check.objects.update_or_create(
                        check_id=check_id,
                        defaults=check_data
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
                            'click': 0  # Default value as per model
                        }
                    )

                    updated_count += 1

                except Exception as inner_e:
                    print(f"[ROW ERROR] Check ID: {check_id}, Error: {inner_e}")
                    continue

            # Save the last update date
            if hasattr(response, 'lastUpdateDateTime') and response.lastUpdateDateTime:
                save_last_update_date(str(response.lastUpdateDateTime))

            return Response({
                'updated': updated_count,
                'last_update': str(response.lastUpdateDateTime)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"[GLOBAL ERROR] {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)