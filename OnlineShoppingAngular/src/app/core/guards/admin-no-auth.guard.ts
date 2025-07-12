import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, filter, map, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminNoAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.authService.userLoaded$.pipe(
      filter(loaded => loaded),
      take(1),
      map(() => {
        const user = this.authService.getCurrentUser();
        console.log("admin no auth guard user:", user);

        if (this.authService.isLoggedIn() && user?.roleName !== 'customer') {
          this.router.navigate(['/admin/dashboard']);
          return false;
        }

        return true;
      })
    );
  }

  // canActivate(): Observable<boolean> {
  //   return this.authService.userLoaded$.pipe(
  //     filter(loaded => loaded), // ✅ Wait until user is loaded
  //     map(() => {
  //       const user = this.authService.getCurrentUser();
  //       console.log("admin no auth guard user:", user);

  //       if (this.authService.isLoggedIn() && user?.roleName !== 'customer') {
  //         this.router.navigate(['/admin/dashboard']);
  //         return false;
  //       }

  //       return true;
  //     })
  //   );
  // }

  // canActivate(): Observable<boolean> {
  //   return this.authService.userLoaded$.pipe(
  //     map(() => {
  //       const user = this.authService.getCurrentUser();
  //       console.log("admin no auth guard user:", user);

  //       if (this.authService.isLoggedIn() && user?.roleName !== 'customer') {
  //         this.router.navigate(['/admin/dashboard']);
  //         return false;
  //       }

  //       return true;
  //     })
  //   );
  // }
}

