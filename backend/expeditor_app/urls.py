from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StatisticsView, GlobalStatisticsView, ProjectsViewSet, CheckDetailViewSet, 
    SkladViewSet, CityViewSet, EkispiditorViewSet, CheckViewSet, FilialViewSet,
    AnalyticsSummaryView, TelegramTargetView, CheckAnalyticsViewSet, CheckAnalyticsAPIView,
    ViolationAnalyticsDashboardView, ViolationDetailView, ViolationChecksListView,
)
from .task_views import ScheduledTaskViewSet, TaskRunViewSet, TaskStatusView, TaskListViewSet, TaskAnalyticsView
from .yandex_token_views import YandexTokenViewSet, YandexTokenStatusView
from .auth_views import register_user, login_user, logout_user, get_user_profile, check_auth_status
from .integration import UpdateChecksView
from .violation_insights_views import ViolationInsightsView, SameLocationViolationsView
from .user_analytics_views import UserAnalyticsView, LiveUserDataView, UserSessionListView
from .manager_report_views import ManagerReportView, ManagerReportPDFView, ManagerReportEmailView

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
router.register(r'task-list', TaskListViewSet, basename='task-list')
router.register(r'yandex-tokens', YandexTokenViewSet, basename='yandex-tokens')

# The API URLs are now determined automatically by the router.
# IMPORTANT: Specific paths must come BEFORE router.urls to avoid conflicts
urlpatterns = [
    # Specific analytics endpoints (must be before router.urls)
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('analytics/violation-dashboard/', ViolationAnalyticsDashboardView.as_view(), name='violation-dashboard'),
    path('analytics/violation-detail/', ViolationDetailView.as_view(), name='violation-detail'),
    path('analytics/violation-checks/', ViolationChecksListView.as_view(), name='violation-checks'),
    path('analytics/violation-insights/', ViolationInsightsView.as_view(), name='violation-insights'),
    path('analytics/same-location-violations/', SameLocationViolationsView.as_view(), name='same-location-violations'),
    path('analytics-simple/', CheckAnalyticsAPIView.as_view(), name='analytics-simple'),
    
    # Statistics endpoints
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('statistics/global/', GlobalStatisticsView.as_view(), name='statistics-global'),
    
    # Manager Report endpoints
    path('manager-report/', ManagerReportView.as_view(), name='manager-report'),
    path('manager-report/pdf/', ManagerReportPDFView.as_view(), name='manager-report-pdf'),
    path('manager-report/email/', ManagerReportEmailView.as_view(), name='manager-report-email'),
    
    # Other specific endpoints
    path('telegram/target/', TelegramTargetView.as_view(), name='telegram-target'),
    path('update-checks/', UpdateChecksView.as_view(), name='update-checks'),
    path('task-status/', TaskStatusView.as_view(), name='task-status'),
    path('task-analytics/', TaskAnalyticsView.as_view(), name='task-analytics'),
    path('yandex-token-status/', YandexTokenStatusView.as_view(), name='yandex-token-status'),
    
    # Authentication endpoints
    path('auth/register/', register_user, name='register'),
    path('auth/login/', login_user, name='login'),
    path('auth/logout/', logout_user, name='logout'),
    path('auth/profile/', get_user_profile, name='profile'),
    path('auth/status/', check_auth_status, name='auth-status'),
    
    # User Analytics endpoints (Super User only)
    path('admin/user-analytics/', UserAnalyticsView.as_view(), name='user-analytics'),
    path('admin/user-analytics/live/', LiveUserDataView.as_view(), name='live-user-data'),
    path('admin/user-sessions/', UserSessionListView.as_view(), name='user-sessions'),
    
    # Router URLs (must be LAST to avoid conflicts with specific paths)
    path('', include(router.urls)),
]
