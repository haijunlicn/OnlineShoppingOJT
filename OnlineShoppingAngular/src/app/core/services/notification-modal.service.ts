import { Injectable } from '@angular/core';
import { UserNotificationDTO } from '../models/notification.model';

declare var bootstrap: any

@Injectable({
  providedIn: 'root'
})

export class NotificationModalService {
  private currentNotification: UserNotificationDTO | null = null

  constructor() {}

  openNotificationDetail(notification: UserNotificationDTO): void {
    this.currentNotification = notification

    console.log("modal opened!", notification);
    

    // Wait for the next tick to ensure the modal content is updated
    setTimeout(() => {
      const modalElement = document.getElementById("notificationDetailModal")
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement)
        modal.show()
      }
    }, 0)
  }

  getCurrentNotification(): UserNotificationDTO | null {
    return this.currentNotification
  }

  closeModal(): void {
    const modalElement = document.getElementById("notificationDetailModal")
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement)
      if (modal) {
        modal.hide()
      }
    }
    this.currentNotification = null
  }
}
