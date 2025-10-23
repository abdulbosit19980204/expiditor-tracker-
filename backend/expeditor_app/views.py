from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from django.db.models import Count, Sum, Q, OuterRef, Subquery, IntegerField, FloatField, F, Value, Prefetch
from django.db.models.functions import TruncDate, TruncHour, Coalesce
from django.utils import timezone
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
import django_filters
import hashlib

from .models import Projects, CheckDetail, Sklad, City, Ekispiditor, Check, Filial, TelegramAccount, CheckAnalytics
from .serializers import (
    ProjectsSerializer, CheckDetailSerializer, SkladSerializer, 
    CitySerializer, EkispiditorSerializer, CheckSerializer, FilialSerializer, TelegramAccountSerializer, CheckAnalyticsSerializer
)


class CustomPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
        })


class CheckFilter(django_filters.FilterSet):
    date_from = django_filters.DateTimeFilter(
        field_name='yetkazilgan_vaqti',
        lookup_expr='gte',
        method='filter_date_from_start_of_day'
    )
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
    ekispiditor_id = django_filters.NumberFilter(method='filter_by_ekispiditor_id')
    
    def filter_date_from_start_of_day(self, queryset, name, value):
        if value:
            # Ensure timezone-aware boundaries to avoid off-by-one-day due to UTC offsets
            aware = timezone.make_aware(value) if timezone.is_naive(value) else value
            start_of_day = aware.astimezone(timezone.get_current_timezone()).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            return queryset.filter(**{f"{name}__gte": start_of_day})
        return queryset
    
    def filter_date_to_end_of_day(self, queryset, name, value):
        if value:
            aware = timezone.make_aware(value) if timezone.is_naive(value) else value
            end_of_day = aware.astimezone(timezone.get_current_timezone()).replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
            return queryset.filter(**{f"{name}__lte": end_of_day})
        return queryset
    
    def filter_by_ekispiditor_id(self, queryset, name, value):
        try:
            ekispiditor = Ekispiditor.objects.get(id=value)
            return queryset.filter(ekispiditor=ekispiditor.ekispiditor_name)
        except Ekispiditor.DoesNotExist:
            return queryset.none()
    
    class Meta:
        model = Check
        # Exclude 'ekispiditor_id' from auto-generated filters to avoid
        # unsupported lookup on CharField; we provide a custom method filter above.
        fields = ['date_from', 'date_to', 'project', 'sklad', 'city', 'ekispiditor', 'status']


class EkispiditorFilter(django_filters.FilterSet):
    filial = django_filters.NumberFilter(field_name='filial__id')
    filial_name = django_filters.CharFilter(field_name='filial__filial_name', lookup_expr='icontains')
    has_checks = django_filters.BooleanFilter(method='filter_has_checks')
    
    def filter_has_checks(self, queryset, name, value):
        if value:
            # Get expeditors that have checks
            ekispiditor_names = Check.objects.values_list('ekispiditor', flat=True).distinct()
            return queryset.filter(ekispiditor_name__in=ekispiditor_names)
        return queryset
    
    class Meta:
        model = Ekispiditor
        fields = ['filial', 'filial_name', 'is_active', 'has_checks']


class CheckAnalyticsFilter(django_filters.FilterSet):
    date_from = django_filters.DateTimeFilter(field_name='window_start', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='window_end', lookup_expr='lte')
    expiditor = django_filters.CharFilter(field_name='most_active_expiditor', lookup_expr='icontains')
    min_checks = django_filters.NumberFilter(field_name='total_checks', lookup_expr='gte')
    max_checks = django_filters.NumberFilter(field_name='total_checks', lookup_expr='lte')
    
    class Meta:
        model = CheckAnalytics
        fields = ['date_from', 'date_to', 'expiditor', 'min_checks', 'max_checks', 'radius_meters', 'window_duration_minutes']


class ProjectsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Projects.objects.all()
    serializer_class = ProjectsSerializer
    pagination_class = None  # No pagination for dropdown data
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['project_name', 'project_description']
    ordering_fields = ['project_name', 'created_at']
    ordering = ['project_name']

class CheckDetailViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CheckDetail.objects.all()
    serializer_class = CheckDetailSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['check_id']
    ordering_fields = ['check_date', 'total_sum']
    ordering = ['-check_date']

class SkladViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sklad.objects.all()
    serializer_class = SkladSerializer
    pagination_class = None  # No pagination for dropdown data
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['sklad_name', 'sklad_code']
    ordering_fields = ['sklad_name', 'created_at']
    ordering = ['sklad_name']

class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    pagination_class = None  # No pagination for dropdown data
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['city_name', 'city_code']
    ordering_fields = ['city_name', 'created_at']
    ordering = ['city_name']

class FilialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Filial.objects.all()
    serializer_class = FilialSerializer
    pagination_class = None  # No pagination for dropdown data
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['filial_name', 'filial_code']
    ordering_fields = ['filial_name']
    ordering = ['filial_name']
    permission_classes = [AllowAny]
    authentication_classes = []

class EkispiditorViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EkispiditorSerializer
    pagination_class = None  # No pagination for dropdown data
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EkispiditorFilter
    search_fields = ['ekispiditor_name', 'transport_number', 'phone_number']
    ordering_fields = ['ekispiditor_name', 'created_at']
    ordering = ['ekispiditor_name']
    
    def get_queryset(self):
        # Optimized queryset with proper select_related and efficient subquery
        queryset = Ekispiditor.objects.filter(is_active=True).select_related('filial')

        # Optimized subquery for checks count - only count delivered checks for better performance
        checks_count_sq = (
            Check.objects
            .filter(ekispiditor=OuterRef('ekispiditor_name'), 
                   yetkazilgan_vaqti__isnull=False,
                   status='delivered')  # Only count delivered checks for better performance
            .values('ekispiditor')
            .annotate(c=Count('id'))
            .values('c')[:1]
        )

        queryset = queryset.annotate(checks_count=Subquery(checks_count_sq, output_field=IntegerField()))

        return queryset

class CheckViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CheckSerializer
    pagination_class = None  # Return all checks for selected expeditor
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CheckFilter
    search_fields = ['check_id', 'client_name', 'client_address', 'ekispiditor', 'project']
    ordering_fields = ['yetkazilgan_vaqti', 'created_at', 'status', 'ekispiditor', 'project']
    ordering = ['-yetkazilgan_vaqti']
    
    def get_queryset(self):
        # Optimized queryset - CheckDetail is linked by check_id, not FK
        # We'll handle the relationship in the serializer for better performance
        return Check.objects.all()
    
    @action(detail=False, methods=['get'])
    def today_checks(self, request):
        today = timezone.now().date()
        checks = self.get_queryset().filter(yetkazilgan_vaqti__date=today)
        serializer = self.get_serializer(checks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def with_locations(self, request):
        checks = self.get_queryset().filter(
            check_lat__isnull=False,
            check_lon__isnull=False
        )
        serializer = self.get_serializer(checks, many=True)
        return Response(serializer.data)


class CheckAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CheckAnalytics.objects.all()
    serializer_class = CheckAnalyticsSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CheckAnalyticsFilter
    search_fields = ['most_active_expiditor']
    ordering_fields = ['window_start', 'window_end', 'total_checks', 'most_active_count', 'analysis_date']
    ordering = ['-window_start', '-analysis_date']
    permission_classes = [AllowAny]
    authentication_classes = []


class CheckAnalyticsAPIView(APIView):
    """Simple API view for analytics data"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        try:
            queryset = CheckAnalytics.objects.all().order_by('-window_start', '-analysis_date')
            
            # Apply basic filtering
            if 'expiditor' in request.GET:
                queryset = queryset.filter(most_active_expiditor__icontains=request.GET['expiditor'])
            
            if 'min_checks' in request.GET:
                try:
                    min_checks = int(request.GET['min_checks'])
                    queryset = queryset.filter(total_checks__gte=min_checks)
                except ValueError:
                    pass
            
            # Limit results for now
            queryset = queryset[:100]
            
            serializer = CheckAnalyticsSerializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class StatisticsView(APIView):
    def get(self, request):
        # Create cache key based on request parameters
        cache_key_params = {
            'date_from': request.GET.get('date_from', ''),
            'date_to': request.GET.get('date_to', ''),
            'project': request.GET.get('project', ''),
            'sklad': request.GET.get('sklad', ''),
            'city': request.GET.get('city', ''),
            'ekispiditor_id': request.GET.get('ekispiditor_id', ''),
            'status': request.GET.get('status', ''),
        }
        
        # Create a unique cache key
        cache_key = f"statistics_{hashlib.md5(str(sorted(cache_key_params.items())).encode()).hexdigest()}"
        
        # Try to get from cache first (5 minute cache)
        cached_result = cache.get(cache_key)
        if cached_result:
            return Response(cached_result)
        
        # If not in cache, calculate statistics
        result = self._calculate_statistics(request)
        
        # Cache the result for 10 minutes
        cache.set(cache_key, result, 600)
        
        return Response(result)
    
    def _calculate_statistics(self, request):
        # Get filter parameters
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        project = request.GET.get('project')
        sklad = request.GET.get('sklad')
        city = request.GET.get('city')
        ekispiditor_id = request.GET.get('ekispiditor_id')
        status = request.GET.get('status')
        
        # Base queryset with optimization
        checks_qs = Check.objects.all()
        check_details_qs = CheckDetail.objects.all()
        today = timezone.now().date()
        
        # Apply filters
        if date_from:
            try:
                df = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                # Normalize to local tz and clamp to start-of-day
                df = timezone.make_aware(df) if timezone.is_naive(df) else df
                df = df.astimezone(timezone.get_current_timezone()).replace(hour=0, minute=0, second=0, microsecond=0)
                checks_qs = checks_qs.filter(yetkazilgan_vaqti__gte=df)
            except ValueError:
                pass
                
        if date_to:
            try:
                dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                # Normalize to local tz and clamp to end-of-day
                dt = timezone.make_aware(dt) if timezone.is_naive(dt) else dt
                dt = dt.astimezone(timezone.get_current_timezone()).replace(hour=23, minute=59, second=59, microsecond=999999)
                checks_qs = checks_qs.filter(yetkazilgan_vaqti__lte=dt)
            except ValueError:
                pass
        
        if ekispiditor_id:
            try:
                ekispiditor = Ekispiditor.objects.get(id=ekispiditor_id)
                checks_qs = checks_qs.filter(ekispiditor=ekispiditor.ekispiditor_name)
            except Ekispiditor.DoesNotExist:
                pass
                
        if project:
            checks_qs = checks_qs.filter(project__icontains=project)
            
        if sklad:
            checks_qs = checks_qs.filter(sklad__icontains=sklad)
            
        if city:
            checks_qs = checks_qs.filter(city__icontains=city)
            
        if status:
            checks_qs = checks_qs.filter(status=status)
        
        # Get check IDs for filtering check details
        check_ids = list(checks_qs.values_list('check_id', flat=True))
        if check_ids:
            check_details_qs = check_details_qs.filter(check_id__in=check_ids)
        else:
            check_details_qs = CheckDetail.objects.none()
        
        # Calculate statistics with single queries
        total_checks = checks_qs.count()
        status_counts = checks_qs.aggregate(
            delivered=Count('id', filter=Q(status='delivered')),
            failed=Count('id', filter=Q(status='failed')),
            pending=Count('id', filter=Q(status='pending'))
        )
        
        today_checks_count = checks_qs.filter(yetkazilgan_vaqti__date=today).count()
        
        delivered_checks = status_counts['delivered'] or 0
        failed_checks = status_counts['failed'] or 0
        pending_checks = status_counts['pending'] or 0
        
        success_rate = (delivered_checks / total_checks * 100) if total_checks > 0 else 0
        
        # Payment statistics and shares
        payment_stats = check_details_qs.aggregate(
            total_sum=Coalesce(Sum('total_sum', output_field=FloatField()), Value(0.0), output_field=FloatField()),
            total_nalichniy=Coalesce(Sum('nalichniy', output_field=FloatField()), Value(0.0), output_field=FloatField()),
            total_uzcard=Coalesce(Sum('uzcard', output_field=FloatField()), Value(0.0), output_field=FloatField()),
            total_humo=Coalesce(Sum('humo', output_field=FloatField()), Value(0.0), output_field=FloatField()),
            total_click=Coalesce(Sum('click', output_field=FloatField()), Value(0.0), output_field=FloatField()),
        )

        avg_check_sum = 0
        if payment_stats['total_sum'] and total_checks:
            avg_check_sum = float(payment_stats['total_sum']) / float(total_checks)
        
        # Optimized top expeditors query with single aggregation
        top_expeditors = list(
            checks_qs.values('ekispiditor')
            .annotate(
                check_count=Count('id'),
                success_count=Count('id', filter=Q(status='delivered'))
            )
            .order_by('-check_count')[:5]
        )
        
        # Optimized: Get all expeditor sums using bulk queries
        if top_expeditors:
            expeditor_names = [exp['ekispiditor'] for exp in top_expeditors]
            expeditor_sums = {}
            
            # Get all check IDs for these expeditors
            expeditor_check_ids = list(
                checks_qs.filter(ekispiditor__in=expeditor_names)
                .values_list('check_id', 'ekispiditor')
            )
            
            # Get all check details in one query
            check_ids = [check_id for check_id, _ in expeditor_check_ids]
            check_details = {
                detail.check_id: detail.total_sum or 0 
                for detail in CheckDetail.objects.filter(check_id__in=check_ids)
            }
            
            # Calculate sums by expeditor
            for check_id, expeditor_name in expeditor_check_ids:
                if expeditor_name not in expeditor_sums:
                    expeditor_sums[expeditor_name] = 0
                expeditor_sums[expeditor_name] += check_details.get(check_id, 0)
            
            # Add total sum to each expeditor
            for exp_stat in top_expeditors:
                exp_stat['total_sum'] = expeditor_sums.get(exp_stat['ekispiditor'], 0) or 0
        
        # Optimized top projects query
        top_projects = list(
            checks_qs.values('project')
            .annotate(check_count=Count('id'))
            .order_by('-check_count')[:5]
        )
        
        # Optimized: Get all project sums using bulk queries
        if top_projects:
            project_names = [proj['project'] for proj in top_projects]
            project_sums = {}
            
            # Get all check IDs for these projects
            project_check_ids = list(
                checks_qs.filter(project__in=project_names)
                .values_list('check_id', 'project')
            )
            
            # Get all check details in one query
            check_ids = [check_id for check_id, _ in project_check_ids]
            check_details = {
                detail.check_id: detail.total_sum or 0 
                for detail in CheckDetail.objects.filter(check_id__in=check_ids)
            }
            
            # Calculate sums by project
            for check_id, project_name in project_check_ids:
                if project_name not in project_sums:
                    project_sums[project_name] = 0
                project_sums[project_name] += check_details.get(check_id, 0)
            
            # Add total sum to each project
            for proj_stat in top_projects:
                proj_stat['total_sum'] = project_sums.get(proj_stat['project'], 0) or 0
        
        # Optimized top cities query
        top_cities = list(
            checks_qs.values('city')
            .annotate(check_count=Count('id'))
            .order_by('-check_count')[:5]
        )
        
        # Optimized: Get all city sums using bulk queries
        if top_cities:
            city_names = [city['city'] for city in top_cities]
            city_sums = {}
            
            # Get all check IDs for these cities
            city_check_ids = list(
                checks_qs.filter(city__in=city_names)
                .values_list('check_id', 'city')
            )
            
            # Get all check details in one query
            check_ids = [check_id for check_id, _ in city_check_ids]
            check_details = {
                detail.check_id: detail.total_sum or 0 
                for detail in CheckDetail.objects.filter(check_id__in=check_ids)
            }
            
            # Calculate sums by city
            for check_id, city_name in city_check_ids:
                if city_name not in city_sums:
                    city_sums[city_name] = 0
                city_sums[city_name] += check_details.get(check_id, 0)
            
            # Add total sum to each city
            for city_stat in top_cities:
                city_stat['total_sum'] = city_sums.get(city_stat['city'], 0) or 0
        
        # Daily statistics - optimized for date range
        if date_from and date_to:
            try:
                df = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                df = timezone.make_aware(df) if timezone.is_naive(df) else df
                dt = timezone.make_aware(dt) if timezone.is_naive(dt) else dt
                start_date = df.astimezone(timezone.get_current_timezone()).date()
                end_date = dt.astimezone(timezone.get_current_timezone()).date()
            except ValueError:
                start_date = today.replace(day=1)
                end_date = today
        else:
            start_date = today.replace(day=1)
            end_date = today
        
        # Top warehouses (sklads)
        top_sklads = list(
            checks_qs.values('sklad')
            .annotate(check_count=Count('id'))
            .order_by('-check_count')[:5]
        )

        # Hourly distribution
        hourly_data = (
            checks_qs.exclude(yetkazilgan_vaqti__isnull=True)
            .annotate(hour=TruncHour('yetkazilgan_vaqti'))
            .values('hour')
            .annotate(checks=Count('id'))
            .order_by('hour')
        )
        hourly_stats = [
            {'hour': (item['hour'].isoformat() if hasattr(item['hour'], 'isoformat') else str(item['hour'])), 'checks': item['checks']}
            for item in hourly_data
        ]

        # Day of week distribution
        dow_counts = list(
            checks_qs.exclude(yetkazilgan_vaqti__isnull=True)
            .annotate(dow=F('yetkazilgan_vaqti__week_day'))
            .values('dow')
            .annotate(checks=Count('id'))
            .order_by('dow')
        )

        # Get daily stats using TruncDate for portability
        daily_data = (
            checks_qs.filter(
                yetkazilgan_vaqti__date__gte=start_date,
                yetkazilgan_vaqti__date__lte=end_date
            )
            .annotate(day=TruncDate('yetkazilgan_vaqti'))
            .values('day')
            .annotate(checks=Count('id'))
            .order_by('day')
        )

        daily_stats = [
            {'date': (item['day'].isoformat() if hasattr(item['day'], 'isoformat') else str(item['day'])), 'checks': item['checks']}
            for item in daily_data
        ]
        
        return {
            'overview': {
                'total_checks': total_checks,
                'delivered_checks': delivered_checks,
                'failed_checks': failed_checks,
                'pending_checks': pending_checks,
                'success_rate': round(success_rate, 2),
                'today_checks_count': today_checks_count,
                'avg_check_sum': round(avg_check_sum, 2),
            },
            'payment_stats': {
                'total_sum': payment_stats['total_sum'] or 0,
                'nalichniy': payment_stats['total_nalichniy'] or 0,
                'uzcard': payment_stats['total_uzcard'] or 0,
                'humo': payment_stats['total_humo'] or 0,
                'click': payment_stats['total_click'] or 0
            },
            'top_expeditors': top_expeditors,
            'top_projects': top_projects,
            'top_cities': top_cities,
            'top_sklads': top_sklads,
            'daily_stats': daily_stats,
            'hourly_stats': hourly_stats,
            'dow_stats': dow_counts,
        }


class GlobalStatisticsView(APIView):
    def get(self, request):
        # Reuse StatisticsView logic without ekispiditor filter
        request.GET._mutable = True  # type: ignore
        if 'ekispiditor_id' in request.GET:
            request.GET.pop('ekispiditor_id')
        request.GET._mutable = False  # type: ignore
        return StatisticsView().get(request)


class AnalyticsSummaryView(APIView):
    """Dimension-based aggregates for analytics page.

    Supports grouping by project/sklad/city/ekispiditor/date with
    sums and counts. Date range and filters mirror StatisticsView.
    """
    def get(self, request):
        group_by = request.GET.get('group_by', 'project')

        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        project = request.GET.get('project')
        sklad = request.GET.get('sklad')
        city = request.GET.get('city')
        status = request.GET.get('status')

        checks_qs = Check.objects.all()
        if date_from:
            try:
                df = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                df = df.replace(hour=0, minute=0, second=0, microsecond=0)
                checks_qs = checks_qs.filter(yetkazilgan_vaqti__gte=df)
            except ValueError:
                pass
        if date_to:
            try:
                dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                dt = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
                checks_qs = checks_qs.filter(yetkazilgan_vaqti__lte=dt)
            except ValueError:
                pass
        if project:
            checks_qs = checks_qs.filter(project__icontains=project)
        if sklad:
            checks_qs = checks_qs.filter(sklad__icontains=sklad)
        if city:
            checks_qs = checks_qs.filter(city__icontains=city)
        if status:
            checks_qs = checks_qs.filter(status=status)

        # Join details when needed for sums
        check_ids = list(checks_qs.values_list('check_id', flat=True))
        details_map = {}
        if check_ids:
            details_map = {
                d.check_id: {
                    'total_sum': d.total_sum or 0,
                    'nalichniy': d.nalichniy or 0,
                    'uzcard': d.uzcard or 0,
                    'humo': d.humo or 0,
                    'click': d.click or 0,
                }
                for d in CheckDetail.objects.filter(check_id__in=check_ids)
            }

        # Determine key extractor
        def key_for(c: Check):
            if group_by == 'sklad':
                return c.sklad or '—'
            if group_by == 'city':
                return c.city or '—'
            if group_by == 'ekispiditor':
                return c.ekispiditor or '—'
            if group_by == 'date':
                return (c.yetkazilgan_vaqti.date().isoformat() if c.yetkazilgan_vaqti else '—')
            return c.project or '—'

        # Aggregate in Python for flexibility (with iterator to prevent loading all into memory)
        buckets = {}
        
        # Use iterator() to prevent loading entire queryset into memory at once
        # Process in chunks for better memory management
        chunk_size = 1000
        for i in range(0, checks_qs.count(), chunk_size):
            chunk = checks_qs[i:i + chunk_size]
            
            for c in chunk:
                k = key_for(c)
                b = buckets.setdefault(k, {
                    'dimension': k,
                    'checks': 0,
                    'delivered': 0,
                    'failed': 0,
                    'pending': 0,
                    'total_sum': 0.0,
                    'nalichniy': 0.0,
                    'uzcard': 0.0,
                    'humo': 0.0,
                    'click': 0.0,
                })
                b['checks'] += 1
                b[c.status or 'pending'] = b.get(c.status or 'pending', 0) + 1
                d = details_map.get(c.check_id)
                if d:
                    b['total_sum'] += d['total_sum']
                    b['nalichniy'] += d['nalichniy']
                    b['uzcard'] += d['uzcard']
                    b['humo'] += d['humo']
                    b['click'] += d['click']

        # Sort by checks desc
        items = sorted(buckets.values(), key=lambda x: (-x['checks'], x['dimension']))
        return Response({'group_by': group_by, 'items': items})


class TelegramTargetView(APIView):
    """Returns preferred Telegram deep-link based on active TelegramAccount."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        account = TelegramAccount.objects.filter(is_active=True).order_by('-updated_at', '-id').first()
        if not account:
            return Response({ 'url': None }, status=200)

        url = None
        if account.username:
            url = f"https://t.me/{account.username}"
        elif account.phone_number:
            # tg://resolve?phone=... works in some clients; https form is more universal via share
            phone = account.phone_number.lstrip('+')
            url = f"https://t.me/+{phone}"

        return Response({'url': url, 'display_name': account.display_name, 'username': account.username, 'phone_number': account.phone_number})


class ViolationAnalyticsDashboardView(APIView):
    """
    Comprehensive analytics dashboard for violation patterns.
    Provides all statistics that update based on filters.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Get filter parameters
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        expeditor = request.GET.get('expeditor')
        min_radius = request.GET.get('min_radius')
        max_radius = request.GET.get('max_radius')
        filial = request.GET.get('filial')
        # Optional exact cluster params
        window_minutes_param = request.GET.get('window_minutes')
        radius_meters_param = request.GET.get('radius_meters')
        
        # Base queryset - ONLY violations with 3+ checks
        analytics_qs = CheckAnalytics.objects.filter(total_checks__gte=3)
        
        # Apply filters
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                analytics_qs = analytics_qs.filter(window_start__gte=date_from_obj)
            except:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                analytics_qs = analytics_qs.filter(window_end__lte=date_to_obj)
            except:
                pass
        
        if expeditor:
            analytics_qs = analytics_qs.filter(most_active_expiditor__icontains=expeditor)
        
        # Filter by filial via Ekispiditor relation
        if filial:
            try:
                from .models import Ekispiditor, Filial
                try:
                    filial_ids = [int(filial)]
                    filial_qs = Filial.objects.filter(id__in=filial_ids)
                except ValueError:
                    filial_qs = Filial.objects.filter(filial_name__icontains=filial)
                if filial_qs.exists():
                    exp_names = Ekispiditor.objects.filter(filial__in=filial_qs).values_list('ekispiditor_name', flat=True)
                    analytics_qs = analytics_qs.filter(most_active_expiditor__in=list(exp_names))
            except Exception:
                pass

        # Exact cluster shape filters if provided
        if window_minutes_param:
            try:
                analytics_qs = analytics_qs.filter(window_duration_minutes=int(window_minutes_param))
            except ValueError:
                pass
        if radius_meters_param:
            try:
                analytics_qs = analytics_qs.filter(radius_meters=int(radius_meters_param))
            except ValueError:
                pass

        if min_radius:
            try:
                analytics_qs = analytics_qs.filter(radius_meters__gte=float(min_radius))
            except:
                pass
        
        if max_radius:
            try:
                analytics_qs = analytics_qs.filter(radius_meters__lte=float(max_radius))
            except:
                pass
        
        # === 1. OVERVIEW STATISTICS ===
        total_violations = analytics_qs.count()
        total_checks_involved = analytics_qs.aggregate(
            total=Sum('total_checks')
        )['total'] or 0
        
        unique_expeditors = analytics_qs.values('most_active_expiditor').distinct().count()
        
        from django.db.models import Avg as AvgFunc
        avg_radius = analytics_qs.aggregate(
            avg=AvgFunc('radius_meters')
        )['avg'] or 0
        
        # === 2. TOP VIOLATORS ===
        # Group by expeditor and count violations
        from django.db.models import Count, Avg, Max
        
        top_violators = analytics_qs.values('most_active_expiditor').annotate(
            violation_count=Count('id'),
            total_checks=Sum('total_checks'),
            avg_radius=Avg('radius_meters'),
            max_radius=Max('radius_meters'),
            last_violation=Max('window_start')
        ).order_by('-violation_count')[:10]
        
        # === 3. GEOGRAPHIC DISTRIBUTION ===
        # Get all check locations from analytics
        location_data = []
        for analytics in analytics_qs[:100]:  # Limit to prevent overload
            check_locs = analytics.get_check_locations()  # ✅ Method call
            if check_locs:
                for loc in check_locs:
                    location_data.append({
                        'lat': loc.get('lat'),
                        'lng': loc.get('lng'),
                        'expeditor': loc.get('expeditor'),
                        'client': loc.get('client_name'),
                    })
        
        # Group by approximate location (rounded coordinates)
        from collections import defaultdict
        location_groups = defaultdict(lambda: {'count': 0, 'expeditors': set()})
        
        for loc in location_data:
            if loc['lat'] and loc['lng']:
                # Round to 2 decimal places (~1km precision)
                key = (round(loc['lat'], 2), round(loc['lng'], 2))
                location_groups[key]['count'] += 1
                if loc['expeditor']:
                    location_groups[key]['expeditors'].add(loc['expeditor'])
        
        geographic_hotspots = [
            {
                'lat': k[0],
                'lng': k[1],
                'violation_count': v['count'],
                'expeditor_count': len(v['expeditors'])
            }
            for k, v in sorted(location_groups.items(), key=lambda x: -x[1]['count'])[:20]
        ]
        
        # === 4. TIME ANALYSIS ===
        # By hour of day
        hourly_distribution = analytics_qs.annotate(
            hour=TruncHour('window_start')
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')[:24]
        
        # By day of week
        from django.db.models.functions import ExtractWeekDay
        daily_distribution = analytics_qs.annotate(
            day_of_week=ExtractWeekDay('window_start')
        ).values('day_of_week').annotate(
            count=Count('id')
        ).order_by('day_of_week')
        
        # Convert to readable format
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        daily_stats = []
        for item in daily_distribution:
            day_index = item['day_of_week'] - 1  # Django uses 1-7, we want 0-6
            if 0 <= day_index < 7:
                daily_stats.append({
                    'day': day_names[day_index],
                    'count': item['count']
                })
        
        # === 5. SEVERITY ANALYSIS ===
        # Categorize by radius
        severity_breakdown = {
            'critical': analytics_qs.filter(radius_meters__gte=1000).count(),  # >1km
            'warning': analytics_qs.filter(radius_meters__gte=500, radius_meters__lt=1000).count(),  # 500m-1km
            'minor': analytics_qs.filter(radius_meters__lt=500).count(),  # <500m
        }
        
        # Radius distribution
        radius_ranges = [
            {'range': '0-250m', 'min': 0, 'max': 250},
            {'range': '250-500m', 'min': 250, 'max': 500},
            {'range': '500-750m', 'min': 500, 'max': 750},
            {'range': '750-1000m', 'min': 750, 'max': 1000},
            {'range': '1000m+', 'min': 1000, 'max': 999999},
        ]
        
        radius_distribution = []
        for r in radius_ranges:
            count = analytics_qs.filter(
                radius_meters__gte=r['min'],
                radius_meters__lt=r['max']
            ).count()
            radius_distribution.append({
                'range': r['range'],
                'count': count
            })
        
        # === 6. TREND ANALYSIS ===
        # Last 7 days trend
        last_7_days = analytics_qs.filter(
            analysis_date__gte=timezone.now().date() - timedelta(days=7)
        ).annotate(
            date=TruncDate('analysis_date')
        ).values('date').annotate(
            count=Count('id'),
            total_checks=Sum('total_checks')
        ).order_by('date')
        
        # === 7. EXPEDITOR PERFORMANCE ===
        expeditor_stats = analytics_qs.values('most_active_expiditor').annotate(
            violations=Count('id'),
            total_checks=Sum('total_checks'),
            avg_radius=Avg('radius_meters')
        ).order_by('-violations')[:20]
        
        # Calculate avg_checks_per_violation manually after aggregation
        expeditor_stats_list = list(expeditor_stats)
        for stat in expeditor_stats_list:
            if stat['violations'] > 0:
                stat['avg_checks_per_violation'] = round(stat['total_checks'] / stat['violations'], 2)
            else:
                stat['avg_checks_per_violation'] = 0
        
        # === COMPILE RESPONSE ===
        response_data = {
            'overview': {
                'total_violations': total_violations,
                'total_checks_involved': total_checks_involved,
                'unique_expeditors': unique_expeditors,
                'avg_radius_meters': round(avg_radius, 2) if avg_radius else 0,
            },
            'top_violators': list(top_violators),
            'geographic_hotspots': geographic_hotspots,
            'time_analysis': {
                'hourly': list(hourly_distribution),
                'daily': daily_stats,
            },
            'severity_analysis': {
                'breakdown': severity_breakdown,
                'radius_distribution': radius_distribution,
            },
            'trend_analysis': list(last_7_days),
            'expeditor_performance': list(expeditor_stats),
            'filters_applied': {
                'date_from': date_from,
                'date_to': date_to,
                'expeditor': expeditor,
                'filial': filial,
                'window_minutes': window_minutes_param,
                'radius_meters': radius_meters_param,
                'min_radius': min_radius,
                'max_radius': max_radius,
            }
        }
        
        return Response(response_data)


class ViolationDetailView(APIView):
    """
    Get detailed violation information for a specific expeditor.
    Returns all violation instances and their check locations.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        expeditor = request.GET.get('expeditor')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        filial = request.GET.get('filial')
        window_minutes_param = request.GET.get('window_minutes')
        radius_meters_param = request.GET.get('radius_meters')
        
        if not expeditor:
            return Response({'error': 'expeditor parameter is required'}, status=400)
        
        # Filter violations for this expeditor - ONLY 3+ checks
        analytics_qs = CheckAnalytics.objects.filter(
            most_active_expiditor__icontains=expeditor,
            total_checks__gte=3
        )
        
        # Apply date filters if provided
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                analytics_qs = analytics_qs.filter(window_start__gte=date_from_obj)
            except:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                analytics_qs = analytics_qs.filter(window_end__lte=date_to_obj)
            except:
                pass
        
        # Filial filter via Ekispiditor
        if filial:
            try:
                from .models import Ekispiditor, Filial
                try:
                    filial_ids = [int(filial)]
                    filial_qs = Filial.objects.filter(id__in=filial_ids)
                except ValueError:
                    filial_qs = Filial.objects.filter(filial_name__icontains=filial)
                if filial_qs.exists():
                    exp_names = Ekispiditor.objects.filter(filial__in=filial_qs).values_list('ekispiditor_name', flat=True)
                    analytics_qs = analytics_qs.filter(most_active_expiditor__in=list(exp_names))
            except Exception:
                pass

        if window_minutes_param:
            try:
                analytics_qs = analytics_qs.filter(window_duration_minutes=int(window_minutes_param))
            except ValueError:
                pass
        if radius_meters_param:
            try:
                analytics_qs = analytics_qs.filter(radius_meters=int(radius_meters_param))
            except ValueError:
                pass
        
        # Get all violations and their details
        violations = []
        all_check_locations = []
        
        # Deduplicate clusters by check_ids set (prefer highest total_checks then latest time)
        dedup_map = {}
        for item in analytics_qs.order_by('-window_start')[:200]:
            key = tuple(sorted(item.check_ids)) if item.check_ids else (
                round(item.center_lat or 0, 4), round(item.center_lon or 0, 4),
                (item.window_start.date().isoformat() if item.window_start else 'unknown'), item.radius_meters,
            )
            best = dedup_map.get(key)
            if not best or (item.total_checks or 0) > (best.total_checks or 0) or (
                (item.total_checks or 0) == (best.total_checks or 0) and (item.window_start or timezone.now()) > (best.window_start or timezone.now())
            ):
                dedup_map[key] = item

        for analytics in dedup_map.values():
            # Get check locations for this violation
            check_locations = analytics.get_check_locations()
            
            violation_data = {
                'id': analytics.id,
                'window_start': analytics.window_start.isoformat() if analytics.window_start else None,
                'window_end': analytics.window_end.isoformat() if analytics.window_end else None,
                'total_checks': analytics.total_checks,
                'check_ids': analytics.check_ids or [],
                'center_lat': float(analytics.center_lat) if analytics.center_lat else None,
                'center_lon': float(analytics.center_lon) if analytics.center_lon else None,
                'radius_meters': float(analytics.radius_meters) if analytics.radius_meters else 0,
                'expeditor': analytics.most_active_expiditor,
                'check_locations': check_locations,
                'severity': 'critical' if analytics.radius_meters and analytics.radius_meters >= 1000 else (
                    'warning' if analytics.radius_meters and analytics.radius_meters >= 500 else 'minor'
                )
            }
            
            violations.append(violation_data)
            all_check_locations.extend(check_locations)
        
        # Summary statistics
        from django.db.models import Sum, Avg, Max, Min
        summary_stats = analytics_qs.aggregate(
            total_violations=Count('id'),
            total_checks=Sum('total_checks'),
            avg_radius=Avg('radius_meters'),
            max_radius=Max('radius_meters'),
            min_radius=Min('radius_meters')
        )
        
        response_data = {
            'expeditor': expeditor,
            'summary': {
                'total_violations': summary_stats['total_violations'] or 0,
                'total_checks_involved': summary_stats['total_checks'] or 0,
                'avg_radius_meters': round(summary_stats['avg_radius'], 2) if summary_stats['avg_radius'] else 0,
                'max_radius_meters': round(summary_stats['max_radius'], 2) if summary_stats['max_radius'] else 0,
                'min_radius_meters': round(summary_stats['min_radius'], 2) if summary_stats['min_radius'] else 0,
            },
            'violations': violations,
            'all_check_locations': all_check_locations,
            'filters_applied': {
                'date_from': date_from,
                'date_to': date_to,
                'filial': filial,
                'window_minutes': window_minutes_param,
                'radius_meters': radius_meters_param,
            }
        }
        
        return Response(response_data)


class ViolationChecksListView(APIView):
    """
    Get paginated list of all checks that are part of violations (3+ checks).
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Get filter parameters
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        expeditor = request.GET.get('expeditor')
        filial = request.GET.get('filial')
        window_minutes_param = request.GET.get('window_minutes')
        radius_meters_param = request.GET.get('radius_meters')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        
        # Get violations with 3+ checks
        analytics_qs = CheckAnalytics.objects.filter(total_checks__gte=3)
        
        # Apply filters
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                analytics_qs = analytics_qs.filter(window_start__gte=date_from_obj)
            except:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                analytics_qs = analytics_qs.filter(window_end__lte=date_to_obj)
            except:
                pass
        
        if expeditor:
            analytics_qs = analytics_qs.filter(most_active_expiditor__icontains=expeditor)
        
        if filial:
            try:
                from .models import Ekispiditor, Filial
                try:
                    filial_ids = [int(filial)]
                    filial_qs = Filial.objects.filter(id__in=filial_ids)
                except ValueError:
                    filial_qs = Filial.objects.filter(filial_name__icontains=filial)
                if filial_qs.exists():
                    exp_names = Ekispiditor.objects.filter(filial__in=filial_qs).values_list('ekispiditor_name', flat=True)
                    analytics_qs = analytics_qs.filter(most_active_expiditor__in=list(exp_names))
            except Exception:
                pass
        
        if window_minutes_param:
            try:
                analytics_qs = analytics_qs.filter(window_duration_minutes=int(window_minutes_param))
            except ValueError:
                pass
        if radius_meters_param:
            try:
                analytics_qs = analytics_qs.filter(radius_meters=int(radius_meters_param))
            except ValueError:
                pass
        
        # Collect all check IDs from violations
        all_check_ids = []
        for analytics in analytics_qs:
            if analytics.check_ids:
                all_check_ids.extend(analytics.check_ids)
        
        # Remove duplicates and get Check objects
        unique_check_ids = list(set(all_check_ids))
        checks_qs = Check.objects.filter(check_id__in=unique_check_ids).order_by('-yetkazilgan_vaqti')
        
        # Calculate total
        total_checks = checks_qs.count()
        total_pages = (total_checks + page_size - 1) // page_size
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        checks = checks_qs[start:end]
        
        # Serialize checks
        checks_data = []
        for check in checks:
            # Get check detail
            check_detail = None
            try:
                detail = CheckDetail.objects.get(check_id=check.check_id)
                check_detail = {
                    'total_sum': float(detail.total_sum) if detail.total_sum else 0,
                    'nalichniy': float(detail.nalichniy) if detail.nalichniy else 0,
                    'uzcard': float(detail.uzcard) if detail.uzcard else 0,
                    'humo': float(detail.humo) if detail.humo else 0,
                    'click': float(detail.click) if detail.click else 0,
                }
            except CheckDetail.DoesNotExist:
                pass
            
            checks_data.append({
                'id': check.id,
                'check_id': check.check_id,
                'expeditor': check.ekispiditor,
                'project': check.project,
                'city': check.city,
                'sklad': check.sklad,
                'client_name': check.client_name,
                'client_address': check.client_address,
                'delivered_at': check.yetkazilgan_vaqti.isoformat() if check.yetkazilgan_vaqti else None,
                'status': check.status,
                'lat': float(check.check_lat) if check.check_lat else None,
                'lng': float(check.check_lon) if check.check_lon else None,
                'check_detail': check_detail,
            })
        
        response_data = {
            'total': total_checks,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages,
            'checks': checks_data,
            'filters_applied': {
                'date_from': date_from,
                'date_to': date_to,
                'expeditor': expeditor,
                'filial': filial,
                'window_minutes': window_minutes_param,
                'radius_meters': radius_meters_param,
            }
        }
        
        return Response(response_data)
