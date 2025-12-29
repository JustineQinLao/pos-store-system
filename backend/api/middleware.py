"""
Middleware for automatic encryption/decryption of API payloads
"""
import json
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from .models import EncryptionSettings
from .encryption import EncryptionService


class EncryptionMiddleware(MiddlewareMixin):
    """Middleware to handle encryption/decryption of requests and responses"""
    
    def process_request(self, request):
        """Decrypt incoming request data if encryption is enabled"""
        
        # Skip non-API routes
        if not request.path.startswith('/api/'):
            return None
        
        # Get encryption settings
        try:
            settings = EncryptionSettings.get_settings()
        except Exception:
            return None
        
        # Skip if encryption disabled
        if not settings.encryption_enabled:
            return None
        
        # Skip excluded routes
        if EncryptionService.is_route_excluded(request.path, settings.excluded_routes):
            return None
        
        # Only process POST, PUT, PATCH requests with body
        if request.method in ['POST', 'PUT', 'PATCH'] and request.body:
            try:
                # Parse request body
                body_unicode = request.body.decode('utf-8')
                body_data = json.loads(body_unicode)
                
                # Check if data is encrypted (has 'encrypted_data' key)
                if 'encrypted_data' in body_data:
                    encrypted_string = body_data['encrypted_data']
                    
                    # Decrypt data
                    decrypted_data = EncryptionService.decrypt_data(
                        encrypted_string, 
                        settings.encryption_key
                    )
                    
                    # Replace request body with decrypted data
                    request._body = json.dumps(decrypted_data).encode('utf-8')
                else:
                    # If encryption is enabled but data is not encrypted, reject
                    return JsonResponse({
                        'error': 'Encryption required',
                        'detail': 'This endpoint requires encrypted data when encryption is enabled'
                    }, status=400)
                    
            except Exception as e:
                return JsonResponse({
                    'error': 'Decryption failed',
                    'detail': str(e)
                }, status=400)
        
        return None
    
    def process_response(self, request, response):
        """Encrypt outgoing response data if encryption is enabled"""
        
        # Skip non-API routes
        if not request.path.startswith('/api/'):
            return response
        
        # Get encryption settings
        try:
            settings = EncryptionSettings.get_settings()
        except Exception:
            return response
        
        # Skip if encryption disabled
        if not settings.encryption_enabled:
            return response
        
        # Skip excluded routes
        if EncryptionService.is_route_excluded(request.path, settings.excluded_routes):
            return response
        
        # Only encrypt JSON responses with 200-299 status codes
        if (response.status_code >= 200 and response.status_code < 300 and
            response.get('Content-Type', '').startswith('application/json')):
            try:
                # Get response data
                response_data = json.loads(response.content.decode('utf-8'))
                
                # Encrypt data
                encrypted_string = EncryptionService.encrypt_data(
                    response_data,
                    settings.encryption_key
                )
                
                # Create encrypted response
                encrypted_response = JsonResponse({
                    'encrypted': True,
                    'data': encrypted_string
                })
                
                return encrypted_response
                
            except Exception as e:
                # If encryption fails, return original response
                return response
        
        return response
