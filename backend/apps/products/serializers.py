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
            'gallery', 'datasheet', 'packaging', 'availability', 'is_featured',
            'regions_available', 'seo_title', 'seo_description',
            'schema_data', 'related_products', 'created_at', 'updated_at',
        ]


class ProductAdminSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'description',
            'category', 'category_name', 'category_slug', 'image', 'gallery',
            'specifications', 'applications', 'packaging', 'price_per_unit',
            'price_currency', 'availability', 'stock_quantity', 'reorder_level',
            'unit', 'sku', 'supplier_name', 'cost_per_unit', 'last_restocked',
            'is_featured', 'status', 'regions_available', 'seo_title',
            'seo_description', 'datasheet', 'created_at', 'updated_at',
        ]


class InventorySerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source='id', read_only=True)
    product_name = serializers.CharField(source='name', read_only=True)
    product_sku = serializers.CharField(source='sku', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'product_id', 'product_name', 'product_sku', 'category_name',
            'stock_quantity', 'reorder_level', 'unit', 'supplier_name',
            'last_restocked', 'cost_per_unit', 'is_low_stock',
        ]
