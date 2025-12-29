import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { encryptionInterceptor } from './interceptors/encryption.interceptor';
import { EncryptionService } from './services/encryption.service';
import { initializeApp } from './app.initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([encryptionInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [EncryptionService],
      multi: true
    }
  ]
};
