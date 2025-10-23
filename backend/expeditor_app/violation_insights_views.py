"""
Enhanced Violation Insights Views
Provides advanced analytics and fraud detection patterns for expeditor check violations.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Count, Sum, Avg, Q, Max, Min
from django.db.models.functions import TruncHour, TruncDate, ExtractWeekDay
from datetime import datetime

from .models import CheckAnalytics


class ViolationInsightsView(APIView):
    """
    Enhanced violation insights: detailed patterns, timeline analysis,
    and expeditor behavior tracking for fraud detection.
    
    Identifies suspicious patterns:
    - Multiple checks in <100m within 5-10 minutes
    - Repeated violations at same locations
    - Expeditor risk scores
    - Hourly and daily activity patterns
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        expeditor = request.GET.get('expeditor')
        
        # Base queryset: violations with 3+ checks
        analytics_qs = CheckAnalytics.objects.filter(total_checks__gte=3)
        
        # Filter by violation type if specified
        violation_type = request.GET.get('violation_type')
        if violation_type:
            analytics_qs = analytics_qs.filter(violation_type=violation_type)
        
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
        
        # === PATTERN ANALYSIS ===
        # Suspicious patterns: multiple checks in <100m within 5-10 minutes
        suspicious_pattern_qs = analytics_qs.filter(
            radius_meters__lte=100,
            window_duration_minutes__lte=10,
            total_checks__gte=5
        )
        
        # === EXPEDITOR RANKING BY SEVERITY ===
        expeditor_insights = analytics_qs.values('most_active_expiditor').annotate(
            total_violations=Count('id'),
            total_checks=Sum('total_checks'),
            avg_radius=Avg('radius_meters'),
            min_radius=Min('radius_meters'),
            max_radius=Max('radius_meters'),
            last_violation=Max('window_start')
        ).order_by('-total_violations')[:50]
        
        # Calculate suspicious/critical/warning counts separately (PostgreSQL FILTER limitation workaround)
        expeditor_insights_list = list(expeditor_insights)
        for exp in expeditor_insights_list:
            exp_name = exp['most_active_expiditor']
            exp_qs = analytics_qs.filter(most_active_expiditor=exp_name)
            
            exp['suspicious_count'] = exp_qs.filter(
                radius_meters__lte=100,
                window_duration_minutes__lte=10,
                total_checks__gte=5
            ).count()
            exp['critical_count'] = exp_qs.filter(radius_meters__gte=1000).count()
            exp['warning_count'] = exp_qs.filter(radius_meters__gte=500, radius_meters__lt=1000).count()
            
            # Add same location violations count
            exp['same_location_count'] = exp_qs.filter(violation_type=CheckAnalytics.VIOLATION_TYPE_SAME_LOCATION).count()
        
        # Re-sort by suspicious count
        expeditor_insights = sorted(expeditor_insights_list, key=lambda x: (-x['suspicious_count'], -x['total_violations']))
        
        # Calculate risk score for each expeditor
        expeditor_risks = []
        for exp in expeditor_insights:
            if not exp['most_active_expiditor']:
                continue
            
            risk_score = (
                exp['suspicious_count'] * 10 +  # High weight for suspicious patterns
                exp['critical_count'] * 5 +
                exp['warning_count'] * 2 +
                exp['total_violations']
            )
            
            avg_checks_per_violation = (
                exp['total_checks'] / exp['total_violations'] 
                if exp['total_violations'] > 0 else 0
            )
            
            expeditor_risks.append({
                'expeditor': exp['most_active_expiditor'],
                'risk_score': risk_score,
                'total_violations': exp['total_violations'],
                'total_checks': exp['total_checks'],
                'avg_checks_per_violation': round(avg_checks_per_violation, 1),
                'suspicious_patterns': exp['suspicious_count'],
                'critical_violations': exp['critical_count'],
                'warning_violations': exp['warning_count'],
                'avg_radius': round(exp['avg_radius'], 1) if exp['avg_radius'] else 0,
                'min_radius': round(exp['min_radius'], 1) if exp['min_radius'] else 0,
                'max_radius': round(exp['max_radius'], 1) if exp['max_radius'] else 0,
                'last_violation': exp['last_violation'].isoformat() if exp['last_violation'] else None,
            })
        
        # === TIMELINE ANALYSIS: HOURLY PATTERNS ===
        hourly_pattern = analytics_qs.annotate(
            hour=TruncHour('window_start')
        ).values('hour').annotate(
            count=Count('id'),
            avg_checks=Avg('total_checks')
        ).order_by('hour')[:24]
        
        # Add suspicious count separately
        hourly_pattern_list = list(hourly_pattern)
        for hour_data in hourly_pattern_list:
            hour_val = hour_data['hour']
            hour_data['suspicious'] = analytics_qs.filter(
                window_start__hour=hour_val.hour if hour_val else 0,
                radius_meters__lte=100,
                window_duration_minutes__lte=10
            ).count()
        
        # === LOCATION CLUSTERING ===
        # Find locations where multiple violations occurred
        location_clusters = []
        location_map = {}
        
        for analytics in analytics_qs[:500]:
            if analytics.center_lat and analytics.center_lon:
                # Round to 3 decimal places (~100m precision)
                key = (round(analytics.center_lat, 3), round(analytics.center_lon, 3))
                if key not in location_map:
                    location_map[key] = {
                        'lat': analytics.center_lat,
                        'lon': analytics.center_lon,
                        'violations': [],
                        'expeditors': set(),
                        'total_checks': 0
                    }
                location_map[key]['violations'].append(analytics.id)
                location_map[key]['expeditors'].add(analytics.most_active_expiditor or 'Unknown')
                location_map[key]['total_checks'] += analytics.total_checks or 0
        
        # Filter clusters with 2+ violations
        for loc_key, loc_data in location_map.items():
            if len(loc_data['violations']) >= 2:
                location_clusters.append({
                    'lat': loc_data['lat'],
                    'lon': loc_data['lon'],
                    'violation_count': len(loc_data['violations']),
                    'expeditor_count': len(loc_data['expeditors']),
                    'total_checks': loc_data['total_checks'],
                    'expeditors': list(loc_data['expeditors'])
                })
        
        # Sort by violation count
        location_clusters.sort(key=lambda x: -x['violation_count'])
        
        # === DAILY ACTIVITY HEATMAP ===
        daily_heatmap = analytics_qs.annotate(
            date=TruncDate('window_start'),
            weekday=ExtractWeekDay('window_start')
        ).values('date', 'weekday').annotate(
            violations=Count('id'),
            checks=Sum('total_checks')
        ).order_by('-date')[:30]
        
        # Add suspicious count separately
        daily_heatmap_list = list(daily_heatmap)
        for day_data in daily_heatmap_list:
            date_val = day_data['date']
            day_data['suspicious'] = analytics_qs.filter(
                window_start__date=date_val,
                radius_meters__lte=100,
                window_duration_minutes__lte=10
            ).count()
        
        response_data = {
            'overview': {
                'total_violations': analytics_qs.count(),
                'suspicious_patterns': suspicious_pattern_qs.count(),
                'unique_expeditors': analytics_qs.values('most_active_expiditor').distinct().count(),
                'total_checks': analytics_qs.aggregate(total=Sum('total_checks'))['total'] or 0,
            },
            'expeditor_risks': expeditor_risks,
            'hourly_patterns': hourly_pattern_list,
            'location_clusters': location_clusters[:20],
            'daily_heatmap': daily_heatmap_list,
            'filters_applied': {
                'date_from': date_from,
                'date_to': date_to,
                'expeditor': expeditor,
            }
        }
        
        return Response(response_data)


