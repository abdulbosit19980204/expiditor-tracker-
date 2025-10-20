"""
Management command to analyze check patterns and create analytics records.

This command performs pattern analysis on check data to identify
clusters of activity by time and geographic location.
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import datetime, timedelta
from expeditor_app.models import Check, CheckAnalytics
from expeditor_app.task_executor import TaskExecutor
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Analyze check patterns and create analytics records'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--time-window-minutes',
            type=int,
            default=10,
            help='Time window duration in minutes (default: 10)',
        )
        parser.add_argument(
            '--distance-meters',
            type=int,
            default=15,
            help='Distance radius in meters (default: 15)',
        )
        parser.add_argument(
            '--lookback-hours',
            type=int,
            default=24,
            help='How many hours back to analyze (default: 24)',
        )
        parser.add_argument(
            '--start-date',
            type=str,
            help='Start date for analysis (YYYY-MM-DD format)',
        )
        parser.add_argument(
            '--end-date',
            type=str,
            help='End date for analysis (YYYY-MM-DD format)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be analyzed without creating records',
        )
    
    def handle(self, *args, **options):
        time_window_minutes = options['time_window_minutes']
        distance_meters = options['distance_meters']
        lookback_hours = options['lookback_hours']
        start_date = options.get('start_date')
        end_date = options.get('end_date')
        dry_run = options.get('dry_run', False)
        
        self.stdout.write(
            self.style.SUCCESS('Starting check pattern analysis...')
        )
        
        # Determine time range
        if start_date and end_date:
            try:
                start_time = datetime.strptime(start_date, '%Y-%m-%d').replace(tzinfo=timezone.utc)
                end_time = datetime.strptime(end_date, '%Y-%m-%d').replace(tzinfo=timezone.utc)
                end_time = end_time.replace(hour=23, minute=59, second=59)
            except ValueError:
                raise CommandError('Invalid date format. Use YYYY-MM-DD')
        else:
            now = timezone.now()
            end_time = now
            start_time = now - timedelta(hours=lookback_hours)
        
        self.stdout.write(f'Analyzing period: {start_time} to {end_time}')
        self.stdout.write(f'Time window: {time_window_minutes} minutes')
        self.stdout.write(f'Distance radius: {distance_meters} meters')
        
        # Get checks in the time range
        checks = Check.objects.filter(
            yetkazilgan_vaqti__gte=start_time,
            yetkazilgan_vaqti__lte=end_time,
            check_lat__isnull=False,
            check_lon__isnull=False
        ).order_by('yetkazilgan_vaqti')
        
        total_checks = checks.count()
        self.stdout.write(f'Found {total_checks} checks with coordinates')
        
        if total_checks == 0:
            self.stdout.write(self.style.WARNING('No checks found for analysis'))
            return
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No analytics records will be created'))
            self._show_analysis_preview(checks, time_window_minutes, distance_meters)
            return
        
        # Create a mock scheduled task for the executor
        class MockScheduledTask:
            def __init__(self):
                self.task_type = 'ANALYZE_PATTERNS'
                self.name = 'Manual Pattern Analysis'
                self.params = {
                    'time_window_minutes': time_window_minutes,
                    'distance_meters': distance_meters,
                    'lookback_hours': lookback_hours
                }
        
        # Execute analysis
        executor = TaskExecutor()
        mock_task = MockScheduledTask()
        
        try:
            # Create a mock TaskRun for tracking
            from expeditor_app.models import TaskRun
            task_run = TaskRun.objects.create(
                task_type='ANALYZE_PATTERNS',
                is_running=True,
                status_message='Starting manual pattern analysis...',
                total=0,
                processed=0
            )
            
            result = executor._execute_analyze_patterns(mock_task, task_run)
            
            # Mark as completed
            task_run.is_running = False
            task_run.finished_at = timezone.now()
            task_run.status_message = f"Completed successfully. {result.get('message', '')}"
            task_run.total = result.get('total', 0)
            task_run.processed = result.get('processed', 0)
            task_run.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Analysis completed: {result.get("message", "")}'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Analysis failed: {str(e)}')
            )
            logger.error(f'Pattern analysis failed: {str(e)}')
            raise CommandError(f'Analysis failed: {str(e)}')
    
    def _show_analysis_preview(self, checks, time_window_minutes, distance_meters):
        """Show preview of what would be analyzed."""
        from collections import defaultdict
        
        # Group by time windows
        time_groups = defaultdict(list)
        for check in checks:
            # Round to nearest time window
            minutes_since_start = int((check.yetkazilgan_vaqti - checks.first().yetkazilgan_vaqti).total_seconds() / 60)
            window_start = minutes_since_start // time_window_minutes * time_window_minutes
            time_groups[window_start].append(check)
        
        self.stdout.write(f'Would create {len(time_groups)} time windows')
        
        # Show geographic distribution
        coords = [(check.check_lat, check.check_lon) for check in checks]
        if coords:
            min_lat = min(coord[0] for coord in coords)
            max_lat = max(coord[0] for coord in coords)
            min_lon = min(coord[1] for coord in coords)
            max_lon = max(coord[1] for coord in coords)
            
            self.stdout.write(f'Geographic bounds:')
            self.stdout.write(f'  Latitude: {min_lat:.4f} to {max_lat:.4f}')
            self.stdout.write(f'  Longitude: {min_lon:.4f} to {max_lon:.4f}')
        
        # Show expeditor distribution
        expeditors = set(check.ekispiditor for check in checks if check.ekispiditor)
        self.stdout.write(f'Unique expeditors: {len(expeditors)}')
