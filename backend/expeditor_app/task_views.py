"""
API endpoints for task management.

Provides REST API endpoints for managing scheduled tasks and viewing task runs.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from expeditor_app.models import ScheduledTask, TaskRun, TaskList
from expeditor_app.task_serializers import ScheduledTaskSerializer, TaskRunSerializer, TaskListSerializer
from expeditor_app.task_executor import TaskExecutor
import logging

logger = logging.getLogger(__name__)


class TaskRunPagination(PageNumberPagination):
    """Custom pagination for task runs."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ScheduledTaskViewSet(viewsets.ModelViewSet):
    """ViewSet for managing scheduled tasks."""
    queryset = ScheduledTask.objects.all()
    serializer_class = ScheduledTaskSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def run_now(self, request, pk=None):
        """Run a specific task immediately."""
        try:
            task = self.get_object()
            executor = TaskExecutor()
            task_run = executor.execute_task(task)
            
            return Response({
                'message': f'Task "{task.name}" started successfully',
                'task_run_id': task_run.id,
                'status': 'started'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'Failed to run task {pk}: {str(e)}')
            return Response({
                'detail': f'Failed to run task: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def run_all_due(self, request):
        """Run all tasks that are due."""
        try:
            executor = TaskExecutor()
            now = timezone.now()
            
            due_tasks = ScheduledTask.objects.filter(
                is_enabled=True,
                next_run_at__lte=now
            )
            
            results = []
            for task in due_tasks:
                try:
                    task_run = executor.execute_task(task)
                    results.append({
                        'task_id': task.id,
                        'task_name': task.name,
                        'task_run_id': task_run.id,
                        'status': 'success'
                    })
                except Exception as e:
                    results.append({
                        'task_id': task.id,
                        'task_name': task.name,
                        'status': 'error',
                        'error': str(e)
                    })
            
            return Response({
                'message': f'Processed {len(results)} tasks',
                'results': results
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'Failed to run all due tasks: {str(e)}')
            return Response({
                'detail': f'Failed to run tasks: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaskRunViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing task runs."""
    queryset = TaskRun.objects.all().order_by('-started_at')
    serializer_class = TaskRunSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = TaskRunPagination
    
    def get_queryset(self):
        """Get task runs with optional filters."""
        queryset = TaskRun.objects.all().order_by('-started_at')
        
        # Filter by task_type if provided
        task_type = self.request.GET.get('task_type')
        if task_type:
            queryset = queryset.filter(task_type=task_type)
        
        # Filter by status if provided
        status_filter = self.request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def running(self, request):
        """Get all currently running tasks."""
        running_tasks = TaskRun.objects.filter(status=TaskRun.STATUS_RUNNING).order_by('-started_at')
        serializer = self.get_serializer(running_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent task runs (without pagination for quick view)."""
        limit = int(request.GET.get('limit', 10))
        recent_tasks = TaskRun.objects.all().order_by('-started_at')[:limit]
        serializer = self.get_serializer(recent_tasks, many=True)
        return Response(serializer.data)


class TaskStatusView(APIView):
    """API view for getting overall task system status."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Get task system status."""
        try:
            # Count tasks by status
            total_tasks = ScheduledTask.objects.count()
            enabled_tasks = ScheduledTask.objects.filter(is_enabled=True).count()
            disabled_tasks = total_tasks - enabled_tasks
            
            # Count running tasks
            running_tasks = TaskRun.objects.filter(is_running=True).count()
            
            # Get recent task runs
            recent_runs = TaskRun.objects.filter(
                started_at__gte=timezone.now() - timezone.timedelta(hours=24)
            ).count()
            
            # Get task types
            task_types = {}
            for task_type, _ in ScheduledTask.TASK_CHOICES:
                count = ScheduledTask.objects.filter(task_type=task_type).count()
                task_types[task_type] = count
            
            return Response({
                'total_tasks': total_tasks,
                'enabled_tasks': enabled_tasks,
                'disabled_tasks': disabled_tasks,
                'running_tasks': running_tasks,
                'recent_runs_24h': recent_runs,
                'task_types': task_types,
                'status': 'healthy'
            })
            
        except Exception as e:
            logger.error(f'Failed to get task status: {str(e)}')
            return Response({
                'status': 'error',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaskListViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing task list (task descriptions and info)."""
    queryset = TaskList.objects.filter(is_active=True)
    serializer_class = TaskListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Get all active tasks."""
        return TaskList.objects.filter(is_active=True).order_by('code')


class TaskAnalyticsView(APIView):
    """API view for task run analytics."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Get task analytics."""
        try:
            from django.db.models import Count, Avg, Sum, Q, F
            from django.db.models.functions import TruncDate
            from datetime import timedelta
            
            # Date range filter
            days = int(request.GET.get('days', 7))
            since = timezone.now() - timedelta(days=days)
            
            # Overall statistics
            total_runs = TaskRun.objects.filter(started_at__gte=since).count()
            completed_runs = TaskRun.objects.filter(status=TaskRun.STATUS_COMPLETED, started_at__gte=since).count()
            failed_runs = TaskRun.objects.filter(status=TaskRun.STATUS_FAILED, started_at__gte=since).count()
            running_now = TaskRun.objects.filter(status=TaskRun.STATUS_RUNNING).count()
            
            # Success rate
            success_rate = (completed_runs / total_runs * 100) if total_runs > 0 else 0
            
            # Average duration (only for completed tasks)
            avg_duration = TaskRun.objects.filter(
                status=TaskRun.STATUS_COMPLETED,
                started_at__gte=since,
                finished_at__isnull=False
            ).annotate(
                duration_seconds=(F('finished_at') - F('started_at'))
            ).aggregate(
                avg_duration=Avg('duration_seconds')
            )['avg_duration']
            
            if avg_duration:
                avg_duration = avg_duration.total_seconds()
            else:
                avg_duration = 0
            
            # Most frequent tasks
            most_frequent = list(TaskRun.objects.filter(
                started_at__gte=since
            ).values('task_type').annotate(
                run_count=Count('id')
            ).order_by('-run_count')[:5])
            
            # Fastest tasks (average duration by task type)
            fastest_tasks = list(TaskRun.objects.filter(
                status=TaskRun.STATUS_COMPLETED,
                started_at__gte=since,
                finished_at__isnull=False
            ).values('task_type').annotate(
                avg_duration_seconds=Avg(F('finished_at') - F('started_at')),
                run_count=Count('id')
            ).order_by('avg_duration_seconds')[:5])
            
            # Convert duration to seconds for fastest tasks
            for task in fastest_tasks:
                if task['avg_duration_seconds']:
                    task['avg_duration_seconds'] = task['avg_duration_seconds'].total_seconds()
            
            # Slowest tasks
            slowest_tasks = list(TaskRun.objects.filter(
                status=TaskRun.STATUS_COMPLETED,
                started_at__gte=since,
                finished_at__isnull=False
            ).values('task_type').annotate(
                avg_duration_seconds=Avg(F('finished_at') - F('started_at')),
                run_count=Count('id')
            ).order_by('-avg_duration_seconds')[:5])
            
            # Convert duration to seconds for slowest tasks
            for task in slowest_tasks:
                if task['avg_duration_seconds']:
                    task['avg_duration_seconds'] = task['avg_duration_seconds'].total_seconds()
            
            # Daily distribution
            daily_stats = list(TaskRun.objects.filter(
                started_at__gte=since
            ).annotate(
                date=TruncDate('started_at')
            ).values('date').annotate(
                total=Count('id'),
                completed=Count('id', filter=Q(status=TaskRun.STATUS_COMPLETED)),
                failed=Count('id', filter=Q(status=TaskRun.STATUS_FAILED))
            ).order_by('date'))
            
            # Task type distribution
            by_task_type = list(TaskRun.objects.filter(
                started_at__gte=since
            ).values('task_type').annotate(
                total=Count('id'),
                completed=Count('id', filter=Q(status=TaskRun.STATUS_COMPLETED)),
                failed=Count('id', filter=Q(status=TaskRun.STATUS_FAILED)),
                running=Count('id', filter=Q(status=TaskRun.STATUS_RUNNING))
            ).order_by('-total'))
            
            return Response({
                'overview': {
                    'total_runs': total_runs,
                    'completed_runs': completed_runs,
                    'failed_runs': failed_runs,
                    'running_now': running_now,
                    'success_rate': round(success_rate, 2),
                    'avg_duration_seconds': round(avg_duration, 2),
                },
                'most_frequent_tasks': most_frequent,
                'fastest_tasks': fastest_tasks,
                'slowest_tasks': slowest_tasks,
                'daily_stats': daily_stats,
                'by_task_type': by_task_type,
                'period_days': days,
            })
            
        except Exception as e:
            logger.error(f'Failed to get task analytics: {str(e)}')
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
