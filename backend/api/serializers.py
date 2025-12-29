from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Category, Product, Variant, AddOn, Inventory, Transaction

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'is_verified', 'phone_number', 'address',
            'date_joined', 'is_active'
        ]
        read_only_fields = ['id', 'date_joined', 'is_verified']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'role'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        """Create new user with hashed password"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data.get('role', 'CUSTOMER'),
            is_verified=False  # Always start as unverified
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )


class VerifyUserSerializer(serializers.Serializer):
    """Serializer for verifying users (Super Admin only)"""
    
    user_id = serializers.IntegerField(required=True)
    is_verified = serializers.BooleanField(required=True)


# Product Management Serializers

class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image', 'is_active', 'product_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_product_count(self, obj):
        """Get count of active products in category"""
        return obj.products.filter(is_active=True).count()


class VariantSerializer(serializers.ModelSerializer):
    """Serializer for Variant model"""
    
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Variant
        fields = ['id', 'product', 'name', 'price_adjustment', 'final_price', 'sku_suffix', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'final_price', 'created_at', 'updated_at']


class AddOnSerializer(serializers.ModelSerializer):
    """Serializer for AddOn model"""
    
    class Meta:
        model = AddOn
        fields = ['id', 'name', 'description', 'price', 'applicable_products', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class InventorySerializer(serializers.ModelSerializer):
    """Serializer for Inventory model"""
    
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Inventory
        fields = ['id', 'product', 'product_name', 'variant', 'variant_name', 'quantity', 'low_stock_threshold', 'is_low_stock', 'is_out_of_stock', 'last_restocked', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_low_stock', 'is_out_of_stock', 'product_name', 'variant_name', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for Product list view"""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_stock = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category', 'category_name', 'base_price', 'image', 'is_taxable', 'is_active', 'current_stock', 'created_at']
        read_only_fields = ['id', 'category_name', 'current_stock', 'created_at']


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for Product detail view with related data"""
    
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    variants = VariantSerializer(many=True, read_only=True)
    available_addons = AddOnSerializer(many=True, read_only=True)
    inventories = InventorySerializer(many=True, read_only=True)
    current_stock = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'category', 'category_id', 'base_price', 'image', 'sku', 'is_taxable', 'is_active', 'variants', 'available_addons', 'inventories', 'current_stock', 'created_at', 'updated_at']
        read_only_fields = ['id', 'current_stock', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model"""
    
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_number', 'cashier', 'cashier_name',
            'cart_items', 'subtotal', 'tax', 'total',
            'amount_paid', 'change_given', 'payment_method',
            'status', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'transaction_number', 'change_given', 'created_at', 'updated_at']
