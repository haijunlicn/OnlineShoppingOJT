import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NotificationAction, UserNotificationDTO } from '@app/core/models/notification.model';
import { NotificationModalService } from '@app/core/services/notification-modal.service';
import { NotificationService } from '@app/core/services/notification.service';
import { Subscription } from 'rxjs';

declare var bootstrap: any

@Component({
  selector: "app-notification-detail",
  standalone: false,
  templateUrl: "./notification-detail.component.html",
  styleUrls: ["./notification-detail.component.css"],
})

export class NotificationDetailComponent implements OnInit, OnDestroy {
  // @Input() notification: UserNotificationDTO | null = null

  notification: UserNotificationDTO | null = null;
  private sub!: Subscription;

  constructor(
    private notificationService: NotificationService,
    private notificationModalService: NotificationModalService,
    private router: Router,
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        const modal = bootstrap.Modal.getInstance(document.getElementById("notificationDetailModal"))
        if (modal) {
          modal.hide();
          document.body.classList.remove("modal-open")
          document.querySelector(".modal-backdrop")?.remove()
        }
      }
    })
  }

  ngOnInit(): void {
    // Suppose your service exposes an observable to emit current notification
    this.notificationModalService.currentNotification$.subscribe(noti => {
      this.notification = noti;
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  markAsRead(): void {
    if (this.notification && !this.notification.read) {
      this.notificationService.markAsRead(+this.notification.id).subscribe(() => {
        this.notification!.read = true
      })
    }
  }

  handleAction(action: NotificationAction): void {
    switch (action.type) {
      case "navigate":
        this.closeModal()
        this.router.navigate([action.url])
        break
      case "external":
        window.open(action.url, "_blank")
        break
      case "api":
        // Handle API calls
        this.handleApiAction(action)
        break
      case "modal":
        // Handle opening another modal
        console.log("Open modal:", action.url)
        break
    }
  }

  private handleApiAction(action: NotificationAction): void {
    // Implement API action handling based on your needs
    console.log("API Action:", action)
  }

  closeModal(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById("notificationDetailModal"))
    if (modal) {
      modal.hide()
    }
  }

  getModalHeaderClass(type: string): string {
    switch (type) {
      case "ORDER_PLACED":
      case "ORDER_SHIPPED":
      case "ORDER_DELIVERED":
        return "modal-header-success"
      case "REFUND_REQUESTED":
      case "REFUND_REJECTED":
        return "modal-header-warning"
      case "LOW_STOCK_ALERT":
        return "modal-header-error"
      case "ADMIN_MESSAGE":
        return "modal-header-info"
      case "PROMOTION_OFFER":
        return "modal-header-promo"
      default:
        return "modal-header-default"
    }
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      ORDER_PLACED: "fas fa-shopping-cart",
      ORDER_SHIPPED: "fas fa-truck",
      ORDER_DELIVERED: "fas fa-check-circle",
      REFUND_REQUESTED: "fas fa-undo",
      REFUND_APPROVED: "fas fa-check-double",
      LOW_STOCK_ALERT: "fas fa-exclamation-triangle",
      ADMIN_MESSAGE: "fas fa-user-shield",
      PROMOTION_OFFER: "fas fa-tag",
    }
    return icons[type] || "fas fa-bell"
  }

  getTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      ORDER_PLACED: "Order Placed",
      ORDER_SHIPPED: "Order Shipped",
      ORDER_DELIVERED: "Order Delivered",
      REFUND_REQUESTED: "Refund Requested",
      REFUND_APPROVED: "Refund Approved",
      LOW_STOCK_ALERT: "Stock Alert",
      ADMIN_MESSAGE: "Admin Message",
      PROMOTION_OFFER: "Promotion",
    }
    return typeLabels[type] || "Notification"
  }

  getActionButtonClass(style?: string): string {
    switch (style) {
      case "primary":
        return "btn-primary"
      case "success":
        return "btn-success"
      case "warning":
        return "btn-warning"
      case "danger":
        return "btn-danger"
      case "info":
        return "btn-info"
      default:
        return "btn-outline-primary"
    }
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
}
