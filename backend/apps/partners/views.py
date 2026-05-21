from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Partner
from .serializers import PartnerSerializer

class PartnerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Partner.objects.filter(is_active=True).order_by('sort_order')
    serializer_class = PartnerSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['partner_type']
