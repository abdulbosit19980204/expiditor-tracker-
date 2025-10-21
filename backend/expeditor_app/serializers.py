from rest_framework import serializers
from .models import Filial, Projects, CheckDetail, Sklad, City, Ekispiditor, Check, TelegramAccount, CheckAnalytics, YandexToken


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
        fields = ['id', 'sklad_name', 'sklad_code', 'description', 'created_at', 'updated_at']


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
        # Optimized: Use cached property to avoid N+1 queries
        # Note: For optimal performance, prefetch CheckDetail in the viewset queryset
        if hasattr(obj, '_prefetched_check_detail'):
            # If prefetched, use the cached data
            return CheckDetailSerializer(obj._prefetched_check_detail).data if obj._prefetched_check_detail else None
        
        # Fallback: fetch individually (less optimal)
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
                 'check_detail', 'created_at', 'updated_at']


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
    class Meta:
        model = YandexToken
        fields = ['id', 'name', 'keyword', 'api_key', 'status', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
