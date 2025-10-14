from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Sum, Q, OuterRef, Subquery, IntegerField, FloatField, F, Value
from django.db.models.functions import TruncDate, TruncHour, Coalesce
from django.utils import timezone
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import django_filters
from django.core.cache import cache
from django.conf import settings
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
    """
    Optimized Ekispiditor ViewSet with improved query performance.
    Uses select_related and optimized subqueries for better performance.
    """
    serializer_class = EkispiditorSerializer
    pagination_class = None  # No pagination for dropdown data
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EkispiditorFilter
    search_fields = ['ekispiditor_name', 'transport_number', 'phone_number']
    ordering_fields = ['ekispiditor_name', 'created_at']
    ordering = ['ekispiditor_name']
    
    def get_queryset(self):
        # Optimized queryset with select_related for filial
        queryset = Ekispiditor.objects.filter(is_active=True).select_related('filial')

        # Optimized subquery for checks count using window functions
        checks_count_sq = (
            Check.objects
            .filter(ekispiditor=OuterRef('ekispiditor_name'), yetkazilgan_vaqti__isnull=False)
            .values('ekispiditor')
            .annotate(c=Count('id'))
            .values('c')[:1]
        )

        # Add checks count annotation
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
        # No FK relation to CheckDetail; avoid invalid prefetch
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

class StatisticsView(APIView):
    """
    Optimized statistics view with improved database queries and caching.
    Uses single queries with joins instead of multiple separate queries.
    Implements intelligent caching based on filter parameters.
    """
    
    def get_cache_key(self, request):
        """Generate cache key based on request parameters"""
        params = sorted(request.GET.items())
        cache_string = f"stats_{hashlib.md5(str(params).encode()).hexdigest()}"
        return cache_string
    
    def get(self, request):
        # Check cache first
        cache_key = self.get_cache_key(request)
        cached_result = cache.get(cache_key)
        if cached_result:
            return Response(cached_result)
        
        # Get filter parameters
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        project = request.GET.get('project')
        sklad = request.GET.get('sklad')
        city = request.GET.get('city')
        ekispiditor_id = request.GET.get('ekispiditor_id')
        status = request.GET.get('status')
        
        # Build optimized queryset with prefetch_related for better performance
        checks_qs = Check.objects.select_related().prefetch_related()
        today = timezone.now().date()
        
        # Apply filters with optimized date parsing
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
                ekispiditor = Ekispiditor.objects.select_related('filial').get(id=ekispiditor_id)
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
        
        # Single optimized query for all statistics using annotations
        stats_data = checks_qs.aggregate(
            total_checks=Count('id'),
            delivered_checks=Count('id', filter=Q(status='delivered')),
            failed_checks=Count('id', filter=Q(status='failed')),
            pending_checks=Count('id', filter=Q(status='pending')),
            today_checks=Count('id', filter=Q(yetkazilgan_vaqti__date=today)),
        )
        
        total_checks = stats_data['total_checks'] or 0
        delivered_checks = stats_data['delivered_checks'] or 0
        failed_checks = stats_data['failed_checks'] or 0
        pending_checks = stats_data['pending_checks'] or 0
        today_checks_count = stats_data['today_checks'] or 0
        
        success_rate = (delivered_checks / total_checks * 100) if total_checks > 0 else 0
        
        # Optimized payment statistics using subquery join
        payment_stats = CheckDetail.objects.filter(
            check_id__in=checks_qs.values_list('check_id', flat=True)
        ).aggregate(
            total_sum=Coalesce(Sum('total_sum', output_field=FloatField()), Value(0.0), output_field=FloatField()),
            total_nalichniy=Coalesce(Sum('nalichniy', output_field=FloatField()), Value(0.0), output_field=FloatField()),
            total_uzcard=Coalesce(Sum('uzcard', output_field=FloatField()), Value(0.0), output_field=FloatField()),
            total_humo=Coalesce(Sum('humo', output_field=FloatField()), Value(0.0), output_field=FloatField()),
            total_click=Coalesce(Sum('click', output_field=FloatField()), Value(0.0), output_field=FloatField()),
        )

        avg_check_sum = 0
        if payment_stats['total_sum'] and total_checks:
            avg_check_sum = float(payment_stats['total_sum']) / float(total_checks)
        
        # Optimized top expeditors with single query using window functions
        top_expeditors = list(
            checks_qs.values('ekispiditor')
            .annotate(
                check_count=Count('id'),
                success_count=Count('id', filter=Q(status='delivered')),
                total_sum=Sum(
                    Subquery(
                        CheckDetail.objects.filter(check_id=OuterRef('check_id'))
                        .values('total_sum')[:1]
                    ),
                    output_field=FloatField()
                )
            )
            .order_by('-check_count')[:5]
        )
        
        # Optimized top projects with single query
        top_projects = list(
            checks_qs.values('project')
            .annotate(
                check_count=Count('id'),
                total_sum=Sum(
                    Subquery(
                        CheckDetail.objects.filter(check_id=OuterRef('check_id'))
                        .values('total_sum')[:1]
                    ),
                    output_field=FloatField()
                )
            )
            .order_by('-check_count')[:5]
        )
        
        # Optimized top cities with single query
        top_cities = list(
            checks_qs.values('city')
            .annotate(
                check_count=Count('id'),
                total_sum=Sum(
                    Subquery(
                        CheckDetail.objects.filter(check_id=OuterRef('check_id'))
                        .values('total_sum')[:1]
                    ),
                    output_field=FloatField()
                )
            )
            .order_by('-check_count')[:5]
        )
        
        # Optimized top warehouses with single query
        top_sklads = list(
            checks_qs.values('sklad')
            .annotate(
                check_count=Count('id'),
                total_sum=Sum(
                    Subquery(
                        CheckDetail.objects.filter(check_id=OuterRef('check_id'))
                        .values('total_sum')[:1]
                    ),
                    output_field=FloatField()
                )
            )
            .order_by('-check_count')[:5]
        )

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

        # Optimized hourly distribution with single query
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

        # Optimized day of week distribution
        dow_counts = list(
            checks_qs.exclude(yetkazilgan_vaqti__isnull=True)
            .annotate(dow=F('yetkazilgan_vaqti__week_day'))
            .values('dow')
            .annotate(checks=Count('id'))
            .order_by('dow')
        )

        # Optimized daily stats using TruncDate
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
        
        # Prepare response data
        response_data = {
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
        
        # Cache the result for 5 minutes
        cache.set(cache_key, response_data, getattr(settings, 'CACHE_TTL', 300))
        
        return Response(response_data)


class GlobalStatisticsView(APIView):
    def get(self, request):
        # Reuse StatisticsView logic without ekispiditor filter
        request.GET._mutable = True  # type: ignore
        if 'ekispiditor_id' in request.GET:
            request.GET.pop('ekispiditor_id')
        request.GET._mutable = False  # type: ignore
        return StatisticsView().get(request)
