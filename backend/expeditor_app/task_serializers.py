"""
Serializers for task management.

Provides serializers for ScheduledTask and TaskRun models.
"""

from rest_framework import serializers
from expeditor_app.models import ScheduledTask, TaskRun


class ScheduledTaskSerializer(serializers.ModelSerializer):
    """Serializer for ScheduledTask model."""
    
    class Meta:
        model = ScheduledTask
        fields = [
            'id', 'name', 'task_type', 'is_enabled', 'interval_minutes',
            'last_run_at', 'next_run_at', 'params', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TaskRunSerializer(serializers.ModelSerializer):
    """Serializer for TaskRun model."""
    
    duration = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskRun
        fields = [
            'id', 'task_type', 'is_running', 'processed', 'total',
            'status_message', 'started_at', 'finished_at', 'duration', 'status_display'
        ]
        read_only_fields = ['started_at', 'finished_at']
    
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
    
    def get_status_display(self, obj):
        """Get human-readable status."""
        if obj.is_running:
            return 'Running'
        elif obj.finished_at:
            return 'Completed'
        else:
            return 'Unknown'
