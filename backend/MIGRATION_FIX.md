# Migration Fix Guide

## Muammo: `column expeditor_app_taskrun.status does not exist`

Bu xatolik migration hali ishga tushirilmaganligini ko'rsatadi.

---

## ✅ Yechim 1: Django Migration (Tavsiya qilinadi)

Terminalda quyidagi commandlarni bajaring:

```bash
cd /home/administrator/Documents/expiditor-tracker-/backend
source venv/bin/activate
python manage.py migrate
```

Agar bu ishlamasa, Yechim 2 ga o'ting.

---

## ✅ Yechim 2: SQL Script (Muqobil)

Agar Django migration ishlamasa, SQL scriptni to'g'ridan-to'g'ri ishga tushiring:

```bash
cd /home/administrator/Documents/expiditor-tracker-/backend

# PostgreSQL parol so'ralsa, kiritasiz: Baccardi2020
psql -U expiditor -d expiditor-tracker-real -f apply_status_migration.sql
```

Yoki PostgreSQL ichida:

```bash
psql -U expiditor -d expiditor-tracker-real

# Keyin SQL ichida:
\i /home/administrator/Documents/expiditor-tracker-/backend/apply_status_migration.sql
```

---

## ✅ Yechim 3: Qo'lda SQL Bajarish

PostgreSQL ga kirish:

```bash
psql -U expiditor -d expiditor-tracker-real
```

Keyin quyidagi SQL commandlarni birin-ketin kiriting:

```sql
-- 1. Status column qo'shish
ALTER TABLE expeditor_app_taskrun 
ADD COLUMN status VARCHAR(20) DEFAULT 'running' NOT NULL;

-- 2. Check constraint qo'shish
ALTER TABLE expeditor_app_taskrun 
ADD CONSTRAINT expeditor_app_taskrun_status_check 
CHECK (status IN ('running', 'completed', 'failed', 'cancelled'));

-- 3. Index yaratish
CREATE INDEX expeditor_a_status_idx 
ON expeditor_app_taskrun (status, started_at);

-- 4. Mavjud recordlarni yangilash
UPDATE expeditor_app_taskrun
SET status = CASE
    WHEN is_running = TRUE THEN 'running'
    WHEN is_running = FALSE AND finished_at IS NOT NULL THEN 'completed'
    ELSE 'running'
END;

-- 5. Migration record qo'shish
INSERT INTO django_migrations (app, name, applied)
VALUES ('expeditor_app', '0010_add_status_to_taskrun', NOW());

-- 6. Natijani tekshirish
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expeditor_app_taskrun' AND column_name = 'status';
```

---

## ✅ Natijani Tekshirish

Migration muvaffaqiyatli bo'lganini tekshirish:

```sql
-- PostgreSQL da
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expeditor_app_taskrun' 
ORDER BY ordinal_position;
```

Yoki Django shell da:

```bash
cd /home/administrator/Documents/expiditor-tracker-/backend
source venv/bin/activate
python manage.py shell

# Shell ichida:
from expeditor_app.models import TaskRun
print(TaskRun._meta.get_field('status'))
```

---

## 🔄 Backend Serverni Qayta Ishga Tushirish

Migration'dan keyin backend serverni qayta ishga tushiring:

```bash
# Eski processni to'xtatish
pkill -f gunicorn

# Yangi processni boshlash
cd /home/administrator/Documents/expiditor-tracker-/backend
source venv/bin/activate
nohup gunicorn expeditor_backend.wsgi:application \
    --bind 0.0.0.0:7896 \
    --workers 4 \
    --timeout 300 \
    --error-logfile gunicorn-error.log \
    --access-logfile gunicorn-access.log \
    > /dev/null 2>&1 &

echo "Gunicorn started on port 7896"
```

---

## 📊 Xatoliklarni Tekshirish

Agar yana xatolik bo'lsa:

```bash
# Backend loglarini ko'rish
tail -f /home/administrator/Documents/expiditor-tracker-/backend/gunicorn-error.log

# PostgreSQL loglarini ko'rish (Ubuntu/Debian)
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## ℹ️ Qo'shimcha Ma'lumot

**Migration fayl joylashgan:** 
`backend/expeditor_app/migrations/0010_add_status_to_taskrun.py`

**SQL script joylashgan:** 
`backend/apply_status_migration.sql`

**PostgreSQL credentials (production.env):**
- DB_NAME: expiditor-tracker-real
- DB_USER: expiditor
- DB_PASSWORD: Baccardi2020
- DB_HOST: 127.0.0.1
- DB_PORT: 5432




