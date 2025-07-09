from django.contrib import admin
from .models import Projects, CheckDetail, Sklad, City, Ekispiditor, Check

@admin.register(Projects)
class ProjectsAdmin(admin.ModelAdmin):
    list_display = ['project_name', 'created_at', 'updated_at']
    search_fields = ['project_name']
    list_filter = ['created_at']

@admin.register(CheckDetail)
class CheckDetailAdmin(admin.ModelAdmin):
    list_display = ['check_id', 'total_sum', 'check_date', 'check_lat', 'check_lon']
    search_fields = ['check_id']
    list_filter = ['check_date']
    readonly_fields = ['check_date', 'created_at', 'updated_at']

@admin.register(Sklad)
class SkladAdmin(admin.ModelAdmin):
    list_display = ['sklad_name', 'sklad_code', 'created_at']
    search_fields = ['sklad_name', 'sklad_code']
    list_filter = ['created_at']

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ['city_name', 'city_code', 'created_at']
    search_fields = ['city_name', 'city_code']
    list_filter = ['created_at']

@admin.register(Ekispiditor)
class EkispiditorAdmin(admin.ModelAdmin):
    list_display = ['ekispiditor_name', 'transport_number', 'phone_number', 'is_active', 'today_checks_count']
    search_fields = ['ekispiditor_name', 'transport_number', 'phone_number']
    list_filter = ['is_active', 'created_at']
    readonly_fields = ['today_checks_count']

@admin.register(Check)
class CheckAdmin(admin.ModelAdmin):
    list_display = ['check_id', 'ekispiditor', 'project', 'city', 'status', 'yetkazilgan_vaqti']
    search_fields = ['check_id', 'ekispiditor', 'client_name']
    list_filter = ['status', 'project', 'city', 'yetkazilgan_vaqti']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()
