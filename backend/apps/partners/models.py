"""
Partners & Certifications models for Zenco Systems Ltd
"""
from django.db import models
import uuid


class Partner(models.Model):
    PARTNER_TYPE_CHOICES = [
        ('supplier', 'Supplier'),
        ('distributor', 'Distributor'),
        ('certification', 'Certification'),
        ('association', 'Association'),
        ('client', 'Client'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='partners/')
    url = models.URLField(blank=True)
    partner_type = models.CharField(
        max_length=20, choices=PARTNER_TYPE_CHOICES, default='supplier'
    )
    description = models.CharField(max_length=300, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.partner_type})"
