from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Run all seeder commands in the correct order'

    def handle(self, *args, **kwargs):
        self.stdout.write(
            self.style.WARNING(
                '\n' + '='*60 + '\n' +
                'Starting database seeding process...\n' +
                '='*60 + '\n'
            )
        )
        
        seeders = [
            ('seed_users', 'Users'),
            ('seed_categories', 'Categories'),
            ('seed_products', 'Products'),
            ('seed_variants', 'Variants'),
            ('seed_addons', 'Add-ons'),
            ('seed_inventory', 'Inventory'),
        ]
        
        for command_name, description in seeders:
            self.stdout.write(
                self.style.WARNING(
                    f'\n--- Seeding {description} ---'
                )
            )
            try:
                call_command(command_name)
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error seeding {description}: {str(e)}'
                    )
                )
                return
        
        self.stdout.write(
            self.style.SUCCESS(
                '\n' + '='*60 + '\n' +
                '✅ All seeders completed successfully!\n' +
                '='*60 + '\n'
            )
        )
        
        # Print summary
        from api.models import User, Category, Product, Variant, AddOn, Inventory
        
        self.stdout.write(
            self.style.SUCCESS(
                '\n📊 Database Summary:\n' +
                f'  - Users: {User.objects.count()}\n' +
                f'  - Categories: {Category.objects.count()}\n' +
                f'  - Products: {Product.objects.count()}\n' +
                f'  - Variants: {Variant.objects.count()}\n' +
                f'  - Add-ons: {AddOn.objects.count()}\n' +
                f'  - Inventory Records: {Inventory.objects.count()}\n'
            )
        )
