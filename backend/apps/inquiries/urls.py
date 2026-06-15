from django.urls import path
from .views import (
    InquiryCreateView, InquiryListView, InquiryAdminDetailView,
    InquiryStatsView, InquiryReplyView
)

urlpatterns = [
    path('', InquiryCreateView.as_view(), name='inquiry-create'),
    path('admin/', InquiryListView.as_view(), name='inquiry-admin-list'),
    path('admin/stats/', InquiryStatsView.as_view(), name='inquiry-admin-stats'),
    path('admin/<uuid:pk>/', InquiryAdminDetailView.as_view(), name='inquiry-admin-detail'),
    path('admin/<uuid:pk>/reply/', InquiryReplyView.as_view(), name='inquiry-admin-reply'),
]
