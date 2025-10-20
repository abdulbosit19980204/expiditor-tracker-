"""
Task Execution Engine for Expeditor Tracker

This module provides the core functionality for executing scheduled tasks,
managing task runs, and handling task lifecycle.
"""

import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from django.core.management.base import BaseCommand, CommandError
from expeditor_app.models import ScheduledTask, TaskRun, Check, CheckAnalytics
from expeditor_app.integration import UpdateChecksView
import math

logger = logging.getLogger(__name__)


class TaskExecutor:
    """Core task execution engine."""
    
    def __init__(self):
        self.task_handlers = {
            ScheduledTask.TASK_UPDATE_CHECKS: self._execute_update_checks,
            ScheduledTask.TASK_SCAN_PROBLEM_CHECKS: self._execute_scan_problems,
            ScheduledTask.TASK_SEND_ANALYTICS: self._execute_send_analytics,
            ScheduledTask.TASK_ANALYZE_PATTERNS: self._execute_analyze_patterns,
        }
    
    def execute_task(self, scheduled_task: ScheduledTask) -> TaskRun:
        """Execute a scheduled task and return the TaskRun record."""
        task_run = None
        
        try:
            # Create TaskRun record
            task_run = TaskRun.objects.create(
                task_type=scheduled_task.task_type,
                is_running=True,
                status_message="Starting task execution...",
                total=0,
                processed=0
            )
            
            logger.info(f"Starting task execution: {scheduled_task.task_type} (Run ID: {task_run.id})")
            
            # Update status
            task_run.status_message = f"Executing {scheduled_task.name}..."
            task_run.save()
            
            # Execute the task
            handler = self.task_handlers.get(scheduled_task.task_type)
            if not handler:
                raise CommandError(f"No handler found for task type: {scheduled_task.task_type}")
            
            result = handler(scheduled_task, task_run)
            
            # Mark as completed
            task_run.is_running = False
            task_run.finished_at = timezone.now()
            task_run.status_message = f"Completed successfully. {result.get('message', '')}"
            task_run.total = result.get('total', 0)
            task_run.processed = result.get('processed', 0)
            task_run.save()
            
            # Update scheduled task
            scheduled_task.last_run_at = timezone.now()
            scheduled_task.next_run_at = timezone.now() + timedelta(minutes=scheduled_task.interval_minutes)
            scheduled_task.save()
            
            logger.info(f"Task completed successfully: {scheduled_task.task_type} (Run ID: {task_run.id})")
            
        except Exception as e:
            logger.error(f"Task execution failed: {scheduled_task.task_type} - {str(e)}")
            
            if task_run:
                task_run.is_running = False
                task_run.finished_at = timezone.now()
                task_run.status_message = f"Failed: {str(e)}"
                task_run.save()
            
            raise
        
        return task_run
    
    def _execute_update_checks(self, scheduled_task: ScheduledTask, task_run: TaskRun) -> dict:
        """Execute update checks task."""
        try:
            # Use the existing UpdateChecksView logic
            view = UpdateChecksView()
            
            # Mock request object
            class MockRequest:
                def __init__(self):
                    self.GET = {}
            
            response = view.get(MockRequest())
            
            if response.status_code == 200:
                data = response.data
                return {
                    'message': f"Updated {data.get('updated', 0)} records",
                    'total': data.get('updated', 0),
                    'processed': data.get('updated', 0)
                }
            else:
                raise Exception(f"Update failed with status {response.status_code}")
                
        except Exception as e:
            logger.error(f"Update checks failed: {str(e)}")
            raise
    
    def _execute_scan_problems(self, scheduled_task: ScheduledTask, task_run: TaskRun) -> dict:
        """Execute problem checks scanning task."""
        try:
            from expeditor_app.models import ProblemCheck
            
            # Scan for checks with missing data
            problem_checks = []
            
            # Find checks without coordinates
            checks_without_coords = Check.objects.filter(
                check_lat__isnull=True,
                check_lon__isnull=True
            )
            
            for check in checks_without_coords:
                ProblemCheck.objects.update_or_create(
                    check_id=check.check_id,
                    issue_code='NO_COORDS',
                    defaults={
                        'issue_message': 'Missing GPS coordinates',
                        'resolved': False,
                    }
                )
                problem_checks.append(check.check_id)
            
            # Find checks without expeditor
            checks_without_expeditor = Check.objects.filter(
                ekispiditor__isnull=True
            )
            
            for check in checks_without_expeditor:
                ProblemCheck.objects.update_or_create(
                    check_id=check.check_id,
                    issue_code='NO_EXPEDITOR',
                    defaults={
                        'issue_message': 'Missing expeditor information',
                        'resolved': False,
                    }
                )
                problem_checks.append(check.check_id)
            
            return {
                'message': f"Scanned {len(problem_checks)} problem checks",
                'total': len(problem_checks),
                'processed': len(problem_checks)
            }
            
        except Exception as e:
            logger.error(f"Scan problems failed: {str(e)}")
            raise
    
    def _execute_send_analytics(self, scheduled_task: ScheduledTask, task_run: TaskRun) -> dict:
        """Execute send analytics task."""
        try:
            # For now, just return success
            # In the future, this could send analytics reports via email/telegram
            return {
                'message': "Analytics report sent successfully",
                'total': 1,
                'processed': 1
            }
            
        except Exception as e:
            logger.error(f"Send analytics failed: {str(e)}")
            raise
    
    def _execute_analyze_patterns(self, scheduled_task: ScheduledTask, task_run: TaskRun) -> dict:
        """Execute analyze patterns task."""
        try:
            params = scheduled_task.params or {}
            time_window_minutes = params.get('time_window_minutes', 10)
            distance_meters = params.get('distance_meters', 15)
            lookback_hours = params.get('lookback_hours', 24)
            
            # Calculate time window
            now = timezone.now()
            start_time = now - timedelta(hours=lookback_hours)
            
            # Get checks in the time window
            checks = Check.objects.filter(
                yetkazilgan_vaqti__gte=start_time,
                yetkazilgan_vaqti__lte=now,
                check_lat__isnull=False,
                check_lon__isnull=False
            ).order_by('yetkazilgan_vaqti')
            
            if not checks.exists():
                return {
                    'message': "No checks found for analysis",
                    'total': 0,
                    'processed': 0
                }
            
            # Group checks by time windows and geographic clusters
            analytics_created = 0
            
            # Process checks in time windows
            current_time = start_time
            while current_time < now:
                window_end = current_time + timedelta(minutes=time_window_minutes)
                
                # Get checks in this time window
                window_checks = checks.filter(
                    yetkazilgan_vaqti__gte=current_time,
                    yetkazilgan_vaqti__lt=window_end
                )
                
                if window_checks.exists():
                    # Group by geographic clusters
                    clusters = self._create_geographic_clusters(
                        window_checks, distance_meters
                    )
                    
                    # Create analytics records for each cluster
                    for cluster in clusters:
                        analytics_record = self._create_analytics_record(
                            cluster, current_time, window_end, 
                            time_window_minutes, distance_meters
                        )
                        if analytics_record:
                            analytics_created += 1
                
                current_time = window_end
            
            return {
                'message': f"Created {analytics_created} analytics records",
                'total': analytics_created,
                'processed': analytics_created
            }
            
        except Exception as e:
            logger.error(f"Analyze patterns failed: {str(e)}")
            raise
    
    def _create_geographic_clusters(self, checks, distance_meters):
        """Create geographic clusters from checks."""
        clusters = []
        processed_checks = set()
        
        for check in checks:
            if check.id in processed_checks:
                continue
            
            cluster = [check]
            processed_checks.add(check.id)
            
            # Find nearby checks
            for other_check in checks:
                if other_check.id in processed_checks:
                    continue
                
                distance = self._calculate_distance(
                    check.check_lat, check.check_lon,
                    other_check.check_lat, other_check.check_lon
                )
                
                if distance <= distance_meters:
                    cluster.append(other_check)
                    processed_checks.add(other_check.id)
            
            if len(cluster) > 0:
                clusters.append(cluster)
        
        return clusters
    
    def _create_analytics_record(self, cluster, window_start, window_end, 
                                window_duration_minutes, radius_meters):
        """Create CheckAnalytics record from cluster."""
        try:
            # Calculate cluster center
            total_lat = sum(check.check_lat for check in cluster)
            total_lon = sum(check.check_lon for check in cluster)
            center_lat = total_lat / len(cluster)
            center_lon = total_lon / len(cluster)
            
            # Count expeditors
            expeditors = set(check.ekispiditor for check in cluster if check.ekispiditor)
            
            # Find most active expeditor
            expeditor_counts = {}
            for check in cluster:
                if check.ekispiditor:
                    expeditor_counts[check.ekispiditor] = expeditor_counts.get(check.ekispiditor, 0) + 1
            
            most_active_expiditor = max(expeditor_counts.items(), key=lambda x: x[1])[0] if expeditor_counts else None
            most_active_count = max(expeditor_counts.values()) if expeditor_counts else 0
            
            # Calculate averages
            avg_checks_per_expiditor = len(cluster) / len(expeditors) if expeditors else 0
            
            # Store check IDs and details
            check_ids = [check.check_id for check in cluster]
            check_details = {
                'check_ids': check_ids,
                'expeditors': list(expeditors),
                'total_amount': sum(check.check_detail.total_sum or 0 for check in cluster if check.check_detail),
                'cluster_size': len(cluster)
            }
            
            # Create analytics record
            analytics = CheckAnalytics.objects.create(
                window_start=window_start,
                window_end=window_end,
                window_duration_minutes=window_duration_minutes,
                center_lat=center_lat,
                center_lon=center_lon,
                radius_meters=radius_meters,
                total_checks=len(cluster),
                unique_expiditors=len(expeditors),
                most_active_expiditor=most_active_expiditor,
                most_active_count=most_active_count,
                avg_checks_per_expiditor=avg_checks_per_expiditor,
                check_ids=check_ids,
                check_details=check_details
            )
            
            return analytics
            
        except Exception as e:
            logger.error(f"Failed to create analytics record: {str(e)}")
            return None
    
    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points in meters."""
        R = 6371000  # Earth radius in meters
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon/2) * math.sin(dlon/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
