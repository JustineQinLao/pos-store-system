from django.core.management.base import BaseCommand
from api.models import Product, Variant, Inventory
from django.utils import timezone
import random


class Command(BaseCommand):
    help = 'Seed database with inventory data'

    def handle(self, *args, **kwargs):
        # Clear existing inventory
        Inventory.objects.all().delete()
        
        created_count = 0
        
        # Get all products
        products = Product.objects.all()
        
        for product in products:
            variants = product.variants.all()
            
            if variants.exists():
                # Create inventory for each variant
                for variant in variants:
                    # Random quantity between 20 and 200
                    quantity = random.randint(20, 200)
                    
                    # Random low stock threshold between 5 and 20
                    low_stock_threshold = random.randint(5, 20)
                    
                    inventory = Inventory.objects.create(
                        product=product,
                        variant=variant,
                        quantity=quantity,
                        low_stock_threshold=low_stock_threshold,
                        last_restocked=timezone.now()
                    )
                    created_count += 1
                    
                    status = "✅ In Stock"
                    if inventory.is_out_of_stock:
                        status = "❌ Out of Stock"
                    elif inventory.is_low_stock:
                        status = "⚠️ Low Stock"
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created inventory: {product.name} - {variant.name}: {quantity} units ({status})'
                        )
                    )
            else:
                # Create inventory for product without variants
                # Random quantity between 30 and 300
                quantity = random.randint(30, 300)
                
                # Random low stock threshold between 10 and 30
                low_stock_threshold = random.randint(10, 30)
                
                inventory = Inventory.objects.create(
                    product=product,
                    variant=None,
                    quantity=quantity,
                    low_stock_threshold=low_stock_threshold,
                    last_restocked=timezone.now()
                )
                created_count += 1
                
                status = "✅ In Stock"
                if inventory.is_out_of_stock:
                    status = "❌ Out of Stock"
                elif inventory.is_low_stock:
                    status = "⚠️ Low Stock"
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created inventory: {product.name}: {quantity} units ({status})'
                    )
                )
        
        # Create some low stock items for testing
        low_stock_products = random.sample(list(products), min(5, len(products)))
        for product in low_stock_products:
            inventory = Inventory.objects.filter(product=product).first()
            if inventory:
                inventory.quantity = random.randint(1, inventory.low_stock_threshold)
                inventory.save()
                self.stdout.write(
                    self.style.WARNING(
                        f'Updated to low stock: {product.name}: {inventory.quantity} units ⚠️'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} inventory records!'
            )
        )
