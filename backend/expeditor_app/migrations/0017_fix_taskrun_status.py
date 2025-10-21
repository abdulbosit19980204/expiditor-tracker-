# Generated manually on 2025-10-21 09:25

from django.db import migrations


def fix_taskrun_status(apps, schema_editor):
    """Fix existing TaskRun records with incorrect status."""
    TaskRun = apps.get_model('expeditor_app', 'TaskRun')
    
    # Update completed tasks
    completed_count = TaskRun.objects.filter(
        is_running=False,
        finished_at__isnull=False,
        status='running'
    ).update(status='completed')
    
    print(f"✅ Fixed {completed_count} completed TaskRun records")


def reverse_fix(apps, schema_editor):
    """Reverse is not needed as we're fixing data."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('expeditor_app', '0016_merge_20251021_0857'),
    ]

    operations = [
        migrations.RunPython(fix_taskrun_status, reverse_fix),
    ]

