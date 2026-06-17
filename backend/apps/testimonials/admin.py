from django.contrib import admin
from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('author_name', 'company', 'rating', 'is_featured', 'is_active', 'sort_order', 'created_at')
    list_filter = ('rating', 'is_featured', 'is_active', 'created_at')
    search_fields = ('author_name', 'company', 'text', 'industry')
    ordering = ('sort_order', '-created_at')
