from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StatisticsView, ProjectsViewSet, CheckDetailViewSet, 
    SkladViewSet, CityViewSet, EkispiditorViewSet, CheckViewSet,FilialViewSet,
)
from .integration import UpdateChecksView

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'projects', ProjectsViewSet)
router.register(r'check-details', CheckDetailViewSet)
router.register(r'sklad', SkladViewSet)
router.register(r'city', CityViewSet)
router.register(r'filial', FilialViewSet)  # Registering FilialViewSet
router.register(r'ekispiditor', EkispiditorViewSet)
router.register(r'check', CheckViewSet)

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('update-checks/', UpdateChecksView.as_view(), name='update-checks'),
]
