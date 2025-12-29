import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from '../services/encryption.service';

export const encryptionInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const encryptionService = inject(EncryptionService);

  // Get the URL path from the request URL
  let urlPath: string;
  try {
    urlPath = new URL(req.url).pathname;
  } catch {
    // If URL parsing fails, use the URL as is
    urlPath = req.url;
  }

  // Clone request with encrypted body if needed
  let modifiedReq = req;
  
  if (req.body && req.method !== 'GET') {
    const encryptedPayload = encryptionService.prepareRequestPayload(req.body, urlPath);
    
    // Only modify if encryption actually happened
    if (encryptedPayload && encryptedPayload.encrypted_data) {
      modifiedReq = req.clone({
        body: encryptedPayload
      });
    }
  }

  // Process response and decrypt if needed
  return next(modifiedReq).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body) {
        const decryptedBody = encryptionService.processResponseData(event.body);
        
        if (decryptedBody !== event.body) {
          return event.clone({
            body: decryptedBody
          });
        }
      }
      return event;
    })
  );
};
