"""
Blog, Insights, Technical Documents, and Automation models for Zenco Systems Ltd – Chemical Division
"""
from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid
import math

User = get_user_model()


class BlogCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#F26C0C',
        help_text='Hex color code for category badge')

    class Meta:
        verbose_name_plural = 'Blog Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogTag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    
    # Relationships
    category = models.ForeignKey(
        BlogCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='posts'
    )
    categories = models.ManyToManyField(
        BlogCategory, blank=True, related_name='posts_m2m'
    )
    tags = models.ManyToManyField(
        BlogTag, blank=True, related_name='posts'
    )
    tags_json = models.JSONField(
        default=list, blank=True,
        help_text='Legacy JSON tags. Use the tags ManyToMany relationship going forward.'
    )
    
    author = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='blog_posts'
    )
    author_name = models.CharField(max_length=150, blank=True,
        help_text='Override author display name')
    excerpt = models.CharField(max_length=300, blank=True)
    content = models.TextField()
    featured_image = models.ImageField(
        upload_to='blog/', blank=True, null=True
    )
    featured_image_alt = models.CharField(max_length=255, blank=True)

    # SEO & Metadata
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.TextField(max_length=160, blank=True)
    seo_title = models.CharField(max_length=70, blank=True)  # Legacy SEO field
    seo_description = models.CharField(max_length=160, blank=True)  # Legacy SEO field
    canonical_url = models.URLField(blank=True)
    og_image = models.ImageField(upload_to='blog/og/', blank=True, null=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_published = models.BooleanField(default=False)  # Kept for backward compatibility
    is_featured = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    quality_score = models.IntegerField(default=0)

    # Related items
    related_products = models.ManyToManyField(
        'products.Product', blank=True, related_name='blog_posts'
    )
    related_services = models.ManyToManyField(
        'services.Service', blank=True, related_name='blog_posts'
    )
    related_docs = models.ManyToManyField(
        'blog.TechnicalDocument', blank=True, related_name='blog_posts'
    )

    # Timestamps
    scheduled_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status']),
            models.Index(fields=['is_published', '-published_at']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['is_deleted']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while BlogPost.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        # Synchronize status with is_published for backward compatibility
        if self.status == 'published':
            self.is_published = True
            if not self.published_at:
                self.published_at = timezone.now()
        else:
            self.is_published = False

        if not self.meta_title:
            self.meta_title = self.title[:70]
        if not self.meta_description:
            self.meta_description = (self.excerpt or self.content or "")[:160]

        # Sync with legacy SEO fields
        if not self.seo_title:
            self.seo_title = self.meta_title
        if not self.seo_description:
            self.seo_description = self.meta_description

        if not self.canonical_url:
            self.canonical_url = f"https://zencochemicals.com/blog/{self.slug}"

        super().save(*args, **kwargs)

    @property
    def reading_time(self):
        """Estimated reading time in minutes."""
        word_count = len(self.content.split())
        return max(1, math.ceil(word_count / 200))


class TechnicalDocument(models.Model):
    DOC_TYPES = [
        ('datasheet', 'Product Data Sheet'),
        ('iso_guide', 'ISO Standard Guide'),
        ('kebs_guide', 'KEBS Compliance Guide'),
        ('iec_guide', 'IEC Standard Guide'),
        ('case_study', 'Case Study'),
        ('whitepaper', 'Technical Whitepaper'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    doc_type = models.CharField(max_length=30, choices=DOC_TYPES)
    standard_code = models.CharField(max_length=50, blank=True,
        help_text='e.g. ISO 9001:2015, KEBS KS 04-136, IEC 60204-1')

    # SEO & Metadata
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.TextField(max_length=160, blank=True)
    excerpt = models.TextField(max_length=300)
    body_html = models.TextField()  # full HTML content
    pdf_file = models.FileField(upload_to='tech-docs/', blank=True, null=True)

    # Relationships
    related_products = models.ManyToManyField(
        'products.Product', blank=True, related_name='technical_documents'
    )
    related_blogs = models.ManyToManyField(
        'blog.BlogPost', blank=True, related_name='technical_documents'
    )

    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['doc_type']),
            models.Index(fields=['is_published']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_doc_type_display()})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while TechnicalDocument.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        if not self.meta_title:
            self.meta_title = self.title[:70]
        if not self.meta_description:
            self.meta_description = self.excerpt[:160]

        super().save(*args, **kwargs)


class ProductDataSheet(models.Model):
    """AI-generated Technical Data Sheet linked one-to-one with a Product."""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    product = models.OneToOneField(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='product_data_sheet',
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    version = models.CharField(max_length=10, default='1.0')
    issue_date = models.DateField(auto_now_add=True)
    revision_date = models.DateField(auto_now=True)

    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.TextField(max_length=160, blank=True)

    product_description = models.TextField()
    chemical_composition = models.JSONField(default=list)
    physical_properties = models.JSONField(default=dict)
    performance_data = models.JSONField(default=dict)
    applications = models.JSONField(default=list)
    industries_served = models.JSONField(default=list)
    health_safety = models.JSONField(default=dict)
    storage_handling = models.JSONField(default=dict)
    packaging_info = models.JSONField(default=dict)
    standards_compliance = models.JSONField(default=list)
    certifications = models.JSONField(default=list)
    faq = models.JSONField(default=list)
    related_products_text = models.TextField(blank=True)

    ai_generated = models.BooleanField(default=False)
    ai_model_used = models.CharField(max_length=50, blank=True)
    tokens_used = models.PositiveIntegerField(default=0)
    generation_date = models.DateTimeField(null=True, blank=True)
    validation_flags = models.JSONField(default=list, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_public = models.BooleanField(default=True)
    pdf_file = models.FileField(upload_to='datasheets/pdf/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['product__name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status']),
            models.Index(fields=['status', 'is_public']),
        ]

    def __str__(self):
        return f"TDS — {self.product.name} v{self.version}"

    def save(self, *args, **kwargs):
        if not self.slug and self.product_id:
            base = f"{self.product.slug}-datasheet"
            slug = base
            counter = 1
            while ProductDataSheet.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug
        if not self.title and self.product_id:
            self.title = f"Technical Data Sheet — {self.product.name}"
        if self.meta_title and len(self.meta_title) > 70:
            self.meta_title = self.meta_title[:70]
        if self.meta_description and len(self.meta_description) > 160:
            self.meta_description = self.meta_description[:160]
        super().save(*args, **kwargs)


class BlogGenerationLog(models.Model):
    blog = models.ForeignKey(
        BlogPost, on_delete=models.SET_NULL, null=True, related_name='generation_logs'
    )
    triggered_by = models.CharField(max_length=20, help_text='scheduler or admin')
    topic_used = models.TextField()
    tokens_used = models.PositiveIntegerField()
    quality_score = models.PositiveIntegerField()
    retries = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20)  # success or failed
    created_at = models.DateTimeField(auto_now_add=True)
    error_log = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Generation Log {self.id} - Status: {self.status} (Score: {self.quality_score})"
