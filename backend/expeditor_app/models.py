from django.db import models
from django.utils import timezone
import math

class Projects(models.Model):
    project_name = models.CharField(max_length=100, unique=True)
    project_description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Projects"
    
    def __str__(self):
        return self.project_name

class CheckDetail(models.Model):
    check_id = models.CharField(max_length=100, unique=True, db_index=True)
    checkURL = models.URLField(max_length=200, unique=True)
    check_date = models.DateTimeField(blank=True, null=True, db_index=True)
    receiptIdDate = models.DateTimeField(blank=True, null=True)
    check_lat = models.FloatField(blank=True, null=True)
    check_lon = models.FloatField(blank=True, null=True)
    total_sum = models.FloatField(blank=True, null=True, db_index=True)
    nalichniy = models.FloatField(blank=True, null=True)
    uzcard = models.FloatField(blank=True, null=True)
    humo = models.FloatField(blank=True, null=True)
    click = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Check Details"
    
    def __str__(self):
        return self.check_id

class Sklad(models.Model):
    sklad_name = models.CharField(max_length=100, unique=True)
    sklad_code = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Skladlar"
    
    def __str__(self):
        return self.sklad_name

class City(models.Model):
    city_name = models.CharField(max_length=100, unique=True)
    city_code = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    filial = models.ForeignKey('Filial', on_delete=models.CASCADE, related_name='cities', blank=True, null=True)
    class Meta:
        verbose_name_plural = "Cities"
    
    def __str__(self):
        return self.city_name

