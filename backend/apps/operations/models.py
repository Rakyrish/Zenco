import uuid
from django.db import models


class ChatConversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.CharField(max_length=120, unique=True)
    user_identifier = models.CharField(max_length=255, blank=True)
    is_resolved = models.BooleanField(default=False)
    source_page = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_message_at']

    @property
    def first_message(self):
        first = self.messages.order_by('timestamp').first()
        return first.content if first else ''

    @property
    def message_count(self):
        return self.messages.count()


class ChatMessage(models.Model):
    ROLE_CHOICES = [('user', 'User'), ('assistant', 'Assistant')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(ChatConversation, related_name='messages', on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']


class WhatsAppClick(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page_url = models.CharField(max_length=500, blank=True)
    source = models.CharField(max_length=120, blank=True)
    message = models.TextField(blank=True)
    product_slug = models.CharField(max_length=280, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']


class SeoPageMeta(models.Model):
    id = models.CharField(max_length=80, primary_key=True)
    page_path = models.CharField(max_length=255, unique=True)
    page_label = models.CharField(max_length=120)
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=170, blank=True)
    og_title = models.CharField(max_length=95, blank=True)
    og_description = models.CharField(max_length=220, blank=True)
    og_image = models.CharField(max_length=500, blank=True)
    canonical_url = models.CharField(max_length=500, blank=True)
    index = models.BooleanField(default=True)
    follow = models.BooleanField(default=True)
    keywords = models.JSONField(default=list, blank=True)
    schema_type = models.CharField(max_length=80, default='WebPage')
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page_path']


class SiteSetting(models.Model):
    key = models.CharField(max_length=120, primary_key=True)
    label = models.CharField(max_length=160)
    value = models.TextField(blank=True)
    type = models.CharField(max_length=30, default='text')
    group = models.CharField(max_length=80, default='general')
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['group', 'label']


class PerformanceSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page_path = models.CharField(max_length=255, default='/')
    performance_score = models.PositiveSmallIntegerField(default=0)
    seo_score = models.PositiveSmallIntegerField(default=0)
    accessibility_score = models.PositiveSmallIntegerField(default=0)
    best_practices_score = models.PositiveSmallIntegerField(default=0)
    largest_contentful_paint = models.FloatField(default=0)
    first_contentful_paint = models.FloatField(default=0)
    interaction_to_next_paint = models.FloatField(default=0)
    cumulative_layout_shift = models.FloatField(default=0)
    server_response_time = models.FloatField(default=0)
    image_optimization_status = models.CharField(max_length=80, default='unknown')
    caching_status = models.CharField(max_length=80, default='unknown')
    broken_links = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class GoogleSheetSyncState(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sheet_name = models.CharField(max_length=120)
    resource = models.CharField(max_length=120)
    spreadsheet_id = models.CharField(max_length=255, blank=True)
    last_pull_at = models.DateTimeField(null=True, blank=True)
    last_push_at = models.DateTimeField(null=True, blank=True)
    last_status = models.CharField(max_length=40, default='pending')
    last_message = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['resource', 'sheet_name']
