"""
Management command to run all scheduled tasks.

This command checks for enabled scheduled tasks that are due to run
and executes them using the TaskExecutor.
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from expeditor_app.models import ScheduledTask
from expeditor_app.task_executor import TaskExecutor
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run all scheduled tasks that are due to execute'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--task-type',
            type=str,
            help='Run only tasks of specific type',
            choices=[
                ScheduledTask.TASK_UPDATE_CHECKS,
                ScheduledTask.TASK_SCAN_PROBLEM_CHECKS,
                ScheduledTask.TASK_SEND_ANALYTICS,
                ScheduledTask.TASK_ANALYZE_PATTERNS,
            ]
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force run tasks even if not due',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be executed without actually running',
        )
    
    def handle(self, *args, **options):
        task_type = options.get('task_type')
        force = options.get('force', False)
        dry_run = options.get('dry_run', False)
        
        self.stdout.write(
            self.style.SUCCESS('Starting scheduled task execution...')
        )
        
        # Get tasks to run
        tasks_query = ScheduledTask.objects.filter(is_enabled=True)
        
        if task_type:
            tasks_query = tasks_query.filter(task_type=task_type)
        
        if not force:
            now = timezone.now()
            tasks_query = tasks_query.filter(
                next_run_at__lte=now
            )
        
        tasks = tasks_query.order_by('next_run_at')
        
        if not tasks.exists():
            self.stdout.write(
                self.style.WARNING('No tasks found to execute')
            )
            return
        
        self.stdout.write(f'Found {tasks.count()} task(s) to execute')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No tasks will be executed'))
            for task in tasks:
                self.stdout.write(f'  - {task.name} ({task.task_type})')
            return
        
        # Execute tasks
        executor = TaskExecutor()
        executed_count = 0
        failed_count = 0
        
        for task in tasks:
            try:
                self.stdout.write(f'Executing: {task.name} ({task.task_type})')
                
                task_run = executor.execute_task(task)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Completed: {task.name} '
                        f'(Run ID: {task_run.id}, '
                        f'Processed: {task_run.processed}/{task_run.total})'
                    )
                )
                executed_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed: {task.name} - {str(e)}')
                )
                failed_count += 1
                logger.error(f'Task execution failed: {task.name} - {str(e)}')
        
        # Summary
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                f'Task execution completed: '
                f'{executed_count} succeeded, {failed_count} failed'
            )
        )
