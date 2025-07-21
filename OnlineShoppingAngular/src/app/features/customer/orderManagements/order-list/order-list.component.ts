import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderDetail, OrderItemDetail } from '@app/core/models/order.dto';
import { PdfExportService } from '@app/core/services/pdf-export.service';
import { ExcelExportService } from '@app/core/services/excel-export.service';
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
  selectedOrderType = "NORMAL" // Default to NORMAL
  searchTerm = ""
  dropdownOpen = false
  orderTypeDropdownOpen = false
  private subscriptions: Subscription[] = []

  // Pagination state
  currentPage = 1
  pageSize = 5

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize) || 1
  }

  get paginatedOrders(): OrderDetail[] {
    const start = (this.currentPage - 1) * this.pageSize
    return this.filteredOrders.slice(start, start + this.pageSize)
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return
    this.currentPage = page
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
    }
  }

  setPageSize(size: number): void {
    this.pageSize = size
    this.currentPage = 1
  }

  constructor(
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService
  ) {}

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement
    if (!target.closest(".filter-dropdown")) {
      this.dropdownOpen = false
    }
    if (!target.closest(".order-type-dropdown")) {
      this.orderTypeDropdownOpen = false
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
        this.applyFilters()
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
    this.orderTypeDropdownOpen = false
  }

  toggleOrderTypeDropdown(): void {
    this.orderTypeDropdownOpen = !this.orderTypeDropdownOpen
    this.dropdownOpen = false
  }

  selectFilter(filter: string): void {
    this.selectedFilter = filter
    this.dropdownOpen = false
    this.applyFilters()
  }

  selectOrderType(orderType: string): void {
    this.selectedOrderType = orderType
    this.orderTypeDropdownOpen = false
    this.applyFilters()
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = [...this.orders]

    // Apply order type filter
    if (this.selectedOrderType !== "all") {
      filtered = filtered.filter((order) => (order.orderType || "NORMAL") === this.selectedOrderType)
    }

    // Apply order status filter
    if (this.selectedFilter !== "all") {
      filtered = filtered.filter((order) => {
        const orderStatus = order.currentOrderStatus?.toLowerCase()
        switch (this.selectedFilter) {
          case "pending":
            return orderStatus === "order_pending"
          case "confirmed":
            return orderStatus === "order_confirmed"
          case "packed":
            return orderStatus === "packed"
          case "shipped":
            return orderStatus === "shipped"
          case "out_for_delivery":
            return orderStatus === "out_for_delivery"
          case "delivered":
            return orderStatus === "delivered"
          case "cancelled":
            return orderStatus === "order_cancelled"
          default:
            return true
        }
      })
    }

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.trackingNumber?.toLowerCase().includes(searchLower) ||
          order.items?.some((item: OrderItemDetail) => item.product.name.toLowerCase().includes(searchLower)),
      )
    }

    this.filteredOrders = filtered
    this.currentPage = 1 // Reset to first page on filter
  }

  clearFilters(): void {
    this.selectedFilter = "all"
    this.selectedOrderType = "NORMAL"
    this.searchTerm = ""
    this.applyFilters()
  }

  getFilterTitle(): string {
    let title = ""

    // Order type part
    if (this.selectedOrderType === "REPLACEMENT") {
      title = "Replacement Orders"
    } else if (this.selectedOrderType === "NORMAL") {
      title = "Normal Orders"
    } else {
      title = "All Orders"
    }

    // Status part
    if (this.selectedFilter !== "all") {
      const statusLabel = this.getFilterLabel()
      title = `${statusLabel} ${this.selectedOrderType === "all" ? "Orders" : title}`
    }

    // Search part
    if (this.searchTerm) {
      title = "Search Results"
    }

    return title
  }

  getFilterLabel(): string {
    switch (this.selectedFilter) {
      case "all":
        return "All Status"
      case "pending":
        return "Pending"
      case "confirmed":
        return "Confirmed"
      case "packed":
        return "Packed"
      case "shipped":
        return "Shipped"
      case "out_for_delivery":
        return "Out for Delivery"
      case "delivered":
        return "Delivered"
      case "cancelled":
        return "Cancelled"
      default:
        return "Filter"
    }
  }

  getOrderTypeLabel(): string {
    switch (this.selectedOrderType) {
      case "NORMAL":
        return "Normal Orders"
      case "REPLACEMENT":
        return "Replacement Orders"
      case "all":
        return "All Types"
      default:
        return "Order Type"
    }
  }

  viewOrderDetail(orderId: number): void {
    this.router.navigate(["/customer/orderDetail", orderId])
  }

  // Updated to use currentOrderStatus instead of paymentStatus
  getOrderStatusClass(status: string): string {
    if (!status) return "status-default"

    switch (status.toLowerCase()) {
      case "order_pending":
        return "status-pending"
      case "order_confirmed":
        return "status-confirmed"
      case "packed":
        return "status-packed"
      case "shipped":
        return "status-shipped"
      case "out_for_delivery":
        return "status-out-for-delivery"
      case "delivered":
        return "status-delivered"
      case "order_cancelled":
        return "status-cancelled"
      case "payment_rejected":
        return "status-failed"
      default:
        return "status-default"
    }
  }

  // Updated to use currentOrderStatus instead of paymentStatus
  getOrderStatusIcon(status: string): string {
    if (!status) return "fas fa-info-circle"

    switch (status.toLowerCase()) {
      case "order_pending":
        return "fas fa-clock"
      case "order_confirmed":
        return "fas fa-thumbs-up"
      case "packed":
        return "fas fa-box"
      case "shipped":
        return "fas fa-truck"
      case "out_for_delivery":
        return "fas fa-shipping-fast"
      case "delivered":
        return "fas fa-box-open"
      case "order_cancelled":
        return "fas fa-ban"
      case "payment_rejected":
        return "fas fa-times-circle"
      default:
        return "fas fa-info-circle"
    }
  }

  // Helper method to get user-friendly status label
  getOrderStatusLabel(status: string): string {
    if (!status) return "Unknown"

    switch (status.toLowerCase()) {
      case "order_pending":
        return "Pending"
      case "order_confirmed":
        return "Confirmed"
      case "packed":
        return "Packed"
      case "shipped":
        return "Shipped"
      case "out_for_delivery":
        return "Out for Delivery"
      case "delivered":
        return "Delivered"
      case "order_cancelled":
        return "Cancelled"
      case "payment_rejected":
        return "Payment Rejected"
      default:
        return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
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

    return order.items.reduce((total: number, item: OrderItemDetail) => total + (item.quantity || 0), 0)
  }

  getSubtotal(order: OrderDetail): number {
    if (!order.items || !Array.isArray(order.items)) return 0

    return order.items.reduce(
      (total: number, item: OrderItemDetail) => total + (item.price || 0) * (item.quantity || 0),
      0,
    )
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

  // Updated statistics methods to use currentOrderStatus
  getPendingOrders(): number {
    return this.orders.filter((order) => {
      const status = order.currentOrderStatus?.toLowerCase()
      return status === "order_pending"
    }).length
  }

  getCompletedOrders(): number {
    return this.orders.filter((order) => {
      const status = order.currentOrderStatus?.toLowerCase()
      return status === "delivered"
    }).length
  }

  getShippedOrders(): number {
    return this.orders.filter((order) => {
      const status = order.currentOrderStatus?.toLowerCase()
      return status === "shipped" || status === "out_for_delivery"
    }).length
  }

  getCancelledOrders(): number {
    return this.orders.filter((order) => {
      const status = order.currentOrderStatus?.toLowerCase()
      return status === "order_cancelled"
    }).length
  }

  // Updated to work with order status filters
  getFilteredOrdersCount(status: string): number {
    if (status === "all") return this.orders.length

    return this.orders.filter((order) => {
      const orderStatus = order.currentOrderStatus?.toLowerCase()
      switch (status) {
        case "pending":
          return orderStatus === "order_pending"
        case "confirmed":
          return orderStatus === "order_confirmed"
        case "packed":
          return orderStatus === "packed"
        case "shipped":
          return orderStatus === "shipped"
        case "out_for_delivery":
          return orderStatus === "out_for_delivery"
        case "delivered":
          return orderStatus === "delivered"
        case "cancelled":
          return orderStatus === "order_cancelled"
        default:
          return false
      }
    }).length
  }

  // New method to get order type counts
  getOrderTypeCount(orderType: string): number {
    if (orderType === "all") return this.orders.length

    return this.orders.filter((order) => (order.orderType || "NORMAL") === orderType).length
  }

  getTotalAmount(): number {
    return this.orders.reduce((total, order) => total + (order.totalAmount || 0), 0)
  }

  // Payment method display methods (keeping these for display purposes)
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

  exportTableToPdf() {
    const columns = [
      { header: 'Order #', field: 'trackingNumber', width: 30 },
      { header: 'Date', field: 'createdDate', width: 30 },
      { header: 'Status', field: 'currentOrderStatus', width: 25 },
      { header: 'Total (MMK)', field: 'totalAmount', width: 25 }
      // Add more columns as needed
    ];
    const filename = `MyOrders_${new Date().toISOString().slice(0,10)}.pdf`;
    this.pdfExportService.exportTableToPdf(
      this.filteredOrders,
      columns,
      filename,
      'My Orders'
    );
  }

  async exportTableToExcel() {
    const columns = [
      { header: 'Order #', field: 'trackingNumber', width: 30 },
      { header: 'Date', field: 'createdDate', width: 30 },
      { header: 'Status', field: 'currentOrderStatus', width: 25 },
      { header: 'Total (MMK)', field: 'totalAmount', width: 25 }
      // Add more columns as needed
    ];
    const filename = `MyOrders_${new Date().toISOString().slice(0,10)}.xlsx`;
    await this.excelExportService.exportToExcel(
      this.filteredOrders,
      columns,
      filename,
      'My Orders'
    );
  }
}