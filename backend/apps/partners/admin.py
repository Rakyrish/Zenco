from django.contrib import admin
from django.utils.html import format_html
from .models import Partner


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ('logo_preview', 'name', 'partner_type', 'url', 'sort_order', 'is_active', 'created_at')
    list_filter = ('partner_type', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('sort_order', 'name')

    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" width="40" height="40" style="object-fit:contain; background:#fafafa; border-radius:4px; border:1px solid #eee;"/>', obj.logo.url)
        return "-"
    logo_preview.short_description = 'Logo'
