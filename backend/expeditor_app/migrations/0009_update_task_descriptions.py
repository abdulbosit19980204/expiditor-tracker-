# Generated manually on 2025-10-21

from django.db import migrations


def create_task_descriptions(apps, schema_editor):
    """Create detailed task descriptions for all task types."""
    TaskList = apps.get_model('expeditor_app', 'TaskList')
    
    # Clear existing tasks
    TaskList.objects.all().delete()
    
    # Create tasks with detailed descriptions
    tasks_data = [
        {
            'code': 'UPDATE_CHECKS',
            'name': 'Checklar yangilash (Ma\'lumotlarni olish)',
            'description': '''📥 **VAZIFA:** Tizimga yangi checklar ma\'lumotlarini yuklash

🎯 **MAQSAD:** 
- Barcha loyihalardan (AVON, MaxWay, va boshqalar) yangi chek ma'lumotlarini olish
- Check, CheckDetail va Expeditor jadvallarini yangilash
- Tizimni eng so'nggi ma'lumotlar bilan ta'minlash

⚙️ **ISHLASH JARAYONI:**
1. IntegrationEndpoint jadvalidan barcha faol loyihalarni oladi
2. Har bir loyihaning SOAP servisiga ulanadi (WSDL orqali)
3. Yangi checklar ro'yxatini so'raydi
4. Har bir check uchun:
   - Check asosiy ma'lumotlarini saqlaydi (check_id, check_date, total_sum, va h.k.)
   - CheckDetail batafsil ma'lumotlarini saqlaydi (mahsulotlar ro'yxati, narxlar)
   - Expeditor ma'lumotlarini yangilaydi
5. Barcha yangi ma'lumotlarni bazaga saqlaydi

🕐 **TAVSIYA QILINGAN VAQT:** 
- Interval: 15-30 daqiqa
- Sabab: Yangi checklar tez-tez paydo bo'ladi, ma'lumotlar o'z vaqtida yangilanishi kerak

📊 **NATIJA:**
- Yangilangan checklar soni
- Yangilangan detallar soni  
- Yangilangan expeditorlar soni
- Xatolar ro'yxati (agar bo'lsa)

⚠️ **MUHIM:**
Bu task barcha boshqa tasklarning asosi hisoblanadi. 
Agar bu task ishlamasa, boshqa tasklar uchun yangi ma'lumotlar bo'lmaydi.''',
            'default_params': {
                'batch_size': 100,
                'max_retries': 3
            },
            'sample_result': '''Natija namunasi:
{
    "total_checks": 156,
    "total_details": 892,
    "total_expeditors": 45,
    "new_checks": 23,
    "updated_checks": 12,
    "errors": []
}''',
            'is_active': True
        },
        {
            'code': 'SCAN_PROBLEMS',
            'name': 'Muammoli checklar skanerlash',
            'description': '''🔍 **VAZIFA:** Checklar ichidagi muammolarni aniqlash va belgilash

🎯 **MAQSAD:**
- Noto'g'ri, shubhali yoki qoidabuzarlik checklar ni topish
- Muammolarni avtomatik aniqlash va loglash
- Tizim administratoriga muammolar haqida xabar berish

⚙️ **ISHLASH JARAYONI:**
1. CheckAnalytics jadvalidagi barcha "pending" statusdagi checklar ni oladi
2. Har bir check uchun quyidagi tekshiruvlarni amalga oshiradi:

   📍 **Joylashuv tekshiruvi:**
   - Check geografik koordinatalarini tekshiradi
   - Agar koordinata [0, 0] bo'lsa - "invalid_location" muammosi
   - Agar koordinata O'zbekiston chegarasidan tashqarida bo'lsa - "location_out_of_bounds"

   💰 **Summa tekshiruvi:**
   - Check summasini tekshiradi
   - Agar summa 0 yoki manfiy bo'lsa - "invalid_amount"
   - Agar summa juda katta bo'lsa (masalan, 100 million+) - "suspicious_amount"

   📦 **Mahsulotlar tekshiruvi:**
   - CheckDetail mavjudligini tekshiradi
   - Agar mahsulotlar ro'yxati bo'sh bo'lsa - "missing_details"
   - Agar mahsulotlar narxi noto'g'ri bo'lsa - "invalid_item_price"

   👤 **Expeditor tekshiruvi:**
   - Expeditor ma'lumotlari mavjudligini tekshiradi
   - Agar expeditor topilmasa - "missing_expeditor"

3. Topilgan muammolarni CheckAnalytics jadvaliga yozadi
4. Agar jiddiy muammo bo'lsa, administratorga email yuboradi

🕐 **TAVSIYA QILINGAN VAQT:**
- Interval: 30-60 daqiqa
- Sabab: Muammolar tez-tez paydo bo'lmaydi, lekin tezda topilishi kerak

📊 **NATIJA:**
- Skanerlangan checklar soni
- Topilgan muammolar soni
- Muammo turlari statistikasi
- Email yuborilgan holatlari

⚠️ **MUHIM:**
Bu task "UPDATE_CHECKS" taskdan keyin ishlashi kerak.
Chunki yangi checklar mavjud bo'lgandan keyingina ularni tekshirish mumkin.''',
            'default_params': {
                'check_last_hours': 24,
                'alert_threshold': 10
            },
            'sample_result': '''Natija namunasi:
{
    "scanned_checks": 145,
    "problems_found": 8,
    "problem_types": {
        "invalid_location": 3,
        "suspicious_amount": 2,
        "missing_details": 2,
        "missing_expeditor": 1
    },
    "emails_sent": 1
}''',
            'is_active': True
        },
        {
            'code': 'SEND_ANALYTICS',
            'name': 'Analitika hisobot yuborish',
            'description': '''📧 **VAZIFA:** Kunlik analitika hisobotini email orqali yuborish

🎯 **MAQSAD:**
- Tizim administratorlarga avtomatik kunlik hisobot tayyorlash
- Muhim statistikalarni email orqali yuborish
- Muammolar haqida xabardor qilish

⚙️ **ISHLASH JARAYONI:**
1. EmailConfig jadvalidan faol email konfiguratsiyasini oladi
2. EmailRecipient jadvalidan barcha faol qabul qiluvchilarni oladi
3. Kunlik statistikani to'playdi:

   📊 **Asosiy statistika:**
   - Jami checklar soni
   - Jami summa
   - O'rtacha check summasi
   - Faol expeditorlar soni

   ⚠️ **Muammolar statistikasi:**
   - Muammoli checklar soni
   - Muammo turlari va ularning soni
   - Eng ko'p muammoli hududlar

   📈 **Trend tahlili:**
   - Kunlik o'sish/pasayish foizi
   - Haftalik taqqoslash
   - Oylik taqqoslash

4. Hisobotni HTML formatda tayyorlaydi
5. Barcha qabul qiluvchilarga email yuboradi
6. Yuborilgan emaillar haqida log yozadi

🕐 **TAVSIYA QILINGAN VAQT:**
- Interval: Kuniga 1 marta (masalan, har kuni ertalab 8:00 da)
- Sabab: Kunlik hisobotlar juda tez-tez kerak emas

📊 **NATIJA:**
- Yuborilgan emaillar soni
- Qabul qiluvchilar ro'yxati
- Yuborishda xatolar (agar bo'lsa)

⚠️ **MUHIM:**
Bu task oxirgi navbatda ishlashi kerak, chunki u butun kunlik ma'lumotlarni to'playdi.
Email konfiguratsiyasi to'g'ri sozlanganligiga ishonch hosil qiling.''',
            'default_params': {
                'report_type': 'daily',
                'include_charts': True
            },
            'sample_result': '''Natija namunasi:
{
    "emails_sent": 5,
    "recipients": ["admin@example.com", "manager@example.com"],
    "report_period": "2025-10-21",
    "total_checks_in_report": 234,
    "errors": []
}''',
            'is_active': True
        },
        {
            'code': 'ANALYZE_PATTERNS',
            'name': 'Checklar pattern tahlili',
            'description': '''🔬 **VAZIFA:** Checklar orasidagi noodatiy patternlarni aniqlash

🎯 **MAQSAD:**
- Shubhali checklar patternlarini topish
- Bir xil expeditor tomonidan qisqa vaqt ichida ko'p checklar
- Bir xil joylashuvda ko'p checklar
- Noodatiy xatti-harakatlarni aniqlash

⚙️ **ISHLASH JARAYONI:**
1. So'nggi checklar ma'lumotlarini oladi (masalan, oxirgi 24 soat)
2. Quyidagi patternlarni qidiradi:

   ⏰ **Vaqt bo'yicha patternlar:**
   - Bir expeditor 5 daqiqa ichida 10+ check yaratsa
   - Tunda (22:00-06:00) ko'p checklar
   - Dam olish kunlari noodatiy faollik

   📍 **Joylashuv bo'yicha patternlar:**
   - Bir xil koordinatada 1 soat ichida 20+ check
   - Bir expeditor bir necha joyda bir vaqtda (fizik jihatdan mumkin emas)
   - Shubhali joylashuvlar (masalan, cho'lda, dengizda)

   💰 **Summa bo'yicha patternlar:**
   - Bir xil summali ko'p checklar ketma-ket
   - Juda katta summa (outlier detection)
   - Summa tez o'zgarishi (masalan, 100 UZS dan 1,000,000 UZS ga)

   👥 **Expeditor bo'yicha patternlar:**
   - Bir expeditor kunlik normaldan 3x ko'p checklar
   - Yangi expeditor darhol ko'p checklar
   - Faol bo'lmagan expeditor to'satdan faollashishi

3. Topilgan patternlarni CheckAnalytics jadvaliga yozadi
4. Har bir pattern uchun:
   - Muammo darajasi (low, medium, high, critical)
   - Tafsilot ma'lumotlar
   - Tegishli checklar ID lari

5. Agar critical pattern topilsa, darhol email yuboradi

🕐 **TAVSIYA QILINGAN VAQT:**
- Interval: 1-2 soat
- Sabab: Patternlarni tez aniqlash kerak, lekin juda tez-tez ham kerak emas

📊 **NATIJA:**
- Tahlil qilingan checklar soni
- Topilgan patternlar soni
- Pattern turlari statistikasi
- Critical patternlar soni
- Yuborilgan ogohlantirishlar

⚠️ **MUHIM:**
Bu task eng murakkab tahliliy task hisoblanadi.
U "SCAN_PROBLEMS" taskdan farqli o'laroq, yakka checklar emas, balki checklar o'rtasidagi bog'lanishlarni tahlil qiladi.
Bu task "UPDATE_CHECKS" va "SCAN_PROBLEMS" tasklardan keyin ishlashi kerak.''',
            'default_params': {
                'time_window_hours': 24,
                'pattern_thresholds': {
                    'rapid_checks': 10,
                    'same_location': 20,
                    'amount_outlier_std': 3.0
                }
            },
            'sample_result': '''Natija namunasi:
{
    "analyzed_checks": 567,
    "patterns_found": 12,
    "pattern_types": {
        "rapid_checks_expeditor": 3,
        "suspicious_location_cluster": 2,
        "amount_outliers": 4,
        "impossible_travel": 2,
        "night_activity_spike": 1
    },
    "critical_patterns": 2,
    "alerts_sent": 1
}''',
            'is_active': True
        },
    ]
    
    # Create tasks
    for task_data in tasks_data:
        TaskList.objects.create(**task_data)
    
    print(f"✅ Created {len(tasks_data)} tasks with detailed descriptions")


def reverse_migration(apps, schema_editor):
    """Remove task descriptions."""
    TaskList = apps.get_model('expeditor_app', 'TaskList')
    TaskList.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('expeditor_app', '0008_emailconfig_tasklist_alter_emailrecipient_options_and_more'),
    ]

    operations = [
        migrations.RunPython(create_task_descriptions, reverse_migration),
    ]

