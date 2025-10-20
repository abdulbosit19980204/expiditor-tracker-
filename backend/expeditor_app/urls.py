from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StatisticsView, GlobalStatisticsView, ProjectsViewSet, CheckDetailViewSet, 
    SkladViewSet, CityViewSet, EkispiditorViewSet, CheckViewSet, FilialViewSet,
    AnalyticsSummaryView, TelegramTargetView, CheckAnalyticsViewSet, CheckAnalyticsAPIView,
)
from .task_views import ScheduledTaskViewSet, TaskRunViewSet, TaskStatusView
from .integration import UpdateChecksView

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'projects', ProjectsViewSet)
router.register(r'check-details', CheckDetailViewSet)
router.register(r'sklad', SkladViewSet)
router.register(r'city', CityViewSet)
router.register(r'filial', FilialViewSet)  # Registering FilialViewSet
router.register(r'ekispiditor', EkispiditorViewSet, basename='ekispiditor')
router.register(r'check', CheckViewSet, basename='check')
router.register(r'analytics', CheckAnalyticsViewSet, basename='analytics')
router.register(r'tasks', ScheduledTaskViewSet, basename='tasks')
router.register(r'task-runs', TaskRunViewSet, basename='task-runs')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('statistics/global/', GlobalStatisticsView.as_view(), name='statistics-global'),
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('analytics-simple/', CheckAnalyticsAPIView.as_view(), name='analytics-simple'),
    path('telegram/target/', TelegramTargetView.as_view(), name='telegram-target'),
    path('update-checks/', UpdateChecksView.as_view(), name='update-checks'),
    path('task-status/', TaskStatusView.as_view(), name='task-status'),
]
