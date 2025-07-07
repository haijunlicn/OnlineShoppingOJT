import { Component, OnInit } from '@angular/core';
import { UserNotificationDTO } from '@app/core/models/notification.model';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationService } from '@app/core/services/notification.service';

@Component({
  selector: 'app-notification-list',
  standalone: false,
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css'
})

export class NotificationListComponent implements OnInit {
  notifications: UserNotificationDTO[] = [];

  constructor(
    private notificationService: NotificationService, 
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.notificationService.connectWebSocket();
    this.notificationService.loadInAppNotificationsForUser(this.authService.getCurrentUser()?.id!);
    this.notificationService.notifications$.subscribe(list => {
      this.notifications = list;
    });
  }

  // markAsRead(noti: UserNotificationDTO) {
  //   if (!noti.read) {
  //     this.notificationService.markAsRead(noti.id).subscribe(() => {
  //       noti.read = true;
  //     });
  //   }
  // }
}