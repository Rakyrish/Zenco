from rest_framework import serializers
from .models import Testimonial

class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = [
            'id', 'author_name', 'author_role', 'company',
            'company_logo', 'text', 'rating', 'industry', 'is_featured',
        ]
