import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.throttling import AnonRateThrottle
from .models import Inquiry
from .serializers import InquirySerializer, InquiryAdminSerializer
from services.resend_service import send_inquiry_notification, send_inquiry_autoreply

logger = logging.getLogger(__name__)


class InquiryThrottle(AnonRateThrottle):
    rate = '10/hour'
    scope = 'inquiry'


class InquiryCreateView(generics.CreateAPIView):
    """
    POST /api/inquiries/ — Public endpoint to submit a contact/product inquiry.
    Rate limited to 10/hour per IP to prevent spam.
    """
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer
    permission_classes = [AllowAny]
    throttle_classes = [InquiryThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Capture metadata
        inquiry = serializer.save(
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            referrer=request.META.get('HTTP_REFERER', '')[:500],
        )

        # Send notifications asynchronously
        try:
            send_inquiry_notification(inquiry)
            send_inquiry_autoreply(inquiry)
        except Exception as e:
            logger.error(f"Failed to send inquiry emails for {inquiry.id}: {e}")

        logger.info(f"New inquiry received from {inquiry.email} [{inquiry.inquiry_type}]")

        return Response(
            {"message": "Your inquiry has been received. We'll respond within 24 hours."},
            status=status.HTTP_201_CREATED,
        )

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class InquiryListView(generics.ListAPIView):
    """Admin-only inquiry list with filtering."""
    queryset = Inquiry.objects.all().order_by('-created_at')
    serializer_class = InquiryAdminSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['status', 'inquiry_type']
    search_fields = ['full_name', 'email', 'company', 'message']


class InquiryAdminDetailView(generics.RetrieveUpdateAPIView):
    queryset = Inquiry.objects.all()
    serializer_class = InquiryAdminSerializer
    permission_classes = [IsAdminUser]
