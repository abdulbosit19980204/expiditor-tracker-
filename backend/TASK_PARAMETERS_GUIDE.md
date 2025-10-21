# Task Parameters Guide / Vazifa Parametrlari Qo'llanmasi

Bu qo'llanma har bir taskda ishlatiladigan parametrlarni tushuntiradi va ularning to'g'ri qiymatlarini ko'rsatadi.

---

## 📋 Umumiy Parametrlar (Barcha Tasklar Uchun)

### `threshold` (chegara qiymati)
- **Maqsad:** Taxminiy natijalarni filtrlash uchun ishlatiladi. Masalan, o'xshashlik darajasi yoki ehtimollik qiymati.
- **Qiymat diapazoni:** 0.0 dan 1.0 gacha (0% dan 100% gacha)
- **Tavsiya qilinadigan qiymat:** `0.8` (80%)
- **Misol:**
  - `0.5` - Past chegara, ko'proq natijalar qaytaradi (kamroq qat'iy)
  - `0.8` - O'rta chegara, muvozanatli natijalar
  - `0.95` - Yuqori chegara, faqat juda aniq natijalar

**Qachon o'zgartirish kerak:**
- Agar juda ko'p noto'g'ri natijalar bo'lsa → qiymatni **oshiring** (masalan, 0.9)
- Agar juda kam natijalar bo'lsa → qiymatni **kamaytiring** (masalan, 0.6)

---

### `window_size` (vaqt oynasi, soat hisobida)
- **Maqsad:** Tahlil qilinadigan vaqt oralig'ini belgilaydi. Qancha vaqt ichidagi ma'lumotlarni tekshirish kerakligini ko'rsatadi.
- **Qiymat diapazoni:** 1 dan 720 gacha (1 soatdan 30 kungacha)
- **Tavsiya qilinadigan qiymat:** `24` (1 kun)
- **Misol:**
  - `6` - Oxirgi 6 soat (juda qisqa muddatli tahlil)
  - `24` - Oxirgi 1 kun (kunlik tahlil)
  - `168` - Oxirgi 7 kun (haftalik tahlil)
  - `720` - Oxirgi 30 kun (oylik tahlil)

**Qachon o'zgartirish kerak:**
- Tez-tez o'zgaradigan ma'lumotlar uchun → **kichik qiymat** (6-12 soat)
- Uzun muddatli tendensiyalar uchun → **katta qiymat** (168-720 soat)

---

## 🔍 Taskga Oid Maxsus Parametrlar

### 1. UPDATE_CHECKS (Cheklarni Yangilash)

```json
{
  "batch_size": 1000,
  "max_retries": 3,
  "timeout_seconds": 300
}
```

**Parametrlar tushuntirmasi:**
- `batch_size` - Bir vaqtning o'zida nechta chekni yuklab olish
  - **Tavsiya:** 500-2000 (server quvvatiga qarab)
  - **Katta qiymat** → tezroq, lekin ko'proq xotira
  - **Kichik qiymat** → sekinroq, lekin kamroq xotira

- `max_retries` - Xatolik yuz berganda necha marta qayta urinish
  - **Tavsiya:** 3-5
  
- `timeout_seconds` - Har bir API so'rov uchun maksimal kutish vaqti
  - **Tavsiya:** 120-300 soniya

---

### 2. SCAN_PROBLEMS (Muammolarni Skanerlash)

```json
{
  "threshold": 0.8,
  "window_size": 24,
  "analyze_all": false,
  "batch_size": 1000
}
```

