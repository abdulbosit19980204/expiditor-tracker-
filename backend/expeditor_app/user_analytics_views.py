from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.functions import TruncDate, TruncHour, TruncDay
from .models import UserSession, UserActivity
import logging

logger = logging.getLogger(__name__)


class UserAnalyticsView(APIView):
    """Main user analytics endpoint"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get comprehensive user analytics"""
        try:
            # Check if user is superuser
            if not request.user.is_superuser:
                return Response(
                    {'error': 'Access denied. Super user required.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get date range from query params
            date_from = request.GET.get('date_from')
            date_to = request.GET.get('date_to')
            user_type = request.GET.get('user_type', 'all')
            
            # Default to last 30 days if no date range provided
            if not date_from:
                date_from = (timezone.now() - timedelta(days=30)).isoformat()
            if not date_to:
                date_to = timezone.now().isoformat()
            
            # Parse dates
            try:
                start_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use ISO format.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Base queryset
            sessions_qs = UserSession.objects.filter(
                first_visit__gte=start_date,
                first_visit__lte=end_date
            )
            
            # Filter by user type
            if user_type != 'all':
                sessions_qs = sessions_qs.filter(user_type=user_type)
            
            # Calculate metrics
            analytics_data = self._calculate_analytics(sessions_qs, start_date, end_date)
            
            return Response(analytics_data)
            
        except Exception as e:
            logger.error(f"User analytics error: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _calculate_analytics(self, sessions_qs, start_date, end_date):
        """Calculate comprehensive analytics"""
        
        # Basic counts
        total_sessions = sessions_qs.count()
        
        # REAL TIME: Active sessions (last 5 minutes)
        active_threshold = timezone.now() - timedelta(minutes=5)
        active_sessions = sessions_qs.filter(
            last_activity__gte=active_threshold
        ).count()
        
        # REAL TIME: Online users (last 2 minutes)
        online_threshold = timezone.now() - timedelta(minutes=2)
        online_users = sessions_qs.filter(
            last_activity__gte=online_threshold
        ).values('ip_address').distinct().count()
        
        # User type distribution
        user_type_dist = sessions_qs.values('user_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Daily active users
        daily_active = sessions_qs.annotate(
            date=TruncDate('first_visit')
        ).values('date').annotate(
            count=Count('id', distinct=True)
        ).order_by('date')
        
        # Hourly activity distribution
        hourly_activity = UserActivity.objects.filter(
            session__in=sessions_qs,
            timestamp__gte=start_date,
            timestamp__lte=end_date
        ).annotate(
            hour=TruncHour('timestamp')
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')
        
        # Activity type distribution
        activity_dist = UserActivity.objects.filter(
            session__in=sessions_qs,
            timestamp__gte=start_date,
            timestamp__lte=end_date
        ).values('activity_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Geographic distribution
        geo_dist = sessions_qs.exclude(
            location__isnull=True
        ).values('location').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Session duration statistics
        sessions_with_duration = sessions_qs.exclude(session_duration__isnull=True)
        avg_session_duration = sessions_with_duration.aggregate(
            avg_duration=Avg('session_duration')
        )['avg_duration']
        
        # API usage statistics
        api_stats = sessions_qs.aggregate(
            total_api_calls=Sum('api_calls'),
            total_map_interactions=Sum('map_interactions'),
            total_page_views=Sum('page_views')
        )
        
        # Recent activity
        recent_activities = UserActivity.objects.filter(
            session__in=sessions_qs
        ).select_related('session').order_by('-timestamp')[:20]
        
        recent_activities_data = []
        for activity in recent_activities:
            recent_activities_data.append({
                'id': activity.id,
                'session_id': activity.session.session_id[:8] + '...',
                'ip_address': activity.session.ip_address,
                'user_type': activity.session.user_type,
                'activity_type': activity.activity_type,
                'timestamp': activity.timestamp.isoformat(),
                'page_url': activity.page_url,
                'api_endpoint': activity.api_endpoint,
            })
        
            return {
                'overview': {
                    'total_sessions': total_sessions,
                    'active_sessions': active_sessions,
                    'online_users': online_users,
                    'date_range': {
                        'from': start_date.isoformat(),
                        'to': end_date.isoformat()
                    }
                },
            'user_type_distribution': list(user_type_dist),
            'daily_active_users': list(daily_active),
            'hourly_activity': list(hourly_activity),
            'activity_distribution': list(activity_dist),
            'geographic_distribution': list(geo_dist),
            'session_statistics': {
                'average_duration_minutes': int(avg_session_duration.total_seconds() / 60) if avg_session_duration else 0,
                'total_api_calls': api_stats['total_api_calls'] or 0,
                'total_map_interactions': api_stats['total_map_interactions'] or 0,
                'total_page_views': api_stats['total_page_views'] or 0,
            },
            'recent_activities': recent_activities_data,
        }


class LiveUserDataView(APIView):
    """Real-time user data endpoint"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get live user data"""
        try:
            if not request.user.is_superuser:
                return Response(
                    {'error': 'Access denied. Super user required.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # REAL TIME: Users active in last 2 minutes (truly online)
            two_minutes_ago = timezone.now() - timedelta(minutes=2)
            online_users = UserSession.objects.filter(
                last_activity__gte=two_minutes_ago
            ).order_by('-last_activity')
            
            # REAL TIME: Active sessions (last 5 minutes)
            five_minutes_ago = timezone.now() - timedelta(minutes=5)
            active_sessions = UserSession.objects.filter(
                last_activity__gte=five_minutes_ago
            ).order_by('-last_activity')
            
            # Today's statistics
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_stats = UserSession.objects.filter(
                first_visit__gte=today_start
            ).aggregate(
                total_today=Count('id'),
                api_calls_today=Sum('api_calls'),
                page_views_today=Sum('page_views'),
                map_interactions_today=Sum('map_interactions')
            )
            
            # Recent activities (last 10)
            recent_activities = UserActivity.objects.select_related('session').order_by('-timestamp')[:10]
            
            online_users_data = []
            for user in online_users:
                online_users_data.append({
                    'session_id': user.session_id[:8] + '...',
                    'ip_address': user.ip_address,
                    'user_type': user.user_type,
                    'last_activity': user.last_activity.isoformat(),
                    'session_duration_minutes': user.session_duration_minutes,
                    'location': user.location or 'Unknown',
                })
            
            recent_activities_data = []
            for activity in recent_activities:
                recent_activities_data.append({
                    'session_id': activity.session.session_id[:8] + '...',
                    'ip_address': activity.session.ip_address,
                    'activity_type': activity.activity_type,
                    'timestamp': activity.timestamp.isoformat(),
                    'page_url': activity.page_url,
                })
            
            return Response({
                'online_users': online_users_data,
                'online_count': len(online_users_data),
                'today_stats': today_stats,
                'recent_activities': recent_activities_data,
                'last_updated': timezone.now().isoformat(),
            })
            
        except Exception as e:
            logger.error(f"Live user data error: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserSessionListView(APIView):
    """List all user sessions with filtering"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get paginated list of user sessions"""
        try:
            if not request.user.is_superuser:
                return Response(
                    {'error': 'Access denied. Super user required.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Pagination
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            offset = (page - 1) * page_size
            
            # Filtering
            user_type = request.GET.get('user_type')
            is_active = request.GET.get('is_active')
            
            sessions_qs = UserSession.objects.all()
            
            if user_type:
                sessions_qs = sessions_qs.filter(user_type=user_type)
            if is_active is not None:
                sessions_qs = sessions_qs.filter(is_active=is_active.lower() == 'true')
            
            # Get total count
            total_count = sessions_qs.count()
            
            # Get paginated results
            sessions = sessions_qs.order_by('-last_activity')[offset:offset + page_size]
            
            sessions_data = []
            for session in sessions:
                sessions_data.append({
                    'id': session.id,
                    'session_id': session.session_id[:8] + '...',
                    'ip_address': session.ip_address,
                    'user_type': session.user_type,
                    'first_visit': session.first_visit.isoformat(),
                    'last_activity': session.last_activity.isoformat(),
                    'total_requests': session.total_requests,
                    'page_views': session.page_views,
                    'map_interactions': session.map_interactions,
                    'api_calls': session.api_calls,
                    'session_duration_minutes': session.session_duration_minutes,
                    'is_active': session.is_active,
                    'location': session.location or 'Unknown',
                })
            
            return Response({
                'sessions': sessions_data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            })
            
        except Exception as e:
            logger.error(f"User sessions list error: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
