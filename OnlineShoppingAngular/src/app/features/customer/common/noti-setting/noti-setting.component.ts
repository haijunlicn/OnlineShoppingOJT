import { Component, Input, OnInit } from '@angular/core';
import { User } from '@app/core/models/User';


interface NotificationSetting {
  id: string
  title: string
  description: string
  enabled: boolean
  category: "email" | "push"
}

@Component({
  selector: "app-noti-setting",
  standalone: false,
  templateUrl: "./noti-setting.component.html",
  styleUrls: ["./noti-setting.component.css"],
})
export class NotiSettingComponent implements OnInit {
  @Input() currentUser: User | null = null

  emailNotifications: NotificationSetting[] = []
  pushNotifications: NotificationSetting[] = []
  isUpdating = false
  successMessage = ""
  errorMessage = ""

  ngOnInit(): void {
    this.loadNotificationSettings()
  }

  loadNotificationSettings(): void {
    this.emailNotifications = [
      {
        id: "account-updates",
        title: "Account Updates",
        description: "Receive emails about account changes",
        enabled: true,
        category: "email",
      },
      {
        id: "security-alerts",
        title: "Security Alerts",
        description: "Get notified about security events",
        enabled: true,
        category: "email",
      },
      {
        id: "marketing-emails",
        title: "Marketing Emails",
        description: "Receive promotional emails and offers",
        enabled: false,
        category: "email",
      },
    ]

    this.pushNotifications = [
      {
        id: "browser-notifications",
        title: "Browser Notifications",
        description: "Show notifications in your browser",
        enabled: true,
        category: "push",
      },
      {
        id: "mobile-push",
        title: "Mobile Push",
        description: "Send notifications to your mobile device",
        enabled: true,
        category: "push",
      },
    ]
  }

  toggleNotification(notification: NotificationSetting): void {
    notification.enabled = !notification.enabled
    this.saveNotificationSettings()
  }

  saveNotificationSettings(): void {
    this.isUpdating = true
    this.clearMessages()

    // Simulate API call
    setTimeout(() => {
      this.successMessage = "Notification preferences updated successfully!"
      this.isUpdating = false
      setTimeout(() => this.clearMessages(), 3000)
    }, 500)
  }

  private clearMessages(): void {
    this.successMessage = ""
    this.errorMessage = ""
  }
}
