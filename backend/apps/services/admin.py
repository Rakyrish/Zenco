from django.contrib import admin
from django.utils.html import format_html
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('image_preview', 'name', 'tagline', 'sort_order', 'is_active', 'is_featured', 'created_at')
    list_filter = ('is_active', 'is_featured', 'created_at')
    search_fields = ('name', 'tagline', 'description')
    ordering = ('sort_order', 'name')

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="40" height="40" style="object-fit:cover; border-radius:4px;"/>', obj.image.url)
        return "-"
    image_preview.short_description = 'Image'
