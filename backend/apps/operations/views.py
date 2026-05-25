from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.blog.models import BlogPost
from apps.inquiries.models import Inquiry
from apps.products.models import Product
from apps.products.serializers import InventorySerializer
from .models import (
    ChatConversation, ChatMessage, WhatsAppClick, SeoPageMeta,
    SiteSetting, PerformanceSnapshot, GoogleSheetSyncState,
)
from .serializers import (
    ChatConversationSerializer, WhatsAppClickSerializer, SeoPageMetaSerializer,
    SiteSettingSerializer, PerformanceSnapshotSerializer,
    GoogleSheetSyncStateSerializer,
)


def _empty_page(results):
    return {'count': len(results), 'next': None, 'previous': None, 'results': results}


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    today = timezone.now().date()
    return Response({
        'total_products': Product.objects.count(),
        'total_blog_posts': BlogPost.objects.count(),
        'total_inquiries': Inquiry.objects.count(),
        'total_quotes': Inquiry.objects.filter(inquiry_type='quote').count(),
        'total_chatbot_chats': ChatConversation.objects.count(),
        'low_stock_alerts': Product.objects.filter(stock_quantity__lte=models_f('reorder_level')).count(),
        'new_inquiries_today': Inquiry.objects.filter(created_at__date=today).count(),
        'resolved_today': Inquiry.objects.filter(updated_at__date=today, status__in=['replied', 'closed', 'resolved']).count(),
    })


def models_f(name):
    from django.db.models import F
    return F(name)


class InventoryListView(generics.ListAPIView):
    serializer_class = InventorySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'sku', 'supplier_name']

    def get_queryset(self):
        qs = Product.objects.select_related('category').order_by('name')
        if self.request.query_params.get('low_stock') == 'true':
            qs = qs.filter(stock_quantity__lte=models_f('reorder_level'))
        return qs


class InventoryDetailView(generics.RetrieveUpdateAPIView):
    queryset = Product.objects.select_related('category')
    serializer_class = InventorySerializer
    permission_classes = [IsAdminUser]


@api_view(['GET'])
@permission_classes([IsAdminUser])
def suppliers(request):
    names = Product.objects.exclude(supplier_name='').values_list('supplier_name', flat=True).distinct()
    return Response(_empty_page([
        {
            'id': name.lower().replace(' ', '-'),
            'name': name,
            'contact_name': '',
            'email': '',
            'phone': '',
            'address': '',
            'country': 'Kenya',
            'products_supplied': list(Product.objects.filter(supplier_name=name).values_list('name', flat=True)),
            'lead_time_days': 0,
            'is_active': True,
            'created_at': timezone.now().isoformat(),
        }
        for name in names
    ]))


