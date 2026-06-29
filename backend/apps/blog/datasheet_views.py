"""
ProductDataSheet API views — public viewer, admin CRUD, AI generation, PDF download.
"""
from django.db.models import F, Sum
from django.http import FileResponse, Http404, HttpResponse
from django.template.loader import render_to_string
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from apps.products.models import Product
from .models import ProductDataSheet, BlogPost, TechnicalDocument
from .serializers import (
    ProductDataSheetPublicSerializer,
    ProductDataSheetAdminSerializer,
    ProductDataSheetListSerializer,
)
from .datasheet_engine import generate_datasheet_for_product


class DatasheetAnonThrottle(AnonRateThrottle):
    rate = '5/min'


class DatasheetSitemapView(APIView):
    """GET /api/datasheets/sitemap/ — published datasheet slugs for Next.js sitemap."""
    permission_classes = [AllowAny]

    @method_decorator(cache_page(60 * 15))
    def get(self, request):
        rows = ProductDataSheet.objects.filter(
            status='published',
            is_public=True,
            product__is_active=True,
            product__is_deleted=False,
        ).values('product__slug', 'updated_at').order_by('product__slug')
        return Response([
            {'product_slug': row['product__slug'], 'updated_at': row['updated_at']}
            for row in rows
        ])


class ProductDataSheetPublicView(APIView):
    """GET /api/datasheets/<product_slug>/ — published datasheet for frontend viewer."""
    permission_classes = [AllowAny]

    @method_decorator(cache_page(60 * 60 * 2))
    def get(self, request, product_slug):
        try:
            sheet = ProductDataSheet.objects.select_related(
                'product', 'product__category'
            ).get(
                product__slug=product_slug,
                status='published',
                is_public=True,
                product__is_active=True,
                product__is_deleted=False,
            )
        except ProductDataSheet.DoesNotExist:
            raise Http404

        related_products = Product.objects.filter(
            category=sheet.product.category,
            is_active=True,
            is_deleted=False,
            status='published',
        ).exclude(pk=sheet.product.pk)[:4]

        related_blogs = BlogPost.objects.filter(
            status='published',
            is_deleted=False,
            related_products=sheet.product,
        ).order_by('-published_at')[:4]

        related_docs = TechnicalDocument.objects.filter(
            is_published=True,
            related_products=sheet.product,
        ).order_by('-created_at')[:4]

        serializer = ProductDataSheetPublicSerializer(
            sheet,
            context={
                'request': request,
                'related_products': related_products,
                'related_blogs': related_blogs,
                'related_docs': related_docs,
            },
        )
        return Response(serializer.data)


class DatasheetViewTrackView(APIView):
    """POST /api/datasheets/<product_slug>/view/ — increment view counter."""
    permission_classes = [AllowAny]
    throttle_classes = [DatasheetAnonThrottle]

    def post(self, request, product_slug):
        updated = ProductDataSheet.objects.filter(
            product__slug=product_slug,
            status='published',
            is_public=True,
        ).update(view_count=F('view_count') + 1)
        if not updated:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'status': 'ok'})


