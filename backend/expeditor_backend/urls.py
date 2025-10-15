"""
URL configuration for expeditor_backend project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('expeditor_app.urls')),
]
