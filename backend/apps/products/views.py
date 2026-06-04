from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import Category, Product
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductAdminSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True).prefetch_related('products')
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

    @method_decorator(cache_page(60 * 15))  # Cache 15 mins
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'availability', 'is_featured']
    search_fields = ['name', 'short_description', 'description', 'applications']
    ordering_fields = ['name', 'created_at', 'sort_order']
    ordering = ['sort_order', 'name']

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True
        ).select_related('category').order_by('sort_order', 'name')

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


class ProductAdminViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').order_by('-updated_at')
    serializer_class = ProductAdminSerializer
    permission_classes = [IsAdminUser]
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

    @action(detail=False, methods=['get'], url_path='category/(?P<category_slug>[^/.]+)')
    def by_category(self, request, category_slug=None):
        qs = self.get_queryset().filter(category__slug=category_slug)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)
