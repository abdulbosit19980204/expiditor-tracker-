from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import django_filters

from .models import Projects, CheckDetail, Sklad, City, Ekispiditor, Check
from .serializers import (
    ProjectsSerializer, CheckDetailSerializer, SkladSerializer, 
    CitySerializer, EkispiditorSerializer, CheckSerializer
)

class CheckFilter(django_filters.FilterSet):
    date_from = django_filters.DateTimeFilter(field_name='yetkazilgan_vaqti', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='yetkazilgan_vaqti', lookup_expr='lte')
    project = django_filters.CharFilter(field_name='project', lookup_expr='icontains')
    sklad = django_filters.CharFilter(field_name='sklad', lookup_expr='icontains')
    city = django_filters.CharFilter(field_name='city', lookup_expr='icontains')
    ekispiditor = django_filters.CharFilter(field_name='ekispiditor', lookup_expr='icontains')
    status = django_filters.CharFilter(field_name='status')
    
    class Meta:
        model = Check
        fields = ['date_from', 'date_to', 'project', 'sklad', 'city', 'ekispiditor', 'status']

class ProjectsViewSet(viewsets.ModelViewSet):
    queryset = Projects.objects.all()
    serializer_class = ProjectsSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['project_name', 'project_description']
    ordering_fields = ['project_name', 'created_at']

class CheckDetailViewSet(viewsets.ModelViewSet):
    queryset = CheckDetail.objects.all()
    serializer_class = CheckDetailSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['check_id']
    ordering_fields = ['check_date', 'total_sum']

class SkladViewSet(viewsets.ModelViewSet):
    queryset = Sklad.objects.all()
    serializer_class = SkladSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['sklad_name', 'sklad_code']
    ordering_fields = ['sklad_name', 'created_at']

class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['city_name', 'city_code']
    ordering_fields = ['city_name', 'created_at']

class EkispiditorViewSet(viewsets.ModelViewSet):
    queryset = Ekispiditor.objects.all()
    serializer_class = EkispiditorSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['ekispiditor_name', 'transport_number', 'phone_number']
    ordering_fields = ['ekispiditor_name', 'created_at']

class CheckViewSet(viewsets.ModelViewSet):
    queryset = Check.objects.all()
    serializer_class = CheckSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CheckFilter
    search_fields = ['check_id', 'client_name', 'client_address']
    ordering_fields = ['yetkazilgan_vaqti', 'created_at']
    
    @action(detail=False, methods=['get'])
    def today_checks(self, request):
        today = timezone.now().date()
        checks = Check.objects.filter(yetkazilgan_vaqti__date=today)
        serializer = self.get_serializer(checks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def with_locations(self, request):
        checks = Check.objects.filter(
            check_lat__isnull=False, 
            check_lon__isnull=False
        )
        serializer = self.get_serializer(checks, many=True)
        return Response(serializer.data)

class StatisticsView(APIView):
    def get(self, request):
        # Get filter parameters
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        project = request.GET.get('project')
        sklad = request.GET.get('sklad')
        city = request.GET.get('city')
        ekispiditor = request.GET.get('ekispiditor')
        status = request.GET.get('status')
        
        # Base queryset
        checks_qs = Check.objects.all()
        check_details_qs = CheckDetail.objects.all()
        
        # Apply filters
        if date_from:
            try:
                date_from_parsed = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                checks_qs = checks_qs.filter(yetkazilgan_vaqti__gte=date_from_parsed)
            except:
                pass
                
        if date_to:
            try:
                date_to_parsed = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                checks_qs = checks_qs.filter(yetkazilgan_vaqti__lte=date_to_parsed)
            except:
                pass
                
        if project:
            checks_qs = checks_qs.filter(project__icontains=project)
            
        if sklad:
            checks_qs = checks_qs.filter(sklad__icontains=sklad)
            
        if city:
            checks_qs = checks_qs.filter(city__icontains=city)
            
        if ekispiditor:
            checks_qs = checks_qs.filter(ekispiditor__icontains=ekispiditor)
            
        if status:
            checks_qs = checks_qs.filter(status=status)
        
        # Get check IDs for filtering check details
        check_ids = list(checks_qs.values_list('check_id', flat=True))
        if check_ids:
            check_details_qs = check_details_qs.filter(check_id__in=check_ids)
        
        # Calculate statistics
        total_checks = checks_qs.count()
        delivered_checks = checks_qs.filter(status='delivered').count()
        failed_checks = checks_qs.filter(status='failed').count()
        pending_checks = checks_qs.filter(status='pending').count()
        
        success_rate = (delivered_checks / total_checks * 100) if total_checks > 0 else 0
        
        # Payment statistics
        payment_stats = check_details_qs.aggregate(
            total_sum=Sum('total_sum') or 0,
            total_nalichniy=Sum('nalichniy') or 0,
            total_uzcard=Sum('uzcard') or 0,
            total_humo=Sum('humo') or 0,
            total_click=Sum('click') or 0,
        )
        
        # Top expeditors
        top_expeditors = (
            checks_qs.values('ekispiditor')
            .annotate(
                check_count=Count('id'),
                success_count=Count('id', filter=Q(status='delivered'))
            )
            .order_by('-check_count')[:5]
        )
        
        # Top projects
        top_projects = (
            checks_qs.values('project')
            .annotate(check_count=Count('id'))
            .order_by('-check_count')[:5]
        )
        
        # Top cities
        top_cities = (
            checks_qs.values('city')
            .annotate(check_count=Count('id'))
            .order_by('-check_count')[:5]
        )
        
        # Daily statistics (last 7 days)
        today = timezone.now().date()
        daily_stats = []
        for i in range(7):
            date = today - timedelta(days=i)
            day_checks = checks_qs.filter(yetkazilgan_vaqti__date=date).count()
            daily_stats.append({
                'date': date.isoformat(),
                'checks': day_checks
            })
        
        daily_stats.reverse()
        
        return Response({
            'overview': {
                'total_checks': total_checks,
                'delivered_checks': delivered_checks,
                'failed_checks': failed_checks,
                'pending_checks': pending_checks,
                'success_rate': round(success_rate, 2)
            },
            'payment_stats': {
                'total_sum': payment_stats['total_sum'],
                'nalichniy': payment_stats['total_nalichniy'],
                'uzcard': payment_stats['total_uzcard'],
                'humo': payment_stats['total_humo'],
                'click': payment_stats['total_click']
            },
            'top_expeditors': list(top_expeditors),
            'top_projects': list(top_projects),
            'top_cities': list(top_cities),
            'daily_stats': daily_stats
        })
