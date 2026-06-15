import logging
from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import TruncMonth
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from .models import Inquiry
from .serializers import InquirySerializer, InquiryAdminSerializer
from services.resend_service import send_inquiry_notification, send_inquiry_autoreply

logger = logging.getLogger(__name__)


class InquiryThrottle(AnonRateThrottle):
    rate = '10/hour'
    scope = 'inquiry'


class InquiryFilter(django_filters.FilterSet):
    start_date = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    end_date = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    product_name = django_filters.CharFilter(lookup_expr='icontains')
    country = django_filters.CharFilter(lookup_expr='iexact')
    status = django_filters.CharFilter(lookup_expr='exact')
    inquiry_type = django_filters.CharFilter(lookup_expr='exact')

    class Meta:
        model = Inquiry
        fields = ['status', 'inquiry_type', 'product_name', 'country', 'start_date', 'end_date']


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
        client_ip = self._get_client_ip(request)

        # Honeypot spam protection
        if request.data.get('website_hp'):
            logger.warning(f"Spam submission blocked by honeypot field from IP: {client_ip}")
            # Silently succeed to confuse spam bots
            return Response(
                {"message": "Your inquiry has been received. We'll respond within 24 hours."},
                status=status.HTTP_201_CREATED,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Sanitize referrer — HTTP_REFERER can be a relative path or malformed URL
        raw_referrer = request.META.get('HTTP_REFERER', '')
        safe_referrer = raw_referrer[:500] if raw_referrer else ''

        # Capture metadata and save
        inquiry = serializer.save(
            ip_address=client_ip,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            referrer=safe_referrer,
        )

        # Send notifications — never let email errors surface as a 500
        try:
            send_inquiry_notification(inquiry)
            send_inquiry_autoreply(inquiry)
        except Exception as e:
            logger.error(f"Failed to send inquiry emails for {inquiry.ticket_number}: {e}", exc_info=True)
            # Do NOT re-raise — inquiry is already saved successfully

        logger.info(f"New inquiry {inquiry.ticket_number} received from {inquiry.email} [{inquiry.inquiry_type}]")

        return Response(
            {
                "message": "Your inquiry has been received. We'll respond within 24 hours.",
                "ticket_number": inquiry.ticket_number,
            },
            status=status.HTTP_201_CREATED,
        )

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class InquiryListView(generics.ListAPIView):
    """Admin-only inquiry list with advanced search and filtering."""
    queryset = Inquiry.objects.all().order_by('-created_at')
    serializer_class = InquiryAdminSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = InquiryFilter
    search_fields = ['name', 'email', 'company', 'message', 'ticket_number']


class InquiryAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin-only inquiry details page. Supports updates and deletion."""
    queryset = Inquiry.objects.all()
    serializer_class = InquiryAdminSerializer
    permission_classes = [IsAdminUser]


class InquiryReplyView(generics.GenericAPIView):
    """Admin-only endpoint to send direct email responses to customer inquiries using Resend."""
    permission_classes = [IsAdminUser]
    queryset = Inquiry.objects.all()

    def post(self, request, pk, *args, **kwargs):
        inquiry = self.get_object()
        reply_message = request.data.get('message')
        if not reply_message:
            return Response({"error": "Message body is required"}, status=status.HTTP_400_BAD_REQUEST)

        from services.resend_service import send_admin_reply_email
        success = send_admin_reply_email(inquiry, reply_message)
        if success:
            inquiry.status = 'replied'
            inquiry.replied_at = timezone.now()
            # Append response to admin notes for tracking
            timestamp_str = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
            inquiry.admin_notes = f"{inquiry.admin_notes}\n\n[Official Response Sent {timestamp_str}]:\n{reply_message}".strip()
            inquiry.save(update_fields=['status', 'replied_at', 'admin_notes'])

            return Response({
                "message": "Reply sent successfully",
                "status": inquiry.status,
                "replied_at": inquiry.replied_at,
                "admin_notes": inquiry.admin_notes,
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Failed to send email reply via Resend"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InquiryStatsView(APIView):
    """Admin-only statistics dashboard returning aggregated metrics for inquiries and analytics."""
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        today = timezone.now().date()
        
        total = Inquiry.objects.count()
        new_inq = Inquiry.objects.filter(status='new').count()
        replied = Inquiry.objects.filter(status='replied').count()
        quote_reqs = Inquiry.objects.filter(inquiry_type='quote').count()
        product_inq = Inquiry.objects.filter(inquiry_type='product').count()
        
        # Monthly trends for the current year
        trends_qs = Inquiry.objects.filter(
            created_at__year=today.year
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        monthly_trends = []
        for item in trends_qs:
            monthly_trends.append({
                "month": item['month'].strftime('%b'),
                "count": item['count']
            })

        # Fill months with 0 if no records
        all_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        current_month_idx = today.month - 1
        relevant_months = all_months[:current_month_idx + 1]
        
        trends_dict = {item['month']: item['count'] for item in monthly_trends}
        monthly_trends = [
            {"month": m, "count": trends_dict.get(m, 0)}
            for m in relevant_months
        ]
        
        # Analytics values
        converted = Inquiry.objects.filter(status__in=['replied', 'quotation_sent', 'closed']).count()
        conversion_rate = round((converted / total * 100), 1) if total else 0.0

        # Most requested products
        top_products = Inquiry.objects.exclude(product_name='').values('product_name').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        most_requested = [{"name": item['product_name'], "count": item['count']} for item in top_products]

        # Inquiry sources
        sources_qs = Inquiry.objects.exclude(source_page='').values('source_page').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        sources = [{"source": item['source_page'], "count": item['count']} for item in sources_qs]

        # Email delivery success rates
        delivery_success_rate = round(
            (Inquiry.objects.filter(notification_sent=True).count() / total * 100), 1
        ) if total else 0.0

        autoreply_success_rate = round(
            (Inquiry.objects.filter(autoreply_sent=True).count() / total * 100), 1
        ) if total else 0.0

        return Response({
            "total_inquiries": total,
            "new_inquiries": new_inq,
            "replied_inquiries": replied,
            "quote_requests": quote_reqs,
            "product_inquiries": product_inq,
            "monthly_trends": monthly_trends,
            "conversion_rate": conversion_rate,
            "most_requested_products": most_requested,
            "inquiry_sources": sources,
            "email_delivery_success_rate": delivery_success_rate,
            "autoreply_success_rate": autoreply_success_rate,
        })
