from django.urls import path
from .views import InquiryCreateView, InquiryListView, InquiryAdminDetailView

urlpatterns = [
    path('', InquiryCreateView.as_view(), name='inquiry-create'),
    path('admin/', InquiryListView.as_view(), name='inquiry-admin-list'),
    path('admin/<uuid:pk>/', InquiryAdminDetailView.as_view(), name='inquiry-admin-detail'),
]
