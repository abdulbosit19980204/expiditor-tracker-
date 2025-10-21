# 📋 Task Management Guide / Vazifalar Boshqaruv Qo'llanmasi

## 🎯 Umumiy Ko'rinish / Overview

Expeditor Tracker tizimida 4 ta asosiy avtomatik vazifa (task) mavjud. Ular ma'lum tartibda va vaqtda ishlaydi.

---

## 📊 Tasklar Ro'yxati va Ishlash Tartibi

### 1️⃣ **Checklar Yangilash (UPDATE_CHECKS)**
**Vazifa:** Tizimga yangi checklar ma'lumotlarini yuklash

#### 🎯 Maqsad:
- Barcha loyihalardan (AVON, MaxWay, va boshqalar) yangi chek ma'lumotlarini olish
- Check, CheckDetail va Expeditor jadvallarini yangilash
- Tizimni eng so'nggi ma'lumotlar bilan ta'minlash

#### ⚙️ Ishlash Jarayoni:
1. IntegrationEndpoint jadvalidan barcha faol loyihalarni oladi
2. Har bir loyihaning SOAP servisiga ulanadi (WSDL orqali)
3. Yangi checklar ro'yxatini so'raydi
4. Har bir check uchun:
   - Check asosiy ma'lumotlarini saqlaydi (check_id, check_date, total_sum, va h.k.)
   - CheckDetail batafsil ma'lumotlarini saqlaydi (mahsulotlar ro'yxati, narxlar)
   - Expeditor ma'lumotlarini yangilaydi
5. Barcha yangi ma'lumotlarni bazaga saqlaydi

#### 🕐 Tavsiya Qilingan Vaqt:
- **Interval:** 15-30 daqiqa
- **Sabab:** Yangi checklar tez-tez paydo bo'ladi, ma'lumotlar o'z vaqtida yangilanishi kerak

#### 📊 Natija:
```json
{
    "total_checks": 156,
    "total_details": 892,
    "total_expeditors": 45,
    "new_checks": 23,
    "updated_checks": 12,
    "errors": []
}
```

#### ⚠️ Muhim:
Bu task barcha boshqa tasklarning asosi hisoblanadi. Agar bu task ishlamasa, boshqa tasklar uchun yangi ma'lumotlar bo'lmaydi.

---

### 2️⃣ **Muammoli Checklar Skanerlash (SCAN_PROBLEMS)**
**Vazifa:** Checklar ichidagi muammolarni aniqlash va belgilash

#### 🎯 Maqsad:
- Noto'g'ri, shubhali yoki qoidabuzarlik checklar ni topish
- Muammolarni avtomatik aniqlash va loglash
- Tizim administratoriga muammolar haqida xabar berish

#### ⚙️ Ishlash Jarayoni:

**1. Joylashuv tekshiruvi (Location Check):**
   - Check geografik koordinatalarini tekshiradi
   - Agar koordinata [0, 0] bo'lsa → "invalid_location"
   - Agar koordinata O'zbekiston chegarasidan tashqarida → "location_out_of_bounds"

**2. Summa tekshiruvi (Amount Check):**
   - Check summasini tekshiradi
   - Agar summa 0 yoki manfiy → "invalid_amount"
   - Agar summa juda katta (100 million+) → "suspicious_amount"

**3. Mahsulotlar tekshiruvi (Items Check):**
   - CheckDetail mavjudligini tekshiradi
   - Agar mahsulotlar ro'yxati bo'sh → "missing_details"
   - Agar mahsulotlar narxi noto'g'ri → "invalid_item_price"

**4. Expeditor tekshiruvi (Expeditor Check):**
   - Expeditor ma'lumotlari mavjudligini tekshiradi
   - Agar expeditor topilmasa → "missing_expeditor"

