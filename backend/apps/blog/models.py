"""
Blog / Insights models for Zenco Systems Ltd – Chemical Division
"""
from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model
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


class BlogPost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    category = models.ForeignKey(
        BlogCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='posts'
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
    tags = models.JSONField(default=list, blank=True,
        help_text='["water treatment", "industrial chemicals", ...]')

    # SEO
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    canonical_url = models.URLField(blank=True)
    og_image = models.ImageField(upload_to='blog/og/', blank=True, null=True)

    # Status
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)

    # Timestamps
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_published', '-published_at']),
            models.Index(fields=['is_featured']),
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
        if not self.seo_title:
            self.seo_title = f"{self.title} | Zenco Systems Blog"[:70]
        if not self.seo_description:
            self.seo_description = (self.excerpt or self.content or "")[:160]
        if not self.canonical_url:
            self.canonical_url = f"https://zencosystems.com/blog/{self.slug}"
        super().save(*args, **kwargs)

    @property
    def reading_time(self):
        """Estimated reading time in minutes."""
        word_count = len(self.content.split())
        return max(1, math.ceil(word_count / 200))
