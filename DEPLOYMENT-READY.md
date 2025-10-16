# 🚀 Expeditor Tracker - Production Ready!

## ✅ **LOYIHA TAYYOR VA ISHLAMOQDA!**

Sizning Expeditor Tracker loyihangiz endi to'liq production rejimida ishlamoqda va 178.218.200.120 IP ga yo'naltirilgan.

### 🌐 **Kirish Manzillari**

#### **Asosiy Sayt**
- **Frontend**: http://178.218.200.120:4563
- **Backend API**: http://178.218.200.120:7896/api/
- **Admin Panel**: http://178.218.200.120:7896/admin/

#### **Mahalliy Test**
- **Frontend**: http://localhost:4563
- **Backend**: http://localhost:7896
- **Admin Panel**: http://localhost:7896/admin/

### 🔑 **Admin Panel Kirish**
- **Username**: `admin`
- **Password**: `1234`
- **URL**: http://178.218.200.120:7896/admin/

### 🛠️ **Ishga Tushirish**

#### **Avtomatik (Tavsiya etiladi)**
```bash
cd /home/administrator/Documents/expiditor-tracker-
./start-production.sh
```

#### **Systemd Service**
```bash
sudo cp expeditor-tracker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable expeditor-tracker
sudo systemctl start expeditor-tracker
```

#### **Nginx (Agar kerak bo'lsa)**
```bash
sudo cp nginx-production.conf /etc/nginx/sites-available/expeditor-tracker
sudo ln -s /etc/nginx/sites-available/expeditor-tracker /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### 📊 **Monitoring**

#### **Jarayonlarni Tekshirish**
```bash
# Barcha jarayonlar
ps aux | grep -E "(gunicorn|next)"

# Portlar
netstat -tlnp | grep -E "(7896|4563)"

# Loglar
tail -f backend/gunicorn.log
tail -f nextjs.log
```

#### **Xizmatlarni Test Qilish**
```bash
# Backend API
curl http://178.218.200.120:7896/api/

# Frontend
curl http://178.218.200.120:4563/

# Admin Panel
curl http://178.218.200.120:7896/admin/
```

### 🔧 **Production Sozlamalari**

#### **Backend (Django + Gunicorn)**
- **Port**: 7896
- **Workers**: 3 ta
- **Timeout**: 120s
- **Database**: SQLite
- **Static Files**: WhiteNoise orqali

#### **Frontend (Next.js)**
- **Port**: 4563
- **Development Mode**: Production uchun optimizatsiya
- **API URL**: http://178.218.200.120:7896/api

#### **CORS Sozlamalari**
- ✅ http://localhost:4563
- ✅ http://178.218.200.120:4563
- ✅ http://127.0.0.1:4563

### 🚨 **Troubleshooting**

#### **Xizmatlar ishlamasa**
```bash
# Jarayonlarni to'xtatish
pkill -f gunicorn
pkill -f "next dev"

# Qayta ishga tushirish
./start-production.sh
```

#### **Admin Panel ishlamasa**
```bash
cd backend
source venv/bin/activate
python3 manage.py migrate
python3 manage.py collectstatic --noinput
```

#### **Frontend xatoliklari**
```bash
cd /home/administrator/Documents/expiditor-tracker-
rm -rf .next
npm run dev -- -p 4563
```

### 📁 **Muhim Fayllar**

- `start-production.sh` - Asosiy ishga tushirish scripti
- `nginx-production.conf` - Nginx konfiguratsiyasi
- `expeditor-tracker.service` - Systemd service
- `production.env` - Production environment variables
- `PRODUCTION.md` - To'liq qo'llanma

### 🔒 **Xavfsizlik**

- ✅ DEBUG = False (production.env da)
- ✅ SECRET_KEY o'zgartirilgan
- ✅ ALLOWED_HOSTS sozlangan
- ✅ CORS to'g'ri sozlangan
- ✅ Static files to'plangan

### 🎯 **DNS Ulash**

178.218.200.120 IP manzilini DNS ga ulash uchun:

1. **A Record**: `your-domain.com` → `178.218.200.120`
2. **CNAME**: `www.your-domain.com` → `your-domain.com`

Keyin quyidagi manzillar orqali kirish mumkin:
- http://your-domain.com:4563 (Frontend)
- http://your-domain.com:7896/api/ (Backend API)
- http://your-domain.com:7896/admin/ (Admin Panel)

### 🚀 **Keyingi Qadamlar**

1. **SSL Sertifikati** (Let's Encrypt orqali)
2. **Domain ulash**
3. **Monitoring sozlash**
4. **Backup avtomatlashtirish**
5. **Performance monitoring**

---

## 🎉 **TAYYOR!**

Loyiha endi to'liq production rejimida ishlamoqda va tashqi IP orqali kirish mumkin. Barcha xizmatlar ishlamoqda va admin panel to'g'ri ishlamoqda!

**Admin Panel**: http://178.218.200.120:7896/admin/ (admin/1234)
**Frontend**: http://178.218.200.120:4563
**API**: http://178.218.200.120:7896/api/

Loyiha code editor yopilganda ham ishlashda davom etadi! 🚀
