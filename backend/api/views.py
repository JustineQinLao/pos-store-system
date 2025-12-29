from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    LoginSerializer, 
    VerifyUserSerializer
)

User = get_user_model()


from rest_framework import serializers as rest_serializers


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with user data"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check if user is verified
        if not self.user.is_verified:
            raise rest_serializers.ValidationError({
                'error': 'Your account is pending verification by Super Admin',
                'is_verified': False
            })
        
        # Check if user is active
        if not self.user.is_active:
            raise rest_serializers.ValidationError({
                'error': 'Your account has been deactivated'
            })
        
        # Add user data to response
        data['user'] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view"""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'Registration successful. Your account is pending verification by Super Admin.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint with JWT tokens and HttpOnly cookie"""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_verified:
            return Response({
                'error': 'Your account is pending verification by Super Admin',
                'is_verified': False
            }, status=status.HTTP_403_FORBIDDEN)
        
        if not user.is_active:
            return Response({
                'error': 'Your account has been deactivated'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """User logout endpoint - blacklist refresh token"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """Get current authenticated user"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UnverifiedUsersView(generics.ListAPIView):
    """List all unverified users (Super Admin only)"""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only Super Admin can access
        if not self.request.user.is_super_admin:
            return User.objects.none()
        return User.objects.filter(is_verified=False).order_by('-date_joined')


class VerifyUserView(APIView):
    """Verify or unverify a user (Super Admin only)"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Check if user is Super Admin
        if not request.user.is_super_admin:
            return Response({
                'error': 'Only Super Admin can verify users'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = VerifyUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = serializer.validated_data['user_id']
        is_verified = serializer.validated_data['is_verified']
        
        try:
            user = User.objects.get(id=user_id)
            user.is_verified = is_verified
            user.save()
            
            return Response({
                'message': f'User {user.username} has been {"verified" if is_verified else "unverified"}',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)


class UserListView(generics.ListAPIView):
    """List all users (Admin and Super Admin only)"""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only Admin and Super Admin can access
        if not self.request.user.is_admin:
            return User.objects.none()
        return User.objects.all().order_by('-date_joined')


class EncryptionSettingsView(APIView):
    """Get encryption settings (key and status)"""
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        from .models import EncryptionSettings
        
        settings = EncryptionSettings.get_settings()
        
        return Response({
            'encryption_enabled': settings.encryption_enabled,
            'encryption_key': settings.encryption_key,
            'excluded_routes': settings.excluded_routes
        }, status=status.HTTP_200_OK)
