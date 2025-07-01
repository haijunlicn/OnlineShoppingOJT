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
  searchQuery = ""
  notificationCount = 15

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log("Searching for:", this.searchQuery)
      // Implement your search logic here
    }
  }

  onNotificationClick(): void {
    console.log("Notifications clicked")
    // Implement notification logic here
  }

  onProfileClick(): void {
    console.log("Profile clicked")
    this.router.navigate(["/admin/profile"])
  }

  onSettingsClick(): void {
    console.log("Settings clicked")
    this.router.navigate(["/admin/settings"])
  }

  onLogout(): void {
    this.authService.logout()
    this.router.navigate(["/admin/login"])
    console.log("User logged out")
  }
}
