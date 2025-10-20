from django.core.management.base import BaseCommand
from expeditor_app.models import TaskList


class Command(BaseCommand):
    help = "Add the analytics task to TaskList for easy configuration"

    def handle(self, *args, **options):
        # Create or update the analytics task in TaskList
        task, created = TaskList.objects.update_or_create(
            code='ANALYZE_CHECK_PATTERNS',
            defaults={
                'name': 'Check Pattern Analysis',
                'description': 'Analyzes check patterns within time and distance windows to identify active expiditors in specific areas.',
                'default_params': {
                    'time_window_minutes': 10,
                    'distance_meters': 15,
                    'lookback_hours': 24
                },
                'sample_result': '''{
    "total_analytics_created": 25,
    "time_windows_analyzed": 48,
    "geographic_clusters_found": 15,
    "most_active_areas": [
        {
            "location": "(40.1222, 65.3446)",
            "checks": 19,
            "top_expiditor": "Norov Elyor",
            "time_window": "10:40-10:50"
        }
    ]
}''',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created analytics task in TaskList: '{task.name}'"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Updated analytics task in TaskList: '{task.name}'"
                )
            )
        
        self.stdout.write(
            f"Task details: {task.description}"
        )
        self.stdout.write(
            f"Default parameters: {task.default_params}"
        )
