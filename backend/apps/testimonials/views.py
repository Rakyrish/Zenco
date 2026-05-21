from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Testimonial
from .serializers import TestimonialSerializer

class TestimonialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Testimonial.objects.filter(is_active=True, is_featured=True).order_by('sort_order')
    serializer_class = TestimonialSerializer
    permission_classes = [AllowAny]
