import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-admin-header',
  standalone: false,
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css'
})

export class AdminHeaderComponent implements OnInit, OnDestroy {

  @Input() accountInfo: any = { name: 'Admin User' };
  @Input() sidebarExpanded: boolean = false;

  currentDateTime = ""
  currentDate = ""
  currentTime = ""
  notificationCount = 15
  // accountInfo: any = { name: "Admin User" }

  private timeInterval: any
  private isBrowser: boolean

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private authService: AuthService,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId)
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.updateDateTime()
      // Update time every second
      this.timeInterval = setInterval(() => {
        this.updateDateTime()
      }, 1000)
    }
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
  }

  private updateDateTime(): void {
    const now = new Date();

    // Format date (e.g., "Monday, December 7, 2025")
    this.currentDate = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format time (e.g., "3:45 AM")
    this.currentTime = now.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
  }

  onNotificationClick(): void {
    console.log("Notifications clicked")
    this.router.navigate(["/admin/notificationCreate"])
  }

  onSettingsClick(): void {
    console.log("Settings clicked")
    this.router.navigate(["/admin/settings"])
  }

  onProfileClick(): void {
    console.log("Profile clicked")
    this.router.navigate(["/admin/profile"])
  }

  onLogout(): void {
    this.authService.logout()
    this.router.navigate(["/admin/login"])
    console.log("User logged out")
  }
}
