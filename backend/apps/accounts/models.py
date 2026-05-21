from django.contrib.auth.models import AbstractUser
from django.db import models


class ZencoUser(AbstractUser):
    """Extended user with admin role support."""
    is_content_manager = models.BooleanField(default=False)
    is_sales_rep = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