class SameLocationViolationsView(APIView):
    """
    Dedicated view for same location violations.
    Shows expeditors who issued multiple checks from the same location on the same day.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        expeditor = request.GET.get('expeditor')
        
        # Base queryset: same location violations only
        analytics_qs = CheckAnalytics.objects.filter(
            total_checks__gte=3,
            violation_type=CheckAnalytics.VIOLATION_TYPE_SAME_LOCATION
        )
        
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
        
        # Get pagination parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        # Calculate pagination
        total_count = analytics_qs.count()
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        # Get paginated results
        violations = analytics_qs.order_by('-window_start')[start_index:end_index]
        
        # Format response data
        violations_data = []
        for violation in violations:
            violations_data.append({
                'id': violation.id,
                'window_start': violation.window_start.isoformat(),
                'window_end': violation.window_end.isoformat(),
                'window_duration_minutes': violation.window_duration_minutes,
                'center_lat': violation.center_lat,
                'center_lon': violation.center_lon,
                'total_checks': violation.total_checks,
                'unique_expiditors': violation.unique_expiditors,
                'most_active_expiditor': violation.most_active_expiditor,
                'most_active_count': violation.most_active_count,
                'avg_checks_per_expiditor': violation.avg_checks_per_expiditor,
                'check_ids': violation.check_ids,
                'check_details': violation.check_details,
                'analysis_date': violation.analysis_date.isoformat(),
                'created_at': violation.created_at.isoformat()
            })
        
        response_data = {
            'violations': violations_data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': (total_count + page_size - 1) // page_size
            },
            'summary': {
                'total_violations': total_count,
                'total_checks': sum(v['total_checks'] for v in violations_data),
                'unique_expeditors': len(set(v['most_active_expiditor'] for v in violations_data if v['most_active_expiditor']))
            }
        }
        
        return Response(response_data)

