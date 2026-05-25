"""
Zenco Systems Ltd – Chemical Division
Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"status": "ok", "service": "Zenco Systems API"})


urlpatterns = [
    # Admin
    path('django-admin/', admin.site.urls),

    # Health Check
    path('api/health/', health_check, name='health_check'),

    # API Routes
    path('api/products/', include('apps.products.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/industries/', include('apps.industries.urls')),
    path('api/inquiries/', include('apps.inquiries.urls')),
    path('api/blog/', include('apps.blog.urls')),
    path('api/testimonials/', include('apps.testimonials.urls')),
    path('api/partners/', include('apps.partners.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/', include('apps.operations.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Admin customization
admin.site.site_header = "Zenco Systems Ltd – Admin"
admin.site.site_title = "Zenco Admin Portal"
admin.site.index_title = "Chemical Division Management"