#### 🕐 Tavsiya Qilingan Vaqt:
- **Interval:** 30-60 daqiqa
- **Sabab:** Muammolar tez-tez paydo bo'lmaydi, lekin tezda topilishi kerak
- **Ketma-ketlik:** "UPDATE_CHECKS" dan keyin ishlashi kerak

#### 📊 Natija:
```json
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
}
```

#### ⚠️ Muhim:
Bu task UPDATE_CHECKS taskdan keyin ishlashi kerak, chunki yangi checklar mavjud bo'lgandan keyingina ularni tekshirish mumkin.

---

### 3️⃣ **Checklar Pattern Tahlili (ANALYZE_PATTERNS)**
**Vazifa:** Checklar orasidagi noodatiy patternlarni aniqlash

#### 🎯 Maqsad:
- Shubhali checklar patternlarini topish
- Bir xil expeditor tomonidan qisqa vaqt ichida ko'p checklar
- Bir xil joylashuvda ko'p checklar
- Noodatiy xatti-harakatlarni aniqlash

#### ⚙️ Ishlash Jarayoni:

**1. Vaqt bo'yicha patternlar (Time Patterns):**
   - Bir expeditor 5 daqiqa ichida 10+ check → SUSPICIOUS
   - Tunda (22:00-06:00) ko'p checklar → WARNING
   - Dam olish kunlari noodatiy faollik → INFO

