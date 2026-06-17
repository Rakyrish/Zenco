import csv
from django.contrib import admin, messages
from django.http import HttpResponse
from .models import Inquiry, Customer, FollowUp


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
def export_leads_csv(modeladmin, request, queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="zenco_crm_leads.csv"'
    writer = csv.writer(response)
    
    writer.writerow([
        'ticket_number', 'name', 'email', 'phone', 'company', 'country', 
        'inquiry_type', 'product_name', 'quantity', 'status', 'created_at'
    ])
    
    for inquiry in queryset:
        writer.writerow([
            inquiry.ticket_number,
            inquiry.name,
            inquiry.email,
            inquiry.phone,
            inquiry.company,
            inquiry.country,
            inquiry.inquiry_type,
            inquiry.product_name,
            inquiry.quantity,
            inquiry.status,
            inquiry.created_at
        ])
    return response
export_leads_csv.short_description = "Export selected leads to CSV"


def soft_delete_inquiries(modeladmin, request, queryset):
    queryset.update(is_deleted=True)
    messages.success(request, f"Moved {queryset.count()} inquiries to trash.")
soft_delete_inquiries.short_description = "Soft delete selected inquiries"


def restore_inquiries(modeladmin, request, queryset):
    queryset.update(is_deleted=False)
    messages.success(request, f"Restored {queryset.count()} inquiries from trash.")
restore_inquiries.short_description = "Restore selected inquiries from trash"


# --- Inlines ---
class FollowUpInline(admin.TabularInline):
    model = FollowUp
    extra = 1
    fields = ('notes', 'scheduled_date', 'completed', 'assigned_to', 'created_at')
    readonly_fields = ('created_at',)


# --- Admins ---
@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = (
        'ticket_number', 'name', 'email', 'company', 'country', 
        'inquiry_type', 'product_name', 'status', 'assigned_to', 
        'notification_sent', 'created_at', 'is_deleted'
    )
    list_filter = (TrashFilter, 'status', 'inquiry_type', 'assigned_to', 'created_at')
    search_fields = ('ticket_number', 'name', 'email', 'company', 'product_name', 'message')
    actions = [export_leads_csv, soft_delete_inquiries, restore_inquiries]
    inlines = [FollowUpInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if 'trash' in request.GET:
            return qs
        return qs.filter(is_deleted=False)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'company', 'country', 'created_at')
    search_fields = ('name', 'email', 'company', 'country')
    list_filter = ('country', 'created_at')


@admin.register(FollowUp)
class FollowUpAdmin(admin.ModelAdmin):
    list_display = ('inquiry', 'scheduled_date', 'completed', 'assigned_to', 'created_at')
    list_filter = ('completed', 'assigned_to', 'created_at')
    search_fields = ('inquiry__ticket_number', 'notes')
