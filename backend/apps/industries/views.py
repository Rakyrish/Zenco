from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import Industry
from .serializers import IndustrySerializer

class IndustryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Industry.objects.filter(is_active=True).order_by('sort_order')
    serializer_class = IndustrySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    @method_decorator(cache_page(60 * 30))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
