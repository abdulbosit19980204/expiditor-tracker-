from rest_framework import serializers
from .models import YandexToken

class YandexTokenSerializer(serializers.ModelSerializer):
    api_key_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = YandexToken
        fields = ['id', 'name', 'api_key', 'api_key_preview', 'status', 'description', 'created_at', 'updated_at']
        extra_kwargs = {
            'api_key': {'write_only': True}  # Hide API key in responses for security
        }
    
    def get_api_key_preview(self, obj):
        """Show masked API key for security."""
        if obj.api_key:
            return f"{obj.api_key[:8]}...{obj.api_key[-4:]}"
        return "No key"
