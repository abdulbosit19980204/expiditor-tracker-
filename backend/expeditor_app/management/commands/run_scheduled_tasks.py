from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from expeditor_app.models import ScheduledTask, ProblemCheck, Check, CheckDetail, IntegrationEndpoint, EmailRecipient, TaskRun
from expeditor_app.integration import UpdateChecksView
from django.db.models import Q


class Command(BaseCommand):
    help = "Run enabled scheduled tasks once (idempotent). Intended for cron usage."

    def handle(self, *args, **options):
        now = timezone.now()
        tasks = ScheduledTask.objects.filter(is_enabled=True).order_by('next_run_at')
        for task in tasks:
            if task.next_run_at and task.next_run_at > now:
                continue

            run = TaskRun.objects.create(task_type=task.task_type, total=0, processed=0, status_message='Starting')
            if task.task_type == ScheduledTask.TASK_UPDATE_CHECKS:
                # Use IntegrationEndpoint per project if provided
                project = (task.params or {}).get('project_name', 'AVON')
                try:
                    UpdateChecksView.get_client(project)  # ensure client resolves
                    UpdateChecksView().get(None)  # lightweight call path
                except Exception:
                    pass

            elif task.task_type == ScheduledTask.TASK_SCAN_PROBLEM_CHECKS:
                # Efficient streaming scan in batches
                existing_ids_qs = Check.objects.values_list('check_id', flat=True)
                detail_ids_set = set(CheckDetail.objects.values_list('check_id', flat=True))
                run.total = existing_ids_qs.count()
                run.status_message = 'Scanning for missing details'
                run.save(update_fields=['total', 'status_message'])

                batch = 1000
                processed = 0
                for start in range(0, run.total, batch):
                    ids = list(existing_ids_qs[start:start+batch])
                    for cid in ids:
                        if cid not in detail_ids_set:
                            ProblemCheck.objects.update_or_create(
                                check_id=cid,
                                issue_code='DETAIL_MISSING',
                                defaults={'issue_message': 'Check exists but detail missing', 'resolved': False},
                            )
                    processed += len(ids)
                    run.processed = processed
                    run.save(update_fields=['processed'])

                run.status_message = 'Scanning for missing coordinates'
                run.save(update_fields=['status_message'])
                coord_qs = Check.objects.filter(Q(check_lat__isnull=True) | Q(check_lon__isnull=True)).values_list('check_id', flat=True)
                for cid in coord_qs.iterator(chunk_size=1000):
                    ProblemCheck.objects.update_or_create(
                        check_id=cid,
                        issue_code='NO_COORDS',
                        defaults={'issue_message': 'Missing coordinates', 'resolved': False},
                    )

            elif task.task_type == ScheduledTask.TASK_SEND_ANALYTICS:
                # Placeholder hook: collect light metrics
                total_checks = Check.objects.count()
                total_details = CheckDetail.objects.count()
                unresolved = ProblemCheck.objects.filter(resolved=False).count()
                # Email sending integration can be added here; for now we no-op
                _ = (total_checks, total_details, unresolved, list(EmailRecipient.objects.filter(is_active=True)))

            # Update scheduling metadata
            task.last_run_at = now
            task.next_run_at = now + timedelta(minutes=task.interval_minutes or 60)
            task.save(update_fields=['last_run_at', 'next_run_at'])
            run.is_running = False
            run.finished_at = timezone.now()
            run.save(update_fields=['is_running', 'finished_at'])

