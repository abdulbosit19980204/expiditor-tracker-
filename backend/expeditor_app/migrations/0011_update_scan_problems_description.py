# Generated manually on 2025-10-21 09:00

from django.db import migrations


def update_scan_problems_description(apps, schema_editor):
    TaskList = apps.get_model('expeditor_app', 'TaskList')
    
    description = """
**Maqsad:** Bazadagi barcha cheklarni skanerlash va ma'lumot sifati muammolarini aniqlash. Bu task muhim ma'lumotlar yo'q bo'lgan yoki noto'g'ri cheklarni topadi.

**Aniqlanadigan muammolar:**
1. **NO_COORDS** - GPS koordinatalari yo'q (check_lat yoki check_lon NULL)
2. **NO_EXPEDITOR** - Ekspeditor nomi yo'q yoki bo'sh
3. **MISSING_SUM** - Umumiy summa NULL (mavjud emas)
4. **ZERO_SUM** - Umumiy summa 0 (nol)
5. **NEGATIVE_SUM** - Umumiy summa manfiy (< 0)
6. **NO_CLIENT** - Mijoz nomi yo'q yoki bo'sh  
7. **NO_KKM** - KKM raqami yo'q yoki bo'sh
8. **INVALID_DATE** - Chek sanasi yo'q

**Ishlash tartibi:**
1. Parametrlarga qarab, barcha cheklarni yoki faqat oxirgi N soat ichidagi cheklarni oladi.
2. Har bir chekni yuqoridagi 8 ta muammo bo'yicha tekshiradi.
3. Muammoli cheklarni "ProblemCheck" modeliga yozadi.
4. Har 100 ta chekdan keyin progress yangilanadi.
5. Yakunida batafsil statistika chiqaradi.

**Parametrlar:**
- `window_size` (24): Oxirgi necha soat ichidagi cheklarni tekshirish
- `analyze_all` (false): Butun bazani tekshirish (`true`) yoki faqat oxirgi cheklarni (`false`)
- `batch_size` (1000): Bir vaqtning o'zida qayta ishlanadigan cheklar soni
- `threshold` (0.8): Kelajakda ishlatiladi - muammo darajasi

**Tavsiya qilingan interval:** Har 1-2 soatda (oxirgi cheklarni tekshirish uchun)

**Natija namunasi:** 
"Scanned 5000 checks, found 234 with issues. Details: No coords: 45, No expeditor: 12, Zero sum: 89, Missing sum: 23, Negative sum: 5, No client: 34, No KKM: 18, Invalid date: 8"

**Muhim eslatma:** 
- Agar `analyze_all: true` bo'lsa, butun bazani tekshiradi - bu juda uzoq vaqt olishi mumkin!
- Katta bazalar uchun `batch_size` ni kamaytirib, `window_size` ni kichikroq qiling.
- Bu task UPDATE_CHECKS taskidan keyin bajarilishi kerak.
- Muammoli cheklar avtomatik ravishda ProblemCheck jadvaliga yoziladi.
"""
    
    task_list_entry = TaskList.objects.filter(code='SCAN_PROBLEMS').first()
    if task_list_entry:
        task_list_entry.description = description
        task_list_entry.save()


class Migration(migrations.Migration):

    dependencies = [
        ('expeditor_app', '0010_add_status_to_taskrun'),
    ]

    operations = [
        migrations.RunPython(update_scan_problems_description),
    ]




