from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from django.utils.timezone import now
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import django_filters
from django.utils.dateparse import parse_date

from .models import Projects, CheckDetail, Sklad, City, Ekispiditor, Check, Filial, Expeditor
from .serializers import (
    ProjectsSerializer, CheckDetailSerializer, SkladSerializer, 
    CitySerializer, EkispiditorSerializer, CheckSerializer, FilialSerializer, ExpeditorSerializer
)

class CheckFilter(django_filters.FilterSet):
    date_from = django_filters.DateTimeFilter(field_name='yetkazilgan_vaqti', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(
        field_name='yetkazilgan_vaqti',
        lookup_expr='lte',
        method='filter_date_to_end_of_day'
    )
    project = django_filters.CharFilter(field_name='project', lookup_expr='icontains')
    sklad = django_filters.CharFilter(field_name='sklad', lookup_expr='icontains')
    city = django_filters.CharFilter(field_name='city', lookup_expr='icontains')
    ekispiditor = django_filters.CharFilter(field_name='ekispiditor', lookup_expr='icontains')
    status = django_filters.CharFilter(field_name='status')
    # Fixed: Use ekispiditor name instead of ID since it's a CharField
    ekispiditor_name = django_filters.CharFilter(field_name='ekispiditor', lookup_expr='exact')
    
    def filter_date_to_end_of_day(self, queryset, name, value):
        if value:
            # Agar `date_to` berilgan bo'lsa, unga 23:59:59 qo'shamiz
            end_of_day = value.replace(hour=23, minute=59, second=59)
            print(f"Filtering {name} to end of day: {end_of_day}")
            return queryset.filter(**{f"{name}__lte": end_of_day})
        return queryset
    
    class Meta:
        model = Check
        fields = ['date_from', 'date_to', 'project', 'sklad', 'city', 'ekispiditor', 'ekispiditor_name', 'status']

class ProjectsViewSet(viewsets.ModelViewSet):
    queryset = Projects.objects.all()
    serializer_class = ProjectsSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['project_name', 'project_description']
    ordering_fields = ['project_name', 'created_at']
    ordering = ['project_name']

class CheckDetailViewSet(viewsets.ModelViewSet):
    queryset = CheckDetail.objects.all()
    serializer_class = CheckDetailSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['check_id']
    ordering_fields = ['check_date', 'total_sum']
    ordering = ['-check_date']

class SkladViewSet(viewsets.ModelViewSet):
    queryset = Sklad.objects.all()
    serializer_class = SkladSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['sklad_name', 'sklad_code']
    ordering_fields = ['sklad_name', 'created_at']
    ordering = ['sklad_name']

class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['city_name', 'city_code']
    ordering_fields = ['city_name', 'created_at']
    ordering = ['city_name']

class FilialViewSet(viewsets.ModelViewSet):
    queryset = Filial.objects.all()
    serializer_class = FilialSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['filial_name', 'filial_code']
    ordering_fields = ['filial_name']
    ordering = ['filial_name']

class EkispiditorViewSet(viewsets.ModelViewSet):
    queryset = Ekispiditor.objects.filter(is_active=True)
    serializer_class = EkispiditorSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['ekispiditor_name', 'transport_number', 'phone_number']
    ordering_fields = ['ekispiditor_name', 'created_at']
    ordering = ['ekispiditor_name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        filial_id = self.request.query_params.get('filial', None)
        if filial_id:
            queryset = queryset.filter(filial_id=filial_id)
        return queryset

class CheckViewSet(viewsets.ModelViewSet):
    queryset = Check.objects.all()
    serializer_class = CheckSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CheckFilter
    search_fields = ['check_id', 'client_name', 'client_address', 'ekispiditor', 'project']
    ordering_fields = ['yetkazilgan_vaqti', 'created_at', 'status','ekispiditor', 'project']
    ordering = ['-yetkazilgan_vaqti']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Handle expeditor filtering by ID (convert ID to name)
        expeditor_id = self.request.query_params.get('expeditor_id', None)
        if expeditor_id:
            try:
                expeditor = Ekispiditor.objects.get(id=expeditor_id)
                queryset = queryset.filter(ekispiditor=expeditor.ekispiditor_name)
            except Ekispiditor.DoesNotExist:
                # If expeditor doesn't exist, return empty queryset
                queryset = queryset.none()
        
        return queryset
    
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
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get statistics for checks"""
        queryset = Check.objects.all()
        
        # Apply same filters as CheckViewSet
        expeditor_id = request.query_params.get('expeditor_id')
        if expeditor_id:
            try:
                expeditor = Ekispiditor.objects.get(id=expeditor_id)
                queryset = queryset.filter(ekispiditor=expeditor.ekispiditor_name)
            except Ekispiditor.DoesNotExist:
                queryset = queryset.none()
        
        # Date range filtering
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            try:
                from_date = parse_date(date_from)
                if from_date:
                    queryset = queryset.filter(sana__gte=from_date)
            except ValueError:
                pass
            
        if date_to:
            try:
                to_date = parse_date(date_to)
                if to_date:
                    queryset = queryset.filter(sana__lte=to_date)
            except ValueError:
                pass
        
        # Other filters
        project = request.query_params.get('project')
        if project:
            queryset = queryset.filter(loyiha__icontains=project)
        
        sklad = request.query_params.get('sklad')
        if sklad:
            queryset = queryset.filter(sklad__icontains=sklad)
        
        city = request.query_params.get('city')
        if city:
            queryset = queryset.filter(shahar__icontains=city)
        
        status = request.query_params.get('status')
        if status:
            queryset = queryset.filter(holat__icontains=status)
        
        # Calculate statistics
        total_checks = queryset.count()
        total_amount = queryset.aggregate(total=Sum('summa'))['total'] or 0
        
        # Status distribution
        status_stats = queryset.values('holat').annotate(count=Count('id')).order_by('-count')
        
        # City distribution
        city_stats = queryset.values('shahar').annotate(count=Count('id')).order_by('-count')[:10]
        
        # Project distribution
        project_stats = queryset.values('loyiha').annotate(count=Count('id')).order_by('-count')[:10]
        
        return Response({
            'total_checks': total_checks,
            'total_amount': float(total_amount),
            'status_distribution': list(status_stats),
            'city_distribution': list(city_stats),
            'project_distribution': list(project_stats),
        })

class ExpeditorViewSet(viewsets.ModelViewSet):
    queryset = Expeditor.objects.all()
    serializer_class = ExpeditorSerializer
    
    def get_queryset(self):
        queryset = Expeditor.objects.all()
        
        # Filter by filial if provided
        filial_id = self.request.query_params.get('filial_id')
        if filial_id:
            queryset = queryset.filter(filial_id=filial_id)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(phone__icontains=search)
            )
        
        return queryset.order_by('name')

class StatisticsView(viewsets.ViewSet):
    def list(self, request):
        # Get filter parameters
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        project = request.GET.get('project')
        sklad = request.GET.get('sklad')
        city = request.GET.get('city')
        ekispiditor = request.GET.get('ekispiditor')
        status = request.GET.get('status')
        expeditor_id = request.GET.get('expeditor_id')
        
        # Base queryset
        checks_qs = Check.objects.all()
        check_details_qs = CheckDetail.objects.all()
        today = now().date()
        today_checks_count = Check.objects.filter(
            yetkazilgan_vaqti__date=today
        ).count()
        
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
                end_of_day = date_to_parsed.replace(hour=23, minute=59, second=59)
                checks_qs = checks_qs.filter(yetkazilgan_vaqti__lte=end_of_day)
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
        
        # Handle expeditor filtering by ID
        if expeditor_id:
            try:
                expeditor = Ekispiditor.objects.get(id=expeditor_id)
                checks_qs = checks_qs.filter(ekispiditor=expeditor.ekispiditor_name)
            except Ekispiditor.DoesNotExist:
                checks_qs = checks_qs.none()
        
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
        
        # Top expeditors with total sum calculation
        top_expeditors = []
        expeditor_stats = (
            checks_qs.values('ekispiditor')
            .annotate(
                check_count=Count('id'),
                success_count=Count('id', filter=Q(status='delivered'))
            )
            .order_by('-check_count')[:5]
        )
        
        for exp_stat in expeditor_stats:
            exp_check_ids = checks_qs.filter(ekispiditor=exp_stat['ekispiditor']).values_list('check_id', flat=True)
            total_sum = check_details_qs.filter(check_id__in=exp_check_ids).aggregate(Sum('total_sum'))['total_sum__sum'] or 0
            
            top_expeditors.append({
                'ekispiditor': exp_stat['ekispiditor'],
                'check_count': exp_stat['check_count'],
                'success_count': exp_stat['success_count'],
                'total_sum': total_sum
            })
        
        # Top projects with total sum calculation
        top_projects = []
        project_stats = (
            checks_qs.values('project')
            .annotate(check_count=Count('id'))
            .order_by('-check_count')[:5]
        )
        
        for proj_stat in project_stats:
            proj_check_ids = checks_qs.filter(project=proj_stat['project']).values_list('check_id', flat=True)
            total_sum = check_details_qs.filter(check_id__in=proj_check_ids).aggregate(Sum('total_sum'))['total_sum__sum'] or 0
            
            top_projects.append({
                'project': proj_stat['project'],
                'check_count': proj_stat['check_count'],
                'total_sum': total_sum
            })
        
        # Top cities with total sum calculation
        top_cities = []
        city_stats = (
            checks_qs.values('city')
            .annotate(check_count=Count('id'))
            .order_by('-check_count')[:5]
        )
        
        for city_stat in city_stats:
            city_check_ids = checks_qs.filter(city=city_stat['city']).values_list('check_id', flat=True)
            total_sum = check_details_qs.filter(check_id__in=city_check_ids).aggregate(Sum('total_sum'))['total_sum__sum'] or 0
            
            top_cities.append({
                'city': city_stat['city'],
                'check_count': city_stat['check_count'],
                'total_sum': total_sum
            })
        
        # Daily statistics (current year)
        today = timezone.now().date()
        year_start = today.replace(month=1, day=1)
        days_count = (today - year_start).days + 1  # +1 for today

        daily_stats = []
        for i in range(days_count):
            date = year_start + timedelta(days=i)
            day_checks = checks_qs.filter(yetkazilgan_vaqti__date=date).count()
            daily_stats.append({
                'date': date.isoformat(),
                'checks': day_checks
            })
            
        return Response({
            'overview': {
                'total_checks': total_checks,
                'delivered_checks': delivered_checks,
                'failed_checks': failed_checks,
                'pending_checks': pending_checks,
                'success_rate': round(success_rate, 2),
                'today_checks_count': today_checks_count
            },
            'payment_stats': {
                'total_sum': payment_stats['total_sum'],
                'nalichniy': payment_stats['total_nalichniy'],
                'uzcard': payment_stats['total_uzcard'],
                'humo': payment_stats['total_humo'],
                'click': payment_stats['total_click']
            },
            'top_expeditors': top_expeditors,
            'top_projects': top_projects,
            'top_cities': top_cities,
            'daily_stats': daily_stats,
        })
