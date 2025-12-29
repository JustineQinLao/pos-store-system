from django.core.management.base import BaseCommand
from api.models import Product, AddOn, Category
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed database with product add-ons'

    def handle(self, *args, **kwargs):
        # Clear existing add-ons
        AddOn.objects.all().delete()
        
        # Get categories for applicable products
        beverages = Category.objects.get(name='Beverages')
        snacks = Category.objects.get(name='Snacks')
        bakery = Category.objects.get(name='Bakery')
        frozen = Category.objects.get(name='Frozen Foods')
        
        addons = [
            # Beverage add-ons
            {
                'name': 'Extra Ice',
                'description': 'Extra ice for cold beverages',
                'price': Decimal('0.00'),
                'applicable_products': list(beverages.products.all()),
            },
            {
                'name': 'Lemon Slice',
                'description': 'Fresh lemon slice',
                'price': Decimal('0.25'),
                'applicable_products': list(beverages.products.all()),
            },
            {
                'name': 'Straw',
                'description': 'Drinking straw',
                'price': Decimal('0.00'),
                'applicable_products': list(beverages.products.all()),
            },
            
            # Snack add-ons
            {
                'name': 'Extra Seasoning',
                'description': 'Additional seasoning packet',
                'price': Decimal('0.50'),
                'applicable_products': list(snacks.products.all()),
            },
            
            # Bakery add-ons
            {
                'name': 'Butter Spread',
                'description': 'Individual butter spread',
                'price': Decimal('0.25'),
                'applicable_products': list(bakery.products.all()),
            },
            {
                'name': 'Cream Cheese Spread',
                'description': 'Individual cream cheese spread',
                'price': Decimal('0.50'),
                'applicable_products': list(bakery.products.all()),
            },
            
            # Ice cream add-ons
            {
                'name': 'Chocolate Syrup',
                'description': 'Chocolate syrup topping',
                'price': Decimal('0.75'),
                'applicable_products': [Product.objects.get(sku='FRZ-002')],
            },
            {
                'name': 'Caramel Sauce',
                'description': 'Caramel sauce topping',
                'price': Decimal('0.75'),
                'applicable_products': [Product.objects.get(sku='FRZ-002')],
            },
            {
                'name': 'Sprinkles',
                'description': 'Colorful sprinkles',
                'price': Decimal('0.50'),
                'applicable_products': [Product.objects.get(sku='FRZ-002')],
            },
            {
                'name': 'Whipped Cream',
                'description': 'Fresh whipped cream',
                'price': Decimal('0.50'),
                'applicable_products': [Product.objects.get(sku='FRZ-002')],
            },
            
            # Universal add-ons (no specific products)
            {
                'name': 'Gift Wrapping',
                'description': 'Gift wrap service',
                'price': Decimal('2.99'),
                'applicable_products': [],
            },
            {
                'name': 'Gift Card',
                'description': 'Greeting card',
                'price': Decimal('1.99'),
                'applicable_products': [],
            },
            {
                'name': 'Reusable Bag',
                'description': 'Eco-friendly reusable shopping bag',
                'price': Decimal('0.99'),
                'applicable_products': [],
            },
        ]
        
        created_count = 0
        for addon_data in addons:
            applicable_products = addon_data.pop('applicable_products')
            addon = AddOn.objects.create(
                name=addon_data['name'],
                description=addon_data['description'],
                price=addon_data['price']
            )
            
            # Add applicable products
            if applicable_products:
                addon.applicable_products.set(applicable_products)
            
            created_count += 1
            product_count = len(applicable_products) if applicable_products else 'all'
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created add-on: {addon.name} (applicable to {product_count} products)'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} add-ons!'
            )
        )
