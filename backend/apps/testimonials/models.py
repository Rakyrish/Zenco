"""
Testimonials models for Zenco Systems Ltd
"""
from django.db import models
import uuid


class Testimonial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author_name = models.CharField(max_length=150)
    author_role = models.CharField(max_length=150, blank=True)
    company = models.CharField(max_length=200, blank=True)
    company_logo = models.ImageField(
        upload_to='testimonials/', blank=True, null=True
    )
    text = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5,
        help_text='Rating from 1 to 5')
    industry = models.CharField(max_length=100, blank=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return f"{self.author_name} – {self.company}"
