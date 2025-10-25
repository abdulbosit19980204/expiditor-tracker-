import uuid
import json
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from .models import UserSession, UserActivity
import logging

logger = logging.getLogger(__name__)


class UserTrackingMiddleware(MiddlewareMixin):
    """Middleware to track user sessions and activities"""
    
    def process_request(self, request):
        """Process incoming request and track user activity"""
        try:
            # Get or create session
            session = self._get_or_create_session(request)
            
            # Track the request
            self._track_activity(request, session)
            
            # Update session activity
            session.last_activity = timezone.now()
            session.total_requests += 1
            
            # Determine activity type and update counters
            if request.path.startswith('/api/'):
                session.api_calls += 1
                activity_type = 'api_call'
            elif request.path.startswith('/admin/'):
                activity_type = 'admin_access'
            else:
                session.page_views += 1
                activity_type = 'page_view'
            
            session.save()
            
            # Store session in request for use in views
            request.user_session = session
            
        except Exception as e:
            logger.error(f"User tracking middleware error: {e}")
    
    def _get_or_create_session(self, request):
        """Get existing session or create new one"""
        session_id = request.session.session_key
        
        if not session_id:
            request.session.create()
            session_id = request.session.session_key
        
        # Try to get existing session
        try:
            session = UserSession.objects.get(session_id=session_id)
            return session
        except UserSession.DoesNotExist:
            pass
        
        # Create new session
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        user_type = self._determine_user_type(request)
        
        session = UserSession.objects.create(
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            user_type=user_type,
            location=self._get_location_from_ip(ip_address)
        )
        
        return session
    
    def _track_activity(self, request, session):
        """Track individual activity"""
        activity_type = 'page_view'
        page_url = None
        api_endpoint = None
        metadata = {}
        
        if request.path.startswith('/api/'):
            activity_type = 'api_call'
            api_endpoint = request.path
            metadata = {
                'method': request.method,
                'query_params': dict(request.GET),
                'content_type': request.META.get('CONTENT_TYPE', ''),
            }
        else:
            page_url = request.build_absolute_uri()
            metadata = {
                'referer': request.META.get('HTTP_REFERER', ''),
                'method': request.method,
            }
        
        # Create activity record
        UserActivity.objects.create(
            session=session,
            activity_type=activity_type,
            page_url=page_url,
            api_endpoint=api_endpoint,
            metadata=metadata
        )
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _determine_user_type(self, request):
        """Determine user type based on request"""
        # Check if accessing admin area
        if request.path.startswith('/admin/'):
            return 'super_user'
        
        # Check for authentication headers or session
        if hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.is_superuser:
                return 'super_user'
            else:
                return 'regular_user'
        
        # Check for API authentication
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Token ') or auth_header.startswith('Bearer '):
            return 'regular_user'
        
        return 'guest'
    
    def _get_location_from_ip(self, ip_address):
        """Get location from IP address (simplified)"""
        # This is a simplified version - in production you might want to use
        # a service like GeoIP or similar
        if ip_address.startswith('192.168.') or ip_address.startswith('10.') or ip_address.startswith('172.'):
            return 'Local Network'
        elif ip_address == '127.0.0.1':
            return 'Localhost'
        else:
            return 'External'


class MapInteractionMiddleware(MiddlewareMixin):
    """Middleware to track map interactions specifically"""
    
    def process_request(self, request):
        """Track map-related API calls"""
        if hasattr(request, 'user_session') and request.path.startswith('/api/yandex-maps'):
            try:
                session = request.user_session
                session.map_interactions += 1
                session.save()
                
                # Create specific map interaction activity
                UserActivity.objects.create(
                    session=session,
                    activity_type='map_interaction',
                    api_endpoint=request.path,
                    metadata={
                        'map_type': 'yandex',
                        'method': request.method,
                    }
                )
            except Exception as e:
                logger.error(f"Map interaction tracking error: {e}")




