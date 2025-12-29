from django.core.management.base import BaseCommand
from api.models import Product, Variant
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed database with product variants'

    def handle(self, *args, **kwargs):
        # Clear existing variants
        Variant.objects.all().delete()
        
        # Get products that should have variants
        coca_cola = Product.objects.get(sku='BEV-001')
        pepsi = Product.objects.get(sku='BEV-002')
        sprite = Product.objects.get(sku='BEV-003')
        orange_juice = Product.objects.get(sku='BEV-004')
        potato_chips = Product.objects.get(sku='SNK-001')
        chocolate_bar = Product.objects.get(sku='SNK-002')
        milk = Product.objects.get(sku='DRY-001')
        ice_cream = Product.objects.get(sku='FRZ-002')
        
        variants = [
            # Beverage sizes
            {'product': coca_cola, 'name': 'Small (12oz)', 'price_adjustment': Decimal('0.00'), 'sku_suffix': '-SM'},
            {'product': coca_cola, 'name': 'Medium (16oz)', 'price_adjustment': Decimal('0.50'), 'sku_suffix': '-MD'},
            {'product': coca_cola, 'name': 'Large (20oz)', 'price_adjustment': Decimal('1.00'), 'sku_suffix': '-LG'},
            
            {'product': pepsi, 'name': 'Small (12oz)', 'price_adjustment': Decimal('0.00'), 'sku_suffix': '-SM'},
            {'product': pepsi, 'name': 'Medium (16oz)', 'price_adjustment': Decimal('0.50'), 'sku_suffix': '-MD'},
            {'product': pepsi, 'name': 'Large (20oz)', 'price_adjustment': Decimal('1.00'), 'sku_suffix': '-LG'},
            
            {'product': sprite, 'name': 'Small (12oz)', 'price_adjustment': Decimal('0.00'), 'sku_suffix': '-SM'},
            {'product': sprite, 'name': 'Medium (16oz)', 'price_adjustment': Decimal('0.50'), 'sku_suffix': '-MD'},
            {'product': sprite, 'name': 'Large (20oz)', 'price_adjustment': Decimal('1.00'), 'sku_suffix': '-LG'},
            
            {'product': orange_juice, 'name': 'Small (12oz)', 'price_adjustment': Decimal('0.00'), 'sku_suffix': '-SM'},
            {'product': orange_juice, 'name': 'Large (32oz)', 'price_adjustment': Decimal('2.00'), 'sku_suffix': '-LG'},
            
            # Chip sizes
            {'product': potato_chips, 'name': 'Regular (5oz)', 'price_adjustment': Decimal('0.00'), 'sku_suffix': '-REG'},
            {'product': potato_chips, 'name': 'Family Size (10oz)', 'price_adjustment': Decimal('1.50'), 'sku_suffix': '-FAM'},
            {'product': potato_chips, 'name': 'Party Size (15oz)', 'price_adjustment': Decimal('2.50'), 'sku_suffix': '-PTY'},
            
            # Chocolate bar sizes
            {'product': chocolate_bar, 'name': 'Regular', 'price_adjustment': Decimal('0.00'), 'sku_suffix': '-REG'},
            {'product': chocolate_bar, 'name': 'King Size', 'price_adjustment': Decimal('0.70'), 'sku_suffix': '-KNG'},
            
            # Milk sizes
            {'product': milk, 'name': 'Half Gallon', 'price_adjustment': Decimal('0.00'), 'sku_suffix': '-HG'},
            {'product': milk, 'name': 'Gallon', 'price_adjustment': Decimal('2.00'), 'sku_suffix': '-GAL'},
            
            # Ice cream sizes
            {'product': ice_cream, 'name': 'Pint', 'price_adjustment': Decimal('0.00'), 'sku_suffix': '-PT'},
            {'product': ice_cream, 'name': 'Quart', 'price_adjustment': Decimal('2.00'), 'sku_suffix': '-QT'},
            {'product': ice_cream, 'name': 'Half Gallon', 'price_adjustment': Decimal('3.00'), 'sku_suffix': '-HG'},
        ]
        
        created_count = 0
        for variant_data in variants:
            variant = Variant.objects.create(**variant_data)
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created variant: {variant.product.name} - {variant.name}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} variants!'
            )
        )
