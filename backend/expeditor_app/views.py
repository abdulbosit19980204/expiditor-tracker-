from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
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

from .models import Projects, CheckDetail, Sklad, City, Ekispiditor, Check, Filial
from .serializers import (
    ProjectsSerializer, CheckDetailSerializer, SkladSerializer, 
    CitySerializer, EkispiditorSerializer, CheckSerializer, FilialSerializer
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
            start_of_day = value.replace(hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(**{f"{name}__gte": start_of_day})
        return queryset
    
    def filter_date_to_end_of_day(self, queryset, name, value):
        if value:
            end_of_day = value.replace(hour=23, minute=59, second=59, microsecond=999999)
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
        # Optimized queryset - since CheckDetail is linked by check_id (not FK),
        # we'll handle the relationship in the serializer for better performance
        # The serializer will use a more efficient approach
        return Check.objects.all()
    
    def list(self, request, *args, **kwargs):
        # Optimize by pre-fetching check details to avoid N+1 queries
        queryset = self.filter_queryset(self.get_queryset())
        
        # Pre-fetch check details in bulk
        check_ids = list(queryset.values_list('check_id', flat=True))
        check_details_map = {}
        if check_ids:
            check_details = CheckDetail.objects.filter(check_id__in=check_ids)
            check_details_map = {cd.check_id: cd for cd in check_details}
        
        # Add check details to serializer context
        serializer = self.get_serializer(queryset, many=True, context={
            'check_details_map': check_details_map
        })
        
        return Response(serializer.data)
    
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
        
        # Cache the result for 5 minutes
        cache.set(cache_key, result, 300)
        
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
                date_from_parsed = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                date_from_parsed = date_from_parsed.replace(hour=0, minute=0, second=0, microsecond=0)
                checks_qs = checks_qs.filter(yetkazilgan_vaqti__gte=date_from_parsed)
            except ValueError:
                pass
                
        if date_to:
            try:
                date_to_parsed = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                date_to_parsed = date_to_parsed.replace(hour=23, minute=59, second=59, microsecond=999999)
                checks_qs = checks_qs.filter(yetkazilgan_vaqti__lte=date_to_parsed)
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
        
        # Get top expeditors with counts and sums - optimized approach
        # Since Check and CheckDetail are linked by check_id (not FK), we need to join manually
        expeditor_stats = {}
        for check in checks_qs:
            expeditor = check.ekispiditor
            if not expeditor:
                continue
                
            if expeditor not in expeditor_stats:
                expeditor_stats[expeditor] = {
                    'name': expeditor,
                    'check_count': 0,
                    'success_count': 0,
                    'total_sum': 0
                }
            
            expeditor_stats[expeditor]['check_count'] += 1
            if check.status == 'delivered':
                expeditor_stats[expeditor]['success_count'] += 1
        
        # Get sums from CheckDetail for each expeditor
        for expeditor in expeditor_stats:
            expeditor_checks = checks_qs.filter(ekispiditor=expeditor)
            expeditor_check_ids = list(expeditor_checks.values_list('check_id', flat=True))
            if expeditor_check_ids:
                expeditor_sum = CheckDetail.objects.filter(check_id__in=expeditor_check_ids).aggregate(
                    total=Sum('total_sum')
                )['total'] or 0
                expeditor_stats[expeditor]['total_sum'] = expeditor_sum
        
        # Sort and limit top expeditors
        top_expeditors = sorted(expeditor_stats.values(), key=lambda x: x['check_count'], reverse=True)[:5]
        
        # Get top projects with counts and sums - optimized approach
        project_stats = {}
        for check in checks_qs:
            project = check.project
            if not project:
                continue
                
            if project not in project_stats:
                project_stats[project] = {
                    'name': project,
                    'check_count': 0,
                    'total_sum': 0
                }
            
            project_stats[project]['check_count'] += 1
        
        # Get sums from CheckDetail for each project
        for project in project_stats:
            project_checks = checks_qs.filter(project=project)
            project_check_ids = list(project_checks.values_list('check_id', flat=True))
            if project_check_ids:
                project_sum = CheckDetail.objects.filter(check_id__in=project_check_ids).aggregate(
                    total=Sum('total_sum')
                )['total'] or 0
                project_stats[project]['total_sum'] = project_sum
        
        # Sort and limit top projects
        top_projects = sorted(project_stats.values(), key=lambda x: x['check_count'], reverse=True)[:5]
        
        # Get top cities with counts and sums - optimized approach
        city_stats = {}
        for check in checks_qs:
            city = check.city
            if not city:
                continue
                
            if city not in city_stats:
                city_stats[city] = {
                    'name': city,
                    'check_count': 0,
                    'total_sum': 0
                }
            
            city_stats[city]['check_count'] += 1
        
        # Get sums from CheckDetail for each city
        for city in city_stats:
            city_checks = checks_qs.filter(city=city)
            city_check_ids = list(city_checks.values_list('check_id', flat=True))
            if city_check_ids:
                city_sum = CheckDetail.objects.filter(check_id__in=city_check_ids).aggregate(
                    total=Sum('total_sum')
                )['total'] or 0
                city_stats[city]['total_sum'] = city_sum
        
        # Sort and limit top cities
        top_cities = sorted(city_stats.values(), key=lambda x: x['check_count'], reverse=True)[:5]
        
        # Daily statistics - optimized for date range
        if date_from and date_to:
            try:
                start_date = datetime.fromisoformat(date_from.replace('Z', '+00:00')).date()
                end_date = datetime.fromisoformat(date_to.replace('Z', '+00:00')).date()
            except ValueError:
                start_date = today.replace(day=1)
                end_date = today
        else:
            start_date = today.replace(day=1)
            end_date = today
        
        # Top warehouses (sklads) - optimized approach
        sklad_stats = {}
        for check in checks_qs:
            sklad = check.sklad
            if not sklad:
                continue
                
            if sklad not in sklad_stats:
                sklad_stats[sklad] = {
                    'name': sklad,
                    'check_count': 0,
                    'total_sum': 0
                }
            
            sklad_stats[sklad]['check_count'] += 1
        
        # Get sums from CheckDetail for each sklad
        for sklad in sklad_stats:
            sklad_checks = checks_qs.filter(sklad=sklad)
            sklad_check_ids = list(sklad_checks.values_list('check_id', flat=True))
            if sklad_check_ids:
                sklad_sum = CheckDetail.objects.filter(check_id__in=sklad_check_ids).aggregate(
                    total=Sum('total_sum')
                )['total'] or 0
                sklad_stats[sklad]['total_sum'] = sklad_sum
        
        # Sort and limit top sklads
        top_sklads = sorted(sklad_stats.values(), key=lambda x: x['check_count'], reverse=True)[:5]

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
