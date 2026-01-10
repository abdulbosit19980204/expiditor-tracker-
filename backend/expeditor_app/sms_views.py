"""
API endpoints for SMS configuration management.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import SmsConfig
from .serializers import SmsConfigSerializer
import logging

logger = logging.getLogger(__name__)


class SmsConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for managing SMS configurations."""
    queryset = SmsConfig.objects.all().order_by('-created_at')
    serializer_class = SmsConfigSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a specific SMS config."""
        config = self.get_object()
        config.status = SmsConfig.STATUS_ACTIVE
        config.save()
        
        return Response({
            'status': 'success',
            'message': f'SMS Config "{config.name}" activated successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a specific SMS config."""
        config = self.get_object()
        config.status = SmsConfig.STATUS_INACTIVE
        config.save()
        
        return Response({
            'status': 'success',
            'message': f'SMS Config "{config.name}" deactivated successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active SMS config."""
        active_config = SmsConfig.get_active_config()
        if active_config:
            serializer = self.get_serializer(active_config)
            return Response(serializer.data)
        return Response({'detail': 'No active SMS config found.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test SMS sending with the current config."""
        config = self.get_object()
        phone_number = request.data.get('phone_number')
        
        if not phone_number:
            return Response({
                'detail': 'phone_number is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # TODO: Implement actual SMS sending logic based on provider
            # This is a placeholder
            return Response({
                'status': 'success',
                'message': f'Test SMS would be sent to {phone_number} using {config.provider}'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Failed to send test SMS: {str(e)}')
            return Response({
                'detail': f'Failed to send test SMS: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SmsConfigStatusView(APIView):
    """Provides current SMS config status."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        active_config = SmsConfig.get_active_config()
        total_configs = SmsConfig.objects.count()
        active_count = SmsConfig.objects.filter(status=SmsConfig.STATUS_ACTIVE).count()
        inactive_count = SmsConfig.objects.filter(status=SmsConfig.STATUS_INACTIVE).count()
        
        return Response({
            'has_active_config': active_config is not None,
            'active_config_name': active_config.name if active_config else None,
            'total_configs': total_configs,
            'active_count': active_count,
            'inactive_count': inactive_count,
        })
