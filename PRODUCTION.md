# 🚀 Expeditor Tracker - Production Deployment Guide

Bu dokumentatsiya Expeditor Tracker loyihasini production muhitida ishga tushirish uchun to'liq qo'llanma.

## 📋 Tizim Talablari

- **OS**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Python**: 3.8+
- **Node.js**: 18+
- **Nginx**: 1.18+
- **RAM**: 2GB+ (4GB tavsiya etiladi)
- **Disk**: 10GB+ bo'sh joy

## 🔧 Dastlabki Sozlash

### 1. Loyihani Klonlash
```bash
git clone <repository-url>
cd expeditor-tracker
```

### 2. Backend Sozlash
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend Sozlash
```bash
# Node.js o'rnatish (agar yo'q bo'lsa)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Dependencies o'rnatish
npm install
```

## 🚀 Production Ishga Tushirish

### Avtomatik Ishga Tushirish (Tavsiya etiladi)
```bash
./start-production.sh
```

Bu script:
- Mavjud jarayonlarni to'xtatadi
- Migrationlarni ishga tushiradi
- Static fayllarni to'playdi
- Backend ni Gunicorn orqali ishga tushiradi
- Frontend ni Next.js orqali ishga tushiradi
- Barcha xizmatlarni tekshiradi

### Qo'lda Ishga Tushirish

#### Backend (Django + Gunicorn)
```bash
cd backend
source venv/bin/activate
python3 manage.py migrate
python3 manage.py collectstatic --noinput
gunicorn --bind 0.0.0.0:7896 --workers 3 --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 50 expeditor_backend.wsgi
```

#### Frontend (Next.js)
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm run build
npm run start -- -p 4563
```

## 🌐 Nginx Sozlash

### 1. Nginx Konfiguratsiyasi
```bash
sudo cp nginx-production.conf /etc/nginx/sites-available/expeditor-tracker
sudo ln -s /etc/nginx/sites-available/expeditor-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Firewall Sozlash
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 7896
sudo ufw allow 4563
```

## 🔐 Xavfsizlik Sozlash

### 1. Django Settings
```python
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'your-ip-address']
SECRET_KEY = 'your-very-secure-secret-key'
```

### 2. Environment Variables
```bash
export SECRET_KEY="your-secret-key"
export DEBUG=False
export DATABASE_URL="sqlite:///path/to/db.sqlite3"
```

## 📊 Monitoring va Loglar

### Log Fayllar
- **Backend**: `backend/gunicorn.log`
- **Frontend**: `nextjs.log`
- **Nginx**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`

### Monitoring
```bash
# Jarayonlarni ko'rish
ps aux | grep -E "(gunicorn|next)"

# Portlarni tekshirish
netstat -tlnp | grep -E "(7896|4563|80)"

# Loglarni ko'rish
tail -f backend/gunicorn.log
tail -f nextjs.log
```

## 🔄 Service Management

### Systemd Service (Tavsiya etiladi)
```bash
sudo cp expeditor-tracker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable expeditor-tracker
sudo systemctl start expeditor-tracker
sudo systemctl status expeditor-tracker
```

### Manual Management
```bash
# Ishga tushirish
./start-production.sh

# To'xtatish
kill $(cat backend.pid) $(cat frontend.pid)

# Qayta ishga tushirish
./start-production.sh
```

## 🛠️ Maintenance

### Ma'lumotlar Bazasi
```bash
# Backup
cp backend/db.sqlite3 backup_$(date +%Y%m%d_%H%M%S).sqlite3

# Migration
cd backend
source venv/bin/activate
python3 manage.py migrate
```

### Static Fayllar
```bash
cd backend
source venv/bin/activate
python3 manage.py collectstatic --noinput
```

### Superuser Yaratish
```bash
cd backend
source venv/bin/activate
python3 manage.py createsuperuser
```

## 🚨 Troubleshooting

### Umumiy Muammolar

#### 1. Port ishlatilmoqda
```bash
# Portni tekshirish
lsof -i :7896
lsof -i :4563

# Jarayonni to'xtatish
kill -9 <PID>
```

#### 2. Migration xatoliklari
```bash
cd backend
source venv/bin/activate
python3 manage.py migrate --fake-initial
```

#### 3. Static fayllar ko'rinmaydi
```bash
cd backend
source venv/bin/activate
python3 manage.py collectstatic --noinput
sudo chown -R www-data:www-data staticfiles/
```

#### 4. CORS xatoliklari
- `settings.py` da `CORS_ALLOWED_ORIGINS` ni tekshiring
- Frontend URL ni qo'shing

### Log Tahlili
```bash
# Backend xatolari
grep ERROR backend/gunicorn.log

# Frontend xatolari
grep ERROR nextjs.log

# Nginx xatolari
sudo tail -f /var/log/nginx/error.log
```

## 📈 Performance Optimization

### 1. Gunicorn Sozlash
```python
# gunicorn.conf.py
workers = 3
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 2
max_requests = 1000
max_requests_jitter = 50
```

### 2. Nginx Optimization
```nginx
# Gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# Caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,
        }
    }
}
```

## 🔒 Backup va Recovery

### Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/expeditor-tracker"

mkdir -p $BACKUP_DIR

# Database backup
cp backend/db.sqlite3 $BACKUP_DIR/db_$DATE.sqlite3

# Static files backup
tar -czf $BACKUP_DIR/static_$DATE.tar.gz backend/staticfiles/

# Code backup
tar -czf $BACKUP_DIR/code_$DATE.tar.gz --exclude=node_modules --exclude=.git .

echo "Backup completed: $BACKUP_DIR"
```

## 📞 Support

Agar muammolar bo'lsa:
1. Log fayllarni tekshiring
2. Portlarni tekshiring
3. Jarayonlarni tekshiring
4. Nginx konfiguratsiyasini tekshiring

## 🎯 Production Checklist

- [ ] DEBUG = False
- [ ] SECRET_KEY o'zgartirilgan
- [ ] ALLOWED_HOSTS sozlangan
- [ ] CORS sozlangan
- [ ] Static fayllar to'plangan
- [ ] Migration ishlagan
- [ ] Superuser yaratilgan
- [ ] Nginx sozlangan
- [ ] Firewall sozlangan
- [ ] SSL sertifikati (HTTPS uchun)
- [ ] Backup sozlamasi
- [ ] Monitoring sozlamasi

---

**Muhim**: Production muhitida ishlatishdan oldin barcha xavfsizlik choralarini ko'rib chiqing va test qiling!