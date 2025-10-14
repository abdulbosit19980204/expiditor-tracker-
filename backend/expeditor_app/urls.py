from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StatisticsView, GlobalStatisticsView, ProjectsViewSet, CheckDetailViewSet, 
    SkladViewSet, CityViewSet, EkispiditorViewSet, CheckViewSet, FilialViewSet,
)
from .integration import UpdateChecksView
from .analytics_views import (
    DailySalesSummaryView, ExpeditorPerformanceView, PaymentDistributionView,
    ProjectStatisticsView, StatusDistributionView, LocationStatisticsView,
    RevenueSummaryView, HourlyDistributionView
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'projects', ProjectsViewSet)
router.register(r'check-details', CheckDetailViewSet)
router.register(r'sklad', SkladViewSet)
router.register(r'city', CityViewSet)
router.register(r'filial', FilialViewSet)  # Registering FilialViewSet
router.register(r'ekispiditor', EkispiditorViewSet, basename='ekispiditor')
router.register(r'check', CheckViewSet, basename='check')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('statistics/global/', GlobalStatisticsView.as_view(), name='statistics-global'),
    path('update-checks/', UpdateChecksView.as_view(), name='update-checks'),
    
    # Analytics API endpoints
    path('statistics/daily-sales/', DailySalesSummaryView.as_view(), name='daily-sales'),
    path('statistics/expeditor-performance/', ExpeditorPerformanceView.as_view(), name='expeditor-performance'),
    path('statistics/payment-distribution/', PaymentDistributionView.as_view(), name='payment-distribution'),
    path('statistics/project-statistics/', ProjectStatisticsView.as_view(), name='project-statistics'),
    path('statistics/status-distribution/', StatusDistributionView.as_view(), name='status-distribution'),
    path('statistics/location-statistics/', LocationStatisticsView.as_view(), name='location-statistics'),
    path('statistics/revenue-summary/', RevenueSummaryView.as_view(), name='revenue-summary'),
    path('statistics/hourly-distribution/', HourlyDistributionView.as_view(), name='hourly-distribution'),
]
