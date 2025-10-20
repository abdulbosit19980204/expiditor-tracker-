"""
API endpoints for task management.

Provides REST API endpoints for managing scheduled tasks and viewing task runs.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from expeditor_app.models import ScheduledTask, TaskRun
from expeditor_app.task_serializers import ScheduledTaskSerializer, TaskRunSerializer
from expeditor_app.task_executor import TaskExecutor
import logging

logger = logging.getLogger(__name__)


class ScheduledTaskViewSet(viewsets.ModelViewSet):
    """ViewSet for managing scheduled tasks."""
    queryset = ScheduledTask.objects.all()
    serializer_class = ScheduledTaskSerializer
    
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
    
    @action(detail=False, methods=['get'])
    def running(self, request):
        """Get all currently running tasks."""
        running_tasks = self.queryset.filter(is_running=True)
        serializer = self.get_serializer(running_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent task runs."""
        limit = int(request.GET.get('limit', 10))
        recent_tasks = self.queryset[:limit]
        serializer = self.get_serializer(recent_tasks, many=True)
        return Response(serializer.data)


class TaskStatusView(APIView):
    """API view for getting overall task system status."""
    
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