**2. Joylashuv bo'yicha patternlar (Location Patterns):**
   - Bir xil koordinatada 1 soat ichida 20+ check → SUSPICIOUS
   - Bir expeditor bir necha joyda bir vaqtda → IMPOSSIBLE (fizik jihatdan mumkin emas)
   - Shubhali joylashuvlar (cho'l, dengiz) → WARNING

**3. Summa bo'yicha patternlar (Amount Patterns):**
   - Bir xil summali ko'p checklar ketma-ket → SUSPICIOUS
   - Juda katta summa (outlier detection) → WARNING
   - Summa tez o'zgarishi (100 UZS → 1,000,000 UZS) → INFO

**4. Expeditor bo'yicha patternlar (Expeditor Patterns):**
   - Bir expeditor kunlik normaldan 3x ko'p checklar → WARNING
   - Yangi expeditor darhol ko'p checklar → INFO
   - Faol bo'lmagan expeditor to'satdan faollashishi → INFO

#### 🕐 Tavsiya Qilingan Vaqt:
- **Interval:** 1-2 soat
- **Sabab:** Patternlarni tez aniqlash kerak, lekin juda tez-tez ham kerak emas
- **Ketma-ketlik:** UPDATE_CHECKS va SCAN_PROBLEMS dan keyin

#### 📊 Natija:
```json
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
}
```

#### ⚠️ Muhim:
Bu task eng murakkab tahliliy task hisoblanadi. U yakka checklar emas, balki checklar o'rtasidagi bog'lanishlarni tahlil qiladi.

---

### 4️⃣ **Analitika Hisobot Yuborish (SEND_ANALYTICS)**
**Vazifa:** Kunlik analitika hisobotini email orqali yuborish

#### 🎯 Maqsad:
- Tizim administratorlarga avtomatik kunlik hisobot tayyorlash
- Muhim statistikalarni email orqali yuborish
- Muammolar haqida xabardor qilish

#### ⚙️ Ishlash Jarayoni:
1. EmailConfig jadvalidan faol email konfiguratsiyasini oladi
2. EmailRecipient jadvalidan barcha faol qabul qiluvchilarni oladi
3. Kunlik statistikani to'playdi:
   - Jami checklar soni
   - Jami summa
   - O'rtacha check summasi
   - Faol expeditorlar soni
   - Muammolar statistikasi
   - Trend tahlili
4. Hisobotni HTML formatda tayyorlaydi
5. Barcha qabul qiluvchilarga email yuboradi

#### 🕐 Tavsiya Qilingan Vaqt:
- **Interval:** Kuniga 1 marta (masalan, ertalab 8:00)
- **Sabab:** Kunlik hisobotlar juda tez-tez kerak emas
- **Ketma-ketlik:** Oxirgi navbatda (barcha boshqa tasklar bajarilgandan keyin)

#### 📊 Natija:
```json
{
    "emails_sent": 5,
    "recipients": ["admin@example.com", "manager@example.com"],
    "report_period": "2025-10-21",
    "total_checks_in_report": 234,
    "errors": []
}
```

#### ⚠️ Muhim:
Email konfiguratsiyasi to'g'ri sozlanganligiga ishonch hosil qiling. Bu task oxirgi navbatda ishlashi kerak.

---

## 📅 Tavsiya Qilingan Ishlash Jadvali

### Vaqt bo'yicha tartib:

```
00:00 ┐
00:15 │  UPDATE_CHECKS (har 15-30 daqiqada)
00:30 │  └─ Yangi checklar yuklanadi
00:45 │
01:00 ├─ SCAN_PROBLEMS (har 30-60 daqiqada)
01:15 │  └─ Muammoli checklar aniqlanadi
01:30 │  UPDATE_CHECKS
...   │
07:00 ├─ ANALYZE_PATTERNS (har 1-2 soatda)
...   │  └─ Patternlar tahlil qilinadi
08:00 ├─ SEND_ANALYTICS (kuniga 1 marta)
      │  └─ Kunlik hisobot yuboriladi
      │
      └─ Keyingi kun boshlanadi...
```

### Optimal sozlamalar:

| Task | Interval | Ishlash vaqti | Ketma-ketlik |
|------|----------|---------------|--------------|
| UPDATE_CHECKS | 15-30 min | Har doim | 1 |
| SCAN_PROBLEMS | 30-60 min | UPDATE_CHECKS dan 10 min keyin | 2 |
| ANALYZE_PATTERNS | 1-2 soat | SCAN_PROBLEMS dan 15 min keyin | 3 |
| SEND_ANALYTICS | 1 kun | Ertalab 8:00 | 4 |

---

## 🔧 Konfiguratsiya / Configuration

### Django Admin Panelda:

1. **Settings → Scheduled Tasks** ga kiring
2. Har bir task uchun:
   - ✅ `is_enabled` - taskni yoqish/o'chirish
   - ⏱️ `interval_minutes` - task ishlash intervali
   - 📝 `params` - qo'shimcha parametrlar (JSON formatda)

### Task parametrlari:

```json
{
  "UPDATE_CHECKS": {
    "batch_size": 100,
    "max_retries": 3
  },
  "SCAN_PROBLEMS": {
    "check_last_hours": 24,
    "alert_threshold": 10
  },
  "ANALYZE_PATTERNS": {
    "time_window_hours": 24,
    "pattern_thresholds": {
      "rapid_checks": 10,
      "same_location": 20,
      "amount_outlier_std": 3.0
    }
  },
  "SEND_ANALYTICS": {
    "report_type": "daily",
    "include_charts": true
  }
}
```

---

## 📞 Qo'llab-quvvatlash / Support

Agar tasklar bilan bog'liq muammo yoki savol bo'lsa:

1. **Django Admin Panel** → **Tasks → Runs** - tasklar tarixini ko'ring
2. **Logs** - server loglarini tekshiring
3. **Email** - administrator email'ga xabar yuboring

---

## ✅ Best Practices

1. **Birinchi UPDATE_CHECKS taskni yoqing** - bu eng muhim task
2. **Tasklar ketma-ketligini saqlang** - har bir task oldingi taskga bog'liq
3. **Interval vaqtlarini to'g'ri sozlang** - juda tez yoki juda sekin emas
4. **Email konfiguratsiyasini tekshiring** - SEND_ANALYTICS uchun kerak
5. **Loglarni muntazam tekshiring** - muammolarni erta aniqlash uchun

---

**Oxirgi yangilanish:** 2025-10-21
**Versiya:** 1.0

