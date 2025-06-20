import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class AdminNoAuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean {
    const user: User | null = this.authService.getCurrentUser();
    console.log("user role : ", user?.roleName);

    if (this.authService.isLoggedIn() && user?.roleName != null && user?.roleName != undefined && user.roleName !== 'customer') {
      console.log("admin no auth going...");
      this.router.navigate(['/admin/dashboard']); // already logged in as admin
      return false;
    }

    return true; // not logged in => allow
  }
}
