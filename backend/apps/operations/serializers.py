from rest_framework import serializers
from .models import (
    ChatConversation, ChatMessage, WhatsAppClick, SeoPageMeta,
    SiteSetting, PerformanceSnapshot, GoogleSheetSyncState,
)


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'timestamp']


class ChatConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.ReadOnlyField()
    first_message = serializers.ReadOnlyField()

    class Meta:
        model = ChatConversation
        fields = [
            'id', 'session_id', 'user_identifier', 'messages',
            'message_count', 'is_resolved', 'first_message',
            'last_message_at', 'created_at',
            'lead_intent', 'product_interest', 'escalated_to_whatsapp',
        ]


class WhatsAppClickSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppClick
        fields = '__all__'


class SeoPageMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeoPageMeta
        fields = '__all__'


class SiteSettingSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key', read_only=True)

    class Meta:
        model = SiteSetting
        fields = ['id', 'key', 'label', 'value', 'type', 'group', 'description']


class PerformanceSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceSnapshot
        fields = '__all__'


class GoogleSheetSyncStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleSheetSyncState
        fields = '__all__'
