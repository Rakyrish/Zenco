from django.contrib import admin
from django.utils.html import format_html
from .models import Industry


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ('image_preview', 'name', 'tagline', 'sort_order', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'tagline', 'description')
    ordering = ('sort_order', 'name')

    def image_preview(self, obj):
        if obj.hero_image:
            return format_html('<img src="{}" width="40" height="40" style="object-fit:cover; border-radius:4px;"/>', obj.hero_image.url)
        return "-"
    image_preview.short_description = 'Hero Image'
