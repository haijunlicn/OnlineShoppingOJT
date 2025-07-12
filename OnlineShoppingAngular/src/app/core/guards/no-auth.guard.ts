import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.authService.userLoaded$.pipe(
      map(() => {
        const user = this.authService.getCurrentUser();
        console.log("no auth guard user:", user);

        if (this.authService.isLoggedIn() && user?.roleName === 'customer') {
          this.router.navigate(['/customer/general/home']);
          return false;
        }

        return true;
      })
    );
  }
}

