from django.urls import path
from .views import InquiryCreateView, InquiryListView

urlpatterns = [
    path('', InquiryCreateView.as_view(), name='inquiry-create'),
    path('admin/', InquiryListView.as_view(), name='inquiry-admin-list'),
]
