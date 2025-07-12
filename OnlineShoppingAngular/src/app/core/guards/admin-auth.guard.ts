// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';
// import { Observable, filter, map } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class AdminAuthGuard implements CanActivate {
//   constructor(private authService: AuthService, private router: Router) { }

//   canActivate(): Observable<boolean> {
//     return this.authService.userLoaded$.pipe(
//       filter(loaded => loaded === true),  // WAIT until user loading completes
//       map(() => {
//         const user = this.authService.getCurrentUser();
//         console.log("admin auth guard user:", user);

//         if (this.authService.isLoggedIn() && user?.roleName !== 'customer') {
//           return true;
//         }

//         this.router.navigate(['/admin/login']);
//         return false;
//       })
//     );
//   }
// }

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { combineLatest, Observable } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return combineLatest([
      this.authService.userLoaded$,
      this.authService.user$
    ]).pipe(
      filter(([loaded, user]) => loaded), // wait for loading to finish
      take(1), // only take the first result
      map(([loaded, user]) => {
        console.log('Admin Guard | Loaded:', loaded, '| User:', user);

        if (user && this.authService.isLoggedIn() && user.roleName !== 'customer') {
          return true;
        }

        this.router.navigate(['/admin/login']);
        return false;
      })
    );
  }
}
