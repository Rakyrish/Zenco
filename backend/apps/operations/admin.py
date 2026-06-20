import json
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ChatConversation, ChatMessage, WhatsAppClick, SeoPageMeta,
    SiteSetting, PerformanceSnapshot, GoogleSheetSyncState, KnowledgeCache,
    PageContent, FaqEntry, RedirectRule, MediaFile, ApiRequestLog,
    AuditLog, LoginAttempt
)
from apps.products.models import Product, Category as ProductCategory
from apps.blog.models import BlogPost
from apps.services.models import Service
from apps.industries.models import Industry


# --- Inlines ---
class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('role', 'content', 'timestamp')
    can_delete = False


# --- Admin Registrations ---

@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'user_identifier', 'is_resolved', 'lead_intent', 'escalated_to_whatsapp', 'message_count', 'created_at', 'last_message_at')
    list_filter = ('is_resolved', 'lead_intent', 'escalated_to_whatsapp', 'created_at')
    search_fields = ('session_id', 'user_identifier', 'messages__content')
    inlines = [ChatMessageInline]
    readonly_fields = ('created_at', 'last_message_at')


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'role', 'content_truncated', 'timestamp')
    list_filter = ('role', 'timestamp')
    search_fields = ('content', 'conversation__session_id')
    readonly_fields = ('conversation', 'role', 'content', 'timestamp')

    def content_truncated(self, obj):
        return obj.content[:80] + "..." if len(obj.content) > 80 else obj.content
    content_truncated.short_description = 'Message Content'


@admin.register(WhatsAppClick)
class WhatsAppClickAdmin(admin.ModelAdmin):
    list_display = ('page_url', 'source', 'message_truncated', 'ip_address', 'created_at')
    list_filter = ('source', 'created_at')
    search_fields = ('page_url', 'message', 'ip_address')
    readonly_fields = ('page_url', 'source', 'message', 'product_slug', 'ip_address', 'user_agent', 'created_at')

    def message_truncated(self, obj):
        return obj.message[:80] + "..." if len(obj.message) > 80 else obj.message
    message_truncated.short_description = 'Message'


@admin.register(SeoPageMeta)
class SeoPageMetaAdmin(admin.ModelAdmin):
    list_display = ('page_label', 'page_path', 'seo_health', 'seo_title', 'canonical_url', 'index', 'follow', 'last_updated')
    list_filter = ('index', 'follow', 'schema_type', 'last_updated')
    search_fields = ('page_path', 'page_label', 'seo_title', 'seo_description')

    def seo_health(self, obj):
        score = 100
        issues = []
        if not obj.seo_title:
            score -= 25
            issues.append("Missing Title")
        if not obj.seo_description:
            score -= 25
            issues.append("Missing Description")
        if not obj.canonical_url:
            score -= 20
            issues.append("Missing Canonical")
        if not obj.og_title or not obj.og_description:
            score -= 15
            issues.append("Missing OG Tags")
        if not obj.keywords:
            score -= 15
            issues.append("Missing Keywords")

        color = "#5cb85c" if score >= 80 else ("#f0ad4e" if score >= 50 else "#d9534f")
        tip = ", ".join(issues) if issues else "All metadata set!"
        return format_html('<span style="background:{}; color:#fff; padding:3px 8px; border-radius:4px; font-weight:bold;" title="{}">{}%</span>', color, tip, score)
    seo_health.short_description = 'SEO Score'


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'label', 'value', 'type', 'group', 'updated_at')
    list_filter = ('group', 'type')
    search_fields = ('key', 'label', 'value', 'description')
    ordering = ('group', 'label')


@admin.register(PerformanceSnapshot)
class PerformanceSnapshotAdmin(admin.ModelAdmin):
    list_display = ('page_path', 'score_indicator', 'performance_score', 'seo_score', 'accessibility_score', 'best_practices_score', 'created_at')
    list_filter = ('page_path', 'created_at')
    search_fields = ('page_path',)

    def score_indicator(self, obj):
        avg = (obj.performance_score + obj.seo_score + obj.accessibility_score + obj.best_practices_score) / 4.0
        color = "#5cb85c" if avg >= 80 else ("#f0ad4e" if avg >= 50 else "#d9534f")
        return format_html('<div style="width:12px; height:12px; border-radius:50%; background:{}; display:inline-block; margin-right:5px;"></div>', color)
    score_indicator.short_description = 'Status'


@admin.register(GoogleSheetSyncState)
class GoogleSheetSyncStateAdmin(admin.ModelAdmin):
    list_display = ('sheet_name', 'resource', 'last_status', 'last_pull_at', 'last_push_at', 'updated_at')
    list_filter = ('last_status', 'resource')
    search_fields = ('sheet_name', 'resource', 'spreadsheet_id')