class ProductDataSheetAdminViewSet(viewsets.ModelViewSet):
    """Admin CRUD and AI operations for product datasheets."""
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'ai_generated']
    search_fields = ['title', 'product__name', 'product__slug', 'product__sku']
    ordering_fields = ['product__name', 'view_count', 'updated_at', 'created_at']
    ordering = ['-updated_at']

    def get_queryset(self):
        qs = ProductDataSheet.objects.select_related(
            'product', 'product__category'
        ).all()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(product__category__slug=category)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductDataSheetListSerializer
        return ProductDataSheetAdminSerializer

    @action(detail=False, methods=['get'], url_path='overview')
    def overview(self, request):
        total_products = Product.objects.filter(
            is_active=True, is_deleted=False
        ).count()
        sheets = ProductDataSheet.objects.all()
        published = sheets.filter(status='published').count()
        generated = sheets.count()
        without = Product.objects.filter(
            is_active=True,
            is_deleted=False,
            product_data_sheet__isnull=True,
        ).count()
        total_views = sheets.aggregate(total=Sum('view_count'))['total'] or 0
        total_tokens = sheets.aggregate(total=Sum('tokens_used'))['total'] or 0
        top_viewed = ProductDataSheetListSerializer(
            sheets.order_by('-view_count')[:10],
            many=True,
            context={'request': request},
        ).data

        products_without = Product.objects.filter(
            is_active=True,
            is_deleted=False,
            product_data_sheet__isnull=True,
        ).values('id', 'name', 'slug', 'sku')[:50]

        return Response({
            'total_products': total_products,
            'datasheets_generated': generated,
            'datasheets_published': published,
            'products_without_datasheet': without,
            'total_datasheet_views': total_views,
            'total_tokens_used': total_tokens,
            'estimated_tokens_per_datasheet': (
                round(total_tokens / generated) if generated else 3500
            ),
            'top_viewed': top_viewed,
            'products_without': list(products_without),
        })

    @action(detail=False, methods=['post'], url_path='generate-sync')
    def generate_sync(self, request):
        product_id = request.data.get('product_id')
        regenerate = bool(request.data.get('regenerate', False))
        if not product_id:
            return Response({'error': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not getattr(settings, 'OPENAI_API_KEY', None):
            return Response(
                {'error': 'OpenAI API key not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            product = Product.objects.select_related('category').get(
                pk=product_id, is_active=True, is_deleted=False
            )
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        sheet, error = generate_datasheet_for_product(
            product, regenerate=regenerate, triggered_by='admin'
        )
        if sheet:
            serializer = ProductDataSheetAdminSerializer(sheet, context={'request': request})
            return Response({'status': 'success', 'datasheet': serializer.data})
        return Response({'status': 'failed', 'error': error}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate_async(self, request):
        product_id = request.data.get('product_id')
        regenerate = bool(request.data.get('regenerate', False))
        if not product_id:
            return Response({'error': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        from apps.blog.tasks import generate_datasheet_on_demand
        result = generate_datasheet_on_demand.delay(
            str(product_id), regenerate=regenerate, triggered_by='admin'
        )
        return Response({
            'status': 'queued',
            'task_id': result.id,
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=False, methods=['post'], url_path='bulk-generate')
    def bulk_generate(self, request):
        if not getattr(settings, 'OPENAI_API_KEY', None):
            return Response(
                {'error': 'OpenAI API key not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        from apps.blog.tasks import generate_all_datasheets_task
        result = generate_all_datasheets_task.delay(triggered_by='admin')
        return Response({
            'status': 'queued',
            'task_id': result.id,
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=False, methods=['get'], url_path='bulk-status')
    def bulk_status(self, request):
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({'error': 'task_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        from celery.result import AsyncResult
        result = AsyncResult(task_id)
        payload = {'task_id': task_id, 'state': result.state}
        if result.state == 'PROGRESS' and result.info:
            payload.update(result.info)
        elif result.state == 'SUCCESS' and result.result:
            payload['result'] = result.result
        elif result.state == 'FAILURE':
            payload['error'] = str(result.result)
        return Response(payload)

    @action(detail=True, methods=['post'], url_path='regenerate')
    def regenerate(self, request, pk=None):
        sheet = self.get_object()
        if not getattr(settings, 'OPENAI_API_KEY', None):
            return Response(
                {'error': 'OpenAI API key not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        new_sheet, error = generate_datasheet_for_product(
            sheet.product, regenerate=True, triggered_by='admin'
        )
        if new_sheet:
            serializer = ProductDataSheetAdminSerializer(new_sheet, context={'request': request})
            return Response({'status': 'success', 'datasheet': serializer.data})
        return Response({'status': 'failed', 'error': error}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        sheet = self.get_object()
        sheet.status = 'published'
        sheet.is_public = True
        sheet.save(update_fields=['status', 'is_public', 'updated_at'])
        serializer = ProductDataSheetAdminSerializer(sheet, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='unpublish')
    def unpublish(self, request, pk=None):
        sheet = self.get_object()
        sheet.status = 'draft'
        sheet.save(update_fields=['status', 'updated_at'])
        serializer = ProductDataSheetAdminSerializer(sheet, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='download-pdf')
    def download_pdf(self, request, pk=None):
        sheet = self.get_object()
        return _render_datasheet_pdf_response(request, sheet)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_download_datasheet_pdf(request, datasheet_id):
    """Admin-only PDF download by datasheet ID."""
    try:
        sheet = ProductDataSheet.objects.select_related('product').get(pk=datasheet_id)
    except ProductDataSheet.DoesNotExist:
        raise Http404
    return _render_datasheet_pdf_response(request, sheet)


def _render_datasheet_pdf_response(request, sheet):
    html_content = render_to_string(
        'datasheets/pdf_template.html',
        {'datasheet': sheet, 'product': sheet.product},
    )
    try:
        from weasyprint import HTML
    except ImportError:
        return Response(
            {'error': 'PDF generation unavailable (weasyprint not installed).'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    pdf_bytes = HTML(
        string=html_content,
        base_url=request.build_absolute_uri('/'),
    ).write_pdf()

    filename = f"TDS_{sheet.product.name.replace(' ', '_')}_v{sheet.version}.pdf"
    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
