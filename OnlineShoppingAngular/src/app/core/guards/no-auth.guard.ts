import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();

    console.log("no auth guard user : ", user);

    if (this.authService.isLoggedIn() && user?.roleName === 'customer') {
      this.router.navigate(['/customer/general/home']);
      return false;
    }

    return true; // not logged in OR not customer => can proceed
  }
  
}
