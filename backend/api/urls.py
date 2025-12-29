from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    UnverifiedUsersView,
    VerifyUserView,
    UserListView,
    CustomTokenObtainPairView,
    EncryptionSettingsView,
)
from .views_products import (
    CategoryViewSet,
    ProductViewSet,
    VariantViewSet,
    AddOnViewSet,
    InventoryViewSet,
)
from .views_transactions import TransactionViewSet

# Create router for product management
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'variants', VariantViewSet, basename='variant')
router.register(r'addons', AddOnViewSet, basename='addon')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    
    # JWT token endpoints
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management endpoints (Admin/Super Admin)
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/unverified/', UnverifiedUsersView.as_view(), name='unverified-users'),
    path('users/verify/', VerifyUserView.as_view(), name='verify-user'),
    
    # Encryption settings
    path('encryption/settings/', EncryptionSettingsView.as_view(), name='encryption-settings'),
    
    # Product management endpoints
    path('', include(router.urls)),
]
