from django.core.management.base import BaseCommand
from expeditor_app.models import ScheduledTask


class Command(BaseCommand):
    help = "Set up the default analytics task for check pattern analysis"

    def handle(self, *args, **options):
        # Default parameters for analytics task
        default_params = {
            'time_window_minutes': 10,
            'distance_meters': 15,
            'lookback_hours': 24
        }
        
        # Create or update the analytics task
        task, created = ScheduledTask.objects.update_or_create(
            name='Check Pattern Analysis',
            task_type=ScheduledTask.TASK_ANALYZE_PATTERNS,
            defaults={
                'is_enabled': True,
                'interval_minutes': 30,  # Run every 30 minutes
                'params': default_params
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created analytics task: '{task.name}' "
                    f"(runs every {task.interval_minutes} minutes)"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Updated analytics task: '{task.name}' "
                    f"(runs every {task.interval_minutes} minutes)"
                )
            )
        
        self.stdout.write(
            f"Task parameters: {task.params}"
        )
        self.stdout.write(
            self.style.WARNING(
                "Note: The task is enabled by default. You can disable it in Django Admin "
                "if needed."
            )
        )
