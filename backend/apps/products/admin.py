import csv
import uuid
from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import render, redirect
from django import forms
from django.http import HttpResponse
from django.utils.html import format_html
from .models import Category, Product, Supplier, StockMovement


# --- Forms ---
class CsvImportForm(forms.Form):
    csv_file = forms.FileField(label="Choose CSV File")


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
def merge_categories(modeladmin, request, queryset):
    if queryset.count() < 2:
        messages.error(request, "Please select at least 2 categories to merge.")
        return
    categories = list(queryset)
    primary = categories[0]
    secondaries = categories[1:]
    
    product_count = 0
    for secondary in secondaries:
        # Move subcategories
        Category.objects.filter(parent=secondary).update(parent=primary)
        # Move products
        products = Product.objects.filter(category=secondary)
        product_count += products.count()
        products.update(category=primary)
        # Soft delete secondary
        secondary.is_deleted = True
        secondary.save()
        
    messages.success(request, f"Successfully merged {len(secondaries)} categories into '{primary.name}'. {product_count} products moved.")
merge_categories.short_description = "Merge selected categories (first selection is primary)"


def duplicate_products(modeladmin, request, queryset):
    count = 0
    for product in queryset:
        # Clone properties
        product.pk = None
        product.id = uuid.uuid4()
        product.name = f"{product.name} (Copy)"
        product.slug = ""  # Re-generated on save
        product.sku = f"{product.sku}-copy" if product.sku else ""
        product.is_active = False  # Keep drafted by default
        product.save()
        count += 1
    messages.success(request, f"Duplicated {count} products successfully.")
duplicate_products.short_description = "Duplicate selected products"


def soft_delete_items(modeladmin, request, queryset):
    queryset.update(is_deleted=True)
    messages.success(request, f"Moved {queryset.count()} items to trash.")
soft_delete_items.short_description = "Soft delete selected items"


def restore_items(modeladmin, request, queryset):
    queryset.update(is_deleted=False)
    messages.success(request, f"Restored {queryset.count()} items from trash.")
restore_items.short_description = "Restore selected items from trash"


def export_products_csv(modeladmin, request, queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="zenco_products_export.csv"'
    writer = csv.writer(response)
    
    writer.writerow([
        'name', 'category', 'sku', 'stock_quantity', 'reorder_level', 
        'availability', 'price_per_unit', 'cost_per_unit', 'status', 'description'
    ])
    
    for product in queryset:
        writer.writerow([
            product.name,
            product.category.name if product.category else '',
            product.sku,
            product.stock_quantity,
            product.reorder_level,
            product.availability,
            product.price_per_unit or '',
            product.cost_per_unit or '',
            product.status,
            product.description
        ])
    return response
export_products_csv.short_description = "Export selected products to CSV"


# --- Inlines ---
class StockMovementInline(admin.TabularInline):
    model = StockMovement
    extra = 1
    fields = ('quantity', 'movement_type', 'reference', 'notes', 'user', 'created_at')
    readonly_fields = ('created_at',)


# --- Admins ---
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'sort_order', 'is_active', 'is_deleted', 'product_count')
    list_filter = (TrashFilter, 'is_active')
    search_fields = ('name', 'description')
    actions = [merge_categories, soft_delete_items, restore_items]
    ordering = ('sort_order', 'name')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if 'trash' in request.GET:
            return qs
        return qs.filter(is_deleted=False)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'image_preview', 'name', 'category', 'sku', 
        'stock_status', 'stock_quantity', 'price_per_unit', 
        'cost_per_unit', 'inventory_value', 'status', 'is_deleted'
    )
    list_filter = (TrashFilter, 'status', 'availability', 'is_featured', 'category')
    search_fields = ('name', 'sku', 'description', 'supplier_name')
    actions = [duplicate_products, soft_delete_items, restore_items, export_products_csv]
    inlines = [StockMovementInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if 'trash' in request.GET:
            return qs
        return qs.filter(is_deleted=False)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="40" height="40" style="object-fit:cover; border-radius:4px;"/>', obj.image.url)
        return "-"
    image_preview.short_description = 'Preview'

    def stock_status(self, obj):
        if obj.stock_quantity <= 0:
            return format_html('<span style="color:#d9534f; font-weight:bold;">Out of Stock</span>')
        elif obj.is_low_stock:
            return format_html('<span style="color:#f0ad4e; font-weight:bold;">Low Stock</span>')
        return format_html('<span style="color:#5cb85c; font-weight:bold;">In Stock</span>')
    stock_status.short_description = 'Stock Status'

    def inventory_value(self, obj):
        if obj.stock_quantity and obj.cost_per_unit:
            val = obj.stock_quantity * obj.cost_per_unit
            return f"{obj.price_currency} {val:,.2f}"
        return "-"
    inventory_value.short_description = 'Inventory Value'

    # CSV Import URL Mapping
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('import-csv/', self.admin_site.admin_view(self.import_csv), name='products_product_import_csv'),
        ]
        return custom_urls + urls

    def import_csv(self, request):
        if request.method == "POST":
            form = CsvImportForm(request.POST, request.FILES)
            if form.is_valid():
                csv_file = request.FILES["csv_file"]
                decoded_file = csv_file.read().decode('utf-8').splitlines()
                reader = csv.reader(decoded_file)
                
                # Header
                header = next(reader, None)
                
                created_count = 0
                updated_count = 0
                for row in reader:
                    if not row or len(row) < 1:
                        continue
                    try:
                        name = row[0].strip()
                        category_name = row[1].strip() if len(row) > 1 else ''
                        sku = row[2].strip() if len(row) > 2 else ''
                        stock_qty = int(row[3]) if len(row) > 3 and row[3] else 0
                        reorder_lvl = int(row[4]) if len(row) > 4 and row[4] else 0
                        availability = row[5].strip() if len(row) > 5 else 'in_stock'
                        price = float(row[6]) if len(row) > 6 and row[6] else None
                        cost = float(row[7]) if len(row) > 7 and row[7] else None
                        status = row[8].strip() if len(row) > 8 else 'published'
                        desc = row[9].strip() if len(row) > 9 else f"Description for {name}"

                        category = None
                        if category_name:
                            category, _ = Category.objects.get_or_create(name=category_name)

                        product, created = Product.objects.update_or_create(
                            name=name,
                            defaults={
                                'category': category,
                                'sku': sku,
                                'stock_quantity': stock_qty,
                                'reorder_level': reorder_lvl,
                                'availability': availability,
                                'price_per_unit': price,
                                'cost_per_unit': cost,
                                'status': status,
                                'description': desc,
                            }
                        )
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1
                    except Exception as e:
                        self.message_user(request, f"Error parsing row {row}: {e}", level=messages.ERROR)

                self.message_user(request, f"CSV Import complete: {created_count} created, {updated_count} updated.", level=messages.SUCCESS)
                return redirect("..")
        else:
            form = CsvImportForm()

        context = self.admin_site.each_context(request)
        context['form'] = form
        context['title'] = "Import Products from CSV"
        return render(request, "admin/csv_import.html", context)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_name', 'email', 'phone', 'created_at')
    search_fields = ('name', 'contact_name', 'email')


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'movement_type', 'reference', 'user', 'created_at')
    list_filter = ('movement_type', 'created_at')
    search_fields = ('product__name', 'reference', 'notes')
    ordering = ('-created_at',)
