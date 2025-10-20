from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib import messages
from .models import YandexToken
from .yandex_token_serializers import YandexTokenSerializer

class YandexTokenViewSet(viewsets.ModelViewSet):
    queryset = YandexToken.objects.all().order_by('-created_at')
    serializer_class = YandexTokenSerializer
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a specific token."""
        token = self.get_object()
        if token.status == YandexToken.STATUS_BLOCKED:
            return Response({'detail': 'Cannot activate blocked token.'}, status=status.HTTP_400_BAD_REQUEST)
        
        token.status = YandexToken.STATUS_ACTIVE
        token.save()
        
        return Response({
            'status': 'success',
            'message': f'Token "{token.name}" activated successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a specific token."""
        token = self.get_object()
        token.status = YandexToken.STATUS_INACTIVE
        token.save()
        
        return Response({
            'status': 'success',
            'message': f'Token "{token.name}" deactivated successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        """Block a specific token."""
        token = self.get_object()
        token.status = YandexToken.STATUS_BLOCKED
        token.save()
        
        return Response({
            'status': 'success',
            'message': f'Token "{token.name}" blocked successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active token."""
        active_token = YandexToken.get_active_token()
        if active_token:
            serializer = self.get_serializer(active_token)
            return Response(serializer.data)
        return Response({'detail': 'No active token found.'}, status=status.HTTP_404_NOT_FOUND)

class YandexTokenStatusView(APIView):
    """Provides current Yandex token status."""
    def get(self, request):
        active_token = YandexToken.get_active_token()
        total_tokens = YandexToken.objects.count()
        active_count = YandexToken.objects.filter(status=YandexToken.STATUS_ACTIVE).count()
        inactive_count = YandexToken.objects.filter(status=YandexToken.STATUS_INACTIVE).count()
        blocked_count = YandexToken.objects.filter(status=YandexToken.STATUS_BLOCKED).count()
        
        return Response({
            'has_active_token': active_token is not None,
            'active_token_name': active_token.name if active_token else None,
            'total_tokens': total_tokens,
            'active_count': active_count,
            'inactive_count': inactive_count,
            'blocked_count': blocked_count,
        })
