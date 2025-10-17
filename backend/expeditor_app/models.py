from django.db import models
from django.utils import timezone

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

    TASK_CHOICES = [
        (TASK_UPDATE_CHECKS, 'Update Checks from Integrations'),
        (TASK_SCAN_PROBLEM_CHECKS, 'Scan Problem Checks'),
        (TASK_SEND_ANALYTICS, 'Send Analytics Report'),
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

    class Meta:
        verbose_name_plural = "Scheduled Tasks"
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
        verbose_name_plural = "Email Recipients"

    def __str__(self):
        return self.email
