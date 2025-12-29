import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { EncryptionService } from './encryption.service';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
  phone_number?: string;
  address?: string;
  date_joined: string;
  is_active: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  access: string;
  refresh: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8083/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private encryptionService: EncryptionService
  ) {
    this.loadUserFromStorage();
  }

  private getHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }

  private saveTokens(access: string, refresh: string): void {
    // Encrypt tokens before storing
    const encryptedAccess = this.encryptionService.encryptData({ token: access });
    const encryptedRefresh = this.encryptionService.encryptData({ token: refresh });
    
    localStorage.setItem('access_token', encryptedAccess);
    localStorage.setItem('refresh_token', encryptedRefresh);
  }

  private saveUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearStorage(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getAccessToken(): string | null {
    const encrypted = localStorage.getItem('access_token');
    if (!encrypted) {
      console.warn('No access token found in localStorage');
      return null;
    }
    
    try {
      // Check if encryption settings are loaded
      const settings = this.encryptionService.getSettings();
      if (!settings) {
        console.warn('Encryption settings not loaded yet, waiting...');
        // Try to get settings synchronously if available
        return null;
      }
      
      const decrypted = this.encryptionService.decryptData(encrypted);
      if (!decrypted || !decrypted.token) {
        console.error('Decrypted token is invalid');
        return null;
      }
      return decrypted.token;
    } catch (e) {
      console.error('Failed to decrypt access token:', e);
      // Clear invalid token
      localStorage.removeItem('access_token');
      return null;
    }
  }

  getRefreshToken(): string | null {
    const encrypted = localStorage.getItem('refresh_token');
    if (!encrypted) return null;
    
    try {
      // Check if encryption settings are loaded
      if (!this.encryptionService.isEncryptionEnabled() && !this.encryptionService.getSettings()) {
        console.warn('Encryption settings not loaded yet');
        return null;
      }
      const decrypted = this.encryptionService.decryptData(encrypted);
      return decrypted.token;
    } catch (e) {
      console.error('Failed to decrypt refresh token:', e);
      return null;
    }
  }

  register(data: RegisterData): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/`, data, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  login(data: LoginData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login/`, data, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      tap((response: LoginResponse) => {
        if (response.access && response.refresh) {
          this.saveTokens(response.access, response.refresh);
          this.saveUser(response.user);
        }
      })
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post(`${this.apiUrl}/auth/logout/`, 
      { refresh: refreshToken },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.clearStorage();
      }),
      catchError((error) => {
        this.clearStorage();
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<any> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      return throwError(() => new Error('No refresh token'));
    }
    
    return this.http.post(`${this.apiUrl}/auth/token/refresh/`, 
      { refresh },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    ).pipe(
      tap((response: any) => {
        if (response.access) {
          const currentRefresh = this.getRefreshToken();
          if (currentRefresh) {
            this.saveTokens(response.access, currentRefresh);
          }
        }
      }),
      catchError((error) => {
        this.clearStorage();
        return throwError(() => error);
      })
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me/`, {
      headers: this.getHeaders()
    });
  }

  checkAuthStatus(): void {
    if (this.getAccessToken()) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          this.saveUser(user);
        },
        error: () => {
          this.clearStorage();
        }
      });
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.currentUserSubject.value;
    
    if (!token || !user) {
      return false;
    }
    
    return true;
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  isSuperAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'SUPER_ADMIN' || false;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || false;
  }

  isCashier(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'CASHIER' || false;
  }

  isCustomer(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'CUSTOMER' || false;
  }

  // Super Admin functions
  getUnverifiedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/unverified/`, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  verifyUser(userId: number, isVerified: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/verify/`, {
      user_id: userId,
      is_verified: isVerified
    }, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/`, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }
}
