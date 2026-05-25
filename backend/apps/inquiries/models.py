"""
Inquiry / Lead Capture model for Zenco Systems Ltd
"""
from django.db import models
import uuid


class Inquiry(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('read', 'Read'),
        ('processing', 'Processing'),
        ('replied', 'Replied'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('spam', 'Spam'),
    ]

    INQUIRY_TYPE_CHOICES = [
        ('general', 'General Inquiry'),
        ('product', 'Product Inquiry'),
        ('quote', 'Quote Request'),
        ('partnership', 'Partnership'),
        ('technical', 'Technical Support'),
        ('complaint', 'Complaint'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Contact Details
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=200, blank=True)
    country = models.CharField(max_length=100, default='Kenya')

    # Inquiry Details
    inquiry_type = models.CharField(
        max_length=20, choices=INQUIRY_TYPE_CHOICES, default='general'
    )
    product_interest = models.CharField(max_length=255, blank=True,
        help_text='Product name or category the inquiry is about')
    quantity = models.CharField(max_length=100, blank=True,
        help_text='Estimated quantity needed')
    message = models.TextField()

    # Admin
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    admin_notes = models.TextField(blank=True)

    # Tracking
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True, max_length=500)
    page_url = models.URLField(blank=True, max_length=500)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    replied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Inquiry'
        verbose_name_plural = 'Inquiries'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.full_name} – {self.inquiry_type} ({self.created_at.strftime('%Y-%m-%d')})"
