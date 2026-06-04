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
from django.utils import timezone
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django_filters.rest_framework import DjangoFilterBackend

from apps.blog.models import BlogPost
from apps.inquiries.models import Inquiry
from apps.products.models import Category, Product
from apps.products.serializers import InventorySerializer
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
Analyze the product image or URL and return strict JSON with these keys:
product_name, seo_title, seo_meta_description, short_description,
long_description, technical_specifications, applications, benefits, features,
industries_served, faq_section, seo_keywords, opengraph_description,
schema_friendly_content, slug_suggestions, internal_linking_suggestions,
image_alt_text, safety_considerations, chemical_classification,
industrial_classification, product_type, usage, category_suggestions.

Write professional industrial-grade copy for chemical procurement buyers in Kenya and East Africa.
Mention Zenco Chemicals Ltd as the supplier more than five times across the generated content,
including natural phrasing such as "supplied by Zenco Chemicals Ltd" or
"Zenco Chemicals Ltd supplies". State that Zenco Chemicals Ltd supplies East Africa and
name the countries served: Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan,
Ethiopia, Somalia, and the Democratic Republic of the Congo.
Optimize for Google, Bing, featured snippets, AI search engines, ChatGPT Search,
Perplexity, and Gemini Search. Keep claims factual and avoid inventing exact
CAS numbers, purity values, certifications, or safety classifications unless
they are visible in the image or supplied in the context.
Additional context: {prompt}
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

def _build_system_prompt(products, categories, knowledge_texts) -> str:
    company_name = getattr(settings, 'COMPANY_NAME', 'Zenco Systems Ltd')
    company_email = getattr(settings, 'COMPANY_EMAIL', 'info@zenithcoltd.com')
    whatsapp = getattr(settings, 'COMPANY_WHATSAPP_NUMBER', '+254114591982')
    phone = getattr(settings, 'COMPANY_PHONE_NUMBER', '+254114591982')

    knowledge_section = ''
    if knowledge_texts:
        knowledge_section = '\n\n## Website Knowledge\n' + '\n---\n'.join(knowledge_texts[:4])

    product_lines = []
    for p in products[:60]:
        line = f"- {p['name']}"
        if p.get('category__name'):
            line += f" (Category: {p['category__name']})"
        if p.get('short_description'):
            line += f": {p['short_description'][:120]}"
        if p.get('availability'):
            line += f" [{p['availability'].replace('_', ' ')}]"
        product_lines.append(line)

    category_lines = [f"- {c['name']}: {c.get('description','')[:100]}" for c in categories]

    return f"""You are Zara, the professional AI sales and technical assistant for {company_name} — a trusted supplier of industrial chemicals in Kenya and East Africa.

## Your Personality
- Professional, warm, and knowledgeable — like a senior chemical sales engineer
- Concise but complete answers
- Conversion-focused: guide visitors toward quotes, WhatsApp contact, or product discovery
- Never hallucinate chemical CAS numbers, purity values, safety data, or certifications unless you are certain
- If uncertain about technical specs, say: "Our technical team can confirm the exact specifications for you."

## Company Information
- **Company**: {company_name}
- **Email**: {company_email}
- **Phone / WhatsApp**: {whatsapp}
- **Location**: Industrial Area, Enterprise Road, KCB Building, Nairobi, Kenya
- **Business Hours**: Mon–Fri 8:00 AM – 5:00 PM | Sat 9:00 AM – 1:00 PM (EAT)
- **Regions Served**: Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, Ethiopia, Somalia, DR Congo
- **Website**: https://zenithcoltd.com | https://zencosystems.co.ke

## Product Categories Available
{chr(10).join(category_lines) or 'Water treatment, Solvents, Cleaning, Paints & Coatings, Agricultural, Coolants, Pharmaceuticals'}

## Current Products (sample)
{chr(10).join(product_lines) or 'Extensive range of industrial chemicals available — ask for specifics.'}
{knowledge_section}

## Behaviour Rules
1. Greet new visitors warmly on the first message
2. Always recommend the most relevant products based on the visitor's industry or application
3. When a visitor asks about pricing, quantities, or delivery — offer to connect them with sales via WhatsApp
4. For quote requests, collect: company name, product needed, quantity, delivery location, and timeline
5. For technical questions you are unsure of, defer to the technical team
6. Keep replies under 200 words unless deep technical detail is explicitly needed
7. Use bullet points for product lists and specifications
8. Always end with a helpful call-to-action when appropriate

## WhatsApp Escalation
When suggesting WhatsApp contact, always include this exact link format:
https://wa.me/{whatsapp.replace('+', '').replace(' ', '')}?text=Hello%20Zenco%2C%20I%20need%20information%20about%20[PRODUCT]

Replace [PRODUCT] with the relevant product or inquiry topic."""


# ─── AI Chatbot endpoint ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def ai_chatbot(request):
    # ── Throttle check ────────────────────────────────────────────────────
    throttle = ChatbotThrottle()
    if not throttle.allow_request(request, None):
        wait = throttle.wait()
        return Response(
            {'reply': f'I am receiving too many messages right now. Please try again in {int(wait or 60)} seconds, or contact us on WhatsApp.', 'session_id': request.data.get('session_id', '')},
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

    # ── Fetch context ─────────────────────────────────────────────────────
    products = list(
        Product.objects.filter(is_active=True)
        .select_related('category')
        .values('name', 'short_description', 'availability', 'category__name')
        [:80]
    )
    categories = list(Category.objects.filter(is_active=True).values('name', 'description')[:20])
    knowledge_texts = list(
        KnowledgeCache.objects.filter(is_active=True)
        .order_by('page_label')
        .values_list('content', flat=True)
        [:5]
    )

    # ── Build conversation history (last 20 messages) ─────────────────────
    history = list(
        conversation.messages
        .order_by('timestamp')
        .exclude(content=message)   # exclude just-saved user msg
        .values('role', 'content')
        [max(0, conversation.message_count - 21):]  # keep last 20 prior
    )

    # ── Build OpenAI input ────────────────────────────────────────────────
    system_prompt = _build_system_prompt(products, categories, knowledge_texts)
    whatsapp_num = getattr(settings, 'COMPANY_WHATSAPP_NUMBER', '+254114591982').replace('+', '').replace(' ', '')

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
        reply_text = result.output_text
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error(f'OpenAI chatbot error: {exc}')
        reply_text = (
            f'I apologize, I am experiencing a technical issue right now. '
            f'Please contact us directly:\n\n'
            f'📱 WhatsApp: https://wa.me/{whatsapp_num}?text=Hello%20Zenco%2C%20I%20need%20assistance\n'
            f'📧 Email: {getattr(settings, "COMPANY_EMAIL", "info@zenithcoltd.com")}'
        )

    # ── WhatsApp escalation injection ─────────────────────────────────────
    escalation_link = None
    if has_escalation:
        product_param = (product_keyword or 'your product').replace(' ', '%20')
        escalation_link = f'https://wa.me/{whatsapp_num}?text=Hello%20Zenco%2C%20I%20need%20a%20quote%20for%20{product_param}'
        conversation.escalated_to_whatsapp = True

    # ── Save assistant reply + update conversation ────────────────────────
    ChatMessage.objects.create(conversation=conversation, role='assistant', content=reply_text)
    conversation.save(update_fields=['lead_intent', 'product_interest', 'escalated_to_whatsapp', 'last_message_at'])

    return Response({
        'session_id': conversation.session_id,
        'reply': reply_text,
        'escalation_link': escalation_link,
        'lead_intent': has_escalation,
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
