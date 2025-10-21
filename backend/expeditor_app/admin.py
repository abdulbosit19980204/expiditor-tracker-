from django.contrib import admin
from django.utils.html import format_html
from django.contrib import messages
from django.utils import timezone
from .models import (
    Projects, CheckDetail, Sklad, City, Ekispiditor, Check, Filial, ProblemCheck, IntegrationEndpoint,
    ScheduledTask, EmailRecipient, TaskRun, TaskList, EmailConfig, TelegramAccount, CheckAnalytics, YandexToken,
)

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
    search_fields = ['ekispiditor_name', 'transport_number', 'phone_number']
    list_filter = ['filial','is_active', 'created_at']
    readonly_fields = ['today_checks_count']

@admin.register(Check)
class CheckAdmin(admin.ModelAdmin):
    list_display = ['check_id', 'ekispiditor', 'project', 'city', 'status', 'yetkazilgan_vaqti']
    search_fields = ['check_id', 'client_name']
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
    list_display = ['name', 'task_type', 'is_enabled', 'interval_minutes', 'next_run_at', 'last_run_at', 'run_now_button']
    list_filter = ['task_type', 'is_enabled']
    search_fields = ['name']
    autocomplete_fields = ['task']
    actions = ['run_task_now', 'enable_tasks', 'disable_tasks']
    
    def run_now_button(self, obj):
        """Display a run now button for each task."""
        if obj.is_enabled:
            return format_html(
                '<a class="button" href="{}" onclick="return confirm(\'Are you sure you want to run this task now?\')">Run Now</a>',
                f'/admin/expeditor_app/scheduledtask/{obj.id}/run_now/'
            )
        return 'Disabled'
    run_now_button.short_description = 'Actions'
    run_now_button.allow_tags = True
    
    def run_task_now(self, request, queryset):
        """Run selected tasks immediately."""
        from expeditor_app.task_executor import TaskExecutor
        from django.contrib import messages
        
        executor = TaskExecutor()
        success_count = 0
        error_count = 0
        
        for task in queryset:
            try:
                task_run = executor.execute_task(task)
                messages.success(
                    request, 
                    f'Task "{task.name}" completed successfully (Run ID: {task_run.id})'
                )
                success_count += 1
            except Exception as e:
                messages.error(
                    request, 
                    f'Task "{task.name}" failed: {str(e)}'
                )
                error_count += 1
        
        if success_count > 0:
            messages.success(request, f'{success_count} task(s) completed successfully')
        if error_count > 0:
            messages.error(request, f'{error_count} task(s) failed')
    
    run_task_now.short_description = "Run selected tasks now"
    
    def enable_tasks(self, request, queryset):
        """Enable selected tasks."""
        count = queryset.update(is_enabled=True)
        messages.success(request, f'{count} task(s) enabled')
    
    enable_tasks.short_description = "Enable selected tasks"
    
    def disable_tasks(self, request, queryset):
        """Disable selected tasks."""
        count = queryset.update(is_enabled=False)
        messages.success(request, f'{count} task(s) disabled')
    
    disable_tasks.short_description = "Disable selected tasks"

@admin.register(EmailRecipient)
class EmailRecipientAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['email']

@admin.register(TaskRun)
class TaskRunAdmin(admin.ModelAdmin):
    list_display = ['task_type', 'is_running', 'processed', 'total', 'status_message', 'started_at', 'finished_at', 'duration_display']
    list_filter = ['task_type', 'is_running', 'started_at']
    readonly_fields = ['task_type', 'is_running', 'processed', 'total', 'status_message', 'started_at', 'finished_at']
    search_fields = ['status_message']
    ordering = ['-started_at']
    
    def duration_display(self, obj):
        """Display task duration."""
        if obj.finished_at and obj.started_at:
            duration = obj.finished_at - obj.started_at
            return f"{duration.total_seconds():.1f}s"
        elif obj.started_at:
            duration = timezone.now() - obj.started_at
            return f"{duration.total_seconds():.1f}s (running)"
        return "-"
    duration_display.short_description = 'Duration'

