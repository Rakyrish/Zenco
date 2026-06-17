import uuid
from django.utils import timezone
from django.db import models


class ChatConversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.CharField(max_length=120, unique=True)
    user_identifier = models.CharField(max_length=255, blank=True)
    is_resolved = models.BooleanField(default=False)
    source_page = models.CharField(max_length=500, blank=True)

    # Lead / escalation tracking
    lead_intent = models.BooleanField(default=False,
        help_text='True when visitor expressed quote/price/order intent')
    product_interest = models.CharField(max_length=255, blank=True,
        help_text='Most recently mentioned product keyword')
    escalated_to_whatsapp = models.BooleanField(default=False,
        help_text='True when a WhatsApp escalation CTA was sent')

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


class KnowledgeCache(models.Model):
    """
    Stores scraped website content for use as RAG context in the AI chatbot.
    Content is refreshed periodically via the `ingest_website` management command.
    """
    url = models.CharField(max_length=500, unique=True,
        help_text='Source URL that was scraped')
    page_label = models.CharField(max_length=120,
        help_text='Human-readable label, e.g. "Homepage", "Products"')
    content = models.TextField(help_text='Extracted plain-text content from the page')
    scraped_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['page_label']
        verbose_name = 'Knowledge Cache Entry'
        verbose_name_plural = 'Knowledge Cache'

    def __str__(self):
        return f'{self.page_label} ({self.url})'


class PageContent(models.Model):
    page_key = models.SlugField(max_length=100, unique=True, help_text="e.g. 'home', 'about', 'privacy', 'terms'")
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    content = models.TextField(help_text="Main content (HTML/Markdown supported)")
    meta_keywords = models.CharField(max_length=255, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page_key']
        verbose_name = 'Page Content'
        verbose_name_plural = 'Page Contents'

    def __str__(self):
        return self.title


class FaqEntry(models.Model):
    question = models.CharField(max_length=255)
    answer = models.TextField()
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order']
        verbose_name = 'FAQ Entry'
        verbose_name_plural = 'FAQ Entries'

    def __str__(self):
        return self.question


class RedirectRule(models.Model):
    old_path = models.CharField(max_length=255, unique=True, help_text="e.g. /old-path/")
    new_path = models.CharField(max_length=255, help_text="e.g. /new-path/")
    is_permanent = models.BooleanField(default=True, help_text="True for 301, False for 302")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['old_path']

    def __str__(self):
        return f"{self.old_path} -> {self.new_path}"


class MediaFile(models.Model):
    title = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to='media_library/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_size = models.PositiveIntegerField(default=0, help_text="Size in bytes")
    is_optimized = models.BooleanField(default=False)
    usage_count = models.PositiveIntegerField(default=0, help_text="Number of times used on site")

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.title or self.file.name


class ApiRequestLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    path = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.PositiveIntegerField()
    response_time_ms = models.FloatField()
    error_message = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.method} {self.path} - {self.status_code}"


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'accounts.ZencoUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=50)  # CREATE, UPDATE, DELETE, LOGIN
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    changes = models.JSONField(default=dict)  # old_value, new_value
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.email if self.user else "System"
        return f"{self.action} on {self.model_name} by {user_str} at {self.timestamp}"


class LoginAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150)
    ip_address = models.GenericIPAddressField()
    is_successful = models.BooleanField(default=False)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        status = "SUCCESS" if self.is_successful else "FAILED"
        return f"{self.username} ({status}) from {self.ip_address} at {self.timestamp}"
