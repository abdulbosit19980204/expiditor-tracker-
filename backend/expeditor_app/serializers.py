from rest_framework import serializers
from .models import  Filial,Projects, CheckDetail, Sklad, City, Ekispiditor, Check

class ProjectsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projects
        fields = ['id', 'project_name', 'project_description', 'created_at', 'updated_at']

class CheckDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckDetail
        fields = ['id', 'check_id', 'checkURL', 'check_date', 'check_lat', 'check_lon', 
                 'total_sum', 'nalichniy', 'uzcard', 'humo', 'click', 'created_at', 'updated_at']

class SkladSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sklad
        fields = ['id', 'sklad_name', 'sklad_code', 'description', 'created_at', 'updated_at']

class FilialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Filial
        fields = ['filial_name' ]
class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'city_name', 'city_code', 'description', 'created_at', 'updated_at']

class EkispiditorSerializer(serializers.ModelSerializer):
    today_checks_count = serializers.ReadOnlyField()
    name = serializers.CharField(source='ekispiditor_name', read_only=True)
    filial = serializers.SerializerMethodField()
    def get_filial(self, obj):
        if obj.filial:
            return obj.filial.filial_name
        return "Filaiga tegishli emas"
    class Meta:
        model = Ekispiditor
        fields = ['id', 'ekispiditor_name','filial', 'name', 'transport_number', 'phone_number', 
                 'photo', 'is_active', 'today_checks_count', 'created_at', 'updated_at']

class CheckSerializer(serializers.ModelSerializer):
    check_detail = CheckDetailSerializer(read_only=True)
    
    class Meta:
        model = Check
        fields = ['id', 'check_id', 'project', 'sklad', 'city', 'sborshik', 'agent', 
                 'ekispiditor', 'yetkazilgan_vaqti', 'transport_number', 'kkm_number',
                 'client_name', 'client_address', 'check_lat', 'check_lon', 'status',
                 'check_detail', 'created_at', 'updated_at']

class CheckWithLocationSerializer(serializers.ModelSerializer):
    check_detail = CheckDetailSerializer(read_only=True)
    
    class Meta:
        model = Check
        fields = ['id', 'check_id', 'project', 'sklad', 'city', 'sborshik', 'agent', 
                 'ekispiditor', 'yetkazilgan_vaqti', 'transport_number', 'kkm_number',
                 'client_name', 'client_address', 'check_lat', 'check_lon', 'status',
                 'check_detail', 'created_at', 'updated_at']