class Ekispiditor(models.Model):
    ekispiditor_name = models.CharField(max_length=100, unique=True)
    transport_number = models.CharField(max_length=50, unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    filial = models.ForeignKey('Filial', on_delete=models.CASCADE, related_name='ekispiditors', blank=True, null=True)
    photo = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Ekispiditorlar"
    
    def __str__(self):
        return self.ekispiditor_name
    
    @property
    def today_checks_count(self):
        today = timezone.now().date()
        return Check.objects.filter(
            ekispiditor=self.ekispiditor_name,
            yetkazilgan_vaqti__date=today
        ).count()

class Check(models.Model):
    check_id = models.CharField(max_length=100, unique=True, db_index=True)
    project = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    sklad = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    city = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    sborshik = models.CharField(max_length=100, blank=True, null=True)
    agent = models.CharField(max_length=100, blank=True, null=True)
    ekispiditor = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    yetkazilgan_vaqti = models.DateTimeField(blank=True, null=True, db_index=True)
    receiptIdDate = models.DateTimeField(blank=True, null=True)
    transport_number = models.CharField(max_length=50, blank=True, null=True)
    kkm_number = models.CharField(max_length=50, blank=True, null=True)
    client_name = models.CharField(max_length=200, blank=True, null=True)
    client_address = models.TextField(blank=True, null=True)
    check_lat = models.FloatField(blank=True, null=True)
    check_lon = models.FloatField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('delivered', 'Yetkazilgan'),
        ('failed', 'Muvaffaqiyatsiz'),
        ('pending', 'Kutilmoqda')
    ], default='pending', db_index=True)
    check_detail = models.ForeignKey('CheckDetail', on_delete=models.CASCADE, related_name='checks', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Checklar"
        ordering = ['-yetkazilgan_vaqti']
    
    def __str__(self):
        return f"Check {self.check_id} by {self.ekispiditor} on {self.kkm_number}"
    
    @property
    def check_detail(self):
        try:
            return CheckDetail.objects.get(check_id=self.check_id)
        except CheckDetail.DoesNotExist:
            return None

class Filial(models.Model):
    filial_name = models.CharField(max_length=100, unique=True)
    filial_code = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Filiallar"
    
    def __str__(self):
        return self.filial_name


class ProblemCheck(models.Model):
    """Lightweight table to track checks with data quality issues.

    This does NOT change existing flows. It is populated by periodic scans
    and during imports, and is fully decoupled from normal reads.
    """
    check_id = models.CharField(max_length=100, db_index=True)
    issue_code = models.CharField(max_length=50, db_index=True)
    issue_message = models.TextField()
    detected_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved = models.BooleanField(default=False, db_index=True)

    class Meta:
        verbose_name_plural = "Problem Checks"
        indexes = [
            models.Index(fields=["issue_code", "resolved"]),
            models.Index(fields=["detected_at"]),
        ]

    def __str__(self):
        return f"{self.check_id} - {self.issue_code}"


class IntegrationEndpoint(models.Model):
    """Config for external integration endpoints per project.

    Stores WSDL/HTTP URL for a given project. Decoupled from runtime logic; 
    updated in Admin without code changes.
    """
    project_name = models.CharField(max_length=100, unique=True, db_index=True)
    wsdl_url = models.URLField(max_length=500)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Integration Endpoints"

    def __str__(self):
        return f"{self.project_name} -> {self.wsdl_url}"


class ScheduledTask(models.Model):
    TASK_UPDATE_CHECKS = 'UPDATE_CHECKS'
    TASK_SCAN_PROBLEM_CHECKS = 'SCAN_PROBLEMS'
    TASK_SEND_ANALYTICS = 'SEND_ANALYTICS'
    TASK_ANALYZE_PATTERNS = 'ANALYZE_PATTERNS'

    TASK_CHOICES = [
        (TASK_UPDATE_CHECKS, 'Update Checks from Integrations'),
        (TASK_SCAN_PROBLEM_CHECKS, 'Scan Problem Checks'),
        (TASK_SEND_ANALYTICS, 'Send Analytics Report'),
        (TASK_ANALYZE_PATTERNS, 'Analyze Check Patterns'),
    ]

    name = models.CharField(max_length=120)
    task_type = models.CharField(max_length=50, choices=TASK_CHOICES, db_index=True)
    is_enabled = models.BooleanField(default=False, db_index=True)
    interval_minutes = models.PositiveIntegerField(default=60)
    last_run_at = models.DateTimeField(blank=True, null=True, db_index=True)
    next_run_at = models.DateTimeField(blank=True, null=True, db_index=True)
    params = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    task = models.ForeignKey('TaskList', on_delete=models.SET_NULL, null=True, blank=True, related_name='scheduled_uses')

    class Meta:
        verbose_name_plural = "Settings — Scheduled Tasks"
        indexes = [
            models.Index(fields=["is_enabled", "next_run_at", "task_type"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.task_type})"


class EmailRecipient(models.Model):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Settings — Email Recipients"

    def __str__(self):
        return self.email


class TaskRun(models.Model):
    TASK_CHOICES = ScheduledTask.TASK_CHOICES
    task_type = models.CharField(max_length=50, choices=TASK_CHOICES, db_index=True)
    is_running = models.BooleanField(default=True, db_index=True)
    status_message = models.CharField(max_length=255, blank=True, null=True)
    total = models.IntegerField(default=0)
    processed = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Tasks — Runs"
        indexes = [
            models.Index(fields=["task_type", "is_running", "started_at"]),
        ]

    def __str__(self):
        return f"{self.task_type} run at {self.started_at:%Y-%m-%d %H:%M}"


class TaskList(models.Model):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=120)
    description = models.TextField()
    default_params = models.JSONField(blank=True, null=True)
    sample_result = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Settings — Task List"

    def __str__(self):
        return f"{self.name} ({self.code})"


class EmailConfig(models.Model):
    backend = models.CharField(max_length=200, default='django.core.mail.backends.smtp.EmailBackend')
    host = models.CharField(max_length=200, default='smtp.gmail.com')
    port = models.PositiveIntegerField(default=587)
    use_tls = models.BooleanField(default=True)
    use_ssl = models.BooleanField(default=False)
    username = models.CharField(max_length=200, blank=True, null=True)
    password = models.CharField(max_length=200, blank=True, null=True)
    from_email = models.EmailField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Settings — Email Config"

    def __str__(self):
        return f"SMTP {self.host}:{self.port} (TLS={self.use_tls}, SSL={self.use_ssl})"


class TelegramAccount(models.Model):
    """Stores Telegram contact information for quick redirects from the UI.

    If multiple rows exist, the latest active one will be used. Either
    username or phone_number can be provided; both are optional but at
    least one should be set for a working link.
    """
    display_name = models.CharField(max_length=120, blank=True, null=True)
    username = models.CharField(max_length=120, blank=True, null=True, help_text="Telegram @username without @")
    phone_number = models.CharField(max_length=32, blank=True, null=True, help_text="International format like +99890...")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Settings — Telegram Accounts"

    def __str__(self):
        who = self.username or self.phone_number or "unknown"
        return f"TelegramAccount({who})"

# Proxy models for grouping in Django Admin without DB changes
class SettingsEmailRecipient(EmailRecipient):
    class Meta:
        proxy = True
        app_label = 'Settings'
        verbose_name_plural = 'Email Recipients'


class SettingsEmailConfig(EmailConfig):
    class Meta:
        proxy = True
        app_label = 'Settings'
        verbose_name_plural = 'Email Config'


class SettingsScheduledTask(ScheduledTask):
    class Meta:
        proxy = True
        app_label = 'Settings'
        verbose_name_plural = 'Scheduled Tasks'


class SettingsTaskList(TaskList):
    class Meta:
        proxy = True
        app_label = 'Settings'
        verbose_name_plural = 'Task List'


class SettingsTaskRun(TaskRun):
    class Meta:
        proxy = True
        app_label = 'Settings'
        verbose_name_plural = 'Task Runs'


class CheckAnalytics(models.Model):
    """Analytics data for check-ins within specific time and distance ranges.
    
    This table stores aggregated information about check-ins that occurred
    within a certain time window and geographic proximity, helping identify
    patterns and the most active expiditors in specific areas.
    """
    # Time window information
    window_start = models.DateTimeField(db_index=True, help_text="Start of the time window analyzed")
    window_end = models.DateTimeField(db_index=True, help_text="End of the time window analyzed")
    window_duration_minutes = models.PositiveIntegerField(help_text="Duration of the time window in minutes")
    
    # Geographic information
    center_lat = models.FloatField(help_text="Center latitude of the analyzed area")
    center_lon = models.FloatField(help_text="Center longitude of the analyzed area")
    radius_meters = models.PositiveIntegerField(help_text="Radius of the analyzed area in meters")
    
    # Aggregated data
    total_checks = models.PositiveIntegerField(default=0, help_text="Total number of checks in this time/area window")
    unique_expiditors = models.PositiveIntegerField(default=0, help_text="Number of unique expiditors in this window")
    
    # Most active expiditor in this window
    most_active_expiditor = models.CharField(max_length=100, blank=True, null=True, help_text="Name of the most active expiditor in this window")
    most_active_count = models.PositiveIntegerField(default=0, help_text="Number of checks by the most active expiditor")
    
    # Additional statistics
    avg_checks_per_expiditor = models.FloatField(default=0.0, help_text="Average number of checks per expiditor")
    
    # Store the actual check IDs that were part of this analysis
    check_ids = models.JSONField(default=list, help_text="List of check IDs that were part of this analysis")
    
    # Store check details for easy access (optional, for performance)
    check_details = models.JSONField(default=dict, blank=True, help_text="Structured check details including locations and times")
    
    # Metadata
    analysis_date = models.DateTimeField(auto_now_add=True, db_index=True, help_text="When this analysis was performed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Check Analytics"
        indexes = [
            models.Index(fields=["window_start", "window_end"]),
            models.Index(fields=["center_lat", "center_lon"]),
            models.Index(fields=["analysis_date"]),
        ]
        ordering = ['-analysis_date', '-window_start']
    
    def __str__(self):
        return f"Analytics {self.window_start.strftime('%Y-%m-%d %H:%M')} - {self.window_end.strftime('%Y-%m-%d %H:%M')} ({self.total_checks} checks)"
    
    @property
    def time_window_display(self):
        return f"{self.window_start.strftime('%H:%M')} - {self.window_end.strftime('%H:%M')}"
    
    @property
    def area_display(self):
        return f"Radius: {self.radius_meters}m around ({self.center_lat:.4f}, {self.center_lon:.4f})"
    
    def get_checks(self):
        """Get the actual Check objects that were part of this analysis."""
        if not self.check_ids:
            return Check.objects.none()
        return Check.objects.filter(check_id__in=self.check_ids).order_by('yetkazilgan_vaqti')
    
    def get_check_locations(self):
        """Get check locations for map visualization."""
        locations = []
        
        # First try to get from check_details if available
        if self.check_details and isinstance(self.check_details, list) and self.check_ids:
            for i, detail in enumerate(self.check_details):
                if isinstance(detail, dict) and detail.get('lat') and detail.get('lng'):
                    # Get check_id from check_ids array
                    check_id = self.check_ids[i] if i < len(self.check_ids) else 'Unknown'
                    client_name = detail.get('client_name', 'Unknown')
                    
                    # Try to get additional info from Check object
                    if check_id != 'Unknown':
                        try:
                            from .models import Check
                            check_obj = Check.objects.get(check_id=check_id)
                            client_name = check_obj.client_name or 'Unknown'
                        except:
                            pass
                    
                    locations.append({
                        'id': detail.get('id', 0),
                        'check_id': check_id,
                        'client_name': client_name,
                        'lat': float(detail.get('lat', 0)),
                        'lng': float(detail.get('lng', 0)),
                        'time': detail.get('time', ''),
                        'expeditor': detail.get('expeditor', 'Unknown'),
                        'status': detail.get('status', 'Unknown'),
                        'address': detail.get('address', '')
                    })
        
        # If no locations from check_details, try to get from actual Check objects
        if not locations:
            checks = self.get_checks()
            for check in checks:
                if check.check_lat and check.check_lon:
                    locations.append({
                        'id': check.id,
                        'check_id': check.check_id,
                        'client_name': check.client_name or 'Unknown',
                        'lat': float(check.check_lat),
                        'lng': float(check.check_lon),
                        'time': check.yetkazilgan_vaqti.isoformat() if check.yetkazilgan_vaqti else '',
                        'expeditor': check.ekispiditor or 'Unknown',
                        'status': check.status or 'Unknown',
                        'address': getattr(check, 'address', '') or ''
                    })
        
        return locations
    
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two points in meters using Haversine formula."""
        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            return float('inf')
        
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in meters
        r = 6371000
        return c * r
