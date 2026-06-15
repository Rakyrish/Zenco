from rest_framework import serializers
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError
from .models import Inquiry
import html
import re


def sanitize_text(text: str) -> str:
    """Sanitize inputs by removing HTML tags and escaping entities to prevent XSS."""
    if not text:
        return ""
    # Strip basic HTML tags
    clean = re.sub(r'<[^>]*>', '', text)
    # Escape special HTML characters
    return html.escape(clean.strip())


class InquirySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='name', required=False)
    product_interest = serializers.CharField(source='product_name', required=False, allow_blank=True)
    page_url = serializers.CharField(source='source_page', required=False, allow_blank=True)

    class Meta:
        model = Inquiry
        fields = [
            'id', 'ticket_number', 'name', 'full_name', 'email', 'phone', 'company',
            'country', 'inquiry_type', 'product_name', 'product_interest',
            'quantity', 'message', 'status', 'source_page', 'page_url',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'ticket_number', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        data = data.copy()
        # Mapping compatibility fields from frontend payload
        if 'full_name' in data and 'name' not in data:
            data['name'] = data['full_name']
        if 'product_interest' in data and 'product_name' not in data:
            data['product_name'] = data['product_interest']
        if 'page_url' in data and 'source_page' not in data:
            data['source_page'] = data['page_url']
        
        # Sanitize strings to prevent XSS
        for key in ['name', 'company', 'country', 'product_name', 'quantity', 'message']:
            if key in data and isinstance(data[key], str):
                data[key] = sanitize_text(data[key])

        return super().to_internal_value(data)

    def validate_message(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters.")
        return value

    def validate_email(self, value):
        email = value.lower().strip()
        try:
            django_validate_email(email)
        except ValidationError:
            raise serializers.ValidationError("Please enter a valid email address.")
        return email


class InquiryAdminSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='name', required=False)
    product_interest = serializers.CharField(source='product_name', required=False, allow_blank=True)
    page_url = serializers.CharField(source='source_page', required=False, allow_blank=True)

    class Meta:
        model = Inquiry
        fields = '__all__'
