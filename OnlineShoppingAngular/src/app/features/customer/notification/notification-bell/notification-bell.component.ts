import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserNotificationDTO } from '@app/core/models/notification.model';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationModalService } from '@app/core/services/notification-modal.service';
import { NotificationService } from '@app/core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: "app-notification-bell",
  standalone: false,
  templateUrl: "./notification-bell.component.html",
  styleUrl: "./notification-bell.component.css",
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: UserNotificationDTO[] = []
  unreadCount = 0
  showDropdown = false
  subscription!: Subscription

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private notificationModalService: NotificationModalService,
  ) { }

  ngOnInit(): void {
    this.notificationService.loadInAppNotificationsForUser(this.authService.getCurrentUser()?.id!)
    this.notificationService.connectWebSocket()
    this.subscription = this.notificationService.notifications$.subscribe((notiList) => {
      this.notifications = notiList.map(noti => this.notificationService.renderNotification(noti));
      this.unreadCount = this.notifications.filter((n) => !n.read).length;
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown
  }

  openNotificationDetail(notification: UserNotificationDTO): void {
    this.showDropdown = false
    this.notificationModalService.openNotificationDetail(notification)

    // Mark as read when opened
    if (!notification.read) {
      this.markAsRead(notification)
    }
  }

  quickMarkAsRead(notification: UserNotificationDTO, event: Event): void {
    event.stopPropagation()
    this.markAsRead(notification)
  }

  markAsRead(noti: UserNotificationDTO): void {
    if (!noti.read) {
      this.notificationService.markAsRead(+noti.id).subscribe(() => {
        noti.read = true
        this.unreadCount = this.notifications.filter((n) => !n.read).length
      })
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach((n) => (n.read = true))
      this.unreadCount = 0
    })
  }

  navigateToNotificationsList(): void {
    this.showDropdown = false
    this.router.navigate(["/customer/notifications"])
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  getTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      ORDER_PLACED: "Order",
      ORDER_SHIPPED: "Shipping",
      ORDER_DELIVERED: "Delivered",
      REFUND_REQUESTED: "Refund",
      REFUND_APPROVED: "Refund",
      REFUND_COMPLETED: "Refund",
      LOW_STOCK_ALERT: "Alert",
      ADMIN_MESSAGE: "Admin",
      PROMOTION_OFFER: "Promo",
    }
    return typeLabels[type] || "Info"
  }

  trackByNotificationId(index: number, notification: UserNotificationDTO): any {
    return notification.id
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case "ORDER_PLACED":
      case "ORDER_SHIPPED":
      case "ORDER_DELIVERED":
        return "notification-type-success"
      case "REFUND_REQUESTED":
      case "REFUND_REJECTED":
        return "notification-type-warning"
      case "REFUND_APPROVED":
      case "REFUND_COMPLETED":
        return "notification-type-success"
      case "LOW_STOCK_ALERT":
        return "notification-type-error"
      case "ADMIN_MESSAGE":
        return "notification-type-info"
      case "PROMOTION_OFFER":
        return "notification-type-promo"
      default:
        return "notification-type-default"
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }
}

