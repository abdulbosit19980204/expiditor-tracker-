from rest_framework import serializers
from .models import Filial, Projects, CheckDetail, Sklad, City, Ekispiditor, Check, TelegramAccount, CheckAnalytics, YandexToken, SmsConfig, ScheduledTask, EmailConfig, EmailRecipient


class ProjectsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projects
        fields = ['id', 'project_name', 'project_description', 'created_at', 'updated_at']


class CheckDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckDetail
        fields = ['id', 'check_id', 'checkURL', 'check_date', 'receiptIdDate', 'check_lat', 'check_lon',
                 'total_sum', 'nalichniy', 'uzcard', 'humo', 'click', 'created_at', 'updated_at']


class SkladSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sklad
        fields = ['id', 'sklad_name', 'sklad_code', 'description', 'lat', 'lon', 'created_at', 'updated_at']


class FilialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Filial
        fields = ['id', 'filial_name', 'filial_code']


class CitySerializer(serializers.ModelSerializer):
    filial_name = serializers.CharField(source='filial.filial_name', read_only=True, allow_null=True)
    
    class Meta:
        model = City
        fields = ['id', 'city_name', 'city_code', 'description', 'filial_name', 'created_at', 'updated_at']


class EkispiditorSerializer(serializers.ModelSerializer):
    today_checks_count = serializers.ReadOnlyField()
    name = serializers.CharField(source='ekispiditor_name', read_only=True)
    filial = serializers.SerializerMethodField()
    checks_count = serializers.IntegerField(read_only=True, required=False)
    
    def get_filial(self, obj):
        if obj.filial:
            return obj.filial.filial_name
        return "Biriktirilmagan"
    
    class Meta:
        model = Ekispiditor
        fields = ['id', 'ekispiditor_name', 'filial', 'name', 'transport_number', 'phone_number',
                 'photo', 'is_active', 'today_checks_count', 'checks_count', 'created_at', 'updated_at']


class CheckSerializer(serializers.ModelSerializer):
    check_detail = serializers.SerializerMethodField()
    
    def get_check_detail(self, obj):
        """Get check detail with total_sum"""
        try:
            check_detail = CheckDetail.objects.get(check_id=obj.check_id)
            return CheckDetailSerializer(check_detail).data
        except CheckDetail.DoesNotExist:
            return None
    
    class Meta:
        model = Check
        fields = ['id', 'check_id', 'project', 'sklad', 'city', 'sborshik', 'agent',
                 'ekispiditor', 'yetkazilgan_vaqti', 'receiptIdDate', 'transport_number', 'kkm_number',
                 'client_name', 'client_address', 'check_lat', 'check_lon', 'status',
                 'created_at', 'updated_at', 'check_detail']


class TelegramAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramAccount
        fields = ['id', 'display_name', 'username', 'phone_number', 'is_active', 'created_at', 'updated_at']


class CheckAnalyticsSerializer(serializers.ModelSerializer):
    time_window_display = serializers.ReadOnlyField()
    area_display = serializers.ReadOnlyField()
    check_locations = serializers.SerializerMethodField()
    
    class Meta:
        model = CheckAnalytics
        fields = [
            'id', 'window_start', 'window_end', 'window_duration_minutes', 
            'center_lat', 'center_lon', 'radius_meters', 'total_checks', 
            'unique_expiditors', 'most_active_expiditor', 'most_active_count', 
            'avg_checks_per_expiditor', 'analysis_date', 'time_window_display', 
            'area_display', 'check_ids', 'check_details', 'check_locations',
            'created_at', 'updated_at'
        ]
    
    def get_check_locations(self, obj):
        """Get check locations for map visualization."""
        return obj.get_check_locations()


class YandexTokenSerializer(serializers.ModelSerializer):
    api_key_preview = serializers.SerializerMethodField()
    
    def get_api_key_preview(self, obj):
        """Show masked API key for security."""
        if obj.api_key:
            return f"{obj.api_key[:8]}...{obj.api_key[-4:]}" if len(obj.api_key) > 12 else "****"
        return None
    
    class Meta:
        model = YandexToken
        fields = ['id', 'name', 'keyword', 'api_key', 'api_key_preview', 'status', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'api_key_preview']
        extra_kwargs = {
            'api_key': {'write_only': True}
        }


class SmsConfigSerializer(serializers.ModelSerializer):
    api_key_preview = serializers.SerializerMethodField()
    
    def get_api_key_preview(self, obj):
        """Show masked API key for security."""
        if obj.api_key:
            masked = '*' * (len(obj.api_key) - 4) + obj.api_key[-4:] if len(obj.api_key) > 4 else '****'
            return masked
        return None
    
    class Meta:
        model = SmsConfig
        fields = ['id', 'name', 'provider', 'api_key', 'api_key_preview', 'api_secret', 'sender', 'api_url', 'status', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'api_key_preview']
        extra_kwargs = {
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True}
        }


class ScheduledTaskSerializer(serializers.ModelSerializer):
    next_run_display = serializers.SerializerMethodField()
    last_run_display = serializers.SerializerMethodField()
    
    def get_next_run_display(self, obj):
        if obj.next_run_at:
            return obj.next_run_at.strftime('%Y-%m-%d %H:%M:%S')
        return None
    
    def get_last_run_display(self, obj):
        if obj.last_run_at:
            return obj.last_run_at.strftime('%Y-%m-%d %H:%M:%S')
        return None
    
    class Meta:
        model = ScheduledTask
        fields = [
            'id', 'name', 'task_type', 'is_enabled', 'interval_minutes',
            'frequency_type', 'send_time', 'recipient_user_ids', 'recipient_emails',
            'last_run_at', 'next_run_at', 'next_run_display', 'last_run_display',
            'params', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_run_at', 'next_run_at', 'next_run_display', 'last_run_display']


class EmailConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfig
        fields = ['id', 'backend', 'host', 'port', 'use_tls', 'use_ssl', 'username', 'password', 'from_email', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }


class EmailRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailRecipient
        fields = ['id', 'email', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
