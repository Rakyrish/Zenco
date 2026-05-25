"""
Products & Categories models for Zenco Systems Ltd – Chemical Division
"""
from django.db import models
from django.utils.text import slugify
import uuid


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text="Lucide icon name")
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    sort_order = models.PositiveIntegerField(default=0)
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def product_count(self):
        return self.products.filter(is_active=True).count()


class Product(models.Model):
    AVAILABILITY_CHOICES = [
        ('in_stock', 'In Stock'),
        ('limited', 'Limited Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('on_order', 'Available on Order'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True,
        related_name='products'
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField()
    specifications = models.JSONField(default=dict, blank=True,
        help_text='{"CAS Number": "64-17-5", "Purity": "99.5%", ...}')
    applications = models.JSONField(default=list, blank=True,
        help_text='["Cleaning", "Industrial solvent", ...]')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    gallery = models.JSONField(default=list, blank=True,
        help_text='List of additional image URLs')
    datasheet = models.FileField(upload_to='datasheets/', blank=True, null=True,
        help_text='Product technical datasheet PDF')
    packaging = models.CharField(max_length=255, blank=True)
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    price_currency = models.CharField(max_length=8, default='KES')
    stock_quantity = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=50, default='units')
    sku = models.CharField(max_length=80, blank=True)
    supplier_name = models.CharField(max_length=180, blank=True)
    cost_per_unit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    last_restocked = models.DateTimeField(null=True, blank=True)
    availability = models.CharField(
        max_length=20, choices=AVAILABILITY_CHOICES, default='in_stock'
    )
    status = models.CharField(
        max_length=20,
        choices=[('published', 'Published'), ('draft', 'Draft'), ('archived', 'Archived')],
        default='published',
    )
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    # SEO
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    schema_data = models.JSONField(default=dict, blank=True,
        help_text='Additional schema.org structured data overrides')

    # Geography
    regions_available = models.JSONField(
        default=list, blank=True,
        help_text='["Kenya", "Uganda", "Tanzania", "East Africa"]'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_featured', 'is_active']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        if not self.seo_title:
            self.seo_title = f"{self.name} – Zenco Systems Ltd Kenya"[:70]
        if not self.seo_description:
            self.seo_description = self.short_description[:160]
        super().save(*args, **kwargs)

    @property
    def related_products(self):
        return Product.objects.filter(
            category=self.category, is_active=True
        ).exclude(pk=self.pk)[:4]

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.reorder_level
