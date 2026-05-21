from rest_framework import serializers
from .models import Inquiry


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = [
            'id', 'full_name', 'email', 'phone', 'company',
            'country', 'inquiry_type', 'product_interest',
            'quantity', 'message', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_message(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters.")
        return value

    def validate_email(self, value):
        return value.lower().strip()


class InquiryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = '__all__'
