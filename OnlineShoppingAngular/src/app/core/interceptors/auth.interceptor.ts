import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../services/StorageService';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // List of public API endpoints (no token needed)
  private publicPaths: string[] = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-otp',
    '/auth/resend',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];

  constructor(private storageService: StorageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if the request URL includes any public path
    const isPublic = this.publicPaths.some(path => req.url.includes(path));

    if (isPublic) {
      // If public endpoint, don't add Authorization header
      return next.handle(req);
    }

    const token = this.storageService.getItem('token');

    if (token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
