"""
Analytics Service for Expeditor Tracker
Provides optimized ORM-based analytics functions with Django aggregation tools.
"""

from django.db.models import (
    Sum, Count, Avg, Q, F, Value, 
    Case, When, DecimalField, FloatField
)
from django.db.models.functions import (
    TruncDate, TruncMonth, TruncHour, 
    Coalesce, Cast
)
from django.utils import timezone
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal

from .models import Check, CheckDetail, Ekispiditor, Projects, Sklad, City, Filial


class AnalyticsService:
    """
    Service class for handling analytics and statistics operations.
    Provides optimized queries with proper filtering and aggregation.
    """
    
    @staticmethod
    def _build_base_query(filters: Dict[str, Any]) -> Q:
        """
        Build base query object from filters.
        
        Args:
            filters: Dictionary containing filter parameters
            
        Returns:
            Q object for filtering
        """
        query = Q()
        
        # Date range filters
        if filters.get('date_from'):
            if isinstance(filters['date_from'], str):
                date_from = datetime.fromisoformat(filters['date_from'].replace('Z', '+00:00'))
            else:
                date_from = filters['date_from']
            query &= Q(yetkazilgan_vaqti__gte=date_from)
            
        if filters.get('date_to'):
            if isinstance(filters['date_to'], str):
                date_to = datetime.fromisoformat(filters['date_to'].replace('Z', '+00:00'))
            else:
                date_to = filters['date_to']
            query &= Q(yetkazilgan_vaqti__lte=date_to)
        
        # Other filters
        if filters.get('project'):
            query &= Q(project=filters['project'])
            
        if filters.get('city'):
            query &= Q(city=filters['city'])
            
        if filters.get('sklad'):
            query &= Q(sklad=filters['sklad'])
            
        if filters.get('ekispiditor'):
            query &= Q(ekispiditor=filters['ekispiditor'])
            
        if filters.get('filial'):
            query &= Q(ekispiditor__filial__filial_name=filters['filial'])
            
        if filters.get('status'):
            query &= Q(status=filters['status'])
            
        return query

    @staticmethod
    def get_daily_sales_summary(filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get daily sales summary with total revenue and check counts.
        
        Args:
            filters: Optional filters for the query
            
        Returns:
            Dictionary containing daily sales data
        """
        if filters is None:
            filters = {}
            
        base_query = AnalyticsService._build_base_query(filters)
        
        # Get daily aggregated data
        daily_data = (
            Check.objects
            .filter(base_query)
            .annotate(date=TruncDate('yetkazilgan_vaqti'))
            .values('date')
            .annotate(
                total_checks=Count('id'),
                total_revenue=Sum('checkdetail__total_sum'),
                delivered_checks=Count('id', filter=Q(status='delivered')),
                failed_checks=Count('id', filter=Q(status='failed')),
                pending_checks=Count('id', filter=Q(status='pending'))
            )
            .order_by('date')
        )
        
        # Calculate summary statistics
        total_checks = Check.objects.filter(base_query).count()
        total_revenue = (
            CheckDetail.objects
            .filter(check_id__in=Check.objects.filter(base_query).values_list('check_id', flat=True))
            .aggregate(total=Sum('total_sum'))['total'] or 0
        )
        
        return {
            'daily_data': list(daily_data),
            'summary': {
                'total_checks': total_checks,
                'total_revenue': float(total_revenue),
                'avg_daily_revenue': float(total_revenue / max(len(daily_data), 1))
            }
        }

    @staticmethod
    def get_expeditor_performance(filters: Dict[str, Any] = None, limit: int = 10) -> Dict[str, Any]:
        """
        Get expeditor performance statistics.
        
        Args:
            filters: Optional filters for the query
            limit: Maximum number of expeditors to return
            
        Returns:
            Dictionary containing expeditor performance data
        """
        if filters is None:
            filters = {}
            
        base_query = AnalyticsService._build_base_query(filters)
        
        expeditor_stats = (
            Check.objects
            .filter(base_query)
            .values('ekispiditor')
            .annotate(
                total_checks=Count('id'),
                delivered_checks=Count('id', filter=Q(status='delivered')),
                failed_checks=Count('id', filter=Q(status='failed')),
                pending_checks=Count('id', filter=Q(status='pending')),
                success_rate=Case(
                    When(total_checks=0, then=Value(0.0)),
                    default=Cast(
                        Count('id', filter=Q(status='delivered')) * 100.0 / Count('id'),
                        FloatField()
                    ),
                    output_field=FloatField()
                )
            )
            .order_by('-total_checks')[:limit]
        )
        
        # Get revenue data for each expeditor
        expeditor_revenue = {}
        for stat in expeditor_stats:
            expeditor = stat['ekispiditor']
            revenue = (
                CheckDetail.objects
                .filter(
                    check_id__in=Check.objects.filter(
                        base_query & Q(ekispiditor=expeditor)
                    ).values_list('check_id', flat=True)
                )
                .aggregate(total=Sum('total_sum'))['total'] or 0
            )
            expeditor_revenue[expeditor] = float(revenue)
        
        # Add revenue to stats
        for stat in expeditor_stats:
            stat['total_revenue'] = expeditor_revenue.get(stat['ekispiditor'], 0)
        
        return {
            'expeditor_performance': list(expeditor_stats),
            'summary': {
                'total_expeditors': len(expeditor_stats),
                'avg_success_rate': sum(s['success_rate'] for s in expeditor_stats) / max(len(expeditor_stats), 1)
            }
        }

    @staticmethod
    def get_payment_distribution(filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get payment method distribution statistics.
        
        Args:
            filters: Optional filters for the query
            
        Returns:
            Dictionary containing payment distribution data
        """
        if filters is None:
            filters = {}
            
        base_query = AnalyticsService._build_base_query(filters)
        
        # Get payment method totals
        payment_stats = (
            CheckDetail.objects
            .filter(check_id__in=Check.objects.filter(base_query).values_list('check_id', flat=True))
            .aggregate(
                total_sum=Sum('total_sum'),
                nalichniy=Sum('nalichniy'),
                uzcard=Sum('uzcard'),
                humo=Sum('humo'),
                click=Sum('click')
            )
        )
        
        total_sum = payment_stats['total_sum'] or 0
        
        # Calculate percentages
        payment_distribution = []
        for method, amount in [
            ('Cash', payment_stats['nalichniy'] or 0),
            ('UzCard', payment_stats['uzcard'] or 0),
            ('Humo', payment_stats['humo'] or 0),
            ('Click', payment_stats['click'] or 0)
        ]:
            percentage = (amount / total_sum * 100) if total_sum > 0 else 0
            payment_distribution.append({
                'method': method,
                'amount': float(amount),
                'percentage': round(percentage, 2)
            })
        
        return {
            'payment_distribution': payment_distribution,
            'summary': {
                'total_revenue': float(total_sum),
                'payment_methods_count': len([p for p in payment_distribution if p['amount'] > 0])
            }
        }

    @staticmethod
    def get_project_statistics(filters: Dict[str, Any] = None, limit: int = 10) -> Dict[str, Any]:
        """
        Get project-based statistics.
        
        Args:
            filters: Optional filters for the query
            limit: Maximum number of projects to return
            
        Returns:
            Dictionary containing project statistics data
        """
        if filters is None:
            filters = {}
            
        base_query = AnalyticsService._build_base_query(filters)
        
        project_stats = (
            Check.objects
            .filter(base_query)
            .values('project')
            .annotate(
                total_checks=Count('id'),
                delivered_checks=Count('id', filter=Q(status='delivered')),
                failed_checks=Count('id', filter=Q(status='failed')),
                pending_checks=Count('id', filter=Q(status='pending')),
                unique_expeditors=Count('ekispiditor', distinct=True)
            )
            .order_by('-total_checks')[:limit]
        )
        
        # Get revenue data for each project
        project_revenue = {}
        for stat in project_stats:
            project = stat['project']
            revenue = (
                CheckDetail.objects
                .filter(
                    check_id__in=Check.objects.filter(
                        base_query & Q(project=project)
                    ).values_list('check_id', flat=True)
                )
                .aggregate(total=Sum('total_sum'))['total'] or 0
            )
            project_revenue[project] = float(revenue)
        
        # Add revenue to stats
        for stat in project_stats:
            stat['total_revenue'] = project_revenue.get(stat['project'], 0)
        
        return {
            'project_statistics': list(project_stats),
            'summary': {
                'total_projects': len(project_stats),
                'most_active_project': max(project_stats, key=lambda x: x['total_checks'])['project'] if project_stats else None
            }
        }

    @staticmethod
    def get_filial_city_sklad_stats(filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get statistics by filial, city, and sklad.
        
        Args:
            filters: Optional filters for the query
            
        Returns:
            Dictionary containing location-based statistics
        """
        if filters is None:
            filters = {}
            
        base_query = AnalyticsService._build_base_query(filters)
        
        # City statistics
        city_stats = (
            Check.objects
            .filter(base_query)
            .values('city')
            .annotate(
                total_checks=Count('id'),
                total_revenue=Sum('checkdetail__total_sum'),
                unique_expeditors=Count('ekispiditor', distinct=True)
            )
            .order_by('-total_checks')[:10]
        )
        
        # Sklad statistics
        sklad_stats = (
            Check.objects
            .filter(base_query)
            .values('sklad')
            .annotate(
                total_checks=Count('id'),
                total_revenue=Sum('checkdetail__total_sum'),
                unique_expeditors=Count('ekispiditor', distinct=True)
            )
            .order_by('-total_checks')[:10]
        )
        
        # Filial statistics
        filial_stats = (
            Check.objects
            .filter(base_query)
            .values('ekispiditor__filial__filial_name')
            .annotate(
                total_checks=Count('id'),
                total_revenue=Sum('checkdetail__total_sum'),
                unique_expeditors=Count('ekispiditor', distinct=True)
            )
            .order_by('-total_checks')
        )
        
        return {
            'city_statistics': list(city_stats),
            'sklad_statistics': list(sklad_stats),
            'filial_statistics': list(filial_stats),
            'summary': {
                'total_cities': len(city_stats),
                'total_sklads': len(sklad_stats),
                'total_filials': len(filial_stats)
            }
        }

    @staticmethod
    def get_status_distribution(filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get status distribution statistics.
        
        Args:
            filters: Optional filters for the query
            
        Returns:
            Dictionary containing status distribution data
        """
        if filters is None:
            filters = {}
            
        base_query = AnalyticsService._build_base_query(filters)
        
        status_stats = (
            Check.objects
            .filter(base_query)
            .values('status')
            .annotate(
                count=Count('id'),
                percentage=Case(
                    When(count=0, then=Value(0.0)),
                    default=Cast(
                        Count('id') * 100.0 / Count('id'),
                        FloatField()
                    ),
                    output_field=FloatField()
                )
            )
            .order_by('-count')
        )
        
        total_checks = Check.objects.filter(base_query).count()
        
        # Calculate actual percentages
        status_distribution = []
        for stat in status_stats:
            percentage = (stat['count'] / total_checks * 100) if total_checks > 0 else 0
            status_distribution.append({
                'status': stat['status'],
                'count': stat['count'],
                'percentage': round(percentage, 2)
            })
        
        return {
            'status_distribution': status_distribution,
            'summary': {
                'total_checks': total_checks,
                'delivery_success_rate': sum(s['percentage'] for s in status_distribution if s['status'] == 'delivered')
            }
        }

    @staticmethod
    def get_total_revenue_summary(filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get comprehensive revenue summary.
        
        Args:
            filters: Optional filters for the query
            
        Returns:
            Dictionary containing revenue summary data
        """
        if filters is None:
            filters = {}
            
        base_query = AnalyticsService._build_base_query(filters)
        
        # Get basic counts and revenue
        basic_stats = (
            Check.objects
            .filter(base_query)
            .aggregate(
                total_checks=Count('id'),
                delivered_checks=Count('id', filter=Q(status='delivered')),
                failed_checks=Count('id', filter=Q(status='failed')),
                pending_checks=Count('id', filter=Q(status='pending')),
                unique_expeditors=Count('ekispiditor', distinct=True),
                unique_cities=Count('city', distinct=True),
                unique_projects=Count('project', distinct=True)
            )
        )
        
        # Get revenue data
        revenue_stats = (
            CheckDetail.objects
            .filter(check_id__in=Check.objects.filter(base_query).values_list('check_id', flat=True))
            .aggregate(
                total_revenue=Sum('total_sum'),
                avg_check_value=Avg('total_sum'),
                total_cash=Sum('nalichniy'),
                total_cards=Sum('uzcard') + Sum('humo'),
                total_click=Sum('click')
            )
        )
        
        # Calculate success rate
        success_rate = 0
        if basic_stats['total_checks'] > 0:
            success_rate = (basic_stats['delivered_checks'] / basic_stats['total_checks']) * 100
        
        return {
            'basic_statistics': basic_stats,
            'revenue_statistics': revenue_stats,
            'performance_metrics': {
                'success_rate': round(success_rate, 2),
                'avg_revenue_per_check': float(revenue_stats['avg_check_value'] or 0),
                'revenue_per_expeditor': float(revenue_stats['total_revenue'] or 0) / max(basic_stats['unique_expeditors'], 1)
            }
        }

    @staticmethod
    def get_hourly_distribution(filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get hourly distribution of deliveries.
        
        Args:
            filters: Optional filters for the query
            
        Returns:
            Dictionary containing hourly distribution data
        """
        if filters is None:
            filters = {}
            
        base_query = AnalyticsService._build_base_query(filters)
        
        hourly_data = (
            Check.objects
            .filter(base_query)
            .annotate(hour=TruncHour('yetkazilgan_vaqti'))
            .values('hour')
            .annotate(
                checks_count=Count('id'),
                delivered_count=Count('id', filter=Q(status='delivered'))
            )
            .order_by('hour')
        )
        
        return {
            'hourly_distribution': list(hourly_data),
            'summary': {
                'peak_hour': max(hourly_data, key=lambda x: x['checks_count'])['hour'] if hourly_data else None,
                'total_hours_covered': len(hourly_data)
            }
        }
