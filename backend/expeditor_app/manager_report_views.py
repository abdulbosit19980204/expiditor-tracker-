"""
Manager Report Views - Xatoliklarni aniqlash va statistika
"""
import math
import io
from collections import defaultdict
from django.db.models import Q, Count, Sum, F, FloatField, IntegerField
from django.db.models.functions import TruncMinute, TruncHour
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from .models import Check, CheckDetail, Sklad, Ekispiditor, EmailRecipient, EmailConfig
from django.core.mail import send_mail, EmailMessage
from django.conf import settings

# Email settings fallback
DEFAULT_FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@expeditor-tracker.com')


def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine formula bilan masofani metrlarda hisoblash"""
    if not all([lat1, lon1, lat2, lon2]):
        return float('inf')
    
    # Radianlarga o'tkazish
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Yer radiusi metrlarda
    r = 6371000
    return c * r


class ManagerReportView(APIView):
    """
    Managerlar uchun umumiy xisobot API
    Xatoliklar turlari:
    1. Bitta joydan urilgan checklar (bir expeditor bir joydan turib bir nechta checkni urgan)
    2. Skladdan turib urilgan checklar (sklad addressidan foydalanib)
    3. Bir vaqtda urilgan checklar (bir expeditor bir vaqtda turli clientlarnikini urgan)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Filter parametrlarini olish - DRF request yoki Django request uchun
        if hasattr(request, 'query_params'):
            query_params = request.query_params
        else:
            query_params = request.GET
        
        date_from = query_params.get('date_from')
        date_to = query_params.get('date_to')
        filial_id = query_params.get('filial')
        project = query_params.get('project')
        radius_meters = float(query_params.get('radius_meters', 10))  # Default 10 metr
        time_window_minutes = int(query_params.get('time_window_minutes', 5))  # Default 5 daqiqa
        
        # Date range ni tekshirish
        if not date_from or not date_to:
            return Response(
                {'error': 'date_from va date_to parametrlari majburiy'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        except ValueError:
            return Response(
                {'error': 'Noto\'g\'ri sana formati. ISO formatida bo\'lishi kerak.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Checklarni filter qilish
        checks_query = Check.objects.filter(
            yetkazilgan_vaqti__gte=date_from,
            yetkazilgan_vaqti__lte=date_to
        )
        
        # Filial filter
        if filial_id:
            expeditors = Ekispiditor.objects.filter(filial_id=filial_id).values_list('ekispiditor_name', flat=True)
            checks_query = checks_query.filter(ekispiditor__in=expeditors)
        
        # Project filter
        if project:
            checks_query = checks_query.filter(project=project)
        
        # Faqat koordinatalari bor checklarni olish
        checks = checks_query.filter(
            check_lat__isnull=False,
            check_lon__isnull=False
        ).exclude(check_lat=0, check_lon=0)
        
        # CheckDetail bilan birga olish
        checks_with_details = []
        for check in checks:
            try:
                detail = CheckDetail.objects.get(check_id=check.check_id)
                checks_with_details.append({
                    'check': check,
                    'lat': detail.check_lat or check.check_lat,
                    'lon': detail.check_lon or check.check_lon,
                    'detail': detail
                })
            except CheckDetail.DoesNotExist:
                if check.check_lat and check.check_lon:
                    checks_with_details.append({
                        'check': check,
                        'lat': check.check_lat,
                        'lon': check.check_lon,
                        'detail': None
                    })
        
        # 1. Bitta joydan urilgan checklar (bir expeditor bir joydan turib bir nechta checkni urgan)
        same_location_violations = self._find_same_location_violations(
            checks_with_details, radius_meters
        )
        
        # 2. Skladdan turib urilgan checklar
        sklad_violations = self._find_sklad_violations(
            checks_with_details, radius_meters
        )
        
        # 3. Bir vaqtda urilgan checklar
        same_time_violations = self._find_same_time_violations(
            checks_with_details, time_window_minutes
        )
        
        # Umumiy statistika
        stats = self._calculate_statistics(
            same_location_violations,
            sklad_violations,
            same_time_violations,
            checks_with_details
        )
        
        return Response({
            'filters': {
                'date_from': date_from.isoformat(),
                'date_to': date_to.isoformat(),
                'filial_id': filial_id,
                'project': project,
                'radius_meters': radius_meters,
                'time_window_minutes': time_window_minutes,
            },
            'statistics': stats,
            'violations': {
                'same_location': same_location_violations,
                'sklad': sklad_violations,
                'same_time': same_time_violations,
            }
        })
    
    def _find_same_location_violations(self, checks_with_details, radius_meters):
        """
        Bitta joydan urilgan checklarni topish
        Bir expeditor bir joydan turib bir nechta checkni urgan
        """
        violations = []
        expeditor_groups = defaultdict(list)
        
        # Expeditorlar bo'yicha guruhlash
        for item in checks_with_details:
            expeditor = item['check'].ekispiditor
            if expeditor:
                expeditor_groups[expeditor].append(item)
        
        # Har bir expeditor uchun bitta joydan urilgan checklarni topish
        for expeditor, expeditor_checks in expeditor_groups.items():
            if len(expeditor_checks) < 2:
                continue
            
            # Koordinatalar bo'yicha guruhlash
            location_groups = []
            for check_item in expeditor_checks:
                lat = check_item['lat']
                lon = check_item['lon']
                
                # Mavjud guruhga qo'shish yoki yangi guruh yaratish
                added = False
                for group in location_groups:
                    # Guruh markaziga masofani hisoblash
                    center_lat = sum(c['lat'] for c in group) / len(group)
                    center_lon = sum(c['lon'] for c in group) / len(group)
                    distance = calculate_distance(lat, lon, center_lat, center_lon)
                    
                    if distance <= radius_meters:
                        group.append(check_item)
                        added = True
                        break
                
                if not added:
                    location_groups.append([check_item])
            
            # 2 yoki ko'p checklari bo'lgan guruhlarni violations sifatida qo'shish
            for group in location_groups:
                if len(group) >= 2:
                    center_lat = sum(c['lat'] for c in group) / len(group)
                    center_lon = sum(c['lon'] for c in group) / len(group)
                    
                    violations.append({
                        'type': 'same_location',
                        'expeditor': expeditor,
                        'check_count': len(group),
                        'center_lat': center_lat,
                        'center_lon': center_lon,
                        'radius_meters': radius_meters,
                        'checks': [
                            {
                                'check_id': item['check'].check_id,
                                'client_name': item['check'].client_name,
                                'lat': item['lat'],
                                'lon': item['lon'],
                                'time': item['check'].yetkazilgan_vaqti.isoformat() if item['check'].yetkazilgan_vaqti else None,
                                'project': item['check'].project,
                                'total_sum': item['detail'].total_sum if item['detail'] else 0,
                            }
                            for item in group
                        ]
                    })
        
        return violations
    
    def _find_sklad_violations(self, checks_with_details, radius_meters):
        """
        Skladdan turib urilgan checklarni topish
        """
        violations = []
        
        # Barcha skladlarni olish
        sklads = Sklad.objects.filter(lat__isnull=False, lon__isnull=False).exclude(lat=0, lon=0)
        
        for sklad in sklads:
            sklad_checks = []
            
            for item in checks_with_details:
                distance = calculate_distance(
                    sklad.lat, sklad.lon,
                    item['lat'], item['lon']
                )
                
                if distance <= radius_meters:
                    sklad_checks.append(item)
            
            if len(sklad_checks) >= 2:
                # Expeditorlar bo'yicha guruhlash
                expeditor_groups = defaultdict(list)
                for check_item in sklad_checks:
                    expeditor = check_item['check'].ekispiditor
                    if expeditor:
                        expeditor_groups[expeditor].append(check_item)
                
                # Har bir expeditor uchun violation yaratish
                for expeditor, checks in expeditor_groups.items():
                    if len(checks) >= 2:
                        violations.append({
                            'type': 'sklad',
                            'sklad_name': sklad.sklad_name,
                            'sklad_lat': sklad.lat,
                            'sklad_lon': sklad.lon,
                            'expeditor': expeditor,
                            'check_count': len(checks),
                            'radius_meters': radius_meters,
                            'checks': [
                                {
                                    'check_id': item['check'].check_id,
                                    'client_name': item['check'].client_name,
                                    'lat': item['lat'],
                                    'lon': item['lon'],
                                    'time': item['check'].yetkazilgan_vaqti.isoformat() if item['check'].yetkazilgan_vaqti else None,
                                    'project': item['check'].project,
                                    'total_sum': item['detail'].total_sum if item['detail'] else 0,
                                    'distance_from_sklad': calculate_distance(
                                        sklad.lat, sklad.lon,
                                        item['lat'], item['lon']
                                    ),
                                }
                                for item in checks
                            ]
                        })
        
        return violations
    
    def _find_same_time_violations(self, checks_with_details, time_window_minutes):
        """
        Bir vaqtda urilgan checklarni topish
        Bir expeditor bir vaqtda turli clientlarnikini urgan
        """
        violations = []
        expeditor_groups = defaultdict(list)
        
        # Expeditorlar bo'yicha guruhlash
        for item in checks_with_details:
            expeditor = item['check'].ekispiditor
            if expeditor and item['check'].yetkazilgan_vaqti:
                expeditor_groups[expeditor].append(item)
        
        # Har bir expeditor uchun bir vaqtda urilgan checklarni topish
        for expeditor, expeditor_checks in expeditor_groups.items():
            if len(expeditor_checks) < 2:
                continue
            
            # Vaqt bo'yicha saralash
            expeditor_checks.sort(key=lambda x: x['check'].yetkazilgan_vaqti)
            
            # Vaqt oynalari bo'yicha guruhlash
            time_groups = []
            for check_item in expeditor_checks:
                check_time = check_item['check'].yetkazilgan_vaqti
                
                # Mavjud guruhga qo'shish yoki yangi guruh yaratish
                added = False
                for group in time_groups:
                    # Guruhdagi birinchi va oxirgi vaqtni olish
                    group_start = min(c['check'].yetkazilgan_vaqti for c in group)
                    group_end = max(c['check'].yetkazilgan_vaqti for c in group)
                    
                    # Yangi check guruhga mos keladimi?
                    time_diff_start = abs((check_time - group_start).total_seconds() / 60)
                    time_diff_end = abs((check_time - group_end).total_seconds() / 60)
                    
                    if time_diff_start <= time_window_minutes or time_diff_end <= time_window_minutes:
                        group.append(check_item)
                        added = True
                        break
                
                if not added:
                    time_groups.append([check_item])
            
            # 2 yoki ko'p checklari bo'lgan guruhlarni violations sifatida qo'shish
            for group in time_groups:
                if len(group) >= 2:
                    group_start = min(c['check'].yetkazilgan_vaqti for c in group)
                    group_end = max(c['check'].yetkazilgan_vaqti for c in group)
                    duration_minutes = (group_end - group_start).total_seconds() / 60
                    
                    violations.append({
                        'type': 'same_time',
                        'expeditor': expeditor,
                        'check_count': len(group),
                        'time_window_start': group_start.isoformat(),
                        'time_window_end': group_end.isoformat(),
                        'duration_minutes': round(duration_minutes, 2),
                        'time_window_minutes': time_window_minutes,
                        'checks': [
                            {
                                'check_id': item['check'].check_id,
                                'client_name': item['check'].client_name,
                                'lat': item['lat'],
                                'lon': item['lon'],
                                'time': item['check'].yetkazilgan_vaqti.isoformat() if item['check'].yetkazilgan_vaqti else None,
                                'project': item['check'].project,
                                'total_sum': item['detail'].total_sum if item['detail'] else 0,
                            }
                            for item in group
                        ]
                    })
        
        return violations
    
    def _calculate_statistics(self, same_location_violations, sklad_violations, 
                            same_time_violations, all_checks):
        """Umumiy statistika hisoblash"""
        total_violations = len(same_location_violations) + len(sklad_violations) + len(same_time_violations)
        
        # Xatoliklar turlari bo'yicha
        violation_types = {
            'same_location': len(same_location_violations),
            'sklad': len(sklad_violations),
            'same_time': len(same_time_violations),
        }
        
        # Expeditorlar bo'yicha
        expeditor_stats = defaultdict(lambda: {
            'same_location': 0,
            'sklad': 0,
            'same_time': 0,
            'total_violations': 0,
            'total_checks': 0,
        })
        
        for violation in same_location_violations:
            expeditor = violation['expeditor']
            expeditor_stats[expeditor]['same_location'] += 1
            expeditor_stats[expeditor]['total_violations'] += 1
        
        for violation in sklad_violations:
            expeditor = violation['expeditor']
            expeditor_stats[expeditor]['sklad'] += 1
            expeditor_stats[expeditor]['total_violations'] += 1
        
        for violation in same_time_violations:
            expeditor = violation['expeditor']
            expeditor_stats[expeditor]['same_time'] += 1
            expeditor_stats[expeditor]['total_violations'] += 1
        
        # Har bir expeditorning umumiy checklari soni
        for item in all_checks:
            expeditor = item['check'].ekispiditor
            if expeditor:
                expeditor_stats[expeditor]['total_checks'] += 1
        
        return {
            'total_violations': total_violations,
            'violation_types': violation_types,
            'expeditor_statistics': dict(expeditor_stats),
            'total_checks_analyzed': len(all_checks),
        }


class ManagerReportPDFView(APIView):
    """PDF export uchun endpoint"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Xuddi ManagerReportView kabi filterlar
        if hasattr(request, 'query_params'):
            query_params = request.query_params
        else:
            query_params = request.GET
        
        date_from = query_params.get('date_from')
        date_to = query_params.get('date_to')
        filial_id = query_params.get('filial')
        project = query_params.get('project')
        radius_meters = float(query_params.get('radius_meters', 10))
        time_window_minutes = int(query_params.get('time_window_minutes', 5))
        
        if not date_from or not date_to:
            return Response(
                {'error': 'date_from va date_to parametrlari majburiy'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        except ValueError:
            return Response(
                {'error': 'Noto\'g\'ri sana formati'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Report ma'lumotlarini olish
        report_view = ManagerReportView()
        report_view.request = request
        response = report_view.get(request)
        
        if response.status_code != 200:
            return response
        
        report_data = response.data
        
        # HTML formatda PDF yaratish (oddiy HTML, keyinchalik weasyprint yoki reportlab bilan yaxshilash mumkin)
        html_content = self._generate_html_report(report_data, date_from, date_to)
        
        # PDF sifatida qaytarish (hozircha HTML, keyinchalik PDF ga o'tkaziladi)
        response = HttpResponse(html_content, content_type='text/html')
        response['Content-Disposition'] = f'attachment; filename="manager_report_{date_from.date()}_{date_to.date()}.html"'
        return response
    
    def _generate_html_report(self, report_data, date_from, date_to):
        """HTML formatda report yaratish"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Manager Xisoboti</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #333; }}
                table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                .stat-box {{ display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ccc; }}
            </style>
        </head>
        <body>
            <h1>Manager Xisoboti</h1>
            <p><strong>Sana:</strong> {date_from.date()} - {date_to.date()}</p>
            
            <h2>Statistika</h2>
            <div class="stat-box">
                <strong>Jami Xatoliklar:</strong> {report_data['statistics']['total_violations']}
            </div>
            <div class="stat-box">
                <strong>Bitta Joydan:</strong> {report_data['statistics']['violation_types']['same_location']}
            </div>
            <div class="stat-box">
                <strong>Skladdan:</strong> {report_data['statistics']['violation_types']['sklad']}
            </div>
            <div class="stat-box">
                <strong>Bir Vaqtda:</strong> {report_data['statistics']['violation_types']['same_time']}
            </div>
            
            <h2>Xatoliklar</h2>
            <h3>Bitta Joydan Urilgan Checklar</h3>
            {self._generate_violations_table(report_data['violations']['same_location'])}
            
            <h3>Skladdan Urilgan Checklar</h3>
            {self._generate_violations_table(report_data['violations']['sklad'])}
            
            <h3>Bir Vaqtda Urilgan Checklar</h3>
            {self._generate_violations_table(report_data['violations']['same_time'])}
            
            <h2>Expeditorlar Bo'yicha Statistika</h2>
            {self._generate_expeditor_stats_table(report_data['statistics']['expeditor_statistics'])}
        </body>
        </html>
        """
        return html
    
    def _generate_violations_table(self, violations):
        """Xatoliklar jadvalini yaratish"""
        if not violations:
            return "<p>Xatoliklar topilmadi</p>"
        
        html = "<table>"
        html += "<tr><th>Expeditor</th><th>Checklar Soni</th><th>Check ID</th><th>Mijoz</th><th>Vaqt</th><th>Summa</th></tr>"
        
        for violation in violations:
            for i, check in enumerate(violation['checks']):
                html += f"""
                <tr>
                    <td>{violation['expeditor'] if i == 0 else ''}</td>
                    <td>{violation['check_count'] if i == 0 else ''}</td>
                    <td>{check['check_id']}</td>
                    <td>{check['client_name'] or '-'}</td>
                    <td>{check['time']}</td>
                    <td>{check['total_sum']:,.0f} UZS</td>
                </tr>
                """
        
        html += "</table>"
        return html
    
    def _generate_expeditor_stats_table(self, expeditor_stats):
        """Expeditorlar statistika jadvalini yaratish"""
        html = "<table>"
        html += "<tr><th>Expeditor</th><th>Bitta Joydan</th><th>Skladdan</th><th>Bir Vaqtda</th><th>Jami Xatoliklar</th><th>Jami Checklar</th></tr>"
        
        for expeditor, stats in expeditor_stats.items():
            html += f"""
            <tr>
                <td>{expeditor}</td>
                <td>{stats['same_location']}</td>
                <td>{stats['sklad']}</td>
                <td>{stats['same_time']}</td>
                <td>{stats['total_violations']}</td>
                <td>{stats['total_checks']}</td>
            </tr>
            """
        
        html += "</table>"
        return html


class ManagerReportEmailView(APIView):
    """Email orqali xisobot yuborish"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Filter parametrlarini olish
        date_from = request.data.get('date_from')
        date_to = request.data.get('date_to')
        filial_id = request.data.get('filial')
        project = request.data.get('project')
        radius_meters = float(request.data.get('radius_meters', 10))
        time_window_minutes = int(request.data.get('time_window_minutes', 5))
        recipient_emails = request.data.get('recipient_emails', [])
        
        if not date_from or not date_to:
            return Response(
                {'error': 'date_from va date_to parametrlari majburiy'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Report ma'lumotlarini olish - to'g'ridan-to'g'ri chaqirish
        report_view = ManagerReportView()
        # Request ni qayta yaratish
        from django.http import QueryDict
        query_dict = QueryDict('', mutable=True)
        query_dict.update({
            'date_from': date_from,
            'date_to': date_to,
            'radius_meters': str(radius_meters),
            'time_window_minutes': str(time_window_minutes),
        })
        if filial_id:
            query_dict['filial'] = filial_id
        if project:
            query_dict['project'] = project
        
        # Request ni yangilash
        request.query_params = query_dict
        response = report_view.get(request)
        
        if response.status_code != 200:
            return response
        
        report_data = response.data
        
        # Email konfiguratsiyasini olish
        email_config = EmailConfig.objects.filter(is_active=True).first()
        if not email_config:
            return Response(
                {'error': 'Email konfiguratsiyasi topilmadi'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Recipient emaillarni olish
        if not recipient_emails:
            recipients = EmailRecipient.objects.filter(is_active=True).values_list('email', flat=True)
            recipient_emails = list(recipients)
        
        if not recipient_emails:
            return Response(
                {'error': 'Recipient emaillar topilmadi'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # HTML report yaratish
        pdf_view = ManagerReportPDFView()
        date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        html_content = pdf_view._generate_html_report(report_data, date_from_obj, date_to_obj)
        
        # Email yuborish
        try:
            subject = f"Manager Xisoboti - {date_from_obj.date()} dan {date_to_obj.date()} gacha"
            
            email = EmailMessage(
                subject=subject,
                body=html_content,
                from_email=email_config.from_email or DEFAULT_FROM_EMAIL,
                to=recipient_emails,
            )
            email.content_subtype = "html"
            email.send()
            
            return Response({
                'success': True,
                'message': f'Xisobot {len(recipient_emails)} ta emailga yuborildi',
                'recipients': recipient_emails
            })
        except Exception as e:
            return Response(
                {'error': f'Email yuborishda xatolik: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

