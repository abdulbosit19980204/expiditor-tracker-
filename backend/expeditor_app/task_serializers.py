"""
Serializers for task management.

Provides serializers for ScheduledTask and TaskRun models.
"""

from rest_framework import serializers
from expeditor_app.models import ScheduledTask, TaskRun, TaskList


class ScheduledTaskSerializer(serializers.ModelSerializer):
    """Serializer for ScheduledTask model."""
    
    estimated_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduledTask
        fields = [
            'id', 'name', 'task_type', 'is_enabled', 'interval_minutes',
            'last_run_at', 'next_run_at', 'params', 'created_at', 'updated_at',
            'estimated_duration'
        ]
        read_only_fields = ['created_at', 'updated_at', 'estimated_duration']
    
    def get_estimated_duration(self, obj):
        """
        Calculate estimated duration based on average of last 10 completed runs.
        Returns duration in seconds.
        """
        from django.db.models import Avg, F
        from django.db.models.functions import Cast
        from django.db.models import DurationField
        
        # Get last 10 completed runs for this task type
        recent_runs = TaskRun.objects.filter(
            task_type=obj.task_type,
            status=TaskRun.STATUS_COMPLETED,
            finished_at__isnull=False,
            started_at__isnull=False
        ).order_by('-started_at')[:10]
        
        # Calculate average duration
        if recent_runs.exists():
            total_seconds = 0
            count = 0
            for run in recent_runs:
                duration = run.finished_at - run.started_at
                total_seconds += duration.total_seconds()
                count += 1
            
            if count > 0:
                return round(total_seconds / count, 2)
        
        # Default estimates if no history
        defaults = {
            'UPDATE_CHECKS': 0.5,
            'SCAN_PROBLEMS': 1.0,
            'ANALYZE_PATTERNS': 5.0,
            'CLEANUP_OLD_DATA': 2.0,
        }
        return defaults.get(obj.task_type, 1.0)


class TaskRunSerializer(serializers.ModelSerializer):
    """Serializer for TaskRun model."""
    
    duration = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TaskRun
        fields = [
            'id', 'task_type', 'status', 'is_running', 'processed', 'total',
            'status_message', 'started_at', 'finished_at', 'duration', 'status_display'
        ]
        read_only_fields = ['started_at', 'finished_at', 'status_display']
    
    def get_duration(self, obj):
        """Calculate task duration."""
        if obj.finished_at and obj.started_at:
            duration = obj.finished_at - obj.started_at
            return duration.total_seconds()
        elif obj.started_at:
            from django.utils import timezone
            duration = timezone.now() - obj.started_at
            return duration.total_seconds()
        return None


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer for TaskList model."""
    
    class Meta:
        model = TaskList
        fields = [
            'id', 'code', 'name', 'description', 'default_params',
            'sample_result', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