**Parametrlar tushuntirmasi:**
- `threshold` - Muammo deb hisoblanishi uchun minimal aniqlik darajasi (0.8 = 80%) - kelajakda ishlatiladi
- `window_size` - Oxirgi necha soat ichidagi cheklarni tekshirish (24 = 1 kun)
- `analyze_all` - Butun bazani tekshirish (`true`) yoki faqat oxirgi cheklarni (`false`)
  - **`true`** - Barcha cheklarni skanerlaydi (juda sekin, lekin to'liq)
  - **`false`** - Faqat oxirgi `window_size` soat ichidagi cheklarni tekshiradi
- `batch_size` - Bir vaqtning o'zida qayta ishlanadigan cheklar soni (1000-5000 tavsiya)

**Qanday muammolar aniqlanadi:**
1. **NO_COORDS** - GPS koordinatalari yo'q (check_lat yoki check_lon NULL)
2. **NO_EXPEDITOR** - Ekspeditor nomi yo'q yoki bo'sh
3. **MISSING_SUM** - Umumiy summa NULL (mavjud emas)
4. **ZERO_SUM** - Umumiy summa 0 (nol)
5. **NEGATIVE_SUM** - Umumiy summa manfiy (< 0)
6. **NO_CLIENT** - Mijoz nomi yo'q yoki bo'sh
7. **NO_KKM** - KKM raqami yo'q yoki bo'sh
8. **INVALID_DATE** - Chek sanasi yo'q

**Oxirgi 24 soatni tekshirish (tez):**
```json
{
  "threshold": 0.8,
  "window_size": 24,
  "analyze_all": false,
  "batch_size": 1000
}
```

**Butun bazani tekshirish (sekin, lekin to'liq):**
```json
{
  "threshold": 0.75,
  "window_size": 8760,
  "analyze_all": true,
  "batch_size": 5000
}
```

**Performance uchun:**
- Kichik baza (< 100,000 chek): `batch_size: 5000`
- O'rta baza (100K - 1M chek): `batch_size: 2000`
- Katta baza (> 1M chek): `batch_size: 1000`

---

### 3. ANALYZE_PATTERNS (Naqshlarni Tahlil Qilish)

```json
{
  "threshold": 0.8,
  "window_size": 168,
  "min_samples": 10,
  "clustering_method": "dbscan"
}
```

**Parametrlar tushuntirmasi:**
- `threshold` - Naqsh deb hisoblanishi uchun minimal o'xshashlik (0.8 = 80%)
- `window_size` - Tahlil qilinadigan vaqt oynasi (168 = 7 kun)
- `min_samples` - Naqsh aniqlash uchun minimal namunalar soni
  - **Tavsiya:** 5-20 (ma'lumotlar hajmiga qarab)
  
- `clustering_method` - Guruhlashtirish algoritmi:
  - `"dbscan"` - Yuqori aniqlik, lekin sekinroq
  - `"kmeans"` - Tez, lekin kam aniq

**Butun baza uchun sozlash:**
```json
{
  "threshold": 0.75,
  "window_size": 720,
  "analyze_all": true,
  "min_samples": 20,
  "include_historical": true
}
```

---

### 4. SEND_ANALYTICS (Hisobotlarni Yuborish)

```json
{
  "window_size": 24,
  "report_format": "pdf",
  "include_charts": true,
  "recipients": ["admin@example.com"]
}
```

**Parametrlar tushuntirmasi:**
- `window_size` - Hisobot uchun vaqt oralig'i (24 = oxirgi 1 kun)
- `report_format` - Hisobot formati:
  - `"pdf"` - PDF fayl
  - `"excel"` - Excel fayl
  - `"html"` - HTML sahifa
  
- `include_charts` - Grafiklar kiritilsinmi? (`true`/`false`)
- `recipients` - Qabul qiluvchilar ro'yxati

---

## 🎯 Butun Baza Uchun Optimal Sozlamalar

Agar tasklar **butun bazani** tahlil qilishi kerak bo'lsa, quyidagi parametrlarni qo'shing:

```json
{
  "threshold": 0.75,
  "window_size": 720,
  "analyze_all": true,
  "include_historical": true,
  "batch_size": 5000,
  "checkpoint_enabled": true,
  "resume_from_last": true
}
```

**Yangi parametrlar:**
- `analyze_all` - Butun bazani tahlil qilish (`true`/`false`)
- `include_historical` - Eski ma'lumotlarni ham kiritish (`true`/`false`)
- `checkpoint_enabled` - Checkpoint yaratish (xatolik bo'lsa davom ettirish)
- `resume_from_last` - Oxirgi checkpoint dan davom ettirish

**Checkpoint nima?**
- Task ishlayotganda muntazam ravishda progress saqlanadi
- Agar xatolik yuz bersa, task boshidan emas, to'xtaganimizdan davom etadi
- Bu juda katta ma'lumotlar uchun muhim (masalan, 1 million+ chek)

---

## ⚙️ Tasklar Uchun Tavsiya Qilinadigan Interval

| Task | Minimal Interval | Optimal Interval | Maksimal Interval |
|------|-----------------|------------------|-------------------|
| UPDATE_CHECKS | 5 daqiqa | 15-30 daqiqa | 60 daqiqa |
| SCAN_PROBLEMS | 15 daqiqa | 30-60 daqiqa | 120 daqiqa |
| ANALYZE_PATTERNS | 30 daqiqa | 1-2 soat | 6 soat |
| SEND_ANALYTICS | 12 soat | 24 soat (kunlik) | 168 soat (haftalik) |

---

## 🚀 Xotira va Performance Sozlamalari

Agar server quvvati past bo'lsa yoki bazangiz juda katta bo'lsa:

```json
{
  "batch_size": 500,
  "max_workers": 2,
  "memory_limit_mb": 512,
  "use_pagination": true,
  "page_size": 100
}
```

**Parametrlar:**
- `batch_size` - Bir vaqtning o'zida qayta ishlangan yozuvlar soni
- `max_workers` - Parallel ishchilar soni (CPU core soniga qarab)
- `memory_limit_mb` - Maksimal xotira (MB)
- `use_pagination` - Pagination ishlatish (katta ma'lumotlar uchun)
- `page_size` - Har bir sahifadagi yozuvlar soni

---

## 📊 Misol: Butun Bazani Tahlil Qilish

Agar sizda 5 million chek bo'lsa va barchasini tahlil qilmoqchi bo'lsangiz:

```json
{
  "threshold": 0.75,
  "window_size": 8760,
  "analyze_all": true,
  "include_historical": true,
  "batch_size": 10000,
  "max_workers": 4,
  "checkpoint_enabled": true,
  "checkpoint_interval": 50000,
  "resume_from_last": true,
  "use_pagination": true,
  "page_size": 1000,
  "memory_limit_mb": 2048
}
```

**Bu parametrlar:**
- Oxirgi 1 yil (8760 soat) ma'lumotlarini tahlil qiladi
- 10,000 ta chekni bir vaqtning o'zida qayta ishlaydi
- Har 50,000 ta chekdan keyin checkpoint yaratadi
- 4 ta parallel ishchi ishlatadi
- Maksimal 2GB xotira ishlatadi

**Taxminiy vaqt:** 5 million chek uchun ~2-4 soat

---

## ⚠️ Muhim Eslatmalar

1. **Threshold** - Har doim 0.7 dan past bo'lmasin (juda ko'p noto'g'ri natijalar chiqadi)
2. **Window_size** - Juda katta qiymat (masalan, 8760+ soat) server yukini oshiradi
3. **Batch_size** - Server xotirasiga qarab sozlang (kam xotira = kichik batch)
4. **Checkpoint** - Katta bazalar uchun har doim yoqing
5. **Pagination** - 1 million+ yozuvlar uchun majburiy

---

## 🔧 Qo'shimcha Konfiguratsiya

Django admin panelida `TaskList` modelida har bir task uchun parametrlarni to'g'ridan-to'g'ri o'zgartirishingiz mumkin:

1. Admin panelga kiring
2. "Tasks — Task List" ga o'ting
3. Kerakli taskni tanlang
4. `default_params` maydoniga JSON formatda parametrlarni kiriting
5. Saqlang

**Misol JSON:**
```json
{
  "threshold": 0.8,
  "window_size": 24,
  "batch_size": 1000,
  "analyze_all": false
}
```

---

## 📞 Yordam

Agar parametrlar to'g'risida savollar bo'lsa yoki muammo yuz bersa:
- Django admin panelda task description ni o'qing
- Task runs jurnalini tekshiring
- Server loglarini ko'ring (`gunicorn.log`)

