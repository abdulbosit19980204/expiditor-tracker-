"""
Analytics API Views for Expeditor Tracker
Provides REST API endpoints for comprehensive analytics and statistics.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from typing import Dict, Any

from .analytics_service import AnalyticsService
from .analytics_serializers import (
    DailySalesSummarySerializer,
    ExpeditorPerformanceSummarySerializer,
    PaymentDistributionSummarySerializer,
    ProjectStatisticsSummarySerializer,
    StatusDistributionSummarySerializer,
    LocationStatisticsSummarySerializer,
    RevenueSummarySerializer,
    HourlyDistributionSummarySerializer
)


@extend_schema_view(
    get=extend_schema(
        summary="Get daily sales summary",
        description="""
        Retrieve daily sales summary with total revenue and check counts.
        
        This endpoint provides:
        - Daily aggregated data with check counts and revenue
        - Summary statistics including total checks and average daily revenue
        - Support for date range filtering
        
        **Performance:** Results are cached for 15 minutes.
        """,
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='date_from',
                description='Start date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_to',
                description='End date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='project',
                description='Filter by project name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='city',
                description='Filter by city name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='sklad',
                description='Filter by warehouse name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='ekispiditor',
                description='Filter by expeditor name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='filial',
                description='Filter by filial name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='status',
                description='Filter by check status',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
        ],
        examples=[
            OpenApiExample(
                "Example Response",
                summary="Daily sales summary",
                value={
                    "daily_data": [
                        {
                            "date": "2024-01-15",
                            "total_checks": 45,
                            "total_revenue": 1250000.0,
                            "delivered_checks": 40,
                            "failed_checks": 3,
                            "pending_checks": 2
                        }
                    ],
                    "summary": {
                        "total_checks": 450,
                        "total_revenue": 12500000.0,
                        "avg_daily_revenue": 416666.67
                    }
                }
            )
        ]
    )
)
class DailySalesSummaryView(APIView):
    """
    API View for retrieving daily sales summary.
    
    Provides daily aggregated data with check counts and revenue statistics.
    """
    serializer_class = DailySalesSummarySerializer
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        filters = {
            'date_from': request.GET.get('date_from'),
            'date_to': request.GET.get('date_to'),
            'project': request.GET.get('project'),
            'city': request.GET.get('city'),
            'sklad': request.GET.get('sklad'),
            'ekispiditor': request.GET.get('ekispiditor'),
            'filial': request.GET.get('filial'),
            'status': request.GET.get('status'),
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        try:
            data = AnalyticsService.get_daily_sales_summary(filters)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve daily sales summary: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema_view(
    get=extend_schema(
        summary="Get expeditor performance statistics",
        description="""
        Retrieve expeditor performance statistics with success rates and revenue.
        
        This endpoint provides:
        - Top performing expeditors by check count
        - Success rates and delivery statistics
        - Revenue data per expeditor
        - Configurable limit for results
        
        **Performance:** Results are cached for 15 minutes.
        """,
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='limit',
                description='Maximum number of expeditors to return (default: 10)',
                required=False,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_from',
                description='Start date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_to',
                description='End date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='project',
                description='Filter by project name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='city',
                description='Filter by city name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='sklad',
                description='Filter by warehouse name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='filial',
                description='Filter by filial name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='status',
                description='Filter by check status',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
        ],
        examples=[
            OpenApiExample(
                "Example Response",
                summary="Expeditor performance",
                value={
                    "expeditor_performance": [
                        {
                            "ekispiditor": "John Doe",
                            "total_checks": 150,
                            "delivered_checks": 135,
                            "failed_checks": 10,
                            "pending_checks": 5,
                            "success_rate": 90.0,
                            "total_revenue": 3750000.0
                        }
                    ],
                    "summary": {
                        "total_expeditors": 10,
                        "avg_success_rate": 85.5
                    }
                }
            )
        ]
    )
)
class ExpeditorPerformanceView(APIView):
    """
    API View for retrieving expeditor performance statistics.
    
    Provides performance metrics for expeditors including success rates and revenue.
    """
    serializer_class = ExpeditorPerformanceSummarySerializer
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        filters = {
            'date_from': request.GET.get('date_from'),
            'date_to': request.GET.get('date_to'),
            'project': request.GET.get('project'),
            'city': request.GET.get('city'),
            'sklad': request.GET.get('sklad'),
            'ekispiditor': request.GET.get('ekispiditor'),
            'filial': request.GET.get('filial'),
            'status': request.GET.get('status'),
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        limit = int(request.GET.get('limit', 10))
        
        try:
            data = AnalyticsService.get_expeditor_performance(filters, limit)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve expeditor performance: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema_view(
    get=extend_schema(
        summary="Get payment method distribution",
        description="""
        Retrieve payment method distribution statistics.
        
        This endpoint provides:
        - Breakdown by payment methods (Cash, UzCard, Humo, Click)
        - Amount and percentage for each method
        - Total revenue summary
        
        **Performance:** Results are cached for 15 minutes.
        """,
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='date_from',
                description='Start date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_to',
                description='End date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='project',
                description='Filter by project name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='city',
                description='Filter by city name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='sklad',
                description='Filter by warehouse name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='ekispiditor',
                description='Filter by expeditor name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='filial',
                description='Filter by filial name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='status',
                description='Filter by check status',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
        ],
        examples=[
            OpenApiExample(
                "Example Response",
                summary="Payment distribution",
                value={
                    "payment_distribution": [
                        {
                            "method": "Cash",
                            "amount": 5000000.0,
                            "percentage": 45.5
                        },
                        {
                            "method": "UzCard",
                            "amount": 3000000.0,
                            "percentage": 27.3
                        },
                        {
                            "method": "Humo",
                            "amount": 2500000.0,
                            "percentage": 22.7
                        },
                        {
                            "method": "Click",
                            "amount": 500000.0,
                            "percentage": 4.5
                        }
                    ],
                    "summary": {
                        "total_revenue": 11000000.0,
                        "payment_methods_count": 4
                    }
                }
            )
        ]
    )
)
class PaymentDistributionView(APIView):
    """
    API View for retrieving payment method distribution.
    
    Provides breakdown of revenue by payment methods.
    """
    serializer_class = PaymentDistributionSummarySerializer
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        filters = {
            'date_from': request.GET.get('date_from'),
            'date_to': request.GET.get('date_to'),
            'project': request.GET.get('project'),
            'city': request.GET.get('city'),
            'sklad': request.GET.get('sklad'),
            'ekispiditor': request.GET.get('ekispiditor'),
            'filial': request.GET.get('filial'),
            'status': request.GET.get('status'),
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        try:
            data = AnalyticsService.get_payment_distribution(filters)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve payment distribution: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema_view(
    get=extend_schema(
        summary="Get project statistics",
        description="""
        Retrieve project-based statistics.
        
        This endpoint provides:
        - Statistics by project with check counts and revenue
        - Delivery success rates per project
        - Number of unique expeditors per project
        
        **Performance:** Results are cached for 15 minutes.
        """,
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='limit',
                description='Maximum number of projects to return (default: 10)',
                required=False,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_from',
                description='Start date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_to',
                description='End date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='project',
                description='Filter by project name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='city',
                description='Filter by city name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='sklad',
                description='Filter by warehouse name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='ekispiditor',
                description='Filter by expeditor name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='filial',
                description='Filter by filial name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='status',
                description='Filter by check status',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
        ]
    )
)
class ProjectStatisticsView(APIView):
    """
    API View for retrieving project-based statistics.
    
    Provides comprehensive statistics organized by project.
    """
    serializer_class = ProjectStatisticsSummarySerializer
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        filters = {
            'date_from': request.GET.get('date_from'),
            'date_to': request.GET.get('date_to'),
            'project': request.GET.get('project'),
            'city': request.GET.get('city'),
            'sklad': request.GET.get('sklad'),
            'ekispiditor': request.GET.get('ekispiditor'),
            'filial': request.GET.get('filial'),
            'status': request.GET.get('status'),
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        limit = int(request.GET.get('limit', 10))
        
        try:
            data = AnalyticsService.get_project_statistics(filters, limit)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve project statistics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema_view(
    get=extend_schema(
        summary="Get status distribution",
        description="""
        Retrieve status distribution statistics.
        
        This endpoint provides:
        - Distribution of checks by status (delivered, failed, pending)
        - Counts and percentages for each status
        - Overall delivery success rate
        
        **Performance:** Results are cached for 15 minutes.
        """,
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='date_from',
                description='Start date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_to',
                description='End date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='project',
                description='Filter by project name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='city',
                description='Filter by city name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='sklad',
                description='Filter by warehouse name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='ekispiditor',
                description='Filter by expeditor name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='filial',
                description='Filter by filial name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='status',
                description='Filter by check status',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
        ]
    )
)
class StatusDistributionView(APIView):
    """
    API View for retrieving status distribution statistics.
    
    Provides breakdown of checks by delivery status.
    """
    serializer_class = StatusDistributionSummarySerializer
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        filters = {
            'date_from': request.GET.get('date_from'),
            'date_to': request.GET.get('date_to'),
            'project': request.GET.get('project'),
            'city': request.GET.get('city'),
            'sklad': request.GET.get('sklad'),
            'ekispiditor': request.GET.get('ekispiditor'),
            'filial': request.GET.get('filial'),
            'status': request.GET.get('status'),
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        try:
            data = AnalyticsService.get_status_distribution(filters)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve status distribution: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema_view(
    get=extend_schema(
        summary="Get location-based statistics",
        description="""
        Retrieve statistics by filial, city, and sklad.
        
        This endpoint provides:
        - Statistics by city with check counts and revenue
        - Statistics by warehouse (sklad) with performance metrics
        - Statistics by filial with delivery data
        
        **Performance:** Results are cached for 15 minutes.
        """,
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='date_from',
                description='Start date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_to',
                description='End date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='project',
                description='Filter by project name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='city',
                description='Filter by city name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='sklad',
                description='Filter by warehouse name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='ekispiditor',
                description='Filter by expeditor name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='filial',
                description='Filter by filial name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='status',
                description='Filter by check status',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
        ]
    )
)
class LocationStatisticsView(APIView):
    """
    API View for retrieving location-based statistics.
    
    Provides statistics organized by filial, city, and warehouse.
    """
    serializer_class = LocationStatisticsSummarySerializer
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        filters = {
            'date_from': request.GET.get('date_from'),
            'date_to': request.GET.get('date_to'),
            'project': request.GET.get('project'),
            'city': request.GET.get('city'),
            'sklad': request.GET.get('sklad'),
            'ekispiditor': request.GET.get('ekispiditor'),
            'filial': request.GET.get('filial'),
            'status': request.GET.get('status'),
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        try:
            data = AnalyticsService.get_filial_city_sklad_stats(filters)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve location statistics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema_view(
    get=extend_schema(
        summary="Get comprehensive revenue summary",
        description="""
        Retrieve comprehensive revenue summary with KPIs.
        
        This endpoint provides:
        - Total revenue and check statistics
        - Performance metrics including success rates
        - Revenue per expeditor calculations
        - Basic statistics for all entities
        
        **Performance:** Results are cached for 15 minutes.
        """,
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='date_from',
                description='Start date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_to',
                description='End date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='project',
                description='Filter by project name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='city',
                description='Filter by city name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='sklad',
                description='Filter by warehouse name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='ekispiditor',
                description='Filter by expeditor name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='filial',
                description='Filter by filial name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='status',
                description='Filter by check status',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
        ]
    )
)
class RevenueSummaryView(APIView):
    """
    API View for retrieving comprehensive revenue summary.
    
    Provides KPI metrics and comprehensive revenue statistics.
    """
    serializer_class = RevenueSummarySerializer
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        filters = {
            'date_from': request.GET.get('date_from'),
            'date_to': request.GET.get('date_to'),
            'project': request.GET.get('project'),
            'city': request.GET.get('city'),
            'sklad': request.GET.get('sklad'),
            'ekispiditor': request.GET.get('ekispiditor'),
            'filial': request.GET.get('filial'),
            'status': request.GET.get('status'),
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        try:
            data = AnalyticsService.get_total_revenue_summary(filters)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve revenue summary: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema_view(
    get=extend_schema(
        summary="Get hourly distribution",
        description="""
        Retrieve hourly distribution of deliveries.
        
        This endpoint provides:
        - Hourly breakdown of check counts
        - Peak delivery hours identification
        - Delivery success rates by hour
        
        **Performance:** Results are cached for 15 minutes.
        """,
        tags=["Analytics"],
        parameters=[
            OpenApiParameter(
                name='date_from',
                description='Start date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='date_to',
                description='End date for filtering (ISO format: YYYY-MM-DDTHH:MM:SS)',
                required=False,
                type=OpenApiTypes.DATETIME,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='project',
                description='Filter by project name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='city',
                description='Filter by city name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='sklad',
                description='Filter by warehouse name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='ekispiditor',
                description='Filter by expeditor name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='filial',
                description='Filter by filial name',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='status',
                description='Filter by check status',
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY
            ),
        ]
    )
)
class HourlyDistributionView(APIView):
    """
    API View for retrieving hourly distribution of deliveries.
    
    Provides hourly breakdown of delivery statistics.
    """
    serializer_class = HourlyDistributionSummarySerializer
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        filters = {
            'date_from': request.GET.get('date_from'),
            'date_to': request.GET.get('date_to'),
            'project': request.GET.get('project'),
            'city': request.GET.get('city'),
            'sklad': request.GET.get('sklad'),
            'ekispiditor': request.GET.get('ekispiditor'),
            'filial': request.GET.get('filial'),
            'status': request.GET.get('status'),
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        try:
            data = AnalyticsService.get_hourly_distribution(filters)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve hourly distribution: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
