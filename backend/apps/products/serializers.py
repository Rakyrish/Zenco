from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'icon',
            'image', 'sort_order', 'seo_title', 'seo_description',
            'product_count', 'is_active',
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'category',
            'category_name', 'category_slug', 'image', 'availability',
            'is_featured', 'regions_available',
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    related_products = ProductListSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'description',
            'category', 'specifications', 'applications', 'image',
            'gallery', 'datasheet', 'availability', 'is_featured',
            'regions_available', 'seo_title', 'seo_description',
            'schema_data', 'related_products', 'created_at', 'updated_at',
        ]
