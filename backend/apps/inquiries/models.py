"""
Inquiry / Lead Capture model for Zenco Systems Ltd
"""
from django.db import models
from django.utils import timezone
import uuid
import datetime


class Inquiry(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('replied', 'Replied'),
        ('quotation_sent', 'Quotation Sent'),
        ('closed', 'Closed'),
    ]

    INQUIRY_TYPE_CHOICES = [
        ('quote', 'Quote Request'),
        ('product', 'Product Inquiry'),
        ('general', 'General Inquiry'),
        ('consultation', 'Consultation Request'),
        ('product_info', 'Product Information Request'),
        ('partnership', 'Distribution / Partnership'),
        ('technical', 'Technical Support'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=50, unique=True, db_index=True)

    # Contact Details
    name = models.CharField(max_length=150, db_index=True)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=200, blank=True)
    country = models.CharField(max_length=100, default='Kenya')

    # Inquiry Details
    inquiry_type = models.CharField(
        max_length=30, choices=INQUIRY_TYPE_CHOICES, default='general', db_index=True
    )
    product_name = models.CharField(
        max_length=255, blank=True, db_index=True,
        help_text='Product name or category the inquiry is about'
    )
    quantity = models.CharField(
        max_length=100, blank=True,
        help_text='Estimated quantity needed'
    )
    message = models.TextField()

    # Admin
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default='new', db_index=True
    )
    admin_notes = models.TextField(blank=True)

    # Tracking
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True, max_length=500)
    source_page = models.URLField(blank=True, max_length=500)

    # Email Delivery Analytics
    notification_sent = models.BooleanField(default=False, db_index=True)
    autoreply_sent = models.BooleanField(default=False, db_index=True)
    error_log = models.TextField(blank=True, help_text='Logs of any email sending failures')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    replied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Inquiry'
        verbose_name_plural = 'Inquiries'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['email']),
            models.Index(fields=['ticket_number']),
            models.Index(fields=['inquiry_type']),
        ]

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            current_year = datetime.datetime.now().year
            year_prefix = f"FIN-{current_year}-"
            # Find the latest inquiry in this year to compute the sequence number
            latest = Inquiry.objects.filter(ticket_number__startswith=year_prefix).order_by('-created_at').first()
            if latest and latest.ticket_number:
                try:
                    last_num = int(latest.ticket_number.split('-')[-1])
                    new_num = last_num + 1
                except ValueError:
                    new_num = Inquiry.objects.filter(ticket_number__startswith=year_prefix).count() + 1
            else:
                new_num = 1
            self.ticket_number = f"{year_prefix}{new_num:06d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_number or 'NO-TICKET'} – {self.name} ({self.inquiry_type})"
