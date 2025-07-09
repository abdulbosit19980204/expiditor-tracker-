from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from expeditor_app.models import Projects, CheckDetail, Sklad, City, Ekispiditor, Check

class Command(BaseCommand):
    help = 'Create sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create Projects
        projects = [
            {'project_name': 'Toshkent Delivery', 'project_description': 'Toshkent shahri bo\'yicha yetkazib berish'},
            {'project_name': 'Samarqand Express', 'project_description': 'Samarqand viloyati ekspres yetkazib berish'},
            {'project_name': 'Buxoro Logistics', 'project_description': 'Buxoro viloyati logistika xizmatlari'},
        ]
        
        for project_data in projects:
            Projects.objects.get_or_create(**project_data)
        
        # Create Skladlar
        skladlar = [
            {'sklad_name': 'Markaziy Sklad', 'sklad_code': 'MS001'},
            {'sklad_name': 'Shimoliy Sklad', 'sklad_code': 'SS002'},
            {'sklad_name': 'Janubiy Sklad', 'sklad_code': 'JS003'},
        ]
        
        for sklad_data in skladlar:
            Sklad.objects.get_or_create(**sklad_data)
        
        # Create Cities
        cities = [
            {'city_name': 'Toshkent', 'city_code': 'TSH'},
            {'city_name': 'Samarqand', 'city_code': 'SMQ'},
            {'city_name': 'Buxoro', 'city_code': 'BUX'},
            {'city_name': 'Andijon', 'city_code': 'AND'},
            {'city_name': 'Namangan', 'city_code': 'NAM'},
        ]
        
        for city_data in cities:
            City.objects.get_or_create(**city_data)
        
        # Create Ekispiditorlar
        ekispiditorlar = [
            {'ekispiditor_name': 'Alisher Karimov', 'transport_number': '01A123BC', 'phone_number': '+998901234567'},
            {'ekispiditor_name': 'Bobur Toshmatov', 'transport_number': '01B456DE', 'phone_number': '+998902345678'},
            {'ekispiditor_name': 'Davron Usmonov', 'transport_number': '01C789FG', 'phone_number': '+998903456789'},
            {'ekispiditor_name': 'Eldor Rahimov', 'transport_number': '01D012HI', 'phone_number': '+998904567890'},
        ]
        
        for ekispiditor_data in ekispiditorlar:
            Ekispiditor.objects.get_or_create(**ekispiditor_data)
        
        # Create sample checks for the last 30 days
        projects_list = list(Projects.objects.all())
        skladlar_list = list(Sklad.objects.all())
        cities_list = list(City.objects.all())
        ekispiditorlar_list = list(Ekispiditor.objects.all())
        
        # Toshkent coordinates range
        tashkent_lat_range = (41.2646, 41.3272)
        tashkent_lon_range = (69.2034, 69.3370)
        
        statuses = ['delivered', 'failed', 'pending']
        
        for i in range(200):  # Create 200 sample checks
            # Random date in last 30 days
            days_ago = random.randint(0, 30)
            check_date = timezone.now() - timedelta(days=days_ago)
            
            check_id = f"CHK{str(i+1).zfill(6)}"
            
            # Create Check
            check = Check.objects.create(
                check_id=check_id,
                project=random.choice(projects_list).project_name,
                sklad=random.choice(skladlar_list).sklad_name,
                city=random.choice(cities_list).city_name,
                sborshik=f"Sborshik {random.randint(1, 10)}",
                agent=f"Agent {random.randint(1, 15)}",
                ekispiditor=random.choice(ekispiditorlar_list).ekispiditor_name,
                yetkazilgan_vaqti=check_date,
                transport_number=random.choice(ekispiditorlar_list).transport_number,
                kkm_number=f"KKM{random.randint(1000, 9999)}",
                client_name=f"Mijoz {random.randint(1, 100)}",
                client_address=f"Toshkent, {random.randint(1, 20)}-ko'cha, {random.randint(1, 100)}-uy",
                check_lat=random.uniform(*tashkent_lat_range),
                check_lon=random.uniform(*tashkent_lon_range),
                status=random.choice(statuses)
            )
            
            # Create corresponding CheckDetail
            total_sum = random.uniform(50000, 500000)
            nalichniy = random.uniform(0, total_sum * 0.6)
            uzcard = random.uniform(0, (total_sum - nalichniy) * 0.7)
            humo = random.uniform(0, (total_sum - nalichniy - uzcard) * 0.8)
            click = max(0, total_sum - nalichniy - uzcard - humo)
            
            CheckDetail.objects.create(
                check_id=check_id,
                checkURL=f"https://soliq.uz/check/{check_id}",
                check_date=check_date,
                check_lat=check.check_lat,
                check_lon=check.check_lon,
                total_sum=total_sum,
                nalichniy=nalichniy,
                uzcard=uzcard,
                humo=humo,
                click=int(click)
            )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        )
