from django.core.management.base import BaseCommand
from api.models import Category


class Command(BaseCommand):
    help = 'Seed database with product categories'

    def handle(self, *args, **kwargs):
        # Clear existing categories
        Category.objects.all().delete()
        
        categories = [
            {
                'name': 'Beverages',
                'description': 'Soft drinks, juices, water, and other beverages',
                'is_active': True
            },
            {
                'name': 'Snacks',
                'description': 'Chips, crackers, cookies, and other snack items',
                'is_active': True
            },
            {
                'name': 'Dairy Products',
                'description': 'Milk, cheese, yogurt, and dairy items',
                'is_active': True
            },
            {
                'name': 'Bakery',
                'description': 'Bread, pastries, cakes, and baked goods',
                'is_active': True
            },
            {
                'name': 'Fruits & Vegetables',
                'description': 'Fresh fruits and vegetables',
                'is_active': True
            },
            {
                'name': 'Meat & Seafood',
                'description': 'Fresh and frozen meat, poultry, and seafood',
                'is_active': True
            },
            {
                'name': 'Frozen Foods',
                'description': 'Frozen meals, ice cream, and frozen items',
                'is_active': True
            },
            {
                'name': 'Canned Goods',
                'description': 'Canned vegetables, fruits, soups, and preserved foods',
                'is_active': True
            },
            {
                'name': 'Household Items',
                'description': 'Cleaning supplies, paper products, and household essentials',
                'is_active': True
            },
            {
                'name': 'Personal Care',
                'description': 'Toiletries, cosmetics, and personal hygiene products',
                'is_active': True
            },
            {
                'name': 'Condiments & Sauces',
                'description': 'Ketchup, mayo, sauces, and condiments',
                'is_active': True
            },
            {
                'name': 'Breakfast Foods',
                'description': 'Cereals, oatmeal, pancake mix, and breakfast items',
                'is_active': True
            },
        ]
        
        created_count = 0
        for category_data in categories:
            category = Category.objects.create(**category_data)
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created category: {category.name}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} categories!'
            )
        )
