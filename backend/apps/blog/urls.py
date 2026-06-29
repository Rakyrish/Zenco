from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BlogPostViewSet, BlogCategoryViewSet, BlogTagViewSet,
    BlogPostAdminViewSet, TechnicalDocumentViewSet,
    TechnicalDocumentAdminViewSet, BlogGenerationLogViewSet,
)
from .datasheet_views import (
    ProductDataSheetPublicView,
    DatasheetViewTrackView,
    DatasheetSitemapView,
    ProductDataSheetAdminViewSet,
    admin_download_datasheet_pdf,
)

router = DefaultRouter()
router.register(r'categories', BlogCategoryViewSet, basename='blog-category')
router.register(r'tags', BlogTagViewSet, basename='blog-tag')
router.register(r'admin', BlogPostAdminViewSet, basename='blog-admin')
router.register(r'technical-docs/admin', TechnicalDocumentAdminViewSet, basename='techdoc-admin')
router.register(r'technical-docs', TechnicalDocumentViewSet, basename='techdoc')
router.register(r'generation-logs', BlogGenerationLogViewSet, basename='blog-genlog')
router.register(r'', BlogPostViewSet, basename='blog-post')

datasheet_router = DefaultRouter()
datasheet_router.register(r'admin', ProductDataSheetAdminViewSet, basename='datasheet-admin')

urlpatterns = [
    path('', include(router.urls)),
]

datasheet_urlpatterns = [
    path('', include(datasheet_router.urls)),
    path('sitemap/', DatasheetSitemapView.as_view(), name='datasheet-sitemap'),
    path('admin-tools/<int:datasheet_id>/download/', admin_download_datasheet_pdf, name='admin-download-datasheet'),
    path('<slug:product_slug>/view/', DatasheetViewTrackView.as_view(), name='datasheet-view-track'),
    path('<slug:product_slug>/', ProductDataSheetPublicView.as_view(), name='datasheet-detail'),
]
