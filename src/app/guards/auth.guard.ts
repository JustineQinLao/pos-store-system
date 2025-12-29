import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EncryptionService } from '../services/encryption.service';
import { map, filter, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const encryptionService = inject(EncryptionService);
  const router = inject(Router);

  // Wait for encryption settings to be loaded before checking authentication
  return encryptionService.settings$.pipe(
    filter(settings => settings !== null),
    take(1),
    map(() => {
      const token = authService.getAccessToken();
      const user = authService.getUser();
      
      // Check if both token and user exist
      if (!token || !user) {
        console.warn('Auth Guard: No token or user found, redirecting to login');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      // Verify user is verified
      if (!user.is_verified) {
        console.warn('Auth Guard: User not verified');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      return true;
    }),
    catchError(() => {
      console.error('Auth Guard: Error checking authentication');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};
