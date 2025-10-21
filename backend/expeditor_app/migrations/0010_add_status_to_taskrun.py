# Generated manually on 2025-10-21 08:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expeditor_app', '0009_update_task_descriptions'),
    ]

    operations = [
        migrations.AddField(
            model_name='taskrun',
            name='status',
            field=models.CharField(
                choices=[
                    ('running', 'Running'),
                    ('completed', 'Completed'),
                    ('failed', 'Failed'),
                    ('cancelled', 'Cancelled')
                ],
                default='running',
                max_length=20,
                db_index=True
            ),
        ),
        migrations.AddIndex(
            model_name='taskrun',
            index=models.Index(fields=['status', 'started_at'], name='expeditor_a_status_idx'),
        ),
    ]




