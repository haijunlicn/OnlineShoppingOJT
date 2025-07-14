import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, filter, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.authService.userLoaded$.pipe(
      filter(loaded => loaded === true),  // WAIT until user loading completes
      map(() => {
        const user = this.authService.getCurrentUser();
        console.log("auth guard user:", user);

        if (this.authService.isLoggedIn() && user?.roleName === 'customer') {
          return true;
        }

        this.router.navigate(['/customer/general/home']);
        return false;
      })
    );
  }
}
