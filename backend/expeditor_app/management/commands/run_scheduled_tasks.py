from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from expeditor_app.models import ScheduledTask, ProblemCheck, Check, CheckDetail, IntegrationEndpoint, EmailRecipient
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

            if task.task_type == ScheduledTask.TASK_UPDATE_CHECKS:
                # Use IntegrationEndpoint per project if provided
                project = (task.params or {}).get('project_name', 'AVON')
                try:
                    UpdateChecksView.get_client(project)  # ensure client resolves
                    UpdateChecksView().get(None)  # lightweight call path
                except Exception:
                    pass

            elif task.task_type == ScheduledTask.TASK_SCAN_PROBLEM_CHECKS:
                # Detect issues quickly without heavy joins
                existing_ids = set(Check.objects.values_list('check_id', flat=True))
                detail_ids = set(CheckDetail.objects.values_list('check_id', flat=True))

                missing_detail = existing_ids - detail_ids
                for cid in list(missing_detail)[:2000]:  # cap per run to avoid load
                    ProblemCheck.objects.update_or_create(
                        check_id=cid,
                        issue_code='DETAIL_MISSING',
                        defaults={'issue_message': 'Check exists but detail missing', 'resolved': False},
                    )

                # Missing coordinates
                for c in Check.objects.filter(Q(check_lat__isnull=True) | Q(check_lon__isnull=True))[:2000]:
                    ProblemCheck.objects.update_or_create(
                        check_id=c.check_id,
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

