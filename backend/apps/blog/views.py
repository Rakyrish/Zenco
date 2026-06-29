import json
from rest_framework import viewsets, filters, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.conf import settings
from .models import BlogPost, BlogCategory, BlogTag, TechnicalDocument, BlogGenerationLog
from .serializers import (
    BlogPostListSerializer, BlogPostDetailSerializer, BlogCategorySerializer,
    BlogPostAdminSerializer, BlogTagSerializer,
    TechnicalDocumentListSerializer, TechnicalDocumentDetailSerializer,
    BlogGenerationLogSerializer,
)


class BlogCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class BlogTagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BlogTag.objects.all()
    serializer_class = BlogTagSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class BlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'is_featured']
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'views_count']
    ordering = ['-published_at']

    def get_queryset(self):
        return BlogPost.objects.filter(
            status='published', is_deleted=False
        ).select_related('category', 'author').prefetch_related('tags', 'categories').order_by('-published_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BlogPostDetailSerializer
        return BlogPostListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
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
    queryset = BlogPost.objects.select_related('category', 'author').prefetch_related(
        'tags', 'categories', 'related_products', 'related_services'
    ).order_by('-updated_at')
    serializer_class = BlogPostAdminSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'is_featured', 'status']
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'views_count', 'updated_at', 'quality_score']

    def get_queryset(self):
        qs = super().get_queryset()
        status_value = self.request.query_params.get('status')
        if status_value and status_value != 'all':
            return qs.filter(status=status_value)
        return qs

    @action(detail=False, methods=['post'], url_path='generate')
    def generate_with_ai(self, request):
        """Trigger on-demand AI blog generation from admin dashboard."""
        topic = request.data.get('topic', '').strip()
        if not topic:
            return Response({'error': 'topic is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not getattr(settings, 'OPENAI_API_KEY', None):
            return Response({'error': 'OpenAI API key not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            from apps.blog.tasks import generate_ai_blog_on_demand
            # Queue the task asynchronously
            result = generate_ai_blog_on_demand.delay(topic, triggered_by='admin')
            return Response({
                'status': 'queued',
                'task_id': result.id,
                'message': f'Blog generation started for topic: "{topic}". Check the generation logs for results.'
            }, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='generate-sync')
    def generate_with_ai_sync(self, request):
        """Synchronous on-demand AI blog generation for admin dashboard (returns immediately)."""
        topic = request.data.get('topic', '').strip()
        if not topic:
            return Response({'error': 'topic is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not getattr(settings, 'OPENAI_API_KEY', None):
            return Response({'error': 'OpenAI API key not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            from apps.blog.tasks import _generate_blog_post
            post = _generate_blog_post(topic, triggered_by='admin')
            if post:
                serializer = BlogPostAdminSerializer(post, context={'request': request})
                return Response({
                    'status': 'success',
                    'post': serializer.data,
                })
            return Response({
                'status': 'failed',
                'error': 'Generation failed after all retries. Check BlogGenerationLog for details.'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='audit')
    def run_quality_audit(self, request, pk=None):
        """Run the quality engine on an existing post and return the score breakdown."""
        post = self.get_object()
        from apps.blog.quality_engine import run_quality_audit
        result = run_quality_audit(
            title=post.title,
            content=post.content,
            meta_title=post.meta_title,
            meta_description=post.meta_description,
            excerpt=post.excerpt,
        )
        # Save the score
        BlogPost.objects.filter(pk=post.pk).update(quality_score=result['total_score'])
        return Response(result)


class TechnicalDocumentViewSet(viewsets.ReadOnlyModelViewSet):
    """Public viewset for technical documents."""
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['doc_type']
    search_fields = ['title', 'excerpt', 'body_html', 'standard_code']
    ordering_fields = ['created_at', 'view_count']
    ordering = ['-created_at']

    def get_queryset(self):
        return TechnicalDocument.objects.filter(is_published=True).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TechnicalDocumentDetailSerializer
        return TechnicalDocumentListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        TechnicalDocument.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class TechnicalDocumentAdminViewSet(viewsets.ModelViewSet):
    """Admin viewset for technical documents."""
    queryset = TechnicalDocument.objects.order_by('-created_at')
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['doc_type', 'is_published']
    search_fields = ['title', 'standard_code', 'excerpt']

    def get_serializer_class(self):
        if self.action in ('list',):
            return TechnicalDocumentListSerializer
        return TechnicalDocumentDetailSerializer


class BlogGenerationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only viewset for blog generation logs."""
    queryset = BlogGenerationLog.objects.select_related('blog').order_by('-created_at')
    serializer_class = BlogGenerationLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['topic_used', 'status', 'triggered_by']
