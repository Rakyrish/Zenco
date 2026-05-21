"""
Industries Served models for Zenco Systems Ltd
"""
from django.db import models
from django.utils.text import slugify
import uuid


class Industry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    tagline = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    short_description = models.CharField(max_length=300, blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text='Lucide icon name')
    hero_image = models.ImageField(upload_to='industries/', blank=True, null=True)
    challenges = models.JSONField(default=list, blank=True,
        help_text='Industry challenges Zenco solves')
    solutions = models.JSONField(default=list, blank=True,
        help_text='Zenco solutions for this industry')
    relevant_products = models.JSONField(default=list, blank=True,
        help_text='List of related product slugs')
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    # SEO
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'Industries'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
