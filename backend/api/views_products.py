from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django.db.models import Q, F
from django.db import models
from .models import Category, Product, Variant, AddOn, Inventory
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    VariantSerializer, AddOnSerializer, InventorySerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category CRUD operations"""
    
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter categories based on user role"""
        queryset = Category.objects.all()
        
        # Show only active categories to non-authenticated users
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(is_active=True)
        elif not (self.request.user.is_super_admin or self.request.user.is_admin):
            queryset = queryset.filter(is_active=True)
        
        return queryset


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product CRUD operations"""
    
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'base_price', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer
    
    def get_queryset(self):
        """Filter products with advanced filtering"""
        queryset = Product.objects.select_related('category').prefetch_related(
            'variants', 'available_addons', 'inventories'
        )
        
        # Show only active products to non-authenticated users
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(is_active=True)
        elif not (self.request.user.is_super_admin or self.request.user.is_admin):
            queryset = queryset.filter(is_active=True)
        
        # Filter by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(base_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(base_price__lte=max_price)
        
        # Filter by stock availability
        in_stock = self.request.query_params.get('in_stock', None)
        if in_stock == 'true':
            queryset = queryset.filter(inventories__quantity__gt=0).distinct()
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        low_stock_products = Product.objects.filter(
            inventories__quantity__lte=F('inventories__low_stock_threshold')
        ).distinct()
        
        serializer = self.get_serializer(low_stock_products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get products that are out of stock"""
        out_of_stock_products = Product.objects.filter(
            inventories__quantity=0
        ).distinct()
        
        serializer = self.get_serializer(out_of_stock_products, many=True)
        return Response(serializer.data)


class VariantViewSet(viewsets.ModelViewSet):
    """ViewSet for Variant CRUD operations"""
    
    queryset = Variant.objects.all()
    serializer_class = VariantSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'product__name']
    ordering_fields = ['name', 'price_adjustment']
    ordering = ['product', 'name']
    
    def get_queryset(self):
        """Filter variants by product"""
        queryset = Variant.objects.select_related('product')
        
        # Filter by product
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Show only active variants to non-authenticated users
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(is_active=True, product__is_active=True)
        elif not (self.request.user.is_super_admin or self.request.user.is_admin):
            queryset = queryset.filter(is_active=True, product__is_active=True)
        
        return queryset


class AddOnViewSet(viewsets.ModelViewSet):
    """ViewSet for AddOn CRUD operations"""
    
    queryset = AddOn.objects.all()
    serializer_class = AddOnSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter add-ons"""
        queryset = AddOn.objects.all()
        
        # Show only active add-ons to non-authenticated users
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(is_active=True)
        elif not (self.request.user.is_super_admin or self.request.user.is_admin):
            queryset = queryset.filter(is_active=True)
        
        # Filter by product
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(
                Q(applicable_products__id=product_id) | Q(applicable_products__isnull=True)
            ).distinct()
        
        return queryset


class InventoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Inventory CRUD operations"""
    
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'variant__name']
    ordering_fields = ['quantity', 'last_restocked']
    ordering = ['product']
    
    def get_queryset(self):
        """Filter inventory"""
        queryset = Inventory.objects.select_related('product', 'variant')
        
        # Filter by product
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by low stock
        low_stock = self.request.query_params.get('low_stock', None)
        if low_stock == 'true':
            queryset = queryset.filter(quantity__lte=F('low_stock_threshold'))
        
        # Filter by out of stock
        out_of_stock = self.request.query_params.get('out_of_stock', None)
        if out_of_stock == 'true':
            queryset = queryset.filter(quantity=0)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        """Restock inventory"""
        inventory = self.get_object()
        quantity = request.data.get('quantity', 0)
        
        if quantity <= 0:
            return Response(
                {'error': 'Quantity must be greater than 0'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        inventory.quantity += quantity
        from django.utils import timezone
        inventory.last_restocked = timezone.now()
        inventory.save()
        
        serializer = self.get_serializer(inventory)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        """Adjust inventory quantity (for sales/returns)"""
        inventory = self.get_object()
        adjustment = request.data.get('adjustment', 0)
        
        new_quantity = inventory.quantity + adjustment
        if new_quantity < 0:
            return Response(
                {'error': 'Insufficient stock'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        inventory.quantity = new_quantity
        inventory.save()
        
        serializer = self.get_serializer(inventory)
        return Response(serializer.data)
