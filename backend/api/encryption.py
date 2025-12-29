"""
Encryption utilities for API payload encryption/decryption
Compatible with CryptoJS AES encryption
"""
import json
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import hashlib


class EncryptionService:
    """Service for encrypting and decrypting API payloads using AES (CryptoJS compatible)"""
    
    @staticmethod
    def _evp_bytes_to_key(password: bytes, salt: bytes, key_len: int = 32, iv_len: int = 16) -> tuple:
        """
        Derive key and IV using OpenSSL's EVP_BytesToKey function
        This matches CryptoJS's key derivation
        """
        m = []
        i = 0
        while len(b''.join(m)) < (key_len + iv_len):
            md = hashlib.md5()
            data = password + salt
            if i > 0:
                data = m[i - 1] + password + salt
            md.update(data)
            m.append(md.digest())
            i += 1
        ms = b''.join(m)
        return ms[:key_len], ms[key_len:key_len + iv_len]
    
    @staticmethod
    def encrypt_data(data: dict, encryption_key: str) -> str:
        """
        Encrypt dictionary data to base64 string using AES-256-CBC
        Compatible with CryptoJS AES.encrypt()
        
        Args:
            data: Dictionary to encrypt
            encryption_key: Encryption key (passphrase)
            
        Returns:
            Base64 encoded encrypted string (CryptoJS format with Salted__ prefix)
        """
        try:
            import os
            
            # Convert data to JSON
            json_data = json.dumps(data)
            plaintext = json_data.encode('utf-8')
            
            # Generate random salt (8 bytes)
            salt = os.urandom(8)
            
            # Derive key and IV using EVP_BytesToKey (CryptoJS compatible)
            key, iv = EncryptionService._evp_bytes_to_key(encryption_key.encode('utf-8'), salt)
            
            # Create cipher and encrypt
            cipher = AES.new(key, AES.MODE_CBC, iv)
            ciphertext = cipher.encrypt(pad(plaintext, AES.block_size))
            
            # Combine in CryptoJS format: "Salted__" + salt + ciphertext
            encrypted_bytes = b'Salted__' + salt + ciphertext
            
            # Return base64 encoded
            return base64.b64encode(encrypted_bytes).decode('utf-8')
        except Exception as e:
            raise ValueError(f"Encryption failed: {str(e)}")
    
    @staticmethod
    def decrypt_data(encrypted_string: str, encryption_key: str) -> dict:
        """
        Decrypt base64 string to dictionary using AES-256-CBC
        Compatible with CryptoJS AES.decrypt()
        
        Args:
            encrypted_string: Base64 encoded encrypted string (CryptoJS format)
            encryption_key: Encryption key (passphrase)
            
        Returns:
            Decrypted dictionary
        """
        try:
            # Decode base64
            encrypted_bytes = base64.b64decode(encrypted_string)
            
            # Check for "Salted__" prefix (CryptoJS format)
            if encrypted_bytes[:8] != b'Salted__':
                raise ValueError("Invalid CryptoJS format: missing 'Salted__' prefix")
            
            # Extract salt (bytes 8-16) and ciphertext (from byte 16 onwards)
            salt = encrypted_bytes[8:16]
            ciphertext = encrypted_bytes[16:]
            
            # Derive key and IV using EVP_BytesToKey (CryptoJS compatible)
            key, iv = EncryptionService._evp_bytes_to_key(encryption_key.encode('utf-8'), salt)
            
            # Create cipher and decrypt
            cipher = AES.new(key, AES.MODE_CBC, iv)
            plaintext = unpad(cipher.decrypt(ciphertext), AES.block_size)
            
            # Convert to dictionary
            json_data = plaintext.decode('utf-8')
            return json.loads(json_data)
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")
    
    @staticmethod
    def is_route_excluded(path: str, excluded_routes: str) -> bool:
        """
        Check if route is excluded from encryption
        
        Args:
            path: Request path
            excluded_routes: Comma-separated list of excluded routes
            
        Returns:
            True if route is excluded
        """
        if not excluded_routes:
            return False
        
        excluded_list = [route.strip() for route in excluded_routes.split(',')]
        return any(path.startswith(route) for route in excluded_list if route)
