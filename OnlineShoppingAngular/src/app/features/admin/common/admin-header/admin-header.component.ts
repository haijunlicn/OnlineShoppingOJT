import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-admin-header',
  standalone: false,
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css'
})
export class AdminHeaderComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
    console.log('User logged out');
  }
}
