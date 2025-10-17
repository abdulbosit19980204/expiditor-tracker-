# Expeditor Tracker - Complete Project Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Frontend Components](#frontend-components)
- [Deployment Guide](#deployment-guide)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development Guidelines](#development-guidelines)
- [Security Considerations](#security-considerations)

## 🎯 Project Overview

**Expeditor Tracker** is a comprehensive delivery management system that provides real-time tracking of delivery personnel, check management, and analytics. The system integrates with external SOAP services to fetch delivery data and provides a modern web interface for monitoring and analysis.

### Key Features
- **Real-time Delivery Tracking**: Track expeditors and their delivery locations
- **Interactive Maps**: Yandex Maps integration for location visualization
- **Analytics Dashboard**: Comprehensive statistics and reporting
- **Telegram Integration**: Direct communication with configured Telegram accounts
- **Advanced Filtering**: Multi-dimensional filtering system
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Admin Panel**: Django admin interface for system management

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (Django/DRF)  │◄──►│   SOAP Service  │
│   Port: 4563    │    │   Port: 7896    │    │   (1C System)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
    ┌─────────┐            ┌─────────┐
    │  Nginx  │            │SQLite/ │
    │ Reverse │            │Postgres │
    │ Proxy   │            │Database │
    └─────────┘            └─────────┘
```

### Component Structure
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Django 4.2 with Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production)
- **Web Server**: Nginx (reverse proxy)
- **WSGI Server**: Gunicorn
- **Maps**: Yandex Maps API integration

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React hooks (useState, useEffect, useMemo)
- **Maps**: Yandex Maps API
- **Icons**: Lucide React

### Backend
- **Framework**: Django 4.2.7
- **API**: Django REST Framework 3.14.0
- **Database**: SQLite3 / PostgreSQL
- **SOAP Client**: zeep 4.3.1
- **CORS**: django-cors-headers 4.3.1
- **Filtering**: django-filter 23.3
- **Static Files**: whitenoise 6.6.0

### Infrastructure
- **Web Server**: Nginx
- **WSGI Server**: Gunicorn 21.2.0
- **Process Management**: systemd service
- **SSL/TLS**: Let's Encrypt (optional)

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or pnpm
- Git

### Backend Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd expiditor-tracker-
```

2. **Backend Environment Setup**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Database Configuration**
```bash
# For SQLite (default)
python manage.py migrate

# For PostgreSQL (production)
# Set environment variables in production.env
python manage.py migrate
```

4. **Create Superuser**
```bash
python manage.py createsuperuser
# Username: admin
# Password: 1234 (or your choice)
```

5. **Collect Static Files**
```bash
python manage.py collectstatic --noinput
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd /path/to/project/root
npm install
# or
pnpm install
```

2. **Environment Configuration**
```bash
# Copy and configure environment file
cp env.local.example env.local
# Edit env.local with your settings
```

3. **Build Frontend**
```bash
npm run build
```

### Production Deployment

1. **Use Production Script**
```bash
./start-production.sh
```

This script will:
- Clean up existing processes
- Start Django backend with Gunicorn
- Build and start Next.js frontend
- Configure Nginx (if available)

## 📡 API Documentation

### Base URL
```
Development: http://localhost:7896/api/
Production: http://your-domain:7896/api/
```

### Authentication
Currently, the API is open (no authentication required). For production, implement proper authentication.

### Core Endpoints

#### 1. Projects
```http
GET /api/projects/
```
**Response:**
```json
[
  {
    "id": 1,
    "project_name": "AVON",
    "project_description": "AVON Project",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### 2. Expeditors
```http
GET /api/expeditors/?filial=1&with_checks=true
```
**Parameters:**
- `filial` (optional): Filter by filial ID
- `with_checks` (optional): Only return expeditors with checks

**Response:**
```json
[
  {
    "id": 1,
    "ekispiditor_name": "John Doe",
    "filial": "Main Branch",
    "name": "John Doe",
    "transport_number": "ABC123",
    "phone_number": "+998901234567",
    "photo": "path/to/photo.jpg",
    "is_active": true,
    "today_checks_count": 15,
    "checks_count": 150,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### 3. Checks
```http
GET /api/checks/?expeditor_id=1&date_from=2025-01-01&date_to=2025-01-31
```
**Parameters:**
- `expeditor_id`: Filter by expeditor ID
- `date_from`: Start date (ISO format)
- `date_to`: End date (ISO format)
- `project`: Filter by project name
- `sklad`: Filter by warehouse name
- `city`: Filter by city name
- `status`: Filter by status
- `search`: Search in check IDs

**Response:**
```json
[
  {
    "id": 1,
    "check_id": "CHK001",
    "project": "AVON",
    "sklad": "Main Warehouse",
    "city": "Tashkent",
    "sborshik": "Picker Name",
    "agent": "Agent Name",
    "ekispiditor": "John Doe",
    "yetkazilgan_vaqti": "2025-01-01T10:30:00Z",
    "receiptIdDate": "2025-01-01T09:00:00Z",
    "transport_number": "ABC123",
    "kkm_number": "KKM001",
    "client_name": "Client Name",
    "client_address": "Client Address",
    "check_lat": 41.3111,
    "check_lon": 69.2797,
    "status": "delivered",
    "check_detail": {
      "id": 1,
      "check_id": "CHK001",
      "checkURL": "https://example.com/check",
      "check_date": "2025-01-01T09:00:00Z",
      "check_lat": 41.3111,
      "check_lon": 69.2797,
      "total_sum": 150000.0,
      "nalichniy": 50000.0,
      "uzcard": 100000.0,
      "humo": 0.0,
      "click": 0.0,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    },
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### 4. Statistics
```http
GET /api/statistics/?expeditor_id=1&date_from=2025-01-01&date_to=2025-01-31
```
**Response:**
```json
{
  "total_checks": 150,
  "total_amount": 22500000.0,
  "delivered_checks": 145,
  "pending_checks": 3,
  "failed_checks": 2,
  "average_amount": 150000.0,
  "cash_amount": 7500000.0,
  "uzcard_amount": 12000000.0,
  "humo_amount": 3000000.0,
  "click_amount": 0.0
}
```

#### 5. Analytics (New Feature)
```http
GET /api/analytics/summary/?group_by=project&date_from=2025-01-01&date_to=2025-01-31
```
**Parameters:**
- `group_by`: Group by dimension (project, sklad, city, ekispiditor, date)
- `date_from`: Start date (ISO format)
- `date_to`: End date (ISO format)
- `project`: Filter by project name
- `sklad`: Filter by warehouse name
- `city`: Filter by city name
- `status`: Filter by status

**Response:**
```json
{
  "summary": [
    {
      "dimension": "AVON",
      "count": 150,
      "total_sum": 22500000.0,
      "average_sum": 150000.0
    }
  ],
  "metadata": {
    "group_by": "project",
    "date_range": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z"
    },
    "total_records": 150
  }
}
```

#### 6. Telegram Target (New Feature)
```http
GET /api/telegram/target/
```
**Response:**
```json
{
  "id": 1,
  "display_name": "Support Team",
  "username": "support_bot",
  "phone_number": "+998901234567",
  "is_active": true,
  "url": "https://t.me/support_bot",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

#### 7. Data Update
```http
GET /api/update-checks/?part=checks
```
**Parameters:**
- `part` (optional): Update specific part (checks, details, expeditors)

**Response:**
```json
{
  "updated": 150,
  "created": 25,
  "counts": {
    "checks_created": 10,
    "checks_updated": 140,
    "details_created": 8,
    "details_updated": 142,
    "projects_created": 2,
    "cities_created": 3,
    "expeditors_created": 1,
    "sklads_created": 1
  },
  "last_update": "2025-01-01T12:00:00Z"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid parameters",
  "details": "date_from must be a valid ISO date"
}
```

#### 404 Not Found
```json
{
  "detail": "Not found."
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "SOAP service unavailable"
}
```

## 🗄️ Database Schema

### Core Models

#### Projects
```python
class Projects(models.Model):
    project_name = models.CharField(max_length=100)
    project_description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Ekispiditor (Expeditor)
```python
class Ekispiditor(models.Model):
    ekispiditor_name = models.CharField(max_length=100)
    filial = models.ForeignKey(Filial, on_delete=models.SET_NULL, null=True)
    transport_number = models.CharField(max_length=50, blank=True)
    phone_number = models.CharField(max_length=20, default='+998999999999')
    photo = models.ImageField(upload_to='expeditors/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Check
```python
class Check(models.Model):
    check_id = models.CharField(max_length=100, unique=True)
    project = models.CharField(max_length=100, blank=True)
    sklad = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    sborshik = models.CharField(max_length=100, blank=True)
    agent = models.CharField(max_length=100, blank=True)
    ekispiditor = models.CharField(max_length=100, blank=True)
    yetkazilgan_vaqti = models.DateTimeField(null=True, blank=True)
    receiptIdDate = models.DateTimeField(null=True, blank=True)
    transport_number = models.CharField(max_length=50, blank=True)
    kkm_number = models.CharField(max_length=50, blank=True)
    client_name = models.CharField(max_length=200, blank=True)
    client_address = models.TextField(blank=True)
    check_lat = models.FloatField(null=True, blank=True)
    check_lon = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, default='delivered')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### CheckDetail
```python
class CheckDetail(models.Model):
    check_id = models.CharField(max_length=100, unique=True)
    checkURL = models.URLField(blank=True)
    check_date = models.DateTimeField(null=True, blank=True)
    check_lat = models.FloatField(null=True, blank=True)
    check_lon = models.FloatField(null=True, blank=True)
    total_sum = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    nalichniy = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    uzcard = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    humo = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    click = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### TelegramAccount (New Feature)
```python
class TelegramAccount(models.Model):
    display_name = models.CharField(max_length=120, blank=True, null=True)
    username = models.CharField(max_length=120, blank=True, null=True)
    phone_number = models.CharField(max_length=32, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## 🎨 Frontend Components

### Core Components

#### 1. Main Page (`app/page.tsx`)
- **Purpose**: Main dashboard with expeditor tracking
- **Features**: 
  - Interactive map with Yandex Maps
  - Expeditor selection and filtering
  - Real-time check display
  - Statistics panel
  - Advanced filtering system
  - Telegram integration button
  - Analytics navigation button

#### 2. Analytics Page (`app/enhanced-stats/page.tsx`)
- **Purpose**: Comprehensive analytics dashboard
- **Features**:
  - Interactive charts and graphs
  - Multi-dimensional filtering
  - Export capabilities
  - Real-time data updates

#### 3. Map Component (`components/map-component.tsx`)
- **Purpose**: Yandex Maps integration
- **Features**:
  - Check location markers
  - Expeditor tracking
  - Location focus functionality
  - Responsive design

#### 4. Statistics Panel (`components/statistics-panel.tsx`)
- **Purpose**: Display key metrics
- **Features**:
  - Total checks and amounts
  - Payment method breakdown
  - Status distribution
  - Real-time updates

#### 5. Advanced Filters (`components/advanced-filters.tsx`)
- **Purpose**: Multi-dimensional filtering
- **Features**:
  - Date range picker
  - Project, warehouse, city filters
  - Status filtering
  - Search functionality

### API Client (`lib/api.ts`)
- **Purpose**: Centralized API communication
- **Features**:
  - Type-safe API calls
  - Error handling
  - Caching strategies
  - Analytics endpoints
  - Telegram integration

## 🚀 Deployment Guide

### Production Environment Setup

#### 1. Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended

#### 2. System Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and Node.js
sudo apt install python3 python3-pip python3-venv nodejs npm nginx -y

# Install PostgreSQL (optional)
sudo apt install postgresql postgresql-contrib -y
```

#### 3. Application Deployment

1. **Clone and Setup**
```bash
git clone <repository-url>
cd expiditor-tracker-
```

2. **Backend Configuration**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure production environment
cp production.env.example production.env
# Edit production.env with your settings

# Run migrations
python manage.py migrate
python manage.py collectstatic --noinput
```

3. **Frontend Configuration**
```bash
cd ..
npm install
npm run build
```

4. **Start Services**
```bash
./start-production.sh
```

### Nginx Configuration

#### Basic Configuration (`nginx.conf`)
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server 127.0.0.1:7896;
    }

    upstream frontend {
        server 127.0.0.1:4563;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Admin Panel
        location /admin/ {
            proxy_pass http://backend/admin/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### Production Configuration (`nginx-production.conf`)
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    upstream backend {
        server 127.0.0.1:7896;
        keepalive 32;
    }

    upstream frontend {
        server 127.0.0.1:4563;
        keepalive 32;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Admin Panel
        location /admin/ {
            proxy_pass http://backend/admin/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location /static/ {
            alias /path/to/backend/staticfiles/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### SSL/HTTPS Setup

#### Using Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Manual SSL Configuration (`nginx-https.conf`)
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rest of configuration same as HTTP
}
```

### Systemd Service Configuration

#### Service File (`expeditor-tracker.service`)
```ini
[Unit]
Description=Expeditor Tracker Service
After=network.target

[Service]
Type=forking
User=administrator
Group=administrator
WorkingDirectory=/home/administrator/Documents/expiditor-tracker-
ExecStart=/home/administrator/Documents/expiditor-tracker-/start-production.sh
ExecStop=/bin/kill -TERM $(cat /home/administrator/Documents/expiditor-tracker-/backend.pid) $(cat /home/administrator/Documents/expiditor-tracker-/frontend.pid)
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Enable Service
```bash
sudo cp expeditor-tracker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable expeditor-tracker
sudo systemctl start expeditor-tracker
```

## ⚙️ Configuration

### Environment Variables

#### Frontend (`env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:7896/api
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your_yandex_maps_api_key
NEXT_PUBLIC_FRONTEND_URL=http://localhost:4563
NEXT_PUBLIC_BACKEND_URL=http://localhost:7896
```

#### Backend (`production.env`)
```bash
DB_ENGINE=postgres
DB_NAME=expiditor-tracker-real
DB_USER=expiditor
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=5432
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
CORS_ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
```

### Django Settings

#### Key Settings (`backend/expeditor_backend/settings.py`)
```python
# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'expiditor-tracker-real'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://your-domain.com",
    "https://your-domain.com",
]

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}
```

### Next.js Configuration

#### Configuration (`next.config.mjs`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'your-domain.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_YANDEX_MAPS_API_KEY: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
}

export default nextConfig
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Build Errors

**Problem**: Next.js build fails with chunk errors
```bash
Error: Unexpected token `div`. Expected jsx identifier
```

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Prevention**:
- Always check TypeScript compilation before building
- Use proper JSX syntax
- Ensure all imports are correct

#### 2. Database Connection Issues

**Problem**: Database connection failed
```bash
django.db.utils.OperationalError: could not connect to server
```

**Solution**:
```bash
# Check database service
sudo systemctl status postgresql

# Restart database service
sudo systemctl restart postgresql

# Check connection settings in production.env
# Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
```

#### 3. Port Conflicts

**Problem**: Port already in use
```bash
Error: listen EADDRINUSE: address already in use :::7896
```

**Solution**:
```bash
# Find process using port
sudo lsof -i :7896
sudo lsof -i :4563

# Kill processes
sudo kill -9 <PID>

# Or use the cleanup script
./start-production.sh  # This will clean up existing processes
```

#### 4. SOAP Service Integration Issues

**Problem**: SOAP service unavailable
```bash
zeep.exceptions.TransportError: HTTP 500
```

**Solution**:
1. Check SOAP service availability
2. Verify WSDL URL in IntegrationEndpoint
3. Check network connectivity
4. Review SOAP service logs

**Configuration**:
```python
# In Django admin, configure IntegrationEndpoint
# Project Name: AVON
# WSDL URL: http://192.168.1.241:5443/AVON_UT/AVON_UT.1cws?wsdl
# Is Active: True
```

#### 5. Static Files Issues

**Problem**: Static files not loading
```bash
404 Not Found for /static/admin/css/base.css
```

**Solution**:
```bash
# Collect static files
cd backend
python manage.py collectstatic --noinput

# Check static files directory
ls -la staticfiles/

# Verify Nginx configuration for static files
```

#### 6. CORS Issues

**Problem**: CORS errors in browser console
```bash
Access to fetch at 'http://localhost:7896/api/' from origin 'http://localhost:4563' has been blocked by CORS policy
```

**Solution**:
1. Check CORS_ALLOWED_ORIGINS in Django settings
2. Verify frontend URL in CORS configuration
3. Restart Django server after changes

#### 7. Memory Issues

**Problem**: Out of memory errors
```bash
JavaScript heap out of memory
```

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or modify package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}
```

#### 8. Gunicorn Worker Issues

**Problem**: Gunicorn workers crashing
```bash
Worker timeout (pid:1234)
```

**Solution**:
```bash
# Increase worker timeout
gunicorn --timeout 120 --workers 4 expeditor_backend.wsgi:application

# Or modify start-production.sh
# Add --timeout 120 to gunicorn command
```

### Log Analysis

#### Backend Logs
```bash
# Gunicorn logs
tail -f backend/gunicorn.log

# Django logs (if configured)
tail -f backend/django.log
```

#### Frontend Logs
```bash
# Next.js logs
tail -f nextjs.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### System Logs
```bash
# Systemd service logs
sudo journalctl -u expeditor-tracker -f

# System logs
sudo tail -f /var/log/syslog
```

### Performance Optimization

#### Database Optimization
```python
# Use select_related for foreign keys
expeditors = Ekispiditor.objects.select_related('filial').all()

# Use prefetch_related for many-to-many
checks = Check.objects.prefetch_related('checkdetail_set').all()

# Add database indexes
class Check(models.Model):
    # ... fields ...
    class Meta:
        indexes = [
            models.Index(fields=['check_id']),
            models.Index(fields=['ekispiditor']),
            models.Index(fields=['status']),
        ]
```

#### Frontend Optimization
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback((id) => {
  // Handler logic
}, []);
```

#### Caching Strategy
```python
# Django caching
from django.core.cache import cache

def get_expensive_data():
    cache_key = 'expensive_data'
    data = cache.get(cache_key)
    if data is None:
        data = expensive_operation()
        cache.set(cache_key, data, 300)  # Cache for 5 minutes
    return data
```

## 👨‍💻 Development Guidelines

### Code Style

#### Python/Django
- Follow PEP 8 style guide
- Use type hints where possible
- Write comprehensive docstrings
- Use meaningful variable names

#### TypeScript/React
- Use TypeScript strict mode
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries

### Testing

#### Backend Testing
```python
# tests/test_models.py
from django.test import TestCase
from expeditor_app.models import Check, Ekispiditor

class CheckModelTest(TestCase):
    def setUp(self):
        self.expeditor = Ekispiditor.objects.create(
            ekispiditor_name="Test Expeditor"
        )
    
    def test_check_creation(self):
        check = Check.objects.create(
            check_id="TEST001",
            ekispiditor="Test Expeditor"
        )
        self.assertEqual(check.check_id, "TEST001")
```

#### Frontend Testing
```javascript
// __tests__/components/StatisticsPanel.test.tsx
import { render, screen } from '@testing-library/react';
import { StatisticsPanel } from '@/components/statistics-panel';

describe('StatisticsPanel', () => {
  it('renders statistics correctly', () => {
    const mockStats = {
      total_checks: 100,
      total_amount: 15000000,
    };
    
    render(<StatisticsPanel statistics={mockStats} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('15,000,000 UZS')).toBeInTheDocument();
  });
});
```

### Git Workflow

#### Branch Strategy
```bash
# Feature development
git checkout -b feature/analytics-dashboard
git add .
git commit -m "feat: add analytics dashboard with charts"
git push origin feature/analytics-dashboard

# Bug fixes
git checkout -b bugfix/cors-issue
git add .
git commit -m "fix: resolve CORS configuration issue"
git push origin bugfix/cors-issue
```

#### Commit Message Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

### API Versioning

#### Version Strategy
```python
# URL versioning
urlpatterns = [
    path('api/v1/', include('expeditor_app.urls')),
    path('api/v2/', include('expeditor_app.v2.urls')),
]

# Header versioning
class APIVersionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        version = request.META.get('HTTP_API_VERSION', 'v1')
        request.api_version = version
        return self.get_response(request)
```

## 🔒 Security Considerations

### Authentication & Authorization

#### Current State
- API is currently open (no authentication)
- Admin panel uses Django's built-in authentication

#### Recommended Implementation
```python
# JWT Authentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token['user_id']
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
```

#### API Security
```python
# Rate limiting
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='100/h', method='GET')
def get_checks(request):
    # API logic
    pass

# Input validation
from rest_framework import serializers

class CheckSerializer(serializers.ModelSerializer):
    check_id = serializers.CharField(max_length=100, validators=[validate_check_id])
    
    def validate_check_id(self, value):
        if not re.match(r'^[A-Z0-9]+$', value):
            raise serializers.ValidationError("Invalid check ID format")
        return value
```

### Data Protection

#### Sensitive Data Handling
```python
# Encrypt sensitive fields
from django_cryptography.fields import encrypt

class Check(models.Model):
    client_name = encrypt(models.CharField(max_length=200, blank=True))
    client_address = encrypt(models.TextField(blank=True))
```

#### Database Security
```sql
-- Create dedicated database user
CREATE USER expeditor_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE expeditor_tracker TO expeditor_user;
GRANT USAGE ON SCHEMA public TO expeditor_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO expeditor_user;
```

### Network Security

#### HTTPS Configuration
```nginx
# Force HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    # SSL configuration
}
```

#### Firewall Configuration
```bash
# UFW firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 7896/tcp   # Block direct backend access
sudo ufw deny 4563/tcp   # Block direct frontend access
sudo ufw enable
```

### Monitoring & Logging

#### Security Monitoring
```python
# Log security events
import logging

security_logger = logging.getLogger('security')

def log_security_event(event_type, user_ip, details):
    security_logger.warning(f"{event_type}: {user_ip} - {details}")

# Usage
log_security_event('FAILED_LOGIN', request.META.get('REMOTE_ADDR'), 'Invalid credentials')
```

#### Audit Trail
```python
# Track model changes
from django.contrib.admin.models import LogEntry

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    changes = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)
```

## 📊 Monitoring & Maintenance

### Health Checks

#### Backend Health Check
```python
# health_check.py
from django.http import JsonResponse
from django.db import connection
import requests

def health_check(request):
    status = {
        'status': 'healthy',
        'database': 'ok',
        'external_api': 'ok',
        'timestamp': timezone.now().isoformat()
    }
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as e:
        status['database'] = 'error'
        status['status'] = 'unhealthy'
    
    # Check external API
    try:
        response = requests.get('http://external-api/health', timeout=5)
        if response.status_code != 200:
            status['external_api'] = 'error'
            status['status'] = 'unhealthy'
    except Exception as e:
        status['external_api'] = 'error'
        status['status'] = 'unhealthy'
    
    return JsonResponse(status)
```

#### Frontend Health Check
```javascript
// health-check.js
export async function healthCheck() {
  try {
    const response = await fetch('/api/health/');
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
```

### Backup Strategy

#### Database Backup
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/expeditor-tracker"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
pg_dump -h localhost -U expeditor expeditor_tracker > $BACKUP_DIR/db_backup_$DATE.sql

# SQLite backup (if using SQLite)
cp backend/db.sqlite3 $BACKUP_DIR/db_backup_$DATE.sqlite3

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "db_backup_*" -mtime +30 -delete
```

#### Application Backup
```bash
#!/bin/bash
# app-backup.sh

BACKUP_DIR="/backups/expeditor-tracker"
DATE=$(date +%Y%m%d_%H%M%S)

# Create application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='venv' \
  /home/administrator/Documents/expiditor-tracker-

# Clean old backups
find $BACKUP_DIR -name "app_backup_*" -mtime +7 -delete
```

### Performance Monitoring

#### Database Performance
```python
# database_monitoring.py
from django.db import connection
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check slow queries
            cursor.execute("""
                SELECT query, mean_time, calls 
                FROM pg_stat_statements 
                ORDER BY mean_time DESC 
                LIMIT 10
            """)
            slow_queries = cursor.fetchall()
            
            for query in slow_queries:
                self.stdout.write(f"Slow query: {query[0]} - {query[1]}ms")
```

#### Application Performance
```python
# performance_monitoring.py
import time
from functools import wraps

def monitor_performance(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        
        execution_time = end_time - start_time
        if execution_time > 1.0:  # Log slow operations
            logger.warning(f"Slow operation: {func.__name__} took {execution_time:.2f}s")
        
        return result
    return wrapper
```

## 🚀 Future Enhancements

### Planned Features

#### 1. Real-time Updates
- WebSocket integration for live data updates
- Push notifications for important events
- Real-time map updates

#### 2. Advanced Analytics
- Machine learning predictions
- Trend analysis
- Custom reporting

#### 3. Mobile Application
- React Native mobile app
- Offline functionality
- GPS tracking integration

#### 4. Integration Enhancements
- Multiple SOAP service support
- REST API integrations
- Third-party service connections

### Technical Improvements

#### 1. Performance Optimization
- Database query optimization
- Caching strategies
- CDN integration

#### 2. Security Enhancements
- OAuth 2.0 integration
- API key management
- Advanced audit logging

#### 3. Scalability
- Microservices architecture
- Container orchestration
- Load balancing

## 📞 Support & Contact

### Documentation Resources
- **API Documentation**: Available at `/api/docs/` (if implemented)
- **Admin Panel**: Available at `/admin/`
- **Health Check**: Available at `/api/health/`

### Troubleshooting Resources
- **Logs**: Check application logs for detailed error information
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Refer to this comprehensive guide

### Development Team
- **Backend**: Django REST Framework development
- **Frontend**: Next.js and React development
- **DevOps**: Deployment and infrastructure management

---

## 📝 License

This project is proprietary software. All rights reserved.

## 🔄 Version History

- **v1.0.0**: Initial release with basic tracking functionality
- **v1.1.0**: Added analytics dashboard and Telegram integration
- **v1.2.0**: Enhanced filtering system and UI improvements

---

*Last updated: January 2025*
*Documentation version: 1.0*
