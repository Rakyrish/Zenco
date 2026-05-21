from rest_framework import serializers
from .models import Service

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'slug', 'tagline', 'description',
            'short_description', 'icon', 'image', 'features',
            'industries_served', 'is_featured', 'sort_order',
            'seo_title', 'seo_description',
        ]
