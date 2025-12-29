from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with test users for each role'

    def handle(self, *args, **kwargs):
        # Clear existing test users (except admin)
        User.objects.filter(username__startswith='test_').delete()
        
        test_users = [
            # Super Admins
            {
                'username': 'test_superadmin1',
                'email': 'superadmin1@posstore.com',
                'password': 'SuperAdmin123!',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'SUPER_ADMIN',
                'is_verified': True,
                'phone_number': '+1234567890',
                'is_staff': True,
                'is_superuser': True
            },
            {
                'username': 'test_superadmin2',
                'email': 'superadmin2@posstore.com',
                'password': 'SuperAdmin123!',
                'first_name': 'Michael',
                'last_name': 'Chen',
                'role': 'SUPER_ADMIN',
                'is_verified': True,
                'phone_number': '+1234567891',
                'is_staff': True,
                'is_superuser': True
            },
            
            # Admins
            {
                'username': 'test_admin1',
                'email': 'admin1@posstore.com',
                'password': 'Admin123!',
                'first_name': 'Emily',
                'last_name': 'Rodriguez',
                'role': 'ADMIN',
                'is_verified': True,
                'phone_number': '+1234567892',
                'is_staff': True
            },
            {
                'username': 'test_admin2',
                'email': 'admin2@posstore.com',
                'password': 'Admin123!',
                'first_name': 'David',
                'last_name': 'Kim',
                'role': 'ADMIN',
                'is_verified': True,
                'phone_number': '+1234567893',
                'is_staff': True
            },
            
            # Cashiers
            {
                'username': 'test_cashier1',
                'email': 'cashier1@posstore.com',
                'password': 'Cashier123!',
                'first_name': 'Jessica',
                'last_name': 'Martinez',
                'role': 'CASHIER',
                'is_verified': True,
                'phone_number': '+1234567894'
            },
            {
                'username': 'test_cashier2',
                'email': 'cashier2@posstore.com',
                'password': 'Cashier123!',
                'first_name': 'James',
                'last_name': 'Wilson',
                'role': 'CASHIER',
                'is_verified': True,
                'phone_number': '+1234567895'
            },
            {
                'username': 'test_cashier3',
                'email': 'cashier3@posstore.com',
                'password': 'Cashier123!',
                'first_name': 'Maria',
                'last_name': 'Garcia',
                'role': 'CASHIER',
                'is_verified': True,
                'phone_number': '+1234567896'
            },
            
            # Unverified users (for testing verification flow)
            {
                'username': 'test_unverified1',
                'email': 'unverified1@posstore.com',
                'password': 'Unverified123!',
                'first_name': 'John',
                'last_name': 'Pending',
                'role': 'CASHIER',
                'is_verified': False,
                'phone_number': '+1234567897'
            },
            {
                'username': 'test_unverified2',
                'email': 'unverified2@posstore.com',
                'password': 'Unverified123!',
                'first_name': 'Jane',
                'last_name': 'Waiting',
                'role': 'ADMIN',
                'is_verified': False,
                'phone_number': '+1234567898'
            },
        ]
        
        created_count = 0
        for user_data in test_users:
            password = user_data.pop('password')
            user = User.objects.create_user(**user_data)
            user.set_password(password)
            user.save()
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created {user.role} user: {user.username}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} test users!'
            )
        )
