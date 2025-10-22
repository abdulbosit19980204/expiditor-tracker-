"""
Django settings for expeditor_backend project.
"""

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables after BASE_DIR is defined (see below)

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend root production.env (fallback to .env)
env_file_path = os.path.join(BASE_DIR, 'production.env')
if os.path.exists(env_file_path):
    load_dotenv(env_file_path)
else:
    load_dotenv(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Fixed: Remove wildcard '*' from ALLOWED_HOSTS for security
# In production, only allow specific hosts. Allow override via env ALLOWED_HOSTS.
default_allowed_hosts = [
    'localhost',
    '127.0.0.1',
    '192.168.0.109',
    '178.218.200.120',
]

env_allowed_hosts = os.environ.get('ALLOWED_HOSTS')
if env_allowed_hosts:
    ALLOWED_HOSTS = [host.strip() for host in env_allowed_hosts.split(',') if host.strip()]
else:
    ALLOWED_HOSTS = default_allowed_hosts

# Optionally add wildcard only in development mode
if DEBUG:
    ALLOWED_HOSTS.append('*')

# HTTPS/COOP Settings (HTTP-only mode)
SECURE_PROXY_SSL_HEADER = None
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SECURE_CROSS_ORIGIN_OPENER_POLICY = None
SECURE_CROSS_ORIGIN_EMBEDDER_POLICY = None

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'expeditor_app',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'expeditor_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'expeditor_backend.wsgi.application'

# Database - PostgreSQL only (using production.env)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'expiditor-tracker-real'),
        'USER': os.environ.get('DB_USER', 'expiditor'),  # Use expeditor user
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# SQLite configuration (commented out)
# if os.environ.get('DB_ENGINE', 'sqlite') == 'postgres':
#     DATABASES = {
#         'default': {
#             'ENGINE': 'django.db.backends.postgresql',
#             'NAME': os.environ.get('DB_NAME', 'expiditor-tracker-real'),
#             'USER': os.environ.get('DB_USER', 'postgres'),
#             'PASSWORD': os.environ.get('DB_PASSWORD', ''),
#             'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
#             'PORT': os.environ.get('DB_PORT', '5432'),
#         }
#     }
# else:
#     DATABASES = {
#         'default': {
#             'ENGINE': 'django.db.backends.sqlite3',
#             'NAME': BASE_DIR / 'db.sqlite3',
#         }
#     }
# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise for serving static files in production
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings (allow override via env CORS_ALLOWED_ORIGINS)
default_cors_allowed = [
    "http://localhost:4563",
    "http://127.0.0.1:4563",
    "http://178.218.200.120:4563",
    "https://178.218.200.120:4563",
    "http://localhost:7896",
    "http://127.0.0.1:7896",
]

env_cors = os.environ.get('CORS_ALLOWED_ORIGINS')
if env_cors:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in env_cors.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = default_cors_allowed

CORS_ALLOW_ALL_ORIGINS = DEBUG

CORS_ALLOW_CREDENTIALS = True

# HTTPS/COOP Settings (HTTP-only mode)
SECURE_PROXY_SSL_HEADER = None
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SECURE_CROSS_ORIGIN_OPENER_POLICY = None
SECURE_CROSS_ORIGIN_EMBEDDER_POLICY = None

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,  # 5 minutes default
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

# settings.py
LAST_UPDATE_DATE_PATH = BASE_DIR / 'last_update.txt'
DATA_UPLOAD_MAX_NUMBER_FIELDS = 7000

# Custom User Model
# AUTH_USER_MODEL = 'expeditor_app.CustomUser'

# REST Framework Authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}
