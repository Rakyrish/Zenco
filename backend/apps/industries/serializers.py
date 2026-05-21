from rest_framework import serializers
from .models import Industry

class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Industry
        fields = [
            'id', 'name', 'slug', 'tagline', 'description',
            'short_description', 'icon', 'hero_image', 'challenges',
            'solutions', 'relevant_products', 'sort_order',
            'seo_title', 'seo_description',
        ]
