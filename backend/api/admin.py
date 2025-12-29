from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EncryptionSettings, Category, Product, Variant, AddOn, Inventory, Transaction

# Register your models here.

@admin.register(EncryptionSettings)
class EncryptionSettingsAdmin(admin.ModelAdmin):
    """Admin interface for Encryption Settings"""
    
    list_display = ['encryption_enabled', 'updated_at']
    fieldsets = (
        ('Encryption Control', {
            'fields': ('encryption_enabled',),
            'description': 'Enable or disable encryption for API requests and responses'
        }),
        ('Encryption Key', {
            'fields': ('encryption_key',),
            'description': 'Auto-generated encryption key (do not modify unless necessary)'
        }),
        ('Route Configuration', {
            'fields': ('excluded_routes',),
            'description': 'Comma-separated list of routes to exclude from encryption (e.g., /api/auth/login/,/api/auth/register/)'
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one instance
        return not EncryptionSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion
        return False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for custom User model"""
    
    list_display = ['username', 'email', 'role', 'is_verified', 'is_active', 'date_joined']
    list_filter = ['role', 'is_verified', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Verification', {
            'fields': ('role', 'is_verified')
        }),
        ('Additional Info', {
            'fields': ('phone_number', 'address')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role & Verification', {
            'fields': ('role', 'is_verified')
        }),
    )
    
    actions = ['verify_users', 'unverify_users']
    
    def verify_users(self, request, queryset):
        """Action to verify selected users"""
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} user(s) verified successfully.')
    verify_users.short_description = 'Verify selected users'
    
    def unverify_users(self, request, queryset):
        """Action to unverify selected users"""
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} user(s) unverified.')
    unverify_users.short_description = 'Unverify selected users'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin interface for Category"""
    
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'image')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


class VariantInline(admin.TabularInline):
    """Inline admin for Product Variants"""
    model = Variant
    extra = 1
    fields = ['name', 'price_adjustment', 'sku_suffix', 'is_active']


class InventoryInline(admin.TabularInline):
    """Inline admin for Product Inventory"""
    model = Inventory
    extra = 1
    fields = ['variant', 'quantity', 'low_stock_threshold', 'last_restocked']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin interface for Product"""
    
    list_display = ['name', 'sku', 'category', 'base_price', 'current_stock', 'is_taxable', 'is_active', 'created_at']
    list_filter = ['category', 'is_taxable', 'is_active', 'created_at']
    search_fields = ['name', 'sku', 'description']
    ordering = ['name']
    inlines = [VariantInline, InventoryInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'sku')
        }),
        ('Pricing', {
            'fields': ('base_price', 'is_taxable')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )
    
    def current_stock(self, obj):
        """Display current stock in list view"""
        stock = obj.current_stock
        if stock <= 0:
            return f'❌ {stock}'
        elif any(inv.is_low_stock for inv in obj.inventories.all()):
            return f'⚠️ {stock}'
        return f'✅ {stock}'
    current_stock.short_description = 'Stock'


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    """Admin interface for Variant"""
    
    list_display = ['product', 'name', 'price_adjustment', 'final_price', 'sku_suffix', 'is_active']
    list_filter = ['is_active', 'product__category']
    search_fields = ['name', 'product__name', 'sku_suffix']
    ordering = ['product', 'name']
    
    fieldsets = (
        ('Product', {
            'fields': ('product',)
        }),
        ('Variant Details', {
            'fields': ('name', 'price_adjustment', 'sku_suffix')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(AddOn)
class AddOnAdmin(admin.ModelAdmin):
    """Admin interface for AddOn"""
    
    list_display = ['name', 'price', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['applicable_products']
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'price')
        }),
        ('Applicable Products', {
            'fields': ('applicable_products',),
            'description': 'Leave empty to apply to all products'
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    """Admin interface for Inventory"""
    
    list_display = ['product', 'variant', 'quantity', 'low_stock_threshold', 'stock_status', 'last_restocked']
    list_filter = ['product__category', 'last_restocked']
    search_fields = ['product__name', 'variant__name']
    ordering = ['product', 'variant']
    
    fieldsets = (
        ('Product', {
            'fields': ('product', 'variant')
        }),
        ('Stock Information', {
            'fields': ('quantity', 'low_stock_threshold', 'last_restocked')
        }),
    )
    
    def stock_status(self, obj):
        """Display stock status with icons"""
        if obj.is_out_of_stock:
            return '❌ Out of Stock'
        elif obj.is_low_stock:
            return '⚠️ Low Stock'
        return '✅ In Stock'
    stock_status.short_description = 'Status'
    
    actions = ['restock_items']
    
    def restock_items(self, request, queryset):
        """Action to mark items as restocked"""
        from django.utils import timezone
        updated = queryset.update(last_restocked=timezone.now())
        self.message_user(request, f'{updated} inventory item(s) marked as restocked.')
    restock_items.short_description = 'Mark as restocked'


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Admin interface for Transaction"""
    
    list_display = ['transaction_number', 'cashier', 'total', 'amount_paid', 'change_given', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['transaction_number', 'cashier__username', 'notes']
    ordering = ['-created_at']
    readonly_fields = ['transaction_number', 'change_given', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Transaction Info', {
            'fields': ('transaction_number', 'cashier', 'status', 'payment_method')
        }),
        ('Cart Items', {
            'fields': ('cart_items',),
            'description': 'JSON snapshot of cart items at time of purchase'
        }),
        ('Pricing', {
            'fields': ('subtotal', 'tax', 'total')
        }),
        ('Payment', {
            'fields': ('amount_paid', 'change_given')
        }),
        ('Additional Info', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )
    
    def has_add_permission(self, request):
        # Transactions should only be created through the API
        return False
