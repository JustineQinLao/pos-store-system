"""
Custom token refresh view that reads refresh token from HttpOnly cookie
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


class CookieTokenRefreshView(APIView):
    """
    Token refresh endpoint that reads refresh token from HttpOnly cookie
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        # Debug: Print all cookies
        print('All cookies:', request.COOKIES)
        
        # Get refresh token from cookie
        refresh_token = request.COOKIES.get('refresh_token')
        
        print(f'Refresh token from cookie: {refresh_token}')
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token not found in cookies',
                'cookies_received': list(request.COOKIES.keys())
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # Validate and refresh token
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            # Optionally rotate refresh token
            new_refresh_token = str(refresh)
            
            # Create response with new access token
            response = Response({
                'access': access_token
            }, status=status.HTTP_200_OK)
            
            # Update refresh token cookie (token rotation)
            response.set_cookie(
                key='refresh_token',
                value=new_refresh_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=7*24*60*60,  # 7 days
                path='/'
            )
            
            return response
            
        except TokenError as e:
            return Response({
                'error': 'Invalid or expired refresh token',
                'detail': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({
                'error': 'Token refresh failed',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
