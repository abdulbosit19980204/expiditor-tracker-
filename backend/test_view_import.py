#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/home/administrator/Documents/expiditor-tracker-/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expeditor_backend.settings')
django.setup()

try:
    from expeditor_app.views import ViolationAnalyticsDashboardView
    print("✅ ViolationAnalyticsDashboardView imported successfully!")
    print(f"   View class: {ViolationAnalyticsDashboardView}")
    print(f"   Methods: {[m for m in dir(ViolationAnalyticsDashboardView) if not m.startswith('_')]}")
except Exception as e:
    print(f"❌ Error importing view: {e}")
    import traceback
    traceback.print_exc()




