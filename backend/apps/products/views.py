from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Prefetch
from django.utils.text import slugify
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import Category, Product
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductAdminSerializer,
)


class CategoryPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    pagination_class = CategoryPagination

    def get_queryset(self):
        product_prefetch = Prefetch(
            'products',
            queryset=Product.objects.filter(
                is_active=True,
                is_deleted=False
            ).order_by('-created_at'),
            to_attr='prefetched_active_products'
        )
        return Category.objects.filter(
            is_active=True
        ).annotate(
            annotated_product_count=Count(
                'products',
                filter=Q(products__is_active=True, products__is_deleted=False)
            )
        ).prefetch_related(product_prefetch).order_by('name')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

    def create(self, request, *args, **kwargs):
        name = (request.data.get('name') or '').strip()
        slug = (request.data.get('slug') or '').strip() or slugify(name)
        existing = Category.objects.filter(Q(name__iexact=name) | Q(slug__iexact=slug)).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    @method_decorator(cache_page(60 * 15))  # Cache 15 mins
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='generate-content',
            permission_classes=[IsAdminUser])
    def generate_content(self, request, slug=None):
        """Generate long-form authority-page content for this category (sync)."""
        from .content_engine import generate_category_content, apply_category_content
        category = self.get_object()
        data, error = generate_category_content(category)
        if error:
            return Response({'message': error}, status=status.HTTP_502_BAD_GATEWAY)
        apply_category_content(category, data)
        serializer = self.get_serializer(category)
        return Response(serializer.data)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'availability', 'is_featured']
    search_fields = ['name', 'short_description', 'description', 'applications']
    ordering_fields = ['name', 'created_at', 'sort_order']
    ordering = ['sort_order', 'name']

    def get_queryset(self):
        qs = Product.objects.filter(
            is_active=True
        ).select_related('category', 'product_data_sheet').order_by('sort_order', 'name')
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    @method_decorator(cache_page(60 * 10))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        """Return featured products."""
        qs = self.get_queryset().filter(is_featured=True)[:8]
        serializer = ProductListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('q') or request.query_params.get('search') or ''
        qs = self.filter_queryset(self.get_queryset())
        if query:
            qs = qs.filter(name__icontains=query) | qs.filter(short_description__icontains=query)
        page = self.paginate_queryset(qs.distinct())
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(qs.distinct(), many=True, context={'request': request})
        return Response(serializer.data)


class ProductAdminPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ProductAdminViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').order_by('-updated_at')
    serializer_class = ProductAdminSerializer
    permission_classes = [IsAdminUser]
    pagination_class = ProductAdminPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'status', 'availability', 'is_featured']
    search_fields = ['name', 'short_description', 'description', 'sku']
    ordering_fields = ['name', 'created_at', 'updated_at', 'stock_quantity']

    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        product = self.get_object()
        image = request.FILES.get('image')
        if not image:
            return Response({'message': 'No image uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from apps.operations.views import _save_product_image
            media_url = _save_product_image(
                product,
                image.read(),
                image.name,
                image.content_type or 'image/jpeg',
            )
        except Exception:
            product.image = image
            product.save(update_fields=['image', 'updated_at'])
            media_url = product.image.url
        return Response({'image': request.build_absolute_uri(media_url) if media_url.startswith('/') else media_url})

    @action(detail=True, methods=['post'], url_path='import-image')
    def import_image(self, request, pk=None):
        product = self.get_object()
        image_url = request.data.get('image_url', '').strip()
        if not image_url:
            return Response({'message': 'Image URL is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from apps.operations.views import _read_remote_image, _save_product_image
            raw, content_type = _read_remote_image(image_url)
            media_url = _save_product_image(product, raw, f'{product.slug}.jpg', content_type)
            return Response({'image': request.build_absolute_uri(media_url) if media_url.startswith('/') else media_url})
        except Exception as exc:
            return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='regenerate-content')
    def regenerate_content(self, request, pk=None):
        """
        Regenerate this product's content in place (synchronous).
        URL slug, image, gallery, category, and SEO history are preserved —
        only content and metadata are updated.
        """
        from .content_engine import regenerate_product
        product = self.get_object()
        extra_context = str(request.data.get('context') or '')
        updated, error = regenerate_product(product, extra_context)
        if error:
            return Response({'message': error}, status=status.HTTP_502_BAD_GATEWAY)
        serializer = self.get_serializer(updated)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='bulk-regenerate')
    def bulk_regenerate(self, request):
        """
        Queue bulk content regeneration.
        Body: {"product_ids": ["..."]} for selected products, or {"all": true}
        for the entire active catalog. Returns a Celery task id for polling.
        """
        from .tasks import bulk_regenerate_content_task
        product_ids = request.data.get('product_ids') or None
        regenerate_all = bool(request.data.get('all'))
        if not product_ids and not regenerate_all:
            return Response(
                {'message': 'Provide product_ids or set "all": true.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        task = bulk_regenerate_content_task.delay(
            product_ids=None if regenerate_all else [str(pid) for pid in product_ids],
            triggered_by=getattr(request.user, 'username', 'admin'),
        )
        count = (
            Product.objects.filter(is_active=True, is_deleted=False).count()
            if regenerate_all else len(product_ids)
        )
        return Response({'status': 'queued', 'task_id': task.id, 'total': count})

    @action(detail=False, methods=['get'], url_path='bulk-regenerate-status')
    def bulk_regenerate_status(self, request):
        """Poll bulk regeneration progress. Query param: task_id."""
        from celery.result import AsyncResult
        task_id = request.query_params.get('task_id', '')
        if not task_id:
            return Response({'message': 'task_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        result = AsyncResult(task_id)
        payload = {'task_id': task_id, 'state': result.state}
        if result.state == 'PROGRESS':
            payload.update(result.info or {})
        elif result.state == 'SUCCESS':
            payload.update(result.result or {})
        elif result.state == 'FAILURE':
            payload['error'] = str(result.result)
        return Response(payload)

    @action(detail=False, methods=['get'], url_path='category/(?P<category_slug>[^/.]+)')
    def by_category(self, request, category_slug=None):
        qs = self.get_queryset().filter(category__slug=category_slug)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)
