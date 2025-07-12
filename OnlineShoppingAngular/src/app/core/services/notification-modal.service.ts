// import { Injectable } from '@angular/core';
// import { UserNotificationDTO } from '../models/notification.model';

// declare var bootstrap: any

// @Injectable({
//   providedIn: 'root'
// })

// export class NotificationModalService {
//   private currentNotification: UserNotificationDTO | null = null

//   constructor() {}

//   openNotificationDetail(notification: UserNotificationDTO): void {
//     this.currentNotification = notification
//     console.log("modal opened!", notification);

//     // Wait for the next tick to ensure the modal content is updated
//     setTimeout(() => {
//       const modalElement = document.getElementById("notificationDetailModal")
//       if (modalElement) {
//         const modal = new bootstrap.Modal(modalElement)
//         modal.show()
//       }
//     }, 0)
//   }

//   getCurrentNotification(): UserNotificationDTO | null {
//     return this.currentNotification
//   }

//   closeModal(): void {
//     const modalElement = document.getElementById("notificationDetailModal")
//     if (modalElement) {
//       const modal = bootstrap.Modal.getInstance(modalElement)
//       if (modal) {
//         modal.hide()
//       }
//     }
//     this.currentNotification = null
//   }
// }


// import { Injectable, NgZone } from '@angular/core';
// import { UserNotificationDTO } from '../models/notification.model';

// declare var bootstrap: any;

// @Injectable({
//   providedIn: 'root'
// })
// export class NotificationModalService {
//   private currentNotification: UserNotificationDTO | null = null;

//   constructor(private zone: NgZone) { }

//   openNotificationDetail(notification: UserNotificationDTO): void {
//     this.currentNotification = notification;

//     console.log("Modal detail set, waiting for view to render...");

//     // Wait for Angular to complete rendering
//     this.zone.runOutsideAngular(() => {
//       requestAnimationFrame(() => {
//         console.log("helo");

//         const modalElement = document.getElementById("notificationDetailModal");
//         if (modalElement) {
//           const modal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
//           modal.show();
//         }
//       });
//     });
//   }

//   getCurrentNotification(): UserNotificationDTO | null {
//     return this.currentNotification;
//   }

//   closeModal(): void {
//     const modalElement = document.getElementById("notificationDetailModal");
//     if (modalElement) {
//       const modal = bootstrap.Modal.getInstance(modalElement);
//       if (modal) {
//         modal.hide();
//       }
//     }
//     this.currentNotification = null;
//   }
// }

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

  // openNotificationDetail(notification: UserNotificationDTO): void {
  //   // Update the BehaviorSubject value
  //   this.currentNotificationSubject.next(notification);

  //   console.log("Modal detail set, waiting for view to render...");

  //   // Wait for Angular view to update, then show modal outside Angular zone
  //   this.zone.runOutsideAngular(() => {
  //     requestAnimationFrame(() => {
  //       const modalElement = document.getElementById("notificationDetailModal");
  //       if (modalElement) {
  //         const modal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
  //         modal.show();
  //       }
  //     });
  //   });
  // }

  openNotificationDetail(notification: UserNotificationDTO): void {
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
