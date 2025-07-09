from rest_framework import serializers
from .models import Projects, CheckDetail, Sklad, City, Ekispiditor, Check

class ProjectsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projects
        fields = '__all__'

class CheckDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckDetail
        fields = '__all__'

class SkladSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sklad
        fields = '__all__'

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = '__all__'

class EkispiditorSerializer(serializers.ModelSerializer):
    today_checks_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Ekispiditor
        fields = '__all__'

class CheckSerializer(serializers.ModelSerializer):
    check_detail = CheckDetailSerializer(read_only=True)
    
    class Meta:
        model = Check
        fields = '__all__'

class CheckWithLocationSerializer(serializers.ModelSerializer):
    check_detail = CheckDetailSerializer(read_only=True)
    
    class Meta:
        model = Check
        fields = '__all__'
