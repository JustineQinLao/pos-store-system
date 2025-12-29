import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EncryptionService } from '../services/encryption.service';
import { map, filter, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const encryptionService = inject(EncryptionService);
  const router = inject(Router);

  // Wait for encryption settings to be loaded before checking roles
  return encryptionService.settings$.pipe(
    filter(settings => settings !== null),
    take(1),
    map(() => {
      const token = authService.getAccessToken();
      const user = authService.getUser();
      
      // Check authentication first
      if (!token || !user) {
        console.warn('Role Guard: No token or user found, redirecting to login');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      // Verify user is verified
      if (!user.is_verified) {
        console.warn('Role Guard: User not verified');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      // Get required roles from route data
      const requiredRoles = route.data['roles'] as string[];
      
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // Check if user has required role
      if (requiredRoles.includes(user.role)) {
        console.log(`Role Guard: User has required role ${user.role}`);
        return true;
      }

      // User doesn't have required role
      console.warn(`Role Guard: User role ${user.role} not in required roles [${requiredRoles.join(', ')}]`);
      router.navigate(['/products']);
      return false;
    }),
    catchError(() => {
      console.error('Role Guard: Error checking role');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};
