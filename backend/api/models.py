from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class EncryptionSettings(models.Model):
    """Global encryption settings for API payloads"""
    
    encryption_enabled = models.BooleanField(
        default=False,
        help_text='Enable/disable encryption for API requests and responses'
    )
    
    encryption_key = models.CharField(
        max_length=255,
        help_text='Encryption key (auto-generated)',
        blank=True
    )
    
    excluded_routes = models.TextField(
        blank=True,
        help_text='Comma-separated list of routes to exclude from encryption (e.g., /api/auth/login/,/api/auth/register/)'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'encryption_settings'
        verbose_name = 'Encryption Setting'
        verbose_name_plural = 'Encryption Settings'
    
    def __str__(self):
        status = "Enabled" if self.encryption_enabled else "Disabled"
        return f"Encryption: {status}"
    
    def save(self, *args, **kwargs):
        # Ensure only one settings instance exists
        if not self.pk and EncryptionSettings.objects.exists():
            raise ValueError('Only one EncryptionSettings instance is allowed')
        
        # Auto-generate encryption key if not set
        if not self.encryption_key:
            import secrets
            # Generate a random 32-character key for AES-256
            self.encryption_key = secrets.token_urlsafe(32)
        
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create encryption settings"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings


class User(AbstractUser):
    """Custom User model with roles and verification"""
    
    ROLE_CHOICES = [
        ('SUPER_ADMIN', 'Super Admin'),
        ('ADMIN', 'Admin'),
        ('CASHIER', 'Cashier'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='CASHIER',
        help_text='User role in the system'
    )
    
    is_verified = models.BooleanField(
        default=False,
        help_text='Whether the user has been verified by Super Admin'
    )
    
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_super_admin(self):
        return self.role == 'SUPER_ADMIN'
    
    @property
    def is_admin(self):
        return self.role in ['SUPER_ADMIN', 'ADMIN']
    
    @property
    def is_cashier(self):
        return self.role == 'CASHIER'


class Category(models.Model):
    """Product category model"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Product model"""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    sku = models.CharField(max_length=50, unique=True, help_text='Stock Keeping Unit')
    is_taxable = models.BooleanField(default=True, help_text='Whether VAT/tax applies')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.sku}"
    
    @property
    def current_stock(self):
        """Get current total stock across all inventories"""
        return sum(inv.quantity for inv in self.inventories.all())


class Variant(models.Model):
    """Product variant model (e.g., size, color)"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100, help_text='e.g., Small, Medium, Large')
    price_adjustment = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text='Price adjustment (+ or -) from base price'
    )
    sku_suffix = models.CharField(max_length=20, help_text='e.g., -SM, -MD, -LG')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'variants'
        verbose_name = 'Variant'
        verbose_name_plural = 'Variants'
        unique_together = ['product', 'name']
    
    def __str__(self):
        return f"{self.product.name} - {self.name}"
    
    @property
    def final_price(self):
        """Calculate final price with adjustment"""
        return self.product.base_price + self.price_adjustment


class AddOn(models.Model):
    """Product add-on model (e.g., extra cheese, gift wrap)"""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    applicable_products = models.ManyToManyField(
        Product, 
        related_name='available_addons',
        blank=True,
        help_text='Leave empty for all products'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'addons'
        verbose_name = 'Add-on'
        verbose_name_plural = 'Add-ons'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} (+${self.price})"


class Inventory(models.Model):
    """Inventory tracking model"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventories')
    variant = models.ForeignKey(
        Variant, 
        on_delete=models.CASCADE, 
        related_name='inventories',
        null=True,
        blank=True,
        help_text='Optional: track inventory per variant'
    )
    quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(
        default=10,
        help_text='Alert when stock falls below this level'
    )
    last_restocked = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory'
        verbose_name = 'Inventory'
        verbose_name_plural = 'Inventories'
        unique_together = ['product', 'variant']
    
    def __str__(self):
        variant_str = f" - {self.variant.name}" if self.variant else ""
        return f"{self.product.name}{variant_str}: {self.quantity} units"
    
    @property
    def is_low_stock(self):
        """Check if inventory is below threshold"""
        return self.quantity <= self.low_stock_threshold
    
    @property
    def is_out_of_stock(self):
        """Check if inventory is depleted"""
        return self.quantity <= 0


class Transaction(models.Model):
    """Transaction/Order model for completed purchases"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    ]
    
    transaction_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text='Unique transaction/receipt number'
    )
    
    cashier = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        help_text='Cashier who processed the transaction'
    )
    
    # Store cart items as JSON (snapshot at time of purchase)
    cart_items = models.JSONField(
        help_text='JSON snapshot of cart items at time of purchase'
    )
    
    # Pricing details
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment details
    amount_paid = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text='Amount paid by customer'
    )
    change_given = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        help_text='Change returned to customer'
    )
    
    payment_method = models.CharField(
        max_length=50,
        default='CASH',
        help_text='Payment method (CASH, CARD, etc.)'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='COMPLETED'
    )
    
    notes = models.TextField(blank=True, help_text='Additional notes')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'transactions'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Transaction {self.transaction_number} - ${self.total}"
    
    def save(self, *args, **kwargs):
        # Auto-generate transaction number if not set
        if not self.transaction_number:
            import datetime
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            self.transaction_number = f"TXN-{timestamp}"
        
        # Calculate change
        if self.amount_paid:
            self.change_given = max(0, self.amount_paid - self.total)
        
        super().save(*args, **kwargs)
