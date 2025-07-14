import { Component, type OnInit, OnDestroy, HostListener } from "@angular/core"
import { OrderService } from "@app/core/services/order.service";
import { debounceTime, distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '@app/core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { log } from "node:console";
import Swal from 'sweetalert2';
import { PdfExportService } from '@app/core/services/pdf-export.service';
import { ExcelExportService } from '@app/core/services/excel-export.service';
import { ORDER_STATUS, ORDER_STATUS_LABELS, OrderDetail, PAYMENT_STATUS } from "@app/core/models/order.dto";
import { AlertService } from "@app/core/services/alert.service";

interface Order {
  id: number
  trackingNumber: string
  date: string
  time: string
  paymentStatus: PAYMENT_STATUS
  orderStatus: ORDER_STATUS
  items: any[]
  createdDate: Date
  city?: string
}

interface FilterParams {
  search: string
  status: string
  city: string
  dateFrom: string
  dateTo: string
}

@Component({
  selector: "app-admin-orders-control",
  standalone: false,
  templateUrl: "./admin-orders-control.component.html",
  styleUrls: ["./admin-orders-control.component.css"],
})
export class AdminOrdersControlComponent implements OnInit, OnDestroy {
  // Data properties
  orders: Order[] = []
  filteredOrders: Order[] = []
  paginatedOrders: Order[] = []
  isLoading = false
  errorMessage = ""

  // Filter/search properties
  filterParams: FilterParams = {
    search: "",
    status: "",
    city: "",
    dateFrom: "",
    dateTo: "",
  }

  // Search debouncing
  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  selectedOrderIds: number[] = []
  bulkStatus: ORDER_STATUS | "" = ""
  bulkNote = ""
  bulkStatusLoading = false
  bulkStatusError: string | null = null

  adminId: number | null = null
  sortField = "createdAt"
  sortDirection: "asc" | "desc" = "desc"

  // Pagination
  currentPage = 1
  itemsPerPage = 10
  totalItems = 0
  totalPages = 0

  // Status configurations for UI display
  orderStatusConfig: Record<ORDER_STATUS, { label: string; color: string; icon: string }> = {
    [ORDER_STATUS.ORDER_PENDING]: {
      label: "Pending",
      color: "badge bg-warning text-dark",
      icon: "bi bi-clock",
    },
    [ORDER_STATUS.ORDER_CONFIRMED]: {
      label: "Confirmed",
      color: "badge bg-info",
      icon: "bi bi-check-circle",
    },
    [ORDER_STATUS.PACKED]: {
      label: "Packed",
      color: "badge bg-primary",
      icon: "bi bi-box",
    },
    [ORDER_STATUS.SHIPPED]: {
      label: "Shipped",
      color: "badge bg-primary",
      icon: "bi bi-truck",
    },
    [ORDER_STATUS.OUT_FOR_DELIVERY]: {
      label: "Out for Delivery",
      color: "badge bg-info",
      icon: "bi bi-geo-alt",
    },
    [ORDER_STATUS.DELIVERED]: {
      label: "Delivered",
      color: "badge bg-success",
      icon: "bi bi-check-circle-fill",
    },
    [ORDER_STATUS.ORDER_CANCELLED]: {
      label: "Cancelled",
      color: "badge bg-danger",
      icon: "bi bi-x-circle",
    },
    [ORDER_STATUS.PAYMENT_REJECTED]: {
      label: "Payment Rejected",
      color: "badge bg-danger",
      icon: "bi bi-x-circle-fill",
    },
    [ORDER_STATUS.PAID]: {
      label: "Payment Confirmed",
      color: "badge bg-success",
      icon: "bi bi-credit-card-fill",
    },
  }
  // DB -> UI mapping
  dbToUiStatus: any = {
    PENDING: 'pending',
    ORDER_CONFIRMED: 'order_confirmed',
    PACKED: 'packed',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  };

  // allowedTransitions: Record<Order['status'], Order['status'][]> = {
  //   pending: ['order_confirmed', 'cancelled'],
  //   order_confirmed: ['packed', 'cancelled'],
  //   packed: ['out_for_delivery'],
  //   out_for_delivery: ['delivered'],
  //   delivered: [],
  //   cancelled: []
  // };

  // statusList: Order['status'][] = [
  //   'pending',
  //   'order_confirmed',
  //   'packed',
  //   'out_for_delivery',
  //   'delivered',
  //   'cancelled'
  // ];

  // Export columns definition
  orderExportColumns = [
    { header: 'Order ID', field: 'id', width: 20 },
    { header: 'Tracking Number', field: 'trackingNumber', width: 50 },
    { header: 'Customer', field: 'customer', width: 40 },
    { header: 'Date', field: 'date', width: 35 },
    { header: 'Status', field: 'status', width: 45 },
    { header: 'Total', field: 'total', width: 40 },
    { header: 'Items', field: 'items', width: 20 },
    { header: 'Payment Method', field: 'paymentMethod', width: 50 }
  ];

  constructor(
    private orderService: OrderService, 
    private router: Router, 
    private location: Location, 
    private authService: AuthService, 
    private snackBar: MatSnackBar,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService,
    private alertService: AlertService,
  ) {
        // Setup search debouncing
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.applyFilters()
    })
  }

  ngOnInit(): void {
    // Get adminId from AuthService
    const user = this.authService.getCurrentUser()
    if (user && user.id) {
      this.adminId = user.id
    } else {
      this.router.navigate(["/admin/login"])
      return
    }
    this.loadOrders()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  loadOrders(): void {
    this.isLoading = true
    this.errorMessage = ""

    this.orderService.getAllOrders().subscribe({
      next: (orderDetails: OrderDetail[]) => {
        this.orders = orderDetails.map((o) => this.mapOrderDetailToOrder(o))
        this.sortOrders()
        this.filteredOrders = [...this.orders]
        this.updatePagination()
        this.isLoading = false
      },
      error: (err) => {
        this.errorMessage = "Failed to load orders. Please try again."
        this.isLoading = false
        this.alertService.toast("Failed to load orders. Please try again.", "error")
      },
    })
  }

  refreshData(): void {
    this.loadOrders()
  }

  mapOrderDetailToOrder(order: OrderDetail): Order {
    return {
      id: order.id,
      trackingNumber: order.trackingNumber,
      date: order.createdDate ? this.formatCompactDate(order.createdDate) : "",
      time: order.createdDate ? this.formatTime12hr(order.createdDate.split("T")[1]?.substring(0, 5) || "") : "",
      paymentStatus: order.paymentStatus,
      orderStatus: order.currentOrderStatus,
      items: order.items || [],
      createdDate: new Date(order.createdDate),
      city: order.shippingAddress?.city || "—",
    }
  }

  formatCompactDate(dateString: string): string {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (error) {
      return ""
    }
  }

  formatTime12hr(timeStr: string): string {
    if (!timeStr) return ""
    const [hour, minute] = timeStr.split(":")
    let h = Number.parseInt(hour, 10)
    const ampm = h >= 12 ? "PM" : "AM"
    h = h % 12
    if (h === 0) h = 12
    return `${h}:${minute} ${ampm}`
  }

  // Computed properties for stats
  get totalOrders(): number {
    return this.orders.length
  }

  get pendingPaymentOrders(): number {
    return this.orders.filter((o) => o.paymentStatus === PAYMENT_STATUS.PENDING).length
  }

  get processingOrders(): number {
    return this.orders.filter(
      (o) =>
        o.paymentStatus === PAYMENT_STATUS.PAID &&
        [
          ORDER_STATUS.ORDER_CONFIRMED,
          ORDER_STATUS.PACKED,
          ORDER_STATUS.SHIPPED,
          ORDER_STATUS.OUT_FOR_DELIVERY,
        ].includes(o.orderStatus),
    ).length
  }

  get deliveredOrders(): number {
    return this.orders.filter((o) => o.orderStatus === ORDER_STATUS.DELIVERED).length
  }

  // Real-time filtering methods
  onSearchChange(): void {
    this.searchSubject.next(this.filterParams.search)
  }

  onStatusChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onDateFromChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onDateToChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onCityChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onReset(): void {
    this.filterParams = {
      search: "",
      status: "",
      city: "",
      dateFrom: "",
      dateTo: "",
    }
    this.currentPage = 1
    this.selectedOrderIds = [] // Clear selections on reset
    this.filteredOrders = [...this.orders]
    this.updatePagination()
  }

  private applyFilters(): void {
    let filtered = [...this.orders]

    // Status filter
    if (this.filterParams.status) {
      filtered = filtered.filter((order) => order.orderStatus === this.filterParams.status)
    }

    // Date range filter
    if (this.filterParams.dateFrom) {
      const fromDate = new Date(this.filterParams.dateFrom)
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdDate)
        return orderDate >= fromDate
      })
    }

    if (this.filterParams.dateTo) {
      const toDate = new Date(this.filterParams.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdDate)
        return orderDate <= toDate
      })
    }

    // City filter
    if (this.filterParams.city.trim()) {
      const cityTerm = this.filterParams.city.toLowerCase().trim()
      filtered = filtered.filter((order) => {
        const orderCity = order.city && order.city !== "—" ? order.city.toLowerCase() : ""
        return orderCity.includes(cityTerm)
      })
    }

    // Enhanced search
    if (this.filterParams.search.trim()) {
      const searchTerm = this.filterParams.search.toLowerCase().trim()
      filtered = filtered.filter((order) => {
        const orderCity = order.city && order.city !== "—" ? order.city.toLowerCase() : ""
        return (
          order.id.toString().includes(searchTerm) ||
          order.trackingNumber.toLowerCase().includes(searchTerm) ||
          this.getOrderStatusLabel(order.orderStatus).toLowerCase().includes(searchTerm) ||
          orderCity.includes(searchTerm)
        )
      })
    }

    this.filteredOrders = filtered
    this.currentPage = 1 // Reset to first page
    this.updatePagination()
  }

  // Sorting methods
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
    } else {
      this.sortField = field
      this.sortDirection = "desc"
    }
    this.sortOrders()
    this.applyFilters()
  }

  private sortOrders(): void {
    this.orders.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (this.sortField) {
        case "id":
          aValue = a.id
          bValue = b.id
          break
        case "orderStatus":
          aValue = a.orderStatus
          bValue = b.orderStatus
          break
        case "city":
          aValue = a.city && a.city !== "—" ? a.city.toLowerCase() : ""
          bValue = b.city && b.city !== "—" ? b.city.toLowerCase() : ""
          break
        case "createdAt":
        default:
          aValue = a.createdDate.getTime()
          bValue = b.createdDate.getTime()
          break
      }

      if (aValue < bValue) return this.sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return this.sortDirection === "asc" ? 1 : -1
      return 0
    })
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return "bi-arrow-down-up"
    return this.sortDirection === "asc" ? "bi-arrow-up" : "bi-arrow-down"
  }

  private updatePagination(): void {
    this.totalItems = this.filteredOrders.length
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages
    }

    this.updatePaginatedOrders()
  }

  private updatePaginatedOrders(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedOrders = this.filteredOrders.slice(startIndex, endIndex)
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePaginatedOrders()
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePaginatedOrders()
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updatePaginatedOrders()
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = []
    const maxVisiblePages = 5

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i)
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2)
      let start = Math.max(1, this.currentPage - half)
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1)

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  // Status styling methods
  getOrderStatusClass(status: ORDER_STATUS): string {
    return this.orderStatusConfig[status]?.color || "badge bg-secondary"
  }

  getOrderStatusIcon(status: ORDER_STATUS): string {
    return this.orderStatusConfig[status]?.icon || "bi bi-info-circle"
  }

  getOrderStatusLabel(status: ORDER_STATUS): string {
    return this.orderStatusConfig[status]?.label || ORDER_STATUS_LABELS[status] || status
  }

  // Selection methods - only select current page items
  isSelected(order: Order): boolean {
    return this.selectedOrderIds.includes(order.id)
  }

  isAllSelected(): boolean {
    const selectableOrders = this.getSelectableOrdersOnCurrentPage()
    return selectableOrders.length > 0 && selectableOrders.every((order) => this.selectedOrderIds.includes(order.id))
  }

  // Check if order can be selected (not pending payment, failed payment, or delivered)
  isOrderSelectable(order: Order): boolean {
    return (
      order.paymentStatus === PAYMENT_STATUS.PAID &&
      order.orderStatus !== ORDER_STATUS.DELIVERED &&
      order.orderStatus !== ORDER_STATUS.ORDER_CANCELLED
    )
  }

  getSelectableOrdersOnCurrentPage(): Order[] {
    return this.paginatedOrders.filter((order) => this.isOrderSelectable(order))
  }

  toggleSelectOrder(order: Order, event: Event): void {
    event.stopPropagation()

    if (!this.isOrderSelectable(order)) {
      return // Don't allow selection of non-selectable orders
    }

    const checked = (event.target as HTMLInputElement).checked
    if (checked) {
      if (!this.selectedOrderIds.includes(order.id)) {
        this.selectedOrderIds.push(order.id)
      }
    } else {
      this.selectedOrderIds = this.selectedOrderIds.filter((id) => id !== order.id)
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked
    const selectableOrders = this.getSelectableOrdersOnCurrentPage()

    if (checked) {
      selectableOrders.forEach((order) => {
        if (!this.selectedOrderIds.includes(order.id)) {
          this.selectedOrderIds.push(order.id)
        }
      })
    } else {
      selectableOrders.forEach((order) => {
        this.selectedOrderIds = this.selectedOrderIds.filter((id) => id !== order.id)
      })
    }
  }

  // Get count of selected orders that have paid status (eligible for status updates)
  getSelectedPaidCount(): number {
    return this.orders.filter((o) => this.selectedOrderIds.includes(o.id) && o.paymentStatus === PAYMENT_STATUS.PAID)
      .length
  }

  // Bulk status update - only for paid orders
  confirmBulkStatusUpdate(): void {
    if (!this.bulkStatus || this.selectedOrderIds.length === 0 || !this.adminId) return

    // Get only paid orders from selection
    const eligibleOrders = this.orders.filter(
      (o) => this.selectedOrderIds.includes(o.id) && o.paymentStatus === PAYMENT_STATUS.PAID,
    )

    if (eligibleOrders.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Eligible Orders",
        text: "Selected orders must have approved payment status to update order status.",
      })
      return
    }

    // Validate status transitions for eligible orders
    const invalidOrders = eligibleOrders.filter((order) => {
      return !this.isValidStatusTransition(order.orderStatus, this.bulkStatus as ORDER_STATUS)
    })

    if (invalidOrders.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Status Transitions",
        text: `Some orders cannot be changed to "${this.getOrderStatusLabel(this.bulkStatus as ORDER_STATUS)}" from their current status.`,
      })
      return
    }

    // Confirm bulk update
    Swal.fire({
      title: "Confirm Bulk Status Update",
      text: `Update ${eligibleOrders.length} orders to "${this.getOrderStatusLabel(this.bulkStatus as ORDER_STATUS)}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        this.performBulkStatusUpdate(eligibleOrders.map((o) => o.id))
      }
    })
  }

  private performBulkStatusUpdate(orderIds: number[]): void {
    this.bulkStatusLoading = true
    this.bulkStatusError = null

    this.orderService
      .bulkUpdateOrderStatus(
        orderIds,
        this.bulkStatus as ORDER_STATUS,
        this.bulkNote || "Bulk status update by admin",
        this.adminId!,
      )
      .subscribe({
        next: () => {
          this.bulkStatusLoading = false
          this.bulkStatus = ""
          this.bulkNote = ""
          this.selectedOrderIds = []
          this.loadOrders() // Refresh the orders list
          this.alertService.toast(`Successfully updated ${orderIds.length} orders`, "success")
        },
        error: (err) => {
          this.bulkStatusLoading = false
          this.bulkStatusError = "Failed to update order status."
          this.alertService.toast("Failed to update order status. Please try again.", "error")
        },
      })
  }

  // Validate if status transition is allowed
  private isValidStatusTransition(currentStatus: ORDER_STATUS, newStatus: ORDER_STATUS): boolean {
    // Define allowed transitions based on business logic
    const allowedTransitions: Record<ORDER_STATUS, ORDER_STATUS[]> = {
      [ORDER_STATUS.ORDER_PENDING]: [ORDER_STATUS.ORDER_CONFIRMED, ORDER_STATUS.ORDER_CANCELLED],
      [ORDER_STATUS.ORDER_CONFIRMED]: [ORDER_STATUS.PACKED, ORDER_STATUS.ORDER_CANCELLED],
      [ORDER_STATUS.PACKED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.ORDER_CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ORDER_CANCELLED],
      [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.ORDER_CANCELLED],
      [ORDER_STATUS.DELIVERED]: [],
      [ORDER_STATUS.ORDER_CANCELLED]: [],
      [ORDER_STATUS.PAYMENT_REJECTED]: [],
      [ORDER_STATUS.PAID]: [ORDER_STATUS.ORDER_CONFIRMED],
    }

    return allowedTransitions[currentStatus]?.includes(newStatus) || false
  }

  // Navigation and actions
  viewOrder(order: Order): void {
    this.router.navigate(["/admin/orderDetailAdmin", order.id])
  }

  // Filter helper methods
  getFilteredOrdersCount(status: string): number {
    if (status === "") return this.orders.length
    return this.orders.filter((order) => order.orderStatus === status).length
  }

  getTotalItems(order: Order): number {
    if (!order.items || !Array.isArray(order.items)) return 0
    return order.items.reduce((total: number, item: any) => total + (item.quantity || 0), 0)
  }

  onImageError(event: any): void {
    event.target.src = "assets/img/default-product.jpg"
  }

  trackByOrderId(index: number, order: Order): number {
    return order.id
  }

  // Utility methods
  getItemsPerPageOptions(): number[] {
    return [10, 25, 50, 100]
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1
    this.updatePagination()
  }

  Math = Math

  getUniqueCities(): string[] {
    const cities = this.orders
      .map((order) => order.city)
      .filter((city) => city && city !== "—")
      .map((city) => city!.trim())
      .filter((city) => city.length > 0)

    return [...new Set(cities)].sort()
  }

  // Export PDF function
  exportOrdersToPdf() {
    const filename = this.filteredOrders.length === this.orders.length
      ? 'OrderList_All.pdf'
      : `OrderList_Filtered_${this.filteredOrders.length}.pdf`;
    this.pdfExportService.exportTableToPdf(
      this.filteredOrders,
      this.orderExportColumns,
      filename,
      'Order List Report',
      'order' // Pass the type as 'order' for correct footer
    );
  }

  // Export Excel function
  async exportOrdersToExcel() {
    const filename = this.filteredOrders.length === this.orders.length
      ? 'OrderList_All.xlsx'
      : `OrderList_Filtered_${this.filteredOrders.length}.xlsx`;
    await this.excelExportService.exportToExcel(
      this.filteredOrders,
      this.orderExportColumns,
      filename,
      'Orders',
      'Order List Report'
    );
  }
}
