from django.core.management.base import BaseCommand
from api.models import Category, Product
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed database with products'

    def handle(self, *args, **kwargs):
        # Clear existing products
        Product.objects.all().delete()
        
        # Get categories
        beverages = Category.objects.get(name='Beverages')
        snacks = Category.objects.get(name='Snacks')
        dairy = Category.objects.get(name='Dairy Products')
        bakery = Category.objects.get(name='Bakery')
        fruits_veg = Category.objects.get(name='Fruits & Vegetables')
        meat = Category.objects.get(name='Meat & Seafood')
        frozen = Category.objects.get(name='Frozen Foods')
        canned = Category.objects.get(name='Canned Goods')
        household = Category.objects.get(name='Household Items')
        personal_care = Category.objects.get(name='Personal Care')
        condiments = Category.objects.get(name='Condiments & Sauces')
        breakfast = Category.objects.get(name='Breakfast Foods')
        
        products = [
            # Beverages
            {'name': 'Coca-Cola', 'category': beverages, 'base_price': Decimal('1.99'), 'sku': 'BEV-001', 'description': 'Classic Coca-Cola soft drink', 'is_taxable': True},
            {'name': 'Pepsi', 'category': beverages, 'base_price': Decimal('1.89'), 'sku': 'BEV-002', 'description': 'Pepsi cola soft drink', 'is_taxable': True},
            {'name': 'Sprite', 'category': beverages, 'base_price': Decimal('1.99'), 'sku': 'BEV-003', 'description': 'Lemon-lime flavored soda', 'is_taxable': True},
            {'name': 'Orange Juice', 'category': beverages, 'base_price': Decimal('3.99'), 'sku': 'BEV-004', 'description': 'Fresh squeezed orange juice', 'is_taxable': False},
            {'name': 'Mineral Water', 'category': beverages, 'base_price': Decimal('1.49'), 'sku': 'BEV-005', 'description': 'Pure mineral water', 'is_taxable': False},
            {'name': 'Energy Drink', 'category': beverages, 'base_price': Decimal('2.99'), 'sku': 'BEV-006', 'description': 'Energy boost drink', 'is_taxable': True},
            
            # Snacks
            {'name': 'Potato Chips', 'category': snacks, 'base_price': Decimal('2.49'), 'sku': 'SNK-001', 'description': 'Crispy potato chips', 'is_taxable': True},
            {'name': 'Chocolate Bar', 'category': snacks, 'base_price': Decimal('1.79'), 'sku': 'SNK-002', 'description': 'Milk chocolate bar', 'is_taxable': True},
            {'name': 'Cookies', 'category': snacks, 'base_price': Decimal('3.49'), 'sku': 'SNK-003', 'description': 'Chocolate chip cookies', 'is_taxable': True},
            {'name': 'Pretzels', 'category': snacks, 'base_price': Decimal('2.99'), 'sku': 'SNK-004', 'description': 'Salted pretzels', 'is_taxable': True},
            {'name': 'Popcorn', 'category': snacks, 'base_price': Decimal('2.29'), 'sku': 'SNK-005', 'description': 'Butter flavored popcorn', 'is_taxable': True},
            
            # Dairy Products
            {'name': 'Whole Milk', 'category': dairy, 'base_price': Decimal('3.99'), 'sku': 'DRY-001', 'description': 'Fresh whole milk', 'is_taxable': False},
            {'name': 'Cheddar Cheese', 'category': dairy, 'base_price': Decimal('4.99'), 'sku': 'DRY-002', 'description': 'Sharp cheddar cheese', 'is_taxable': False},
            {'name': 'Greek Yogurt', 'category': dairy, 'base_price': Decimal('1.99'), 'sku': 'DRY-003', 'description': 'Plain Greek yogurt', 'is_taxable': False},
            {'name': 'Butter', 'category': dairy, 'base_price': Decimal('3.49'), 'sku': 'DRY-004', 'description': 'Salted butter', 'is_taxable': False},
            {'name': 'Cream Cheese', 'category': dairy, 'base_price': Decimal('2.99'), 'sku': 'DRY-005', 'description': 'Philadelphia cream cheese', 'is_taxable': False},
            
            # Bakery
            {'name': 'White Bread', 'category': bakery, 'base_price': Decimal('2.49'), 'sku': 'BAK-001', 'description': 'Sliced white bread', 'is_taxable': False},
            {'name': 'Croissant', 'category': bakery, 'base_price': Decimal('1.99'), 'sku': 'BAK-002', 'description': 'Butter croissant', 'is_taxable': True},
            {'name': 'Bagels', 'category': bakery, 'base_price': Decimal('3.99'), 'sku': 'BAK-003', 'description': 'Pack of 6 bagels', 'is_taxable': False},
            {'name': 'Muffins', 'category': bakery, 'base_price': Decimal('4.49'), 'sku': 'BAK-004', 'description': 'Blueberry muffins', 'is_taxable': True},
            
            # Fruits & Vegetables
            {'name': 'Bananas', 'category': fruits_veg, 'base_price': Decimal('0.59'), 'sku': 'FRV-001', 'description': 'Fresh bananas per lb', 'is_taxable': False},
            {'name': 'Apples', 'category': fruits_veg, 'base_price': Decimal('1.99'), 'sku': 'FRV-002', 'description': 'Red apples per lb', 'is_taxable': False},
            {'name': 'Tomatoes', 'category': fruits_veg, 'base_price': Decimal('2.49'), 'sku': 'FRV-003', 'description': 'Fresh tomatoes per lb', 'is_taxable': False},
            {'name': 'Lettuce', 'category': fruits_veg, 'base_price': Decimal('1.99'), 'sku': 'FRV-004', 'description': 'Fresh lettuce head', 'is_taxable': False},
            {'name': 'Carrots', 'category': fruits_veg, 'base_price': Decimal('1.49'), 'sku': 'FRV-005', 'description': 'Fresh carrots per lb', 'is_taxable': False},
            
            # Meat & Seafood
            {'name': 'Chicken Breast', 'category': meat, 'base_price': Decimal('6.99'), 'sku': 'MET-001', 'description': 'Boneless chicken breast per lb', 'is_taxable': False},
            {'name': 'Ground Beef', 'category': meat, 'base_price': Decimal('5.99'), 'sku': 'MET-002', 'description': 'Ground beef per lb', 'is_taxable': False},
            {'name': 'Salmon Fillet', 'category': meat, 'base_price': Decimal('12.99'), 'sku': 'MET-003', 'description': 'Fresh salmon fillet per lb', 'is_taxable': False},
            {'name': 'Pork Chops', 'category': meat, 'base_price': Decimal('7.99'), 'sku': 'MET-004', 'description': 'Pork chops per lb', 'is_taxable': False},
            
            # Frozen Foods
            {'name': 'Frozen Pizza', 'category': frozen, 'base_price': Decimal('5.99'), 'sku': 'FRZ-001', 'description': 'Pepperoni frozen pizza', 'is_taxable': True},
            {'name': 'Ice Cream', 'category': frozen, 'base_price': Decimal('4.99'), 'sku': 'FRZ-002', 'description': 'Vanilla ice cream', 'is_taxable': True},
            {'name': 'Frozen Vegetables', 'category': frozen, 'base_price': Decimal('2.99'), 'sku': 'FRZ-003', 'description': 'Mixed frozen vegetables', 'is_taxable': False},
            {'name': 'Frozen Fries', 'category': frozen, 'base_price': Decimal('3.49'), 'sku': 'FRZ-004', 'description': 'Frozen french fries', 'is_taxable': True},
            
            # Canned Goods
            {'name': 'Canned Tomatoes', 'category': canned, 'base_price': Decimal('1.49'), 'sku': 'CAN-001', 'description': 'Diced canned tomatoes', 'is_taxable': False},
            {'name': 'Canned Beans', 'category': canned, 'base_price': Decimal('1.29'), 'sku': 'CAN-002', 'description': 'Black beans', 'is_taxable': False},
            {'name': 'Canned Soup', 'category': canned, 'base_price': Decimal('2.49'), 'sku': 'CAN-003', 'description': 'Chicken noodle soup', 'is_taxable': False},
            {'name': 'Canned Tuna', 'category': canned, 'base_price': Decimal('1.99'), 'sku': 'CAN-004', 'description': 'Tuna in water', 'is_taxable': False},
            
            # Household Items
            {'name': 'Paper Towels', 'category': household, 'base_price': Decimal('5.99'), 'sku': 'HOU-001', 'description': 'Pack of paper towels', 'is_taxable': True},
            {'name': 'Dish Soap', 'category': household, 'base_price': Decimal('3.49'), 'sku': 'HOU-002', 'description': 'Liquid dish soap', 'is_taxable': True},
            {'name': 'Laundry Detergent', 'category': household, 'base_price': Decimal('8.99'), 'sku': 'HOU-003', 'description': 'Laundry detergent', 'is_taxable': True},
            {'name': 'Trash Bags', 'category': household, 'base_price': Decimal('6.99'), 'sku': 'HOU-004', 'description': 'Kitchen trash bags', 'is_taxable': True},
            
            # Personal Care
            {'name': 'Shampoo', 'category': personal_care, 'base_price': Decimal('5.99'), 'sku': 'PER-001', 'description': 'Hair shampoo', 'is_taxable': True},
            {'name': 'Toothpaste', 'category': personal_care, 'base_price': Decimal('3.99'), 'sku': 'PER-002', 'description': 'Fluoride toothpaste', 'is_taxable': True},
            {'name': 'Soap Bar', 'category': personal_care, 'base_price': Decimal('2.49'), 'sku': 'PER-003', 'description': 'Bath soap bar', 'is_taxable': True},
            {'name': 'Deodorant', 'category': personal_care, 'base_price': Decimal('4.49'), 'sku': 'PER-004', 'description': 'Stick deodorant', 'is_taxable': True},
            
            # Condiments & Sauces
            {'name': 'Ketchup', 'category': condiments, 'base_price': Decimal('2.99'), 'sku': 'CON-001', 'description': 'Tomato ketchup', 'is_taxable': True},
            {'name': 'Mayonnaise', 'category': condiments, 'base_price': Decimal('3.49'), 'sku': 'CON-002', 'description': 'Real mayonnaise', 'is_taxable': True},
            {'name': 'Mustard', 'category': condiments, 'base_price': Decimal('2.49'), 'sku': 'CON-003', 'description': 'Yellow mustard', 'is_taxable': True},
            {'name': 'Soy Sauce', 'category': condiments, 'base_price': Decimal('3.99'), 'sku': 'CON-004', 'description': 'Soy sauce', 'is_taxable': True},
            
            # Breakfast Foods
            {'name': 'Cereal', 'category': breakfast, 'base_price': Decimal('4.99'), 'sku': 'BRK-001', 'description': 'Corn flakes cereal', 'is_taxable': True},
            {'name': 'Oatmeal', 'category': breakfast, 'base_price': Decimal('3.99'), 'sku': 'BRK-002', 'description': 'Instant oatmeal', 'is_taxable': False},
            {'name': 'Pancake Mix', 'category': breakfast, 'base_price': Decimal('3.49'), 'sku': 'BRK-003', 'description': 'Pancake mix', 'is_taxable': False},
            {'name': 'Maple Syrup', 'category': breakfast, 'base_price': Decimal('5.99'), 'sku': 'BRK-004', 'description': 'Pure maple syrup', 'is_taxable': True},
        ]
        
        created_count = 0
        for product_data in products:
            product = Product.objects.create(**product_data)
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created product: {product.name} ({product.sku})'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} products!'
            )
        )
