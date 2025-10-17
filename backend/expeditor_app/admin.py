from django.contrib import admin
from .models import Projects, CheckDetail, Sklad, City, Ekispiditor, Check, Filial, ProblemCheck, IntegrationEndpoint, ScheduledTask, EmailRecipient, TaskRun

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

@admin.register(Filial)
class FilialAdmin(admin.ModelAdmin):
    list_display = ['filial_name', 'created_at']
    search_fields = ['filial_name']
    list_filter = ['created_at']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Ekispiditor)
class EkispiditorAdmin(admin.ModelAdmin):
    list_display = ['ekispiditor_name','filial', 'transport_number', 'phone_number', 'is_active', 'today_checks_count']
    search_fields = ['ekispiditor_name','filial', 'transport_number', 'phone_number']
    list_filter = ['filial','is_active', 'created_at']
    readonly_fields = ['today_checks_count']

@admin.register(Check)
class CheckAdmin(admin.ModelAdmin):
    list_display = ['check_id', 'ekispiditor', 'project', 'city', 'status', 'yetkazilgan_vaqti']
    search_fields = ['check_id', 'ekispiditor', 'client_name']
    list_filter = ['status', 'project', 'city', 'yetkazilgan_vaqti']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()

@admin.register(ProblemCheck)
class ProblemCheckAdmin(admin.ModelAdmin):
    list_display = ['check_id', 'issue_code', 'resolved', 'detected_at']
    search_fields = ['check_id', 'issue_message']
    list_filter = ['issue_code', 'resolved', 'detected_at']

@admin.register(IntegrationEndpoint)
class IntegrationEndpointAdmin(admin.ModelAdmin):
    list_display = ['project_name', 'wsdl_url', 'is_active', 'updated_at']
    search_fields = ['project_name', 'wsdl_url']
    list_filter = ['is_active', 'updated_at']

@admin.register(ScheduledTask)
class ScheduledTaskAdmin(admin.ModelAdmin):
    list_display = ['name', 'task_type', 'is_enabled', 'interval_minutes', 'next_run_at', 'last_run_at']
    list_filter = ['task_type', 'is_enabled']
    search_fields = ['name']

@admin.register(EmailRecipient)
class EmailRecipientAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['email']

@admin.register(TaskRun)
class TaskRunAdmin(admin.ModelAdmin):
    list_display = ['task_type', 'is_running', 'processed', 'total', 'status_message', 'started_at', 'finished_at']
    list_filter = ['task_type', 'is_running']
    readonly_fields = ['task_type', 'is_running', 'processed', 'total', 'status_message', 'started_at', 'finished_at']
