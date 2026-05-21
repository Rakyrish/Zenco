from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IndustryViewSet
router = DefaultRouter()
router.register(r'', IndustryViewSet, basename='industry')
urlpatterns = [path('', include(router.urls))]
