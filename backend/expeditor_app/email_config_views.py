"""
API endpoints for Email configuration management.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import EmailConfig
from .serializers import EmailConfigSerializer
import logging

logger = logging.getLogger(__name__)


class EmailConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Email configurations."""
    queryset = EmailConfig.objects.all().order_by('-created_at')
    serializer_class = EmailConfigSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a specific Email config (deactivates others)."""
        config = self.get_object()
        config.is_active = True
        config.save()
        
        return Response({
            'status': 'success',
            'message': f'Email Config "{config.host}:{config.port}" activated successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a specific Email config."""
        config = self.get_object()
        config.is_active = False
        config.save()
        
        return Response({
            'status': 'success',
            'message': f'Email Config "{config.host}:{config.port}" deactivated successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active Email config."""
        active_config = EmailConfig.objects.filter(is_active=True).first()
        if active_config:
            serializer = self.get_serializer(active_config)
            return Response(serializer.data)
        return Response({'detail': 'No active Email config found.'}, status=status.HTTP_404_NOT_FOUND)
    
    def perform_create(self, serializer):
        """Override to ensure only one active config."""
        instance = serializer.save()
        if instance.is_active:
            EmailConfig.objects.exclude(id=instance.id).update(is_active=False)
    
    def perform_update(self, serializer):
        """Override to ensure only one active config."""
        instance = serializer.save()
        if instance.is_active:
            EmailConfig.objects.exclude(id=instance.id).update(is_active=False)
