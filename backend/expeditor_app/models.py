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
    check_id = models.CharField(max_length=100, unique=True)
    checkURL = models.URLField(max_length=200, unique=True)
    check_date = models.DateTimeField(auto_now_add=True)
    check_lat = models.FloatField(blank=True, null=True)
    check_lon = models.FloatField(blank=True, null=True)
    total_sum = models.FloatField(blank=True, null=True)
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
    check_id = models.CharField(max_length=100, unique=True)
    project = models.CharField(max_length=100, blank=True, null=True)
    sklad = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    sborshik = models.CharField(max_length=100, blank=True, null=True)
    agent = models.CharField(max_length=100, blank=True, null=True)
    ekispiditor = models.CharField(max_length=100, blank=True, null=True)
    yetkazilgan_vaqti = models.DateTimeField(blank=True, null=True)
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
    ], default='pending')
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