@api_view(['GET'])
@permission_classes([IsAdminUser])
def analytics_overview(request):
    days = 90 if request.query_params.get('period') == '90d' else 7 if request.query_params.get('period') == '7d' else 30
    start = timezone.now().date() - timedelta(days=days - 1)
    traffic = [
        {'date': (start + timedelta(days=i)).isoformat(), 'visitors': 0, 'page_views': 0, 'new_users': 0}
        for i in range(days)
    ]
    return Response({
        'period': f'{days}d',
        'total_visitors': 0,
        'total_page_views': sum(BlogPost.objects.values_list('views_count', flat=True)),
        'bounce_rate': 0,
        'avg_session_duration': '0m 00s',
        'new_users': 0,
        'returning_users': 0,
        'traffic_by_day': traffic,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def top_products(request):
    return Response([
        {'id': str(p.id), 'title': p.name, 'slug': p.slug, 'views': 0, 'category': p.category.name if p.category else ''}
        for p in Product.objects.select_related('category').filter(is_active=True)[:10]
    ])


@api_view(['GET'])
@permission_classes([IsAdminUser])
def top_blog_posts(request):
    return Response([
        {'id': str(p.id), 'title': p.title, 'slug': p.slug, 'views': p.views_count, 'category': p.category.name if p.category else ''}
        for p in BlogPost.objects.select_related('category').order_by('-views_count')[:10]
    ])


@api_view(['GET'])
@permission_classes([IsAdminUser])
def conversions(request):
    inquiries = Inquiry.objects.count()
    quotes = Inquiry.objects.filter(inquiry_type='quote').count()
    whatsapp_clicks = WhatsAppClick.objects.count()
    return Response({
        'total_inquiries': inquiries,
        'total_quotes': quotes,
        'quote_conversion_rate': round((quotes / inquiries) * 100, 1) if inquiries else 0,
        'inquiry_to_quote_rate': round((quotes / inquiries) * 100, 1) if inquiries else 0,
        'avg_response_time_hours': 0,
        'whatsapp_clicks': whatsapp_clicks,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def seo_pages(request):
    defaults = [
        {'id': 'home', 'page_path': '/', 'page_label': 'Home'},
        {'id': 'products', 'page_path': '/products', 'page_label': 'Products'},
        {'id': 'blog', 'page_path': '/blog', 'page_label': 'Blog'},
        {'id': 'contact', 'page_path': '/contact', 'page_label': 'Contact'},
    ]
    for page in defaults:
        SeoPageMeta.objects.get_or_create(
            id=page['id'],
            defaults={
                **page,
                'seo_title': f"{page['page_label']} | Zenco Systems Ltd",
                'seo_description': 'Industrial chemical solutions for Kenya and East Africa.',
            },
        )
    return Response(SeoPageMetaSerializer(SeoPageMeta.objects.all(), many=True).data)


@api_view(['PATCH', 'GET'])
@permission_classes([IsAdminUser])
def seo_page_detail(request, pk):
    page = generics.get_object_or_404(SeoPageMeta, pk=pk)
    if request.method == 'GET':
        return Response(SeoPageMetaSerializer(page).data)
    serializer = SeoPageMetaSerializer(page, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def settings_list(request):
    defaults = [
        ('company_name', 'Company Name', settings.COMPANY_NAME, 'text', 'company'),
        ('company_email', 'Company Email', settings.COMPANY_EMAIL, 'email', 'company'),
        ('company_phone', 'Company Phone', settings.COMPANY_PHONE_NUMBER, 'text', 'company'),
        ('whatsapp_number', 'WhatsApp Number', settings.COMPANY_WHATSAPP_NUMBER, 'text', 'company'),
        ('maintenance_mode', 'Maintenance Mode', 'false', 'boolean', 'system'),
        ('sms_alerts', 'SMS Restock Notifications', 'false', 'boolean', 'system'),
    ]
    for key, label, value, type_, group in defaults:
        SiteSetting.objects.get_or_create(
            key=key,
            defaults={'label': label, 'value': value, 'type': type_, 'group': group},
        )
    return Response(SiteSettingSerializer(SiteSetting.objects.all(), many=True).data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def setting_detail(request, key):
    setting, _ = SiteSetting.objects.get_or_create(
        key=key,
        defaults={'label': key.replace('_', ' ').title(), 'type': 'text', 'group': 'general'},
    )
    serializer = SiteSettingSerializer(setting, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


class ChatbotConversationListView(generics.ListAPIView):
    serializer_class = ChatConversationSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['session_id', 'user_identifier', 'messages__content']

    def get_queryset(self):
        qs = ChatConversation.objects.prefetch_related('messages').order_by('-last_message_at')
        resolved = self.request.query_params.get('is_resolved')
        if resolved in ['true', 'false']:
            qs = qs.filter(is_resolved=resolved == 'true')
        return qs


@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_chatbot_conversation(request, pk):
    conversation = generics.get_object_or_404(ChatConversation, pk=pk)
    conversation.is_resolved = True
    conversation.save(update_fields=['is_resolved'])
    return Response(status=status.HTTP_204_NO_CONTENT)


def _openai_client():
    from openai import OpenAI
    return OpenAI(api_key=settings.OPENAI_API_KEY)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ai_product_content(request):
    image_url = request.data.get('image_url')
    prompt = request.data.get('prompt', 'Generate industrial product SEO content.')
    content = [{'type': 'input_text', 'text': f"""
Analyze the product image or URL and return strict JSON with these keys:
product_name, seo_title, seo_meta_description, short_description,
long_description, technical_specifications, applications, benefits, features,
industries_served, faq_section, seo_keywords, opengraph_description,
schema_friendly_content, slug_suggestions, internal_linking_suggestions,
image_alt_text.

Write professional industrial-grade copy for chemical procurement buyers in Kenya and East Africa.
Additional context: {prompt}
"""}]
    if image_url:
        content.append({'type': 'input_image', 'image_url': image_url})
    try:
        result = _openai_client().responses.create(
            model=settings.OPENAI_MODEL,
            input=[{'role': 'user', 'content': content}],
            text={'format': {'type': 'json_object'}},
        )
        return Response({'content': result.output_text})
    except Exception as exc:
        return Response({'message': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ai_seo_audit(request):
    try:
        result = _openai_client().responses.create(
            model=settings.OPENAI_MODEL,
            input=f"Audit this page for SEO and return actionable recommendations: {request.data}",
        )
        return Response({'recommendations': result.output_text})
    except Exception as exc:
        return Response({'message': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ai_website_health(request):
    try:
        result = _openai_client().responses.create(
            model=settings.OPENAI_MODEL,
            input=f"Review these website health metrics and recommend improvements: {request.data}",
        )
        return Response({'recommendations': result.output_text})
    except Exception as exc:
        return Response({'message': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['POST'])
@permission_classes([AllowAny])
def ai_chatbot(request):
    session_id = request.data.get('session_id') or str(timezone.now().timestamp()).replace('.', '')
    message = request.data.get('message', '').strip()
    if not message:
        return Response({'message': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)
    conversation, _ = ChatConversation.objects.get_or_create(
        session_id=session_id,
        defaults={
            'user_identifier': request.data.get('user_identifier', ''),
            'source_page': request.data.get('source_page', ''),
        },
    )
    ChatMessage.objects.create(conversation=conversation, role='user', content=message)
    products = list(Product.objects.filter(is_active=True).values('name', 'short_description', 'availability')[:50])
    try:
        result = _openai_client().responses.create(
            model=settings.OPENAI_MODEL,
            instructions='You are the Zenco Systems Ltd chemical product assistant. Recommend products, answer technical questions, and collect quote details for escalation to sales.',
            input=f"Company products: {products}\nVisitor message: {message}",
        )
        ChatMessage.objects.create(conversation=conversation, role='assistant', content=result.output_text)
        conversation.save(update_fields=['last_message_at'])
        return Response({'session_id': conversation.session_id, 'reply': result.output_text})
    except Exception as exc:
        return Response({'message': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['POST'])
@permission_classes([AllowAny])
def whatsapp_click(request):
    serializer = WhatsAppClickSerializer(data={
        **request.data,
        'ip_address': _get_client_ip(request),
        'user_agent': request.META.get('HTTP_USER_AGENT', '')[:1000],
    })
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'message': 'Tracked'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def whatsapp_analytics(request):
    days = 30
    start = timezone.now().date() - timedelta(days=days - 1)
    return Response({
        'total_clicks': WhatsAppClick.objects.count(),
        'clicks_by_day': [
            {
                'date': (start + timedelta(days=i)).isoformat(),
                'clicks': WhatsAppClick.objects.filter(created_at__date=start + timedelta(days=i)).count(),
            }
            for i in range(days)
        ],
    })


class PerformanceSnapshotListView(generics.ListCreateAPIView):
    queryset = PerformanceSnapshot.objects.all()
    serializer_class = PerformanceSnapshotSerializer
    permission_classes = [IsAdminUser]


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def google_sheets_sync(request):
    if request.method == 'GET':
        return Response(GoogleSheetSyncStateSerializer(GoogleSheetSyncState.objects.all(), many=True).data)

    resource = request.data.get('resource', 'products')
    sheet_name = request.data.get('sheet_name', resource)
    sync, _ = GoogleSheetSyncState.objects.get_or_create(
        resource=resource,
        sheet_name=sheet_name,
        defaults={'spreadsheet_id': request.data.get('spreadsheet_id', '')},
    )
    direction = request.data.get('direction', 'push')
    if direction == 'pull':
        sync.last_pull_at = timezone.now()
    else:
        sync.last_push_at = timezone.now()
    sync.last_status = 'ready'
    sync.last_message = 'Google Sheets credentials and mapping endpoint are configured. Add service-account credentials to execute live transfer.'
    sync.save()
    return Response(GoogleSheetSyncStateSerializer(sync).data)


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
