import base64
import hashlib
import json
import mimetypes
import re
import time
from datetime import timedelta
from urllib import request as urllib_request
from urllib.error import URLError

from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django_filters.rest_framework import DjangoFilterBackend

from apps.blog.models import BlogPost
from apps.industries.models import Industry
from apps.inquiries.models import Inquiry
from apps.products.models import Category, Product
from apps.products.serializers import InventorySerializer
from apps.services.models import Service
from .models import (
    ChatConversation, ChatMessage, WhatsAppClick, SeoPageMeta,
    SiteSetting, PerformanceSnapshot, GoogleSheetSyncState, KnowledgeCache,
)
from .serializers import (
    ChatConversationSerializer, WhatsAppClickSerializer, SeoPageMetaSerializer,
    SiteSettingSerializer, PerformanceSnapshotSerializer,
    GoogleSheetSyncStateSerializer,
)


def _empty_page(results):
    return {'count': len(results), 'next': None, 'previous': None, 'results': results}


class ChatbotThrottle(AnonRateThrottle):
    rate = '30/hour'
    scope = 'chatbot'


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


def _iso_or_none(value):
    return value.isoformat() if value else None


@api_view(['GET'])
@permission_classes([IsAdminUser])
def monitoring_overview(request):
    today = timezone.now().date()
    week_start = today - timedelta(days=6)
    month_start = today - timedelta(days=29)

    inquiries = Inquiry.objects.all()
    products = Product.objects.select_related('category').all()
    published_products = products.filter(is_active=True, status='published')
    blog_posts = BlogPost.objects.all()
    chats = ChatConversation.objects.all()
    whatsapp_clicks = WhatsAppClick.objects.all()

    products_with_cost = products.exclude(cost_per_unit__isnull=True)
    inventory_value = sum(
        float(product.cost_per_unit) * product.stock_quantity
        for product in products_with_cost
    ) if products_with_cost.exists() else None

    inquiry_type_rows = inquiries.values('inquiry_type').annotate(count=Count('id')).order_by('-count')
    country_rows = inquiries.exclude(country='').values('country').annotate(count=Count('id')).order_by('-count')[:8]
    product_interest_rows = inquiries.exclude(product_interest='').values('product_interest').annotate(count=Count('id')).order_by('-count')[:8]
    chatbot_question_rows = ChatMessage.objects.filter(role='user').values('content').annotate(count=Count('id')).order_by('-count')[:8]
    product_request_rows = chats.exclude(product_interest='').values('product_interest').annotate(count=Count('id')).order_by('-count')[:8]

    seo_pages_qs = SeoPageMeta.objects.all()
    product_seo_total = published_products.count()
    blog_seo_total = blog_posts.count()
    category_seo_total = Category.objects.filter(is_active=True).count()
    seo_issues = {
        'pages_missing_title': seo_pages_qs.filter(seo_title='').count(),
        'pages_missing_description': seo_pages_qs.filter(seo_description='').count(),
        'pages_missing_canonical': seo_pages_qs.filter(canonical_url='').count(),
        'products_missing_title': published_products.filter(seo_title='').count(),
        'products_missing_description': published_products.filter(seo_description='').count(),
        'products_missing_image_alt_source': published_products.filter(image='').count(),
        'blogs_missing_title': blog_posts.filter(seo_title='').count(),
        'blogs_missing_description': blog_posts.filter(seo_description='').count(),
        'categories_missing_title': Category.objects.filter(is_active=True, seo_title='').count(),
        'categories_missing_description': Category.objects.filter(is_active=True, seo_description='').count(),
    }
    seo_checks = (
        seo_pages_qs.count() * 3
        + product_seo_total * 3
        + blog_seo_total * 2
        + category_seo_total * 2
    )
    seo_issue_count = sum(seo_issues.values())
    seo_score = round(((seo_checks - seo_issue_count) / seo_checks) * 100) if seo_checks else None

    latest_snapshot = PerformanceSnapshot.objects.order_by('-created_at').first()
    latest_sync = GoogleSheetSyncState.objects.order_by('-updated_at').first()

    return Response({
        'generated_at': timezone.now().isoformat(),
        'data_sources': [
            'Product, category, blog, inquiry, chatbot, WhatsApp click, SEO metadata, performance snapshot, and Google Sheet sync database tables',
        ],
        'website_overview': {
            'total_website_visitors': None,
            'active_users_right_now': None,
            'visitors_today': None,
            'visitors_this_week': None,
            'visitors_this_month': None,
            'returning_visitors': None,
            'new_visitors': None,
            'average_session_duration': None,
            'bounce_rate': None,
            'top_landing_pages': [],
            'most_viewed_pages': [
                {'label': post.title, 'path': f'/blog/{post.slug}', 'value': post.views_count}
                for post in blog_posts.order_by('-views_count')[:8]
                if post.views_count
            ],
            'exit_pages': [],
            'user_flow_analysis': None,
        },
        'seo': {
            'score': seo_score,
            'page_score': seo_score,
            'product_score': round(((product_seo_total * 3 - seo_issues['products_missing_title'] - seo_issues['products_missing_description'] - seo_issues['products_missing_image_alt_source']) / (product_seo_total * 3)) * 100) if product_seo_total else None,
            'blog_score': round(((blog_seo_total * 2 - seo_issues['blogs_missing_title'] - seo_issues['blogs_missing_description']) / (blog_seo_total * 2)) * 100) if blog_seo_total else None,
            'category_score': round(((category_seo_total * 2 - seo_issues['categories_missing_title'] - seo_issues['categories_missing_description']) / (category_seo_total * 2)) * 100) if category_seo_total else None,
            'issues': seo_issues,
            'recommendations': [
                {'severity': 'warning', 'message': label.replace('_', ' ').title(), 'count': count}
                for label, count in seo_issues.items()
                if count > 0
            ],
            'robots_txt_health': None,
            'sitemap_coverage': None,
            'structured_data': None,
            'broken_links': None,
            'redirect_chains': None,
        },
        'performance': {
            'latest_snapshot_at': _iso_or_none(latest_snapshot.created_at) if latest_snapshot else None,
            'performance_score': latest_snapshot.performance_score if latest_snapshot else None,
            'accessibility_score': latest_snapshot.accessibility_score if latest_snapshot else None,
            'best_practices_score': latest_snapshot.best_practices_score if latest_snapshot else None,
            'seo_score': latest_snapshot.seo_score if latest_snapshot else None,
            'largest_contentful_paint': latest_snapshot.largest_contentful_paint if latest_snapshot else None,
            'first_contentful_paint': latest_snapshot.first_contentful_paint if latest_snapshot else None,
            'interaction_to_next_paint': latest_snapshot.interaction_to_next_paint if latest_snapshot else None,
            'cumulative_layout_shift': latest_snapshot.cumulative_layout_shift if latest_snapshot else None,
            'time_to_first_byte': latest_snapshot.server_response_time if latest_snapshot else None,
            'mobile_metrics': None,
            'desktop_metrics': None,
            'historical_trends': PerformanceSnapshotSerializer(PerformanceSnapshot.objects.order_by('-created_at')[:10], many=True).data,
        },
        'errors': {
            'error_count': None,
            'error_frequency': None,
            'affected_pages': [],
            'affected_apis': [],
            'affected_users': [],
            'resolution_status': None,
            'message': 'No Data Available',
        },
        'api_health': {
            'endpoints': [],
            'uptime_percentage': None,
            'message': 'No Data Available',
        },
        'inventory': {
            'total_inventory_value': inventory_value,
            'available_stock': products.aggregate(total=Sum('stock_quantity'))['total'],
            'out_of_stock_products': products.filter(stock_quantity=0).count(),
            'low_stock_products': products.filter(stock_quantity__lte=models_f('reorder_level')).count(),
            'negative_inventory': 0,
            'fast_moving_products': [],
            'slow_moving_products': [],
            'supplier_performance': [
                {'supplier': row['supplier_name'], 'product_count': row['count']}
                for row in products.exclude(supplier_name='').values('supplier_name').annotate(count=Count('id')).order_by('-count')[:8]
            ],
            'inventory_turnover_rate': None,
            'google_sheets_sync': {
                'status': latest_sync.last_status if latest_sync else None,
                'resource': latest_sync.resource if latest_sync else None,
                'sheet_name': latest_sync.sheet_name if latest_sync else None,
                'last_pull_at': _iso_or_none(latest_sync.last_pull_at) if latest_sync else None,
                'last_push_at': _iso_or_none(latest_sync.last_push_at) if latest_sync else None,
                'message': latest_sync.last_message if latest_sync else 'No Data Available',
            },
        },
        'crm': {
            'leads_generated': inquiries.count(),
            'quote_requests': inquiries.filter(inquiry_type='quote').count(),
            'contact_form_submissions': inquiries.count(),
            'product_inquiries': inquiries.filter(inquiry_type='product').count(),
            'whatsapp_clicks': whatsapp_clicks.count(),
            'phone_clicks': None,
            'email_clicks': None,
            'chatbot_conversations': chats.count(),
            'lead_sources': [
                {'label': row['inquiry_type'] or 'unknown', 'value': row['count']}
                for row in inquiry_type_rows
            ],
            'top_regions': [
                {'label': row['country'], 'value': row['count']}
                for row in country_rows
            ],
            'most_requested_chemicals': [
                {'label': row['product_interest'], 'value': row['count']}
                for row in product_interest_rows
            ],
        },
        'ai': {
            'total_requests': None,
            'requests_today': None,
            'tokens_consumed': None,
            'estimated_cost': None,
            'failed_requests': None,
            'average_response_time': None,
            'message': 'No Data Available',
        },
        'chatbot': {
            'conversations': chats.count(),
            'conversations_today': chats.filter(created_at__date=today).count(),
            'unresolved_conversations': chats.filter(is_resolved=False).count(),
            'most_asked_questions': [
                {'label': row['content'], 'value': row['count']}
                for row in chatbot_question_rows
            ],
            'failed_responses': None,
            'escalated_conversations': chats.filter(escalated_to_whatsapp=True).count(),
            'product_requests': [
                {'label': row['product_interest'], 'value': row['count']}
                for row in product_request_rows
            ],
            'customer_satisfaction_ratings': None,
        },
        'security': {
            'failed_login_attempts': None,
            'admin_login_activity': None,
            'suspicious_requests': None,
            'blocked_ips': None,
            'rate_limited_requests': None,
            'unauthorized_access_attempts': None,
            'message': 'No Data Available',
        },
        'business_intelligence': {
            'revenue_trends': None,
            'quote_trends': {
                'today': inquiries.filter(inquiry_type='quote', created_at__date=today).count(),
                'last_7_days': inquiries.filter(inquiry_type='quote', created_at__date__gte=week_start).count(),
                'last_30_days': inquiries.filter(inquiry_type='quote', created_at__date__gte=month_start).count(),
            },
            'lead_trends': {
                'today': inquiries.filter(created_at__date=today).count(),
                'last_7_days': inquiries.filter(created_at__date__gte=week_start).count(),
                'last_30_days': inquiries.filter(created_at__date__gte=month_start).count(),
            },
            'inventory_trends': None,
            'product_trends': None,
            'search_trends': None,
            'customer_trends': None,
        },
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


def _read_remote_image(image_url):
    req = urllib_request.Request(image_url, headers={'User-Agent': 'ZencoMediaImporter/1.0'})
    with urllib_request.urlopen(req, timeout=12) as response:
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            raise ValueError('The URL did not return an image.')
        return response.read(8 * 1024 * 1024), content_type


def _cloudinary_upload(raw_bytes, filename, content_type):
    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', '')
    api_key = getattr(settings, 'CLOUDINARY_API_KEY', '')
    api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', '')
    if not all([cloud_name, api_key, api_secret]):
        return None

    timestamp = str(int(time.time()))
    params = {
        'folder': getattr(settings, 'CLOUDINARY_PRODUCTS_FOLDER', 'zenco/products'),
        'timestamp': timestamp,
    }
    signature_base = '&'.join(f'{key}={params[key]}' for key in sorted(params))
    signature = hashlib.sha1(f'{signature_base}{api_secret}'.encode()).hexdigest()
    boundary = f'----ZencoCloudinary{timestamp}'

    fields = {
        **params,
        'api_key': api_key,
        'signature': signature,
    }
    body = bytearray()
    for key, value in fields.items():
        body.extend(f'--{boundary}\r\n'.encode())
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
    body.extend(f'--{boundary}\r\n'.encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.extend(f'Content-Type: {content_type}\r\n\r\n'.encode())
    body.extend(raw_bytes)
    body.extend(f'\r\n--{boundary}--\r\n'.encode())

    req = urllib_request.Request(
        f'https://api.cloudinary.com/v1_1/{cloud_name}/image/upload',
        data=bytes(body),
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST',
    )
    with urllib_request.urlopen(req, timeout=20) as response:
        payload = json.loads(response.read().decode())
        return payload.get('secure_url')


def _save_product_image(product, raw_bytes, filename, content_type):
    cloudinary_url = None
    try:
        cloudinary_url = _cloudinary_upload(raw_bytes, filename, content_type)
    except Exception:
        cloudinary_url = None
    if cloudinary_url:
        existing_gallery = product.gallery or []
        product.gallery = [cloudinary_url, *([product.image.url] if product.image else []), *existing_gallery]
        product.schema_data = {**(product.schema_data or {}), 'cloudinary_image_url': cloudinary_url}
        product.save(update_fields=['gallery', 'schema_data', 'updated_at'])
        return cloudinary_url

    product.image.save(filename, ContentFile(raw_bytes), save=True)
    return product.image.url


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ai_product_content(request):
    image_url = request.data.get('image_url')
    uploaded_image = request.FILES.get('image')
    prompt = request.data.get('prompt', 'Generate industrial product SEO content.')
    content = [{'type': 'input_text', 'text': f"""
You are a senior SEO content generation engine for an industrial chemical supplier operating across East Africa.

Your task is to generate COMPLETE SEO-OPTIMIZED PRODUCT DATA for industrial chemicals, detergent chemicals, cosmetic chemicals, food-grade chemicals, laboratory chemicals, mining chemicals, water treatment chemicals, and manufacturing raw materials.

## CRITICAL CHEMICAL ACCURACY REQUIREMENTS
- Identify the product accurately from the provided image or context.
- If product can be identified, generate REAL, ACCURATE chemical data - NOT placeholder text.
- Chemical Name, Chemical Formula, and CAS Number are MANDATORY for identifiable products - they must be exact and verifiable.
- Use your knowledge of industrial chemicals to provide accurate CAS numbers, formulas, and specifications.
- DO NOT use "Contact supplier for specification" for chemical name, formula, or CAS number when product is identifiable.
- All chemical data must be factually correct based on the actual chemical properties.
- Examples of CORRECT data: H2O2 (Hydrogen Peroxide), NaClO (Sodium Hypochlorite), CaCO3 (Calcium Carbonate).
- If you cannot confidently identify the product from image, state that explicitly rather than guessing.

OUTPUT MUST BE VALID JSON ONLY with exactly these fields:

{{
  "product_title": "",
  "short_product_description": "",
  "product_description": "",
  "meta_description": "",
  "seo_slug": "",
  "image_title": "",
  "image_alt_text": "",
  "focus_keyword": "",
  "product_tags": [],
  "common_names_synonyms": [],
  "features": [],
  "benefits": [],
  "technical_data_sheet": {{
    "Form": "",
    "pH": "",
    "Solubility": "",
    "Density": "",
    "Odor": "",
    "Storage": ""
  }},
  "seo_keywords": [],
  "internal_linking_suggestions": [],
  "faq_section": [
    {{"question": "", "answer": ""}}
  ],
  "product_attributes": {{
    "chemical_name": "",
    "cas_number": "",
    "formula": "",
    "appearance": "",
    "purity": "",
    "grade": "",
    "packaging": "",
    "applications": [],
    "industry_use": []
  }}
}}

## SEO TITLE RULES
- Use the exact product name and supplier region.
- Do NOT include the words "Industrial Grade" in product_title, product_name, name, seo_title, image_title, image_alt_text, or slug.
- Put grade only in product_attributes.grade and the visible specification table, never inside the product name.
- Always append: "in Kenya, Uganda, Tanzania and Rwanda"
- Example: "Hydrogen Peroxide Supplier in Kenya, Uganda, Tanzania and Rwanda"

## SHORT DESCRIPTION RULES
- Maximum 40 words.
- Commercially focused.
- Explain what the product is and its primary use.

## PRODUCT DESCRIPTION RULES
- Generate approximately 370 words.
- Explain: (1) What the product is. (2) Chemical identity. (3) Physical and chemical properties. (4) Major industrial applications. (5) Benefits. (6) Industries using the product. (7) Storage recommendations. (8) Handling recommendations. (9) Why customers choose our supply services.
- Keep sentences under 20 words.
- Use professional B2B language.
- Avoid keyword stuffing.
- Use natural SEO wording.
- At least 30% of sentences must start with transition words: Additionally, Furthermore, Moreover, Therefore, However, Also, In addition, Consequently, Meanwhile, As a result.
- Mention Kenya, Uganda, Tanzania and Rwanda at least 3 times throughout.
- Mention Zenco Systems Ltd as supplier at least 5 times.
- State that Zenco Systems Ltd supplies East Africa and name countries: Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, Ethiopia, Somalia, and the Democratic Republic of the Congo.
- The focus keyword must appear naturally in the first sentence and multiple times throughout.

## FEATURES RULES
- Generate 4-6 product features.
- Focus on technical, physical, and chemical characteristics.
- Examples: "Industrial-grade purity", "Non-corrosive formulation", "Fast-acting formula", "EPA compliant", "Temperature stable (-20°C to 60°C)"
- Each feature should be 1-2 sentences, under 15 words each.

## BENEFITS RULES
- Generate 4-6 product benefits.
- Focus on business/operational advantages for buyers.
- Examples: "Cost-effective bulk purchasing", "Reduces processing time by 40%", "Improves product shelf life", "Enhances cleaning efficiency", "Minimizes waste and environmental impact"
- Each benefit should be 1-2 sentences, under 15 words each.
- Explain HOW the product benefits the customer's business.

## TECHNICAL DATA SHEET RULES
- Generate a concise technical_data_sheet object for the frontend TDS table.
- Include only values that are broadly known or visible from the product context.
- Use "Contact supplier for specification" for uncertain values.
- Keep labels buyer-friendly, for example: Form, pH, Solubility, Density, Odor, Storage.

## SEO KEYWORDS RULES
- Generate 5-8 primary and secondary keywords.
- Include: product name, application keywords, geographic keywords, industry keywords.
- Examples: "industrial chemical supplier", "water treatment chemicals Kenya", "detergent raw materials", "chemical distributor East Africa", "bulk chemical supplier"

## FAQ SECTION RULES
- Generate 3-5 FAQ items.
- Focus on common buyer questions about quality, pricing, delivery, compatibility, safety.
- Each item must have: question (concise) and answer (1-2 sentences, under 25 words).
- Examples:
  - Q: "Is bulk discounting available?" A: "Yes, we offer tiered pricing for orders exceeding 500kg. Contact sales for custom quotes."
  - Q: "What is the minimum order quantity?" A: "Standard MOQ is 25kg for most products. Exceptions available for established suppliers."

## INTERNAL LINKING SUGGESTIONS RULES
- Generate 3-5 internal page suggestions based on product context.
- Format: page name or product category where this product should be linked.
- Examples: "/products/water-treatment", "/industries/manufacturing", "/products/category/detergent-chemicals", "/blog/chemical-sourcing-guide"
- Consider: related products, complementary categories, educational content about applications.
- Only suggest links that would naturally make sense for a buyer of this product.

## META DESCRIPTION RULES
- Maximum 160 characters.
- Include the focus keyword.
- Include the phrase: "in Kenya, Tanzania and Rwanda"
- Example: "Buy high-quality Hydrogen Peroxide for manufacturing and water treatment applications in Kenya, Tanzania and Rwanda."

## SLUG RULES
- Lowercase only.
- Use hyphens.
- No unnecessary words.
- Include product keyword.
- Include Kenya, Uganda and Tanzania.
- Example: hydrogen-peroxide-in-kenya-uganda-tanzania

## IMAGE TITLE RULES
- Use the product name naturally.

## IMAGE ALT TEXT RULES
- Describe the product clearly.
- Include product name and regional references.
- Do NOT include "Industrial Grade" in image alt text.
- Example: "Hydrogen Peroxide supplied in Kenya, Uganda, Tanzania and Rwanda"

## PRODUCT TAG RULES
- Generate extensive tags including:
  * Product name
  * Chemical family
  * Applications
  * Industries
  * Synonyms
  * Nairobi, Mombasa, Kisumu, Nakuru, Eldoret
  * Kenya, Uganda, Tanzania, Rwanda
  * East Africa
  * Industrial chemicals
  * Supply chain related terms

## COMMON NAMES / SYNONYMS RULES
- Include: Chemical names, Common names, Trade names, Industry names, Abbreviations
- Always generate at least 4 useful synonyms or common search names in common_names_synonyms.
- Include abbreviations where buyers commonly use them, for example "PCE" for perchloroethylene or "SXS" for sodium xylene sulfonate.

## PRODUCT ATTRIBUTE RULES
- ALWAYS generate real, accurate chemical data if the product can be identified from the image or context.
- DO NOT use "Contact supplier for specification" as a default fallback.
- Generate the following whenever identifiable:

### Chemical Name (IUPAC/Common)
- Provide the official IUPAC chemical name or widely recognized common name.
- Examples: "Hydrogen Peroxide", "Sodium Hypochlorite", "Calcium Carbonate", "Ferric Chloride"
- If product is identifiable, ALWAYS include the real chemical name.
- Even if exact purity/grade is unknown, the chemical identity must be accurate.

### Chemical Formula
- Provide the accurate molecular/chemical formula.
- Examples: "H₂O₂", "NaClO", "CaCO₃", "FeCl₃"
- Use proper chemical notation with subscripts where applicable.
- If product is identifiable, ALWAYS include the accurate formula.
- Never leave blank - formula is determinable from chemical identification.

### CAS Number
- Provide the real exact CAS Registry Number for identifiable single chemicals.
- Examples: Hydrogen Peroxide = "7722-84-1", Sodium Hydroxide = "1310-73-2", Acetone = "67-64-1".
- If the product is a mixture, proprietary formulation, or cannot be identified confidently, use "Mixture" or "Contact supplier for specification".

### Purity & Grade
 use: "Contact supplier for exact purity specification"

### Appearance
- Always describe physical appearance: color, state (liquid/solid/powder), clarity.
- Examples: "Colorless transparent liquid", "White crystalline powder", "Blue granular solid", "Pale yellow viscous liquid"
- This is always determinable - describe what would be visible of the product.

### Packaging & Applications
- Generate realistic packaging sizes commonly used in East Africa: 5L, 10L, 20L, 25kg, 50kg, 200L drums
- Generate real applications based on the chemical's known industrial uses.
- Examples for hydrogen peroxide: "Water disinfection", "Industrial cleaning", "Textile bleaching", "Food processing"

### Industry Uses
- List actual industries that use this chemical.
- Research-based on chemical properties and common applications.
- Examples: "Water treatment", "Food & beverage", "Pharmaceuticals", "Manufacturing", "Agriculture", "Mining", "Hospitality"

## ACCURACY REQUIREMENTS
- Chemical Name, Formula, and CAS Number MUST be real and accurate for identifiable single chemicals - this is non-negotiable.
- Use your knowledge of common industrial chemicals to provide correct specifications.
- If product cannot be identified from image, clearly state so rather than guess.
- For Purity/Grade: use "Contact supplier for specification" if the exact value is not visible.
- Only provide accurate generated values for Chemical Name, Formula, CAS Number, Appearance, and Packaging/Applications.

## SEO OBJECTIVE
- Content must be written to rank on Google, Bing, ChatGPT Search, Gemini Search, Perplexity, and AI-powered search engines.
- Content must sound like it was written by a professional industrial chemical supplier.
- Content must increase trust, conversions, and quotation requests.

## VALIDATION CHECKLIST
Before returning JSON, verify:
✓ Product is accurately identified from image/context
✓ Product title contains Kenya, Uganda, Tanzania and Rwanda
✓ Product title does not contain "Industrial Grade"
✓ Synonyms/common names are included in common_names_synonyms
✓ Description is approximately 370 words
✓ Sentences remain under 20 words
✓ 30% or more sentences start with transition words
✓ Focus keyword appears naturally in first sentence and multiple times
✓ Meta description contains "in Kenya, Tanzania and Rwanda"
✓ Slug is SEO friendly and includes Kenya, Uganda, Tanzania
✓ Tags are extensive and include regional/industry terms

### CHEMICAL DATA VALIDATION (CRITICAL)
✓ Chemical Name is REAL and ACCURATE (e.g., "Hydrogen Peroxide" not "Contact supplier")
✓ Chemical Formula is REAL and ACCURATE (e.g., "H₂O₂" not blank or placeholder)
✓ CAS Number is REAL and EXACT for identifiable single chemicals
✓ CAS Number is "Mixture" or "Contact supplier for specification" only for mixtures or uncertain products
✓ Purity/Grade is set to "Contact supplier for specification" when exact value is not visible
✓ Appearance is accurate description (e.g., "Colorless transparent liquid")
✓ Chemical Name and Formula are real - only these two are generated as real values
✓ If product cannot be identified, state "Unable to identify product from image" rather than guessing

### SEO & CONTENT VALIDATION
✓ Kenya, Uganda, Tanzania, Rwanda mentioned at least 3 times
✓ Zenco Systems Ltd mentioned at least 5 times as supplier
✓ Features generated (4-6 items)
✓ Benefits generated (4-6 items)
✓ SEO keywords generated (5-8 items)
✓ FAQ section generated (3-5 Q&A items)
✓ Internal linking suggestions generated (3-5 items)
✓ Output is valid JSON only

## CONTEXT FOR THIS PRODUCT
{prompt}

Analyze the product image or URL and generate the complete SEO-optimized JSON product data following ALL rules above.
Never return markdown. Never return explanations. Never return notes. Return only the valid JSON object.
"""}]
    if image_url:
        content.append({'type': 'input_image', 'image_url': image_url})
    elif uploaded_image:
        raw = uploaded_image.read()
        mime = uploaded_image.content_type or 'image/jpeg'
        b64 = base64.b64encode(raw).decode()
        content.append({'type': 'input_image', 'image_url': f'data:{mime};base64,{b64}'})
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
def import_product_image(request):
    image_url = request.data.get('image_url', '').strip()
    if not image_url:
        return Response({'message': 'Image URL is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        raw, content_type = _read_remote_image(image_url)
        ext = mimetypes.guess_extension(content_type.split(';')[0]) or '.jpg'
        product = Product.objects.create(
            category=Category.objects.filter(is_active=True).first(),
            name=f'Imported product {int(time.time())}',
            slug=f'imported-product-{int(time.time())}',
            short_description='AI-generated product draft pending review.',
            description='AI-generated product draft pending review.',
            status='draft',
        )
        media_url = _save_product_image(product, raw, f'{product.slug}{ext}', content_type)
        return Response({'product_id': str(product.id), 'image': request.build_absolute_uri(media_url) if media_url.startswith('/') else media_url})
    except (ValueError, URLError, TimeoutError) as exc:
        return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
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


# ─── Intent detection helpers ────────────────────────────────────────────────

_ESCALATION_KEYWORDS = re.compile(
    r'\b(quote|quotation|price|pricing|cost|bulk|order|purchase|buy|urgent|'
    r'delivery|minimum order|MOQ|ton|tonne|litre|liter|kg|kilogram|wholesale|'
    r'distributor|supplier|stock|availability|negotiate|deal|contract|tender)\b',
    re.IGNORECASE
)

_PRODUCT_KEYWORDS = re.compile(
    r'\b(water treatment|solvent|thinner|degreaser|caustic|acid|bleach|chlorine|'
    r'paint|coating|coolant|lubricant|disinfectant|detergent|boiler|chemical|'
    r'fertilizer|pesticide|fungicide|herbicide|preservative|pharmaceutical|cosmetic)\b',
    re.IGNORECASE
)


def _detect_intent(message: str) -> tuple[bool, str]:
    """Return (has_escalation_intent, matched_product_keyword)."""
    is_escalation = bool(_ESCALATION_KEYWORDS.search(message))
    product_match = _PRODUCT_KEYWORDS.search(message)
    product_keyword = product_match.group(0) if product_match else ''
    return is_escalation, product_keyword


# ─── Build system prompt ──────────────────────────────────────────────────────

def _clean_text(value: str, limit: int = 1200) -> str:
    text = re.sub(r'\s+', ' ', value or '').strip()
    return text[:limit]


def _json_list(value, limit: int = 6) -> str:
    if isinstance(value, list):
        return ', '.join(str(item) for item in value[:limit] if item)
    if isinstance(value, dict):
        return ', '.join(f'{key}: {val}' for key, val in list(value.items())[:limit] if val)
    return ''


def _media_url(field) -> str:
    try:
        return field.url if field else ''
    except Exception:
        return ''


def _company_address() -> str:
    parts = [
        getattr(settings, 'COMPANY_STREET_ADDRESS', ''),
        getattr(settings, 'COMPANY_CITY', ''),
        getattr(settings, 'COMPANY_COUNTRY', ''),
    ]
    return ', '.join(part for part in parts if part)


def _product_context_line(product: Product) -> str:
    category = product.category.name if product.category else 'Uncategorized'
    applications = _json_list(product.applications)
    specifications = _json_list(product.specifications)
    regions = _json_list(product.regions_available)
    stock_note = 'out of stock' if product.stock_quantity == 0 or product.availability == 'out_of_stock' else product.availability.replace('_', ' ')
    page_url = f'{getattr(settings, "SITE_URL", "").rstrip("/")}/products/{product.slug}' if getattr(settings, 'SITE_URL', '') else f'/products/{product.slug}'
    category_url = f'{getattr(settings, "SITE_URL", "").rstrip("/")}/products/category/{product.category.slug}' if getattr(settings, 'SITE_URL', '') and product.category else (f'/products/category/{product.category.slug}' if product.category else '/products')
    return _clean_text(
        f'Product: {product.name}\n'
        f'Category: {category}\n'
        f'Short description: {product.short_description}\n'
        f'Description: {product.description}\n'
        f'Applications: {applications or "Confirm with sales"}\n'
        f'Specifications: {specifications or "Confirm with technical team"}\n'
        f'Packaging: {product.packaging or "Confirm with sales"}\n'
        f'Availability: {stock_note}; stock quantity: {product.stock_quantity}; unit: {product.unit}\n'
        f'Regions: {regions or getattr(settings, "SERVICE_AREA", "")}\n'
        f'Product page: {page_url}\n'
        f'Category page: {category_url}',
        1800,
    )


def _search_local_products(message: str) -> list[Product]:
    words = [word for word in re.findall(r'[a-zA-Z0-9%+-]{3,}', message.lower()) if word not in {
        'please', 'price', 'quote', 'quotation', 'available', 'availability', 'need', 'want',
        'chemical', 'chemicals', 'product', 'products', 'supply', 'supplier',
    }]
    query = Q()
    for word in words[:8]:
        query |= Q(name__icontains=word)
        query |= Q(short_description__icontains=word)
        query |= Q(description__icontains=word)
        query |= Q(category__name__icontains=word)
        query |= Q(sku__icontains=word)
        query |= Q(packaging__icontains=word)

    if not query:
        query = Q(is_featured=True)

    exact_name = Product.objects.filter(is_active=True, status='published', name__iexact=message).first()
    products = list(
        Product.objects.filter(is_active=True, status='published')
        .filter(query)
        .select_related('category')
        .distinct()
        .order_by('-is_featured', 'sort_order', 'name')[:10]
    )
    if exact_name and exact_name not in products:
        products.insert(0, exact_name)
    return products


def _search_local_categories(message: str) -> list[Category]:
    words = [word for word in re.findall(r'[a-zA-Z0-9%+-]{3,}', message.lower())[:8]]
    query = Q()
    for word in words:
        query |= Q(name__icontains=word)
        query |= Q(description__icontains=word)
        query |= Q(slug__icontains=word)
    if not query:
        return list(Category.objects.filter(is_active=True).order_by('sort_order', 'name')[:8])
    return list(Category.objects.filter(is_active=True).filter(query).distinct().order_by('sort_order', 'name')[:8])


def _search_website_content(message: str) -> list[str]:
    words = [word for word in re.findall(r'[a-zA-Z0-9%+-]{4,}', message.lower())[:8]]
    knowledge_query = Q()
    blog_query = Q()
    service_query = Q()
    industry_query = Q()
    for word in words:
        knowledge_query |= Q(content__icontains=word)
        knowledge_query |= Q(page_label__icontains=word)
        blog_query |= Q(title__icontains=word)
        blog_query |= Q(excerpt__icontains=word)
        blog_query |= Q(content__icontains=word)
        service_query |= Q(name__icontains=word)
        service_query |= Q(tagline__icontains=word)
        service_query |= Q(description__icontains=word)
        service_query |= Q(short_description__icontains=word)
        industry_query |= Q(name__icontains=word)
        industry_query |= Q(tagline__icontains=word)
        industry_query |= Q(description__icontains=word)
        industry_query |= Q(short_description__icontains=word)

    snippets = []
    if knowledge_query:
        snippets.extend(
            f'{item.page_label}: {_clean_text(item.content, 900)}'
            for item in KnowledgeCache.objects.filter(is_active=True).filter(knowledge_query).order_by('page_label')[:4]
        )
        snippets.extend(
            f'Blog - {post.title}: {_clean_text(post.excerpt or post.content, 700)} /blog/{post.slug}'
            for post in BlogPost.objects.filter(is_published=True).filter(blog_query).order_by('-published_at', '-created_at')[:3]
        )
        snippets.extend(
            f'Service - {service.name}: {_clean_text(service.short_description or service.description, 700)} /services/{service.slug}'
            for service in Service.objects.filter(is_active=True).filter(service_query).order_by('sort_order', 'name')[:3]
        )
        snippets.extend(
            f'Industry - {industry.name}: {_clean_text(industry.short_description or industry.description, 700)} /industries/{industry.slug}'
            for industry in Industry.objects.filter(is_active=True).filter(industry_query).order_by('sort_order', 'name')[:3]
        )

    if not snippets:
        snippets.extend(
            f'{item.page_label}: {_clean_text(item.content, 900)}'
            for item in KnowledgeCache.objects.filter(is_active=True).order_by('page_label')[:3]
        )
    return snippets[:8]


def _fetch_zenith_reference(message: str) -> list[str]:
    base_url = getattr(settings, 'ZENITH_REFERENCE_URL', '').rstrip('/')
    if not base_url:
        return []
    candidates = [base_url, f'{base_url}/products', f'{base_url}/shop']
    contexts = []
    for url in candidates:
        try:
            req = urllib_request.Request(url, headers={'User-Agent': 'ZencoChatbot/1.0'})
            with urllib_request.urlopen(req, timeout=5) as response:
                html = response.read(250000).decode('utf-8', errors='ignore')
        except Exception:
            continue
        text = re.sub(r'<(script|style).*?</\1>', ' ', html, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = _clean_text(text, 2200)
        terms = [term for term in re.findall(r'[a-zA-Z0-9%+-]{4,}', message.lower())[:8]]
        if not terms or any(term in text.lower() for term in terms):
            contexts.append(f'Zenith reference ({url}): {text}')
        if len(contexts) >= 2:
            break
    return contexts


def _build_rag_context(message: str) -> dict:
    products = _search_local_products(message)
    categories = _search_local_categories(message)
    website_texts = _search_website_content(message)
    zenith_texts = [] if products else _fetch_zenith_reference(message)
    return {
        'products': products,
        'categories': categories,
        'website_texts': website_texts,
        'zenith_texts': zenith_texts,
        'has_local_product_match': bool(products),
    }


def _sanitize_chat_reply(text: str) -> str:
    """Keep customer-facing chat text free of raw links and contact details."""
    cleaned = re.sub(r'https?://\S+', '', text or '')
    cleaned = re.sub(r'www\.\S+', '', cleaned)
    cleaned = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', '', cleaned)
    cleaned = re.sub(r'(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)', '', cleaned)
    cleaned = re.sub(r'[ \t]+\n', '\n', cleaned)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    cleaned = re.sub(r'[ \t]{2,}', ' ', cleaned)
    return cleaned.strip()


def _product_payload(product: Product) -> dict:
    category = product.category.name if product.category else ''
    return {
        'id': str(product.id),
        'name': product.name,
        'slug': product.slug,
        'category': category,
        'category_slug': product.category.slug if product.category else '',
        'short_description': product.short_description,
        'image': _media_url(product.image),
        'availability': product.availability,
        'stock_quantity': product.stock_quantity,
        'packaging': product.packaging,
    }


def _chatbot_products_payload(rag_context: dict) -> list[dict]:
    return [_product_payload(product) for product in rag_context.get('products', [])[:3]]


def _chatbot_actions(rag_context: dict, has_escalation: bool) -> list[str]:
    products = rag_context.get('products', [])
    if not products:
        actions = ['request_product', 'whatsapp_sales', 'call_sales', 'email_sales']
    else:
        primary = products[0]
        out_of_stock = primary.stock_quantity == 0 or primary.availability == 'out_of_stock'
        actions = ['notify_me', 'request_quote', 'whatsapp_sales'] if out_of_stock else ['view_product', 'request_quote', 'whatsapp_sales']

    if has_escalation:
        for action in ['call_sales', 'email_sales']:
            if action not in actions:
                actions.append(action)
    return actions


def _build_system_prompt(rag_context) -> str:
    company_name = getattr(settings, 'COMPANY_NAME', 'Zenco Systems Ltd')
    company_email = getattr(settings, 'COMPANY_EMAIL', '')
    whatsapp = getattr(settings, 'COMPANY_WHATSAPP_NUMBER', '')
    phone = getattr(settings, 'COMPANY_PHONE_NUMBER', '')
    site_url = getattr(settings, 'SITE_URL', '').rstrip('/')
    service_area = getattr(settings, 'SERVICE_AREA', '')
    address = _company_address()

    products = rag_context.get('products', [])
    categories = rag_context.get('categories', [])
    website_texts = rag_context.get('website_texts', [])
    zenith_texts = rag_context.get('zenith_texts', [])

    product_section = '\n\n'.join(_product_context_line(product) for product in products[:10])
    category_section = '\n'.join(
        f'- {category.name}: {_clean_text(category.description, 240)} /products/category/{category.slug}'
        for category in categories[:8]
    )
    website_section = '\n---\n'.join(website_texts[:8])
    zenith_section = '\n---\n'.join(zenith_texts[:2])

    return f"""You are Zara, the professional industrial chemicals and safety products sales consultant for {company_name}.

## Your Personality
- Act as product advisor, sales representative, technical consultant, customer support agent, and lead generation assistant.
- Be professional, concise, helpful, business-oriented, and human-like.
- Avoid phrases such as "as an AI", "I am an AI assistant", and "I cannot".
- Never invent CAS numbers, purity, packaging, stock, safety data, certifications, or technical specifications.
- If exact technical detail is missing, say: "Our technical team can confirm the exact specifications for you."
- Do not write raw URLs, WhatsApp links, phone numbers, or email addresses in the message text. The interface will render contact buttons and product buttons separately.
- Include the countries names Kenya, Uganda, Tanzania and Rwanda in the response at least 3 times.
- Always mention that {company_name} supplies industrial chemicals to East Africa.
- Name all countries served: Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, Ethiopia, Somalia, and the Democratic Republic of the Congo.
- Mention {company_name} as the supplier at least 3 times per response where appropriate.
- In product references (names, slugs, alt text), include regional identifiers like "in Kenya, Uganda, Tanzania and Rwanda" where possible.

## Company Information
- **Company**: {company_name}
- **Email**: {company_email}
- **Phone**: {phone}
- **WhatsApp**: {whatsapp}
- **Location**: {address}
- **Business Hours**: {getattr(settings, 'COMPANY_OPENING_HOURS', '')}
- **Service Area**: {service_area}
- **Website**: {site_url}
- **Secondary Reference Website**: {getattr(settings, 'ZENITH_REFERENCE_URL', '')}

## Retrieval Priority
1. Current website database: products, categories, inventory fields, descriptions, specifications, applications, FAQs, packaging, and stock.
2. Published website content: homepage, product/category pages, blog, services, industries, cached FAQ/about/contact content.
3. Zenith reference website only when local database has no product match.

## Matching Local Products And Inventory
{product_section or 'No matching local product was found for the customer message.'}

## Matching Local Categories
{category_section or 'No directly matching category was found.'}

## Website Content Context
{website_section or 'No matching published website content was found.'}

## Zenith Reference Context
{zenith_section or 'No Zenith fallback context was used.'}

## Product Response Logic
- If a local product exists, answer with product name, short description, applications, packaging, availability status, product page link, relevant category link, and quote/WhatsApp CTA.
- Mention product and category names naturally, but do not include product page URLs. The interface will render product cards and buttons.
- When describing products, include regional context: "supplied in Kenya, Uganda, Tanzania and Rwanda" or "available across East Africa".
- If a local product exists but stock quantity is zero or availability is out_of_stock, say: "We recently exhausted our available stock of this product. Our next shipment is expected soon. Please contact our sales team for availability updates or to reserve upcoming stock." Do not say discontinued or permanently unavailable unless the data explicitly says so.
- If no local product is found but Zenith context contains a related product, explain that it is not currently listed in the local catalog and sales/procurement can assist. Do not claim stock unless local inventory says so.
- If no source contains the requested product, say: "That product is currently unavailable in our catalog. However, our procurement team may be able to source it for you. Kindly contact our sales team for assistance."
- For recommendation questions, search the context, recommend suitable available products, explain why, suggest alternatives, and link internally where possible.
- For pricing, quotation, bulk supply, delivery, or procurement intent, ask for company name, product, quantity, delivery location, and timeline.
- Keep replies under 220 words unless the customer requests deep technical detail.

## SEO Best Practices in Responses
- Use professional B2B language appropriate for industrial chemical procurement.
- Mention applications and industries naturally.
- Reference specific regions served: Kenya, Uganda, Tanzania, Rwanda, and East Africa.
- Highlight {company_name}'s expertise and regional presence.
- Include CTAs that drive quotations and consultations.

## WhatsApp Escalation
When suggesting contact, say the sales team can assist and rely on the interface buttons. Do not print WhatsApp URLs, phone numbers, or email addresses."""


# ─── AI Chatbot endpoint ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def ai_chatbot(request):
    # ── Throttle check ────────────────────────────────────────────────────
    throttle = ChatbotThrottle()
    if not throttle.allow_request(request, None):
        wait = throttle.wait()
        return Response(
            {
                'reply': f'I am receiving too many messages right now. Please try again in {int(wait or 60)} seconds, or use the sales contact options below.',
                'session_id': request.data.get('session_id', ''),
                'actions': ['whatsapp_sales', 'call_sales', 'email_sales'],
                'products': [],
                'escalation_link': None,
                'lead_intent': False,
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )

    session_id = request.data.get('session_id') or str(timezone.now().timestamp()).replace('.', '')
    message = request.data.get('message', '').strip()
    if not message:
        return Response({'reply': 'Please type a message to get started.', 'session_id': session_id})

    # ── Get or create conversation ────────────────────────────────────────
    conversation, _ = ChatConversation.objects.get_or_create(
        session_id=session_id,
        defaults={
            'user_identifier': request.data.get('user_identifier', ''),
            'source_page': request.data.get('source_page', ''),
        },
    )

    # ── Detect intent ─────────────────────────────────────────────────────
    has_escalation, product_keyword = _detect_intent(message)
    if has_escalation:
        conversation.lead_intent = True
    if product_keyword and not conversation.product_interest:
        conversation.product_interest = product_keyword

    # ── Save user message ─────────────────────────────────────────────────
    ChatMessage.objects.create(conversation=conversation, role='user', content=message)

    # ── Fetch RAG context in priority order ───────────────────────────────
    rag_context = _build_rag_context(message)

    # ── Build conversation history (last 20 messages) ─────────────────────
    history = list(
        conversation.messages
        .order_by('timestamp')
        .exclude(content=message)   # exclude just-saved user msg
        .values('role', 'content')
        [max(0, conversation.message_count - 21):]  # keep last 20 prior
    )

    # ── Build OpenAI input ────────────────────────────────────────────────
    system_prompt = _build_system_prompt(rag_context)
    whatsapp_num = re.sub(r'\D+', '', getattr(settings, 'COMPANY_WHATSAPP_NUMBER', ''))

    # Format history as turns for the Responses API
    input_messages = []
    for h in history:
        input_messages.append({'role': h['role'], 'content': h['content']})
    input_messages.append({'role': 'user', 'content': message})

    try:
        result = _openai_client().responses.create(
            model=getattr(settings, 'OPENAI_MODEL', 'gpt-4.1-mini'),
            instructions=system_prompt,
            input=input_messages,
        )
        reply_text = _sanitize_chat_reply(result.output_text)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error(f'OpenAI chatbot error: {exc}')
        reply_text = (
            'I am experiencing a technical issue right now. '
            'Please use the contact options below and our sales team will assist you.'
        )

    # ── WhatsApp escalation tracking ──────────────────────────────────────
    if has_escalation:
        conversation.escalated_to_whatsapp = True
    products_payload = _chatbot_products_payload(rag_context)
    actions = _chatbot_actions(rag_context, has_escalation)
    primary_product = products_payload[0] if products_payload else None

    # ── Save assistant reply + update conversation ────────────────────────
    ChatMessage.objects.create(conversation=conversation, role='assistant', content=reply_text)
    conversation.save(update_fields=['lead_intent', 'product_interest', 'escalated_to_whatsapp', 'last_message_at'])

    return Response({
        'session_id': conversation.session_id,
        'reply': reply_text,
        'escalation_link': None,
        'lead_intent': has_escalation,
        'actions': actions,
        'products': products_payload,
        'product_slug': primary_product['slug'] if primary_product else '',
        'product_id': primary_product['id'] if primary_product else '',
    })


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
