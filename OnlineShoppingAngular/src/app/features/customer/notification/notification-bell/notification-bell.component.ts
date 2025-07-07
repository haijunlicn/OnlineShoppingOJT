import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserNotificationDTO } from '@app/core/models/notification.model';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationService } from '@app/core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: false,
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})

export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: UserNotificationDTO[] = [];
  unreadCount = 0;
  showDropdown = false;
  subscription!: Subscription;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.notificationService.loadInAppNotificationsForUser(this.authService.getCurrentUser()?.id!);
    this.notificationService.connectWebSocket();
    this.subscription = this.notificationService.notifications$.subscribe(notiList => {
      this.notifications = notiList;
      this.unreadCount = notiList.filter(n => !n.read).length;
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  markAsRead(noti: UserNotificationDTO) {
    if (!noti.read) {
      this.notificationService.markAsRead(noti.id).subscribe(() => {
        noti.read = true;
        this.unreadCount = this.notifications.filter(n => !n.read).length;
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}