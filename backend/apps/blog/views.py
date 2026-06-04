from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import BlogPost, BlogCategory
from .serializers import (
    BlogPostListSerializer, BlogPostDetailSerializer, BlogCategorySerializer,
    BlogPostAdminSerializer,
)


class BlogCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class BlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'is_featured']
    search_fields = ['title', 'excerpt', 'content', 'tags']
    ordering_fields = ['published_at', 'views_count']
    ordering = ['-published_at']

    def get_queryset(self):
        return BlogPost.objects.filter(
            is_published=True
        ).select_related('category', 'author').order_by('-published_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BlogPostDetailSerializer
        return BlogPostListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        BlogPost.objects.filter(pk=instance.pk).update(views_count=instance.views_count + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @method_decorator(cache_page(60 * 5))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        qs = self.get_queryset().filter(is_featured=True)[:3]
        serializer = BlogPostListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class BlogPostAdminViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.select_related('category', 'author').order_by('-updated_at')
    serializer_class = BlogPostAdminSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'is_featured']
    search_fields = ['title', 'excerpt', 'content', 'tags']
    ordering_fields = ['published_at', 'views_count', 'updated_at']

    def get_queryset(self):
        qs = super().get_queryset()
        status_value = self.request.query_params.get('status')
        if status_value == 'published':
            return qs.filter(is_published=True)
        if status_value == 'draft':
            return qs.filter(is_published=False)
        return qs
