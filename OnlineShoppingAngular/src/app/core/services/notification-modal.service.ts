import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserNotificationDTO } from '../models/notification.model';

declare var bootstrap: any;

@Injectable({
  providedIn: 'root'
})
export class NotificationModalService {
  // BehaviorSubject to hold current notification; initial value null
  private currentNotificationSubject = new BehaviorSubject<UserNotificationDTO | null>(null);

  // Observable for components to subscribe to
  currentNotification$ = this.currentNotificationSubject.asObservable();

  constructor(private zone: NgZone) { }

  openNotificationDetail(notification: UserNotificationDTO): void {
    console.log("noti detail : ", notification);
    this.currentNotificationSubject.next(notification);
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        const modalElement = document.getElementById("notificationDetailModal");
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
          modal.show();
        }
      }, 50); // allow DOM & focus to stabilize
    });
  }

  getCurrentNotification(): UserNotificationDTO | null {
    // Get current value synchronously if needed
    return this.currentNotificationSubject.getValue();
  }

  closeModal(): void {
    const modalElement = document.getElementById("notificationDetailModal");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    // Reset current notification to null
    this.currentNotificationSubject.next(null);
  }
}
