import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user: User | null = this.authService.getCurrentUser();

    console.log("adminn auth guard user : ", user);

    if (this.authService.isLoggedIn() && user?.roleName != null && user?.roleName != undefined && user?.roleName !== 'customer') {
      console.log("admin auth going...");     
      return true; // ✅ logged in and is admin
    }

    this.router.navigate(['/admin/login']); // 🚫 not admin
    return false;
  }
}