@admin.register(KnowledgeCache)
class KnowledgeCacheAdmin(admin.ModelAdmin):
    list_display = ('page_label', 'url', 'scraped_at', 'is_active')
    list_filter = ('is_active', 'scraped_at')
    search_fields = ('page_label', 'url', 'content')


@admin.register(PageContent)
class PageContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'page_key', 'subtitle', 'last_updated')
    search_fields = ('page_key', 'title', 'subtitle', 'content')


@admin.register(FaqEntry)
class FaqEntryAdmin(admin.ModelAdmin):
    list_display = ('question', 'sort_order', 'is_published')
    list_filter = ('is_published',)
    search_fields = ('question', 'answer')
    ordering = ('sort_order',)


@admin.register(RedirectRule)
class RedirectRuleAdmin(admin.ModelAdmin):
    list_display = ('old_path', 'new_path', 'is_permanent', 'created_at')
    list_filter = ('is_permanent', 'created_at')
    search_fields = ('old_path', 'new_path')


@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_preview', 'title', 'file_name', 'size_display', 'is_optimized', 'usage_tracker', 'uploaded_at')
    list_filter = ('is_optimized', 'uploaded_at')
    search_fields = ('title', 'file')

    def thumbnail_preview(self, obj):
        if obj.file:
            # Check if file is image based on extension
            ext = obj.file.name.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']:
                return format_html('<img src="{}" width="40" height="40" style="object-fit:cover; border-radius:4px;"/>', obj.file.url)
        return format_html('<span style="color:#666; font-size:11px;">Document</span>')
    thumbnail_preview.short_description = 'Preview'

    def file_name(self, obj):
        return obj.file.name.split('/')[-1]
    file_name.short_description = 'File Name'

    def size_display(self, obj):
        size = obj.file.size if obj.file else 0
        if size > 1024 * 1024:
            return f"{size / (1024*1024):.2f} MB"
        elif size > 1024:
            return f"{size / 1024:.2f} KB"
        return f"{size} Bytes"
    size_display.short_description = 'File Size'

    def usage_tracker(self, obj):
        if not obj.file:
            return "0 references"
        url = obj.file.url
        count = 0
        count += Product.objects.filter(description__icontains=url).count()
        count += BlogPost.objects.filter(content__icontains=url).count()
        count += Service.objects.filter(description__icontains=url).count()
        count += Industry.objects.filter(description__icontains=url).count()
        count += Product.objects.filter(image=obj.file).count()
        count += ProductCategory.objects.filter(image=obj.file).count()

        return format_html('<span style="font-weight:bold; color:#F26C0C;">{} references</span>', count)
    usage_tracker.short_description = 'Usage Tracker'


@admin.register(ApiRequestLog)
class ApiRequestLogAdmin(admin.ModelAdmin):
    list_display = ('method', 'path', 'status_badge', 'response_time_ms', 'ip_address', 'created_at')
    list_filter = ('method', 'status_code', 'created_at')
    search_fields = ('path', 'ip_address')
    readonly_fields = ('method', 'path', 'status_code', 'response_time_ms', 'error_message', 'ip_address', 'created_at')

    def status_badge(self, obj):
        code = obj.status_code
        color = "#5cb85c" if code < 400 else ("#f0ad4e" if code < 500 else "#d9534f")
        return format_html('<span style="background:{}; color:#fff; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:11px;">{}</span>', color, code)
    status_badge.short_description = 'Status'


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'model_name', 'object_id', 'user', 'ip_address', 'timestamp')
    list_filter = ('action', 'model_name', 'timestamp')
    search_fields = ('model_name', 'object_id', 'changes', 'ip_address', 'user__email')
    readonly_fields = ('action', 'model_name', 'object_id', 'user', 'changes_pretty', 'ip_address', 'user_agent', 'timestamp')
    exclude = ('changes',)

    def changes_pretty(self, obj):
        return format_html('<pre style="background:#f4f6f9; padding:10px; border-radius:4px; font-family:monospace; font-size:12px;">{}</pre>', json.dumps(obj.changes, indent=2))
    changes_pretty.short_description = 'Field Modifications Detail'

    # Read-only configuration
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ('username', 'status_badge', 'ip_address', 'timestamp')
    list_filter = ('is_successful', 'timestamp')
    search_fields = ('username', 'ip_address')
    readonly_fields = ('username', 'is_successful', 'ip_address', 'user_agent', 'timestamp')

    def status_badge(self, obj):
        if obj.is_successful:
            return format_html('<span style="color:#5cb85c; font-weight:bold;">Success</span>')
        return format_html('<span style="background:#d9534f; color:#fff; padding:2px 8px; border-radius:4px; font-weight:bold;">Failed</span>')
    status_badge.short_description = 'Status'

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
