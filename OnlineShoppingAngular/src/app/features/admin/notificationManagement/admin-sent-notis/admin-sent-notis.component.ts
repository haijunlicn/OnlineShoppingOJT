import { Component, OnInit } from "@angular/core";
import { Notification } from "@app/core/models/notification.model";
import { NotificationService } from "@app/core/services/notification.service";

@Component({
  selector: "app-admin-sent-notis",
  standalone : false,
  templateUrl: "./admin-sent-notis.component.html",
  styleUrls: ["./admin-sent-notis.component.css"],
})
export class AdminSentNotisComponent implements OnInit {
  notifications: Notification[] = [];
  isLoading = false;
  error: string | null = null;

  // For modal
  selectedMetadata: any = null;
  showModal = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.error = null;

    this.notificationService.getCustomNotifications().subscribe({
      next: (data) => {
        this.notifications = data.map((n: any) => ({
          ...n,
          id: typeof n.id === 'string' ? parseInt(n.id, 10) : n.id,
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = "Error loading sent notifications";
        this.isLoading = false;
      },
    });
  }

  // Preview short message
  getMessagePreview(message?: string): string {
    if (!message) return "N/A";
    const maxLength = 100;
    return message.length > maxLength ? message.substring(0, maxLength) + "..." : message;
  }

  clearError(): void {
    this.error = null;
  }

  trackByNotificationId(index: number, notification: Notification): any {
    return notification.id;
  }

  // Modal Logic
  openMetadataModal(metadata: string | null): void {
    if (!metadata) {
      this.selectedMetadata = null;
    } else {
      try {
        this.selectedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      } catch {
        this.selectedMetadata = metadata;
      }
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedMetadata = null;
  }
}
