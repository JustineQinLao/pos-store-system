from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from django.utils import timezone
from .models import Transaction, Product, Inventory
from .serializers import TransactionSerializer
import json


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for Transaction operations"""
    
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter transactions based on user role"""
        queryset = Transaction.objects.all()
        
        # Cashiers can only see their own transactions
        if self.request.user.is_cashier:
            queryset = queryset.filter(cashier=self.request.user)
        
        return queryset
    
    @action(detail=False, methods=['post'], url_path='process-payment')
    @db_transaction.atomic
    def process_payment(self, request):
        """
        Process payment and create transaction
        Expected payload:
        {
            "cart_items": [...],
            "subtotal": 100.00,
            "tax": 12.00,
            "total": 112.00,
            "amount_paid": 120.00,
            "payment_method": "CASH",
            "notes": ""
        }
        """
        try:
            cart_items = request.data.get('cart_items', [])
            subtotal = float(request.data.get('subtotal', 0))
            tax = float(request.data.get('tax', 0))
            total = float(request.data.get('total', 0))
            amount_paid = float(request.data.get('amount_paid', 0))
            payment_method = request.data.get('payment_method', 'CASH')
            notes = request.data.get('notes', '')
            
            # Validate payment
            if amount_paid < total:
                return Response({
                    'error': 'Insufficient payment amount'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate stock availability
            for item in cart_items:
                product_id = item['product']['id']
                quantity = item['quantity']
                
                try:
                    product = Product.objects.get(id=product_id)
                except Product.DoesNotExist:
                    return Response({
                        'error': f'Product {product_id} not found'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                if product.current_stock < quantity:
                    return Response({
                        'error': f'Insufficient stock for {product.name}. Available: {product.current_stock}, Requested: {quantity}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create transaction
            transaction = Transaction.objects.create(
                cashier=request.user,
                cart_items=cart_items,
                subtotal=subtotal,
                tax=tax,
                total=total,
                amount_paid=amount_paid,
                payment_method=payment_method,
                status='COMPLETED',
                notes=notes
            )
            
            # Update inventory for each item
            for item in cart_items:
                product_id = item['product']['id']
                quantity = item['quantity']
                variant_id = item.get('variant', {}).get('id') if item.get('variant') else None
                
                product = Product.objects.get(id=product_id)
                
                # Find the appropriate inventory record
                if variant_id:
                    inventory = Inventory.objects.filter(
                        product=product,
                        variant_id=variant_id
                    ).first()
                else:
                    inventory = Inventory.objects.filter(
                        product=product,
                        variant__isnull=True
                    ).first()
                
                if inventory:
                    # Deduct from existing inventory
                    inventory.quantity -= quantity
                    inventory.save()
                else:
                    # Create new inventory record with negative quantity (for tracking)
                    Inventory.objects.create(
                        product=product,
                        variant_id=variant_id if variant_id else None,
                        quantity=-quantity,
                        low_stock_threshold=10
                    )
            
            serializer = self.get_serializer(transaction)
            return Response({
                'message': 'Payment processed successfully',
                'transaction': serializer.data,
                'change': float(transaction.change_given)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Failed to process payment: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], url_path='refund')
    @db_transaction.atomic
    def refund_transaction(self, request, pk=None):
        """Refund a transaction and restore inventory"""
        try:
            transaction = self.get_object()
            
            if transaction.status == 'REFUNDED':
                return Response({
                    'error': 'Transaction already refunded'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Restore inventory
            cart_items = transaction.cart_items
            for item in cart_items:
                product_id = item['product']['id']
                quantity = item['quantity']
                variant_id = item.get('variant', {}).get('id') if item.get('variant') else None
                
                product = Product.objects.get(id=product_id)
                
                # Find the appropriate inventory record
                if variant_id:
                    inventory = Inventory.objects.filter(
                        product=product,
                        variant_id=variant_id
                    ).first()
                else:
                    inventory = Inventory.objects.filter(
                        product=product,
                        variant__isnull=True
                    ).first()
                
                if inventory:
                    inventory.quantity += quantity
                    inventory.save()
            
            # Update transaction status
            transaction.status = 'REFUNDED'
            transaction.save()
            
            serializer = self.get_serializer(transaction)
            return Response({
                'message': 'Transaction refunded successfully',
                'transaction': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to refund transaction: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
