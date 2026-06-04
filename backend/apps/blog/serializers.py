from rest_framework import serializers
from .models import BlogCategory, BlogPost


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'color']


class BlogPostListSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    reading_time = serializers.ReadOnlyField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'category',
            'featured_image', 'tags', 'reading_time',
            'is_featured', 'published_at', 'author_name',
        ]


class BlogPostDetailSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    reading_time = serializers.ReadOnlyField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'category', 'author_name', 'featured_image', 'og_image',
            'tags', 'seo_title', 'seo_description', 'canonical_url',
            'reading_time', 'views_count', 'is_featured',
            'published_at', 'updated_at',
        ]


class BlogPostAdminSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.all(), required=False, allow_null=True
    )
    reading_time = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()
    author_id = serializers.CharField(source='author.id', read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'category',
            'featured_image', 'og_image', 'tags', 'reading_time', 'is_featured',
            'status', 'author_name', 'author_id', 'published_at', 'seo_title',
            'seo_description', 'canonical_url', 'views_count', 'created_at',
            'updated_at',
        ]
        read_only_fields = ['views_count', 'created_at', 'updated_at']

    def get_status(self, obj):
        return 'published' if obj.is_published else 'draft'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['category'] = BlogCategorySerializer(instance.category).data if instance.category else None
        return data

    def create(self, validated_data):
        status = self.initial_data.get('status', 'draft')
        validated_data['is_published'] = status == 'published'
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data.setdefault('author', request.user)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'status' in self.initial_data:
            instance.is_published = self.initial_data.get('status') == 'published'
        return super().update(instance, validated_data)
