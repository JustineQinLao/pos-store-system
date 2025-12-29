import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';

export interface EncryptionSettings {
  encryption_enabled: boolean;
  encryption_key: string;
  excluded_routes: string;
}

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private apiUrl = 'http://localhost:8083/api';
  private settingsSubject = new BehaviorSubject<EncryptionSettings | null>(null);
  public settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Don't auto-load in constructor to avoid circular dependency
    // Load will be called from app.component.ts
  }

  /**
   * Load encryption settings from backend
   */
  loadSettings(): Observable<EncryptionSettings> {
    return this.http.get<EncryptionSettings>(`${this.apiUrl}/encryption/settings/`).pipe(
      tap(settings => {
        this.settingsSubject.next(settings);
      })
    );
  }

  /**
   * Get current settings
   */
  getSettings(): EncryptionSettings | null {
    return this.settingsSubject.value;
  }

  /**
   * Check if encryption is enabled
   */
  isEncryptionEnabled(): boolean {
    const settings = this.getSettings();
    return settings ? settings.encryption_enabled : false;
  }

  /**
   * Check if route is excluded from encryption
   */
  isRouteExcluded(path: string): boolean {
    const settings = this.getSettings();
    if (!settings || !settings.excluded_routes) {
      return false;
    }

    const excludedList = settings.excluded_routes.split(',').map(r => r.trim()).filter(r => r.length > 0);
    
    // Check if path matches any excluded route
    const isExcluded = excludedList.some(route => {
      // Remove trailing slash from both for comparison
      const normalizedPath = path.replace(/\/$/, '');
      const normalizedRoute = route.replace(/\/$/, '');
      return normalizedPath === normalizedRoute || normalizedPath.startsWith(normalizedRoute + '/');
    });
    
    console.log('Checking route exclusion:', { path, excludedList, isExcluded });
    return isExcluded;
  }

  /**
   * Encrypt data using AES
   */
  encryptData(data: any): string {
    const settings = this.getSettings();
    if (!settings || !settings.encryption_key) {
      throw new Error('Encryption key not available');
    }

    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, settings.encryption_key).toString();
    return encrypted;
  }

  /**
   * Decrypt data using AES
   */
  decryptData(encryptedString: string): any {
    const settings = this.getSettings();
    if (!settings || !settings.encryption_key) {
      throw new Error('Encryption key not available');
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedString, settings.encryption_key);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  }

  /**
   * Prepare request payload (encrypt if needed)
   */
  prepareRequestPayload(data: any, url: string): any {
    console.log('prepareRequestPayload called:', { url, encryptionEnabled: this.isEncryptionEnabled() });
    
    // Check if encryption is enabled
    if (!this.isEncryptionEnabled()) {
      console.log('Encryption disabled, returning original data');
      return data;
    }

    // Check if route is excluded
    if (this.isRouteExcluded(url)) {
      console.log('Route excluded, returning original data');
      return data;
    }

    // Encrypt the data
    try {
      console.log('Encrypting data...');
      const encrypted = this.encryptData(data);
      console.log('Data encrypted successfully');
      return { encrypted_data: encrypted };
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  /**
   * Process response data (decrypt if needed)
   */
  processResponseData(response: any): any {
    // Check if response is encrypted
    if (response && response.encrypted === true && response.data) {
      return this.decryptData(response.data);
    }
    return response;
  }
}
