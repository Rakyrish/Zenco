from django.contrib import admin, messages
from django.utils.html import format_html
import uuid
from .models import BlogCategory, BlogPost


# --- Custom Filters ---
class TrashFilter(admin.SimpleListFilter):
    title = 'Trash Status'
    parameter_name = 'trash'

    def lookups(self, request, model_admin):
        return (
            ('active', 'Active (Non-deleted)'),
            ('deleted', 'Trash (Soft-deleted)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'deleted':
            return queryset.filter(is_deleted=True)
        if self.value() == 'active':
            return queryset.filter(is_deleted=False)
        return queryset


# --- Actions ---
def duplicate_posts(modeladmin, request, queryset):
    count = 0
    for post in queryset:
        post.pk = None
        post.id = uuid.uuid4()
        post.title = f"{post.title} (Copy)"
        post.slug = ""  # Re-generated on save
        post.is_published = False
        post.save()
        count += 1
    messages.success(request, f"Duplicated {count} blog posts successfully.")
duplicate_posts.short_description = "Duplicate selected posts"


def soft_delete_posts(modeladmin, request, queryset):
    queryset.update(is_deleted=True)
    messages.success(request, f"Moved {queryset.count()} posts to trash.")
soft_delete_posts.short_description = "Soft delete selected posts"


def restore_posts(modeladmin, request, queryset):
    queryset.update(is_deleted=False)
    messages.success(request, f"Restored {queryset.count()} posts from trash.")
restore_posts.short_description = "Restore selected posts from trash"


# --- Admins ---
@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'color_badge', 'description')
    search_fields = ('name',)

    def color_badge(self, obj):
        return format_html('<span style="background: {}; color: #fff; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-size: 11px;">{}</span>', obj.color, obj.color)
    color_badge.short_description = 'Color Badge'


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = (
        'featured_image_preview', 'title', 'category', 'author', 
        'views_count', 'is_published', 'is_featured', 'is_deleted', 'published_at'
    )
    list_filter = (TrashFilter, 'is_published', 'is_featured', 'category', 'created_at')
    search_fields = ('title', 'excerpt', 'content')
    actions = [duplicate_posts, soft_delete_posts, restore_posts]
    ordering = ('-published_at', '-created_at')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if 'trash' in request.GET:
            return qs
        return qs.filter(is_deleted=False)

    def featured_image_preview(self, obj):
        if obj.featured_image:
            return format_html('<img src="{}" width="40" height="40" style="object-fit:cover; border-radius:4px;"/>', obj.featured_image.url)
        return "-"
    featured_image_preview.short_description = 'Image'