@admin.register(TaskList)
class TaskListAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active', 'description_preview', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['code', 'name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'description_display']
    
    fieldsets = (
        ('Task Information', {
            'fields': ('code', 'name', 'is_active')
        }),
        ('Description', {
            'fields': ('description_display',),
            'classes': ('wide',)
        }),
        ('Configuration', {
            'fields': ('default_params', 'sample_result'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def description_preview(self, obj):
        """Show first 100 characters of description."""
        if obj.description:
            preview = obj.description[:100].replace('\n', ' ')
            return f"{preview}..." if len(obj.description) > 100 else preview
        return "-"
    description_preview.short_description = 'Description Preview'
    
    def description_display(self, obj):
        """Display full description with markdown formatting."""
        if obj.description:
            from django.utils.html import format_html
            # Convert markdown-like formatting to HTML
            html_desc = obj.description.replace('\n', '<br>')
            html_desc = html_desc.replace('**', '<strong>').replace('**', '</strong>')
            return format_html('<div style="white-space: pre-wrap; padding: 10px; background: #f5f5f5; border-radius: 5px;">{}</div>', html_desc)
        return "-"
    description_display.short_description = 'Full Description'

@admin.register(EmailConfig)
class EmailConfigAdmin(admin.ModelAdmin):
    list_display = ['host', 'port', 'use_tls', 'use_ssl', 'is_active', 'updated_at']
    list_filter = ['use_tls', 'use_ssl', 'is_active']
    search_fields = ['host', 'username', 'from_email']


@admin.register(TelegramAccount)
class TelegramAccountAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'username', 'phone_number', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['display_name', 'username', 'phone_number']

@admin.register(YandexToken)
class YandexTokenAdmin(admin.ModelAdmin):
    list_display = ['name', 'keyword', 'status', 'api_key_preview', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'keyword', 'api_key', 'description']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['activate_token', 'deactivate_token', 'block_token', 'delete_selected_tokens']
    
    fieldsets = (
        ('Token Information', {
            'fields': ('name', 'keyword', 'api_key', 'description')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def api_key_preview(self, obj):
        """Show masked API key for security."""
        if obj.api_key:
            return f"{obj.api_key[:8]}...{obj.api_key[-4:]}"
        return "No key"
    api_key_preview.short_description = 'API Key Preview'
    
    def activate_token(self, request, queryset):
        """Activate selected tokens (only one can be active)."""
        count = 0
        for token in queryset:
            if token.status != YandexToken.STATUS_BLOCKED:
                token.status = YandexToken.STATUS_ACTIVE
                token.save()
                count += 1
        messages.success(request, f'{count} token(s) activated')
    activate_token.short_description = "Activate selected tokens"
    
    def deactivate_token(self, request, queryset):
        """Deactivate selected tokens."""
        count = queryset.update(status=YandexToken.STATUS_INACTIVE)
        messages.success(request, f'{count} token(s) deactivated')
    deactivate_token.short_description = "Deactivate selected tokens"
    
    def block_token(self, request, queryset):
        """Block selected tokens."""
        count = queryset.update(status=YandexToken.STATUS_BLOCKED)
        messages.success(request, f'{count} token(s) blocked')
    block_token.short_description = "Block selected tokens"
    
    def delete_selected_tokens(self, request, queryset):
        """Delete selected tokens with confirmation."""
        if request.POST.get('post'):
            # Confirmation received, proceed with deletion
            count = queryset.count()
            queryset.delete()
            messages.success(request, f'{count} token(s) deleted successfully')
        else:
            # Show confirmation page
            from django.contrib.admin.helpers import ActionForm
            from django.template.response import TemplateResponse
            from django.utils.html import format_html
            
            context = {
                'title': 'Are you sure?',
                'queryset': queryset,
                'action_name': 'delete_selected_tokens',
                'action_form': ActionForm(),
                'opts': self.model._meta,
                'app_label': self.model._meta.app_label,
                'action_checkbox_name': '_selected_action',
                'selected_actions': request.POST.getlist('_selected_action'),
            }
            
            return TemplateResponse(request, 'admin/expeditor_app/yandextoken/delete_selected_confirmation.html', context)
    delete_selected_tokens.short_description = "Delete selected tokens"


@admin.register(CheckAnalytics)
class CheckAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['time_window_display', 'total_checks', 'unique_expiditors', 'most_active_expiditor', 'most_active_count', 'analysis_date']
    list_filter = ['analysis_date', 'window_duration_minutes', 'radius_meters']
    search_fields = ['most_active_expiditor']
    readonly_fields = ['created_at', 'updated_at', 'time_window_display', 'area_display', 'analysis_date']
    ordering = ['-analysis_date', '-window_start']
    exclude = ['analysis_date']  # Exclude from form since it's auto-generated
    
    fieldsets = (
        ('Time Window', {
            'fields': ('window_start', 'window_end', 'window_duration_minutes', 'time_window_display')
        }),
        ('Geographic Area', {
            'fields': ('center_lat', 'center_lon', 'radius_meters', 'area_display')
        }),
        ('Statistics', {
            'fields': ('total_checks', 'unique_expiditors', 'most_active_expiditor', 'most_active_count', 'avg_checks_per_expiditor')
        }),
        ('Check Data', {
            'fields': ('check_ids', 'check_details'),
            'classes': ('collapse',),
            'description': 'Raw check IDs and details stored during analysis'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# CustomUserAdmin temporarily disabled
# @admin.register(CustomUser)
# class CustomUserAdmin(admin.ModelAdmin):
#     list_display = ['username', 'email', 'first_name', 'last_name', 'is_approved', 'is_active', 'is_staff', 'created_at']
#     list_filter = ['is_approved', 'is_active', 'is_staff', 'is_superuser', 'created_at']
#     search_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number', 'department', 'position']
#     readonly_fields = ['created_at', 'updated_at', 'date_joined', 'last_login']
#     actions = ['approve_users', 'disapprove_users', 'activate_users', 'deactivate_users']
#     
#     fieldsets = (
#         ('Basic Information', {
#             'fields': ('username', 'email', 'first_name', 'last_name')
#         }),
#         ('Contact Information', {
#             'fields': ('phone_number', 'department', 'position')
#         }),
#         ('Permissions', {
#             'fields': ('is_approved', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
#         }),
#         ('Important Dates', {
#             'fields': ('created_at', 'updated_at', 'date_joined', 'last_login'),
#             'classes': ('collapse',)
#         }),
#     )
#     
#     def approve_users(self, request, queryset):
#         """Approve selected users."""
#         count = queryset.update(is_approved=True, is_active=True)
#         messages.success(request, f'{count} user(s) approved')
#     approve_users.short_description = "Approve selected users"
#     
#     def disapprove_users(self, request, queryset):
#         """Disapprove selected users."""
#         count = queryset.update(is_approved=False)
#         messages.success(request, f'{count} user(s) disapproved')
#     disapprove_users.short_description = "Disapprove selected users"
#     
#     def activate_users(self, request, queryset):
#         """Activate selected users."""
#         count = queryset.update(is_active=True)
#         messages.success(request, f'{count} user(s) activated')
#     activate_users.short_description = "Activate selected users"
#     
#     def deactivate_users(self, request, queryset):
#         """Deactivate selected users."""
#         count = queryset.update(is_active=False)
#         messages.success(request, f'{count} user(s) deactivated')
#     deactivate_users.short_description = "Deactivate selected users"
