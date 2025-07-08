import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService, OrderDetail } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
@Component({
  selector: "app-order-list",
  standalone: false,
  templateUrl: "./order-list.component.html",
  styleUrl: "./order-list.component.css",
})
export class OrderListComponent implements OnInit, OnDestroy {
  orders: OrderDetail[] = []
  filteredOrders: OrderDetail[] = []
  loading = true
  error = ""
  currentUserId = 0
  selectedFilter = "all"
  searchTerm = ""
  dropdownOpen = false
  private subscriptions: Subscription[] = []

  // Pagination state
  currentPage = 1;
  pageSize = 5;

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize) || 1;
  }

  get paginatedOrders(): OrderDetail[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  constructor(
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
  ) {}

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement
    if (!target.closest(".filter-dropdown")) {
      this.dropdownOpen = false
    }
  }

  ngOnInit(): void {
    // Initialize user authentication
    this.authService.initializeUserFromToken()
    const user = this.authService.getCurrentUser()
    this.currentUserId = user ? user.id : 0

    if (this.currentUserId) {
      this.loadOrders()
    } else {
      this.error = "User not authenticated. Please log in to view your orders."
      this.loading = false
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }

  loadOrders(): void {
    this.loading = true
    this.error = ""

    const ordersSub = this.orderService.getOrdersByUserId(this.currentUserId).subscribe({
      next: (orders: OrderDetail[]) => {
        // Sort orders by creation date (newest first)
        this.orders = orders.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        this.filteredOrders = [...this.orders]
        this.loading = false
      },
      error: (err) => {
        console.error("Error loading orders:", err)
        this.error = "Failed to load orders. Please try again later."
        this.loading = false
      },
    })

    this.subscriptions.push(ordersSub)
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen
  }

  selectFilter(filter: string): void {
    this.selectedFilter = filter
    this.dropdownOpen = false
    this.applyFilters()
  }

  filterOrders(status: string): void {
    this.selectedFilter = status
    this.applyFilters()
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = [...this.orders]

    // Apply status filter
    if (this.selectedFilter !== "all") {
      filtered = filtered.filter((order) => order.paymentStatus?.toLowerCase() === this.selectedFilter.toLowerCase())
    }

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.trackingNumber?.toLowerCase().includes(searchLower) ||
          order.items?.some((item) => item.product.name.toLowerCase().includes(searchLower)),
      )
    }

    this.filteredOrders = filtered
    this.currentPage = 1; // Reset to first page on filter
  }

  clearFilters(): void {
    this.selectedFilter = "all"
    this.searchTerm = ""
    this.applyFilters()
  }

  getFilterTitle(): string {
    switch (this.selectedFilter) {
      case "all":
        return this.searchTerm ? "Search Results" : "All Orders"
      case "pending":
        return "Pending Orders"
      case "paid":
        return "Paid Orders"
      case "shipped":
        return "Shipped Orders"
      case "delivered":
        return "Delivered Orders"
      case "cancelled":
        return "Cancelled Orders"
      default:
        return "Filtered Orders"
    }
  }

  getFilterLabel(): string {
    switch (this.selectedFilter) {
      case "all":
        return "All Orders"
      case "pending":
        return "Pending"
      case "paid":
        return "Paid"
      case "shipped":
        return "Shipped"
      case "delivered":
        return "Delivered"
      case "cancelled":
        return "Cancelled"
      default:
        return "Filter"
    }
  }

  viewOrderDetail(orderId: number): void {
    this.router.navigate(["/customer/orderDetail", orderId])
  }

  getOrderStatusClass(status: string): string {
    if (!status) return "status-default"

    switch (status.toLowerCase()) {
      case "paid":
        return "status-paid"
      case "pending":
        return "status-pending"
      case "payment failed":
        return "status-failed"
      case "shipped":
        return "status-shipped"
      case "delivered":
        return "status-delivered"
      case "cancelled":
        return "status-cancelled"
      default:
        return "status-default"
    }
  }

  getOrderStatusIcon(status: string): string {
    if (!status) return "fas fa-info-circle"

    switch (status.toLowerCase()) {
      case "paid":
        return "fas fa-check-circle"
      case "pending":
        return "fas fa-clock"
      case "payment failed":
        return "fas fa-times-circle"
      case "shipped":
        return "fas fa-shipping-fast"
      case "delivered":
        return "fas fa-box-open"
      case "cancelled":
        return "fas fa-ban"
      default:
        return "fas fa-info-circle"
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  formatCurrency(amount: number): string {
    if (typeof amount !== "number") return "0 MMK"

    return (
      new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + " MMK"
    )
  }

  getTotalItems(order: OrderDetail): number {
    if (!order.items || !Array.isArray(order.items)) return 0
    return order.items.reduce((total, item) => total + (item.quantity || 0), 0)
  }

  getSubtotal(order: OrderDetail): number {
    if (!order.items || !Array.isArray(order.items)) return 0
    return order.items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0)
  }

  goBackToHome(): void {
    this.router.navigate(["/customer/home"])
  }

  trackByOrderId(index: number, order: OrderDetail): number {
    return order.id
  }

  onImageError(event: any): void {
    event.target.src = "assets/img/default-product.jpg"
  }

  // Statistics methods
  getPendingOrders(): number {
    return this.orders.filter((order) => {
      const status = order.paymentStatus?.toLowerCase()
      return status === "pending" || status === "payment failed"
    }).length
  }

  getCompletedOrders(): number {
    return this.orders.filter((order) => {
      const status = order.paymentStatus?.toLowerCase()
      return status === "paid" || status === "delivered"
    }).length
  }

  getShippedOrders(): number {
    return this.orders.filter((order) => order.paymentStatus?.toLowerCase() === "shipped").length
  }

  getCancelledOrders(): number {
    return this.orders.filter((order) => order.paymentStatus?.toLowerCase() === "cancelled").length
  }

  getFilteredOrdersCount(status: string): number {
    if (status === "all") return this.orders.length

    return this.orders.filter((order) => order.paymentStatus?.toLowerCase() === status.toLowerCase()).length
  }

  getTotalAmount(): number {
    return this.orders.reduce((total, order) => total + (order.totalAmount || 0), 0)
  }

  // Payment method display methods
  getPaymentMethodName(order: OrderDetail): string {
    if (order.paymentMethod?.methodName) {
      return order.paymentMethod.methodName
    }
    if (order.paymentType) {
      return order.paymentType.charAt(0).toUpperCase() + order.paymentType.slice(1)
    }
    return "Not specified"
  }

  getPaymentMethodType(order: OrderDetail): string {
    return order.paymentMethod?.type || order.paymentType || "unknown"
  }

  getPaymentMethodIcon(order: OrderDetail): string {
    const type = this.getPaymentMethodType(order).toLowerCase()

    if (type.includes("qr") || type.includes("mobile") || type.includes("wallet")) {
      return "fas fa-qrcode"
    } else if (type.includes("credit") || type.includes("card")) {
      return "fas fa-credit-card"
    } else if (type.includes("bank")) {
      return "fas fa-university"
    }
    return "fas fa-money-bill-wave"
  }

  getPaymentMethodClass(order: OrderDetail): string {
    const type = this.getPaymentMethodType(order).toLowerCase()

    if (type.includes("qr") || type.includes("mobile") || type.includes("wallet")) {
      return "payment-qr"
    } else if (type.includes("credit") || type.includes("card")) {
      return "payment-credit"
    }
    return "payment-default"
  }
}