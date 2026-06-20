from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import ZencoUser


class ZencoUserAdmin(UserAdmin):
    model = ZencoUser
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone', 'is_content_manager', 'is_sales_rep', 'is_staff', 'is_active')
    list_filter = ('is_content_manager', 'is_sales_rep', 'is_staff', 'is_active', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('Zenco Roles & Contact', {
            'fields': ('is_content_manager', 'is_sales_rep', 'phone', 'avatar')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Zenco Roles & Contact', {
            'fields': ('is_content_manager', 'is_sales_rep', 'phone', 'avatar')
        }),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    ordering = ('username',)


admin.site.register(ZencoUser, ZencoUserAdmin)
