from rest_framework import serializers
from .models import Filial, Projects, CheckDetail, Sklad, City, Ekispiditor, Check, TelegramAccount


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
        # Optimized: Use select_related if available, otherwise fetch efficiently
        try:
            # Try to get check detail if it exists
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
