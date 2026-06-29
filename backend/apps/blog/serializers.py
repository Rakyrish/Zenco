from rest_framework import serializers
from .models import BlogCategory, BlogPost, BlogTag, TechnicalDocument, BlogGenerationLog, ProductDataSheet


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'color']


class BlogTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = ['id', 'name', 'slug']


class BlogPostListSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    reading_time = serializers.ReadOnlyField()
    tag_names = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'category',
            'featured_image', 'tag_names', 'reading_time',
            'is_featured', 'published_at', 'updated_at', 'author_name',
        ]

    def get_tag_names(self, obj):
        return list(obj.tags.values_list('name', flat=True))


class BlogPostDetailSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    categories = BlogCategorySerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    reading_time = serializers.ReadOnlyField()

    def get_tags(self, obj):
        return list(obj.tags.values_list('name', flat=True))

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'category', 'categories', 'author_name',
            'featured_image', 'featured_image_alt', 'og_image',
            'tags', 'meta_title', 'meta_description',
            'seo_title', 'seo_description', 'canonical_url',
            'reading_time', 'views_count', 'is_featured',
            'status', 'quality_score',
            'published_at', 'updated_at',
        ]


class BlogPostAdminSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.all(), required=False, allow_null=True
    )
    categories_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=BlogCategory.objects.all(), required=False,
        write_only=True, source='categories'
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=BlogTag.objects.all(), required=False,
        write_only=True, source='tags'
    )
    reading_time = serializers.ReadOnlyField()
    author_id = serializers.CharField(source='author.id', read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'category', 'categories_ids', 'tag_ids',
            'featured_image', 'featured_image_alt', 'og_image',
            'reading_time', 'is_featured',
            'status', 'author_name', 'author_id',
            'meta_title', 'meta_description',
            'seo_title', 'seo_description', 'canonical_url',
            'views_count', 'quality_score', 'scheduled_at',
            'created_at', 'updated_at', 'published_at',
        ]
        read_only_fields = ['views_count', 'quality_score', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['category'] = BlogCategorySerializer(instance.category).data if instance.category else None
        data['categories'] = BlogCategorySerializer(instance.categories.all(), many=True).data
        data['tags'] = BlogTagSerializer(instance.tags.all(), many=True).data
        return data

    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        # Support tags as a list of strings from initial_data (for frontend backward compatibility)
        tags_data = self.initial_data.get('tags', [])
        status = validated_data.get('status', 'draft')
        validated_data['is_published'] = (status == 'published')
        
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data.setdefault('author', request.user)
            
        post = super().create(validated_data)
        
        if categories:
            post.categories.set(categories)
            
        # Parse and assign/create tags
        if tags_data:
            tag_objs = []
            for tag_item in tags_data:
                if isinstance(tag_item, dict) and 'name' in tag_item:
                    name = tag_item['name']
                elif isinstance(tag_item, str):
                    name = tag_item
                else:
                    continue
                tag_obj, _ = BlogTag.objects.get_or_create(
                    name=name.lower().strip(),
                    defaults={}
                )
                tag_objs.append(tag_obj)
            post.tags.set(tag_objs)
            
        return post

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        tags_data = self.initial_data.get('tags', None)
        status = validated_data.get('status', instance.status)
        validated_data['is_published'] = (status == 'published')
        
        instance = super().update(instance, validated_data)
        
        if categories is not None:
            instance.categories.set(categories)
            
        if tags_data is not None:
            tag_objs = []
            for tag_item in tags_data:
                if isinstance(tag_item, dict) and 'name' in tag_item:
                    name = tag_item['name']
                elif isinstance(tag_item, str):
                    name = tag_item
                else:
                    continue
                tag_obj, _ = BlogTag.objects.get_or_create(
                    name=name.lower().strip(),
                    defaults={}
                )
                tag_objs.append(tag_obj)
            instance.tags.set(tag_objs)
            
        return instance


class TechnicalDocumentListSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.CharField(source='get_doc_type_display', read_only=True)

    class Meta:
        model = TechnicalDocument
        fields = [
            'id', 'title', 'slug', 'doc_type', 'doc_type_display',
            'standard_code', 'excerpt', 'is_published',
            'created_at', 'updated_at', 'view_count',
        ]


class TechnicalDocumentDetailSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.CharField(source='get_doc_type_display', read_only=True)

    class Meta:
        model = TechnicalDocument
        fields = [
            'id', 'title', 'slug', 'doc_type', 'doc_type_display',
            'standard_code', 'meta_title', 'meta_description',
            'excerpt', 'body_html', 'pdf_file', 'is_published',
            'created_at', 'updated_at', 'view_count',
        ]


class BlogGenerationLogSerializer(serializers.ModelSerializer):
    blog_title = serializers.CharField(source='blog.title', read_only=True, default=None)

    class Meta:
        model = BlogGenerationLog
        fields = [
            'id', 'blog', 'blog_title', 'triggered_by', 'topic_used',
            'tokens_used', 'quality_score', 'retries', 'status',
            'created_at', 'error_log',
        ]


class ProductDataSheetProductSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()
    sku = serializers.CharField()
    short_description = serializers.CharField()
    image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', default='')
    category_slug = serializers.CharField(source='category.slug', default='')

    def get_image(self, obj):
        schema = obj.schema_data if isinstance(obj.schema_data, dict) else {}
        cloudinary_url = schema.get('cloudinary_image_url')
        if cloudinary_url:
            return cloudinary_url
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


class ProductDataSheetListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True, default='')

    class Meta:
        model = ProductDataSheet
        fields = [
            'id', 'title', 'slug', 'version', 'status', 'is_public',
            'product_name', 'product_slug', 'product_sku', 'category_name',
            'ai_generated', 'tokens_used', 'view_count',
            'validation_flags', 'issue_date', 'revision_date',
            'created_at', 'updated_at',
        ]


class ProductDataSheetAdminSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)

    class Meta:
        model = ProductDataSheet
        fields = [
            'id', 'product_id', 'product_name', 'product_slug',
            'title', 'slug', 'version', 'issue_date', 'revision_date',
            'meta_title', 'meta_description', 'product_description',
            'chemical_composition', 'physical_properties', 'performance_data',
            'applications', 'industries_served', 'health_safety',
            'storage_handling', 'packaging_info', 'standards_compliance',
            'certifications', 'faq', 'related_products_text',
            'ai_generated', 'ai_model_used', 'tokens_used', 'generation_date',
            'validation_flags', 'status', 'is_public', 'pdf_file',
            'view_count', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'slug', 'issue_date', 'revision_date', 'view_count',
            'ai_generated', 'ai_model_used', 'tokens_used', 'generation_date',
        ]


class ProductDataSheetPublicSerializer(serializers.ModelSerializer):
    product = ProductDataSheetProductSerializer(read_only=True)
    related_products = serializers.SerializerMethodField()
    related_blogs = serializers.SerializerMethodField()
    related_docs = serializers.SerializerMethodField()

    class Meta:
        model = ProductDataSheet
        fields = [
            'id', 'title', 'slug', 'version', 'issue_date', 'revision_date',
            'meta_title', 'meta_description', 'product_description',
            'chemical_composition', 'physical_properties', 'performance_data',
            'applications', 'industries_served', 'health_safety',
            'storage_handling', 'packaging_info', 'standards_compliance',
            'certifications', 'faq', 'related_products_text',
            'product', 'related_products', 'related_blogs', 'related_docs',
            'view_count', 'updated_at',
        ]

    def get_related_products(self, obj):
        products = self.context.get('related_products', [])
        return ProductDataSheetProductSerializer(
            products, many=True, context=self.context
        ).data

    def get_related_blogs(self, obj):
        blogs = self.context.get('related_blogs', [])
        return [
            {
                'title': b.title,
                'slug': b.slug,
                'excerpt': b.excerpt,
            }
            for b in blogs
        ]

    def get_related_docs(self, obj):
        docs = self.context.get('related_docs', [])
        return [
            {
                'title': d.title,
                'slug': d.slug,
                'doc_type': d.doc_type,
                'excerpt': d.excerpt,
            }
            for d in docs
        ]


class ProductDataSheetSummarySerializer(serializers.ModelSerializer):
    """Minimal nested serializer for product detail pages."""
    class Meta:
        model = ProductDataSheet
        fields = ['slug', 'status', 'version', 'title']
