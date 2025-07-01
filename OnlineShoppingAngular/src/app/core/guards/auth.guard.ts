// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';


// @Injectable({
//   providedIn: 'root'
// })
// export class AuthGuard implements CanActivate {

//   constructor(private authService: AuthService, private router: Router) {}

//   canActivate(): boolean {
//     const user = this.authService.getCurrentUser();

//     console.log("auth guard user : ", user);


//     if (this.authService.isLoggedIn() && user?.roleName === 'customer') {
//       return true;
//     } else {
//       this.router.navigate(['/customer/general/home']);
//       return false;
//     }
//   }

// }


import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.authService.userLoaded$.pipe(
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
