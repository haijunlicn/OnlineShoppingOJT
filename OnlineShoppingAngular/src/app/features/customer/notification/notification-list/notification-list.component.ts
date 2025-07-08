import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationAction, UserNotificationDTO } from '@app/core/models/notification.model';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationModalService } from '@app/core/services/notification-modal.service';
import { NotificationService } from '@app/core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-list',
  standalone: false,
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css'
})

export class NotificationListComponent implements OnInit, OnDestroy {
  notifications: UserNotificationDTO[] = []
  filteredNotifications: UserNotificationDTO[] = []
  paginatedNotifications: UserNotificationDTO[] = []

  loading = true
  currentFilter = "all"
  sortBy = "date-desc"

  // Pagination
  currentPage = 1
  pageSize = 10
  totalPages = 0

  // Stats
  totalNotifications = 0
  unreadCount = 0
  readCount = 0
  todayCount = 0

  private subscription!: Subscription

  constructor(
    private notificationService: NotificationService,
    public notificationModalService: NotificationModalService, // Make this public
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadNotifications()
    this.subscribeToNotifications()
  }

  loadNotifications(): void {
    this.loading = true
    const userId = this.authService.getCurrentUser()?.id!

    this.notificationService.loadInAppNotificationsForUser(userId) // just triggers it

    this.notificationService.notifications$.subscribe({
      next: (notifications) => {
        this.notifications = notifications
        this.calculateStats()
        this.applyFilters()
        this.loading = false
      },
      error: (error) => {
        console.error("Failed to load notifications:", error)
        this.loading = false
      },
    })
  }

  // loadNotifications(): void {
  //   this.loading = true
  //   const userId = this.authService.getCurrentUser()?.id!

  //   this.notificationService.loadInAppNotificationsForUser(userId).subscribe({
  //     next: (notifications) => {
  //       this.notifications = notifications
  //       this.calculateStats()
  //       this.applyFilters()
  //       this.loading = false
  //     },
  //     error: (error) => {
  //       console.error("Failed to load notifications:", error)
  //       this.loading = false
  //     },
  //   })
  // }

  subscribeToNotifications(): void {
    this.subscription = this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications
      this.calculateStats()
      this.applyFilters()
    })
  }

  calculateStats(): void {
    this.totalNotifications = this.notifications.length
    this.unreadCount = this.notifications.filter((n) => !n.read).length
    this.readCount = this.notifications.filter((n) => n.read).length

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    this.todayCount = this.notifications.filter((n) => new Date(n.deliveredAt) >= today).length
  }

  setFilter(filter: string): void {
    this.currentFilter = filter
    this.currentPage = 1
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = [...this.notifications]

    // Apply filter
    switch (this.currentFilter) {
      case "unread":
        filtered = filtered.filter((n) => !n.read)
        break
      case "all":
        break
      default:
        filtered = filtered.filter((n) => n.type === this.currentFilter)
        break
    }

    this.filteredNotifications = filtered
    this.applySorting()
  }

  applySorting(): void {
    switch (this.sortBy) {
      case "date-desc":
        this.filteredNotifications.sort((a, b) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime())
        break
      case "date-asc":
        this.filteredNotifications.sort((a, b) => new Date(a.deliveredAt).getTime() - new Date(b.deliveredAt).getTime())
        break
      case "unread-first":
        this.filteredNotifications.sort((a, b) => {
          if (a.read === b.read) return 0
          return a.read ? 1 : -1
        })
        break
      case "type":
        this.filteredNotifications.sort((a, b) => a.type.localeCompare(b.type))
        break
    }

    this.updatePagination()
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredNotifications.length / this.pageSize)
    const startIndex = (this.currentPage - 1) * this.pageSize
    const endIndex = startIndex + this.pageSize
    this.paginatedNotifications = this.filteredNotifications.slice(startIndex, endIndex)
  }

  onPageChange(page: number): void {
    this.currentPage = page
    this.updatePagination()
  }

  openNotificationDetail(notification: UserNotificationDTO, event?: Event): void {
    if (event) {
      event.stopPropagation()
    }

    this.notificationModalService.openNotificationDetail(notification)

    if (!notification.read) {
      this.markAsRead(notification)
    }
  }

  markAsRead(notification: UserNotificationDTO, event?: Event): void {
    if (event) {
      event.stopPropagation()
    }

    if (!notification.read) {
      this.notificationService.markAsRead(+notification.id).subscribe(() => {
        notification.read = true
        this.calculateStats()
      })
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach((n) => (n.read = true))
      this.calculateStats()
      this.applyFilters()
    })
  }

  handleNotificationAction(action: NotificationAction, notification: UserNotificationDTO, event: Event): void {
    event.stopPropagation()

    switch (action.type) {
      case "navigate":
        this.router.navigate([action.url])
        break
      case "external":
        window.open(action.url, "_blank")
        break
      case "api":
        // Handle API calls
        console.log("API action:", action)
        break
    }
  }

  getFilterTitle(): string {
    switch (this.currentFilter) {
      case "all":
        return "All Notifications"
      case "unread":
        return "Unread Notifications"
      case "ORDER_PLACED":
        return "Order Notifications"
      case "PROMOTION_OFFER":
        return "Promotion Notifications"
      case "ADMIN_MESSAGE":
        return "Admin Messages"
      default:
        return "Filtered Notifications"
    }
  }

  getEmptyStateMessage(): string {
    switch (this.currentFilter) {
      case "unread":
        return "All caught up! No unread notifications."
      case "all":
        return "No notifications yet. We'll notify you when something happens."
      default:
        return "No notifications found for this filter."
    }
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      ORDER_PLACED: "fas fa-shopping-cart text-success",
      ORDER_SHIPPED: "fas fa-truck text-info",
      ORDER_DELIVERED: "fas fa-check-circle text-success",
      REFUND_REQUESTED: "fas fa-undo text-warning",
      REFUND_APPROVED: "fas fa-check-double text-success",
      LOW_STOCK_ALERT: "fas fa-exclamation-triangle text-danger",
      ADMIN_MESSAGE: "fas fa-user-shield text-primary",
      PROMOTION_OFFER: "fas fa-tag text-warning",
    }
    return icons[type] || "fas fa-bell text-secondary"
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

  getTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      ORDER_PLACED: "Order",
      ORDER_SHIPPED: "Shipping",
      ORDER_DELIVERED: "Delivered",
      REFUND_REQUESTED: "Refund",
      REFUND_APPROVED: "Refund",
      LOW_STOCK_ALERT: "Alert",
      ADMIN_MESSAGE: "Admin",
      PROMOTION_OFFER: "Promo",
    }
    return typeLabels[type] || "Info"
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

  trackByNotificationId(index: number, notification: UserNotificationDTO): any {
    return notification.id
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(this.totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return
    this.currentPage = page
    this.applyPagination()
  }

  applyPagination(): void {
    const start = (this.currentPage - 1) * this.pageSize
    const end = start + this.pageSize
    this.paginatedNotifications = this.filteredNotifications.slice(start, end)
    this.totalPages = Math.ceil(this.filteredNotifications.length / this.pageSize)
  }
}
