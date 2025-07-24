import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ORDER_STATUS, ORDER_STATUS_LABELS, OrderDetail, OrderItemDetail, PAYMENT_STATUS, StatusStep, TIMELINE_STEPS } from '@app/core/models/order.dto';
import { StoreLocationService } from '../../../../core/services/store-location.service';
import { PdfExportService } from '../../../../core/services/pdf-export.service';

// Define all possible order statuses for user
export type OrderStatus = "pending" | "order_confirmed" | "packed" | "out_for_delivery" | "delivered" | "cancelled"

@Component({
  selector: "app-order-detail",
  standalone: false,
  templateUrl: "./order-detail.component.html",
  styleUrl: "./order-detail.component.css",
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  orderId = 0
  order: OrderDetail | null = null
  loading = true
  error = ""
  currentUserId = 0

  private subscriptions: Subscription[] = []

  showProofModal = false;
  proofImageUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
    private storeLocationService: StoreLocationService,
    private pdfExportService: PdfExportService,
  ) { }

  ngOnInit(): void {
    const sub = this.authService.user$.subscribe((user) => {
      this.currentUserId = user ? user.id : 0
      console.log("Current userId from subscription:", this.currentUserId)
    })
    this.subscriptions.push(sub)

    // Get order ID from route parameters
    this.route.params.subscribe((params) => {
      this.orderId = +params["id"]
      if (this.orderId) {
        this.loadOrderDetails()
      } else {
        this.error = "Invalid order ID"
        this.loading = false
      }
    })
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }

  loadOrderDetails(): void {
    this.loading = true
    this.error = ""

    const orderSub = this.orderService.getOrderDetails(this.orderId).subscribe({
      next: (order: OrderDetail) => {
        this.order = order
        this.loading = false
        console.log("order details:", this.order)
      },
      error: (err) => {
        console.error("Error loading order details:", err)
        this.error = "Failed to load order details. Please try again."
        this.loading = false
      },
    })

    this.subscriptions.push(orderSub)
  }

  getOrderStatusClass(status: string | null | undefined): string {
    if (!status) return "badge-secondary"

    switch (status.toUpperCase()) {
      case ORDER_STATUS.ORDER_PENDING:
        return "badge-warning" // Changed from secondary to warning for pending
      case ORDER_STATUS.PAYMENT_REJECTED:
        return "badge-danger"

      case ORDER_STATUS.ORDER_CONFIRMED:
      case ORDER_STATUS.PACKED:
        return "badge-info"

      case ORDER_STATUS.SHIPPED:
      case ORDER_STATUS.OUT_FOR_DELIVERY:
        return "badge-primary"

      case ORDER_STATUS.DELIVERED:
      case ORDER_STATUS.PAID:
        return "badge-success"

      case ORDER_STATUS.ORDER_CANCELLED:
        return "badge-danger" // Changed from secondary to danger for cancelled

      default:
        return "badge-secondary"
    }
  }

  getOrderStatusIcon(status: string | null | undefined): string {
    if (!status) return "fas fa-info-circle"

    switch (status.toUpperCase()) {
      case ORDER_STATUS.PAID:
        return "fas fa-check-circle"
      case ORDER_STATUS.ORDER_PENDING:
        return "fas fa-clock"
      case ORDER_STATUS.PAYMENT_REJECTED:
        return "fas fa-times-circle"
      case ORDER_STATUS.SHIPPED:
        return "fas fa-shipping-fast"
      case ORDER_STATUS.DELIVERED:
        return "fas fa-box-open"
      case ORDER_STATUS.ORDER_CANCELLED:
        return "fas fa-ban"
      default:
        return "fas fa-info-circle"
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return ""
    }
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return "0 MMK"
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "MMK",
        minimumFractionDigits: 0,
      }).format(amount)
    } catch (error) {
      return "0 MMK"
    }
  }

  getDeliveryMethodIcon(methodName: string | null | undefined): string {
    if (!methodName) return "fas fa-shipping-fast"

    const name = methodName.toLowerCase()
    if (name.includes("bike") || name.includes("bicycle")) {
      return "fas fa-bicycle"
    } else if (name.includes("car")) {
      return "fas fa-car"
    } else if (name.includes("truck")) {
      return "fas fa-truck"
    } else {
      return "fas fa-shipping-fast"
    }
  }

  calculateItemTotal(item: any): number {
    if (!item || !item.quantity || !item.price) return 0
    try {
      return (item.quantity || 0) * (item.price || 0)
    } catch (error) {
      return 0
    }
  }

  getEstimatedDeliveryDate(): string {
    if (!this.order?.createdDate) return ""

    try {
      const orderDate = new Date(this.order.createdDate)
      const deliveryDate = new Date(orderDate)
      deliveryDate.setDate(deliveryDate.getDate() + 5) // 5 days from order date

      return deliveryDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return ""
    }
  }

  goBackToOrders(): void {
    this.router.navigate(["/customer/orders"])
  }

  async downloadInvoice(): Promise<void> {
    if (!this.order) return;
    try {
      const store = await this.storeLocationService.getActive().toPromise();
      this.pdfExportService.exportOrderInvoiceToPdf(
        this.order,
        store,
        `Invoice_Order_${this.order.id}.pdf`
      );
    } catch (error) {
      console.error('Failed to generate invoice PDF:', error);
    }
  }

  trackOrder(): void {
    // TODO: Implement order tracking functionality
    console.log("Track order:", this.order?.trackingNumber)
  }

  contactSupport(): void {
    // TODO: Implement contact support functionality
    console.log("Contact support for order:", this.orderId)
  }

  goToRefundForm(): void {
    if (!this.order?.id) return // Safety check
    this.router.navigate(["/customer/refundRequest", this.order.id])
  }

  copyTrackingNumber(): void {
    if (this.order?.trackingNumber) {
      navigator.clipboard.writeText(this.order.trackingNumber).then(() => {
        console.log("Tracking number copied to clipboard")
      })
    }
  }

  formatShortDate(dateString: string | null | undefined): string {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      return ""
    }
  }
  getTotalItems(): number {
    if (!this.order?.items) return 0
    try {
      return this.order.items.reduce((total: number, item: OrderItemDetail) => total + (item?.quantity || 0), 0)
    } catch (error) {
      return 0
    }
  }

  getSubtotal(): number {
    if (!this.order?.items) return 0
    try {
      return this.order.items.reduce((total: number, item: OrderItemDetail) => total + this.calculateItemTotal(item), 0)
    } catch (error) {
      return 0
    }
  }

  onImageError(event: Event): void {
    try {
      const target = event.target as HTMLImageElement
      if (target) {
        target.src = "assets/img/default-product.jpg"
      }
    } catch (error) {
      console.error("Error handling image error:", error)
    }
  }

  onPaymentLogoError(event: Event): void {
    try {
      const target = event.target as HTMLImageElement
      if (target) {
        target.style.display = "none"
        const parent = target.parentElement
        if (parent) {
          parent.innerHTML = '<i class="fas fa-credit-card"></i>'
        }
      }
    } catch (error) {
      console.error("Error handling payment logo error:", error)
    }
  }

  viewPaymentProof(): void {
    if (this.order?.paymentProofPath) {
      this.proofImageUrl = this.order.paymentProofPath;
      this.showProofModal = true;
    }
  }

  closeProofModal(): void {
    this.showProofModal = false;
    this.proofImageUrl = null;
  }

  getUnifiedStatusSteps(): StatusStep[] {
    if (!this.order || !this.order.statusHistory) return []

    // Sort statusHistory chronologically (oldest first)
    const sortedStatusHistory = [...this.order.statusHistory].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    const steps: StatusStep[] = []

    for (const timelineStep of TIMELINE_STEPS) {
      // Find the matching statusHistory item for this timeline step
      const historyItem = sortedStatusHistory.find((s) => s.statusCode === timelineStep.code)
      if (!historyItem) continue // Skip steps not happened yet

      // Enhanced status class determination with better color coding
      const isCurrent = this.order.currentOrderStatus === timelineStep.code
      const isFinal = !!historyItem.status?.isFinal
      const isFailure = !!historyItem.status?.isFailure

      let stepClass = "completed"
      let connectorClass = "completed"

      if (
        isFailure ||
        timelineStep.code === ORDER_STATUS.ORDER_CANCELLED ||
        timelineStep.code === ORDER_STATUS.PAYMENT_REJECTED
      ) {
        stepClass = "cancelled";
        connectorClass = "cancelled";
      } else if (isFinal) {
        stepClass = "final";
      } else if (isCurrent) {
        stepClass = "current";
      }

      steps.push({
        label: timelineStep.label,
        icon: timelineStep.icon,
        key: timelineStep.code,
        class: stepClass,
        connectorClass: connectorClass,
        date: this.formatDate(historyItem.createdAt),
        note: historyItem.note,
        isCurrent: isCurrent,
        isCompleted: isFinal,
      })

      // Stop adding more steps after the current status
      if (isCurrent) break
    }

    // Handle special cancelled or payment rejected statuses that might come after current status
    const cancelledOrRejected = sortedStatusHistory.find(
      (s) => s.statusCode === ORDER_STATUS.ORDER_CANCELLED || s.statusCode === ORDER_STATUS.PAYMENT_REJECTED,
    )

    if (cancelledOrRejected && cancelledOrRejected.statusCode !== this.order.currentOrderStatus) {
      steps.push({
        label: ORDER_STATUS_LABELS[cancelledOrRejected.statusCode as ORDER_STATUS],
        icon: TIMELINE_STEPS.find((s) => s.code === cancelledOrRejected.statusCode)?.icon || "fas fa-ban",
        key: cancelledOrRejected.statusCode,
        class: "cancelled",
        connectorClass: "cancelled",
        date: this.formatDate(cancelledOrRejected.createdAt),
      })
    }

    return steps
  }

  getStatusDateByKey(key: ORDER_STATUS | PAYMENT_STATUS | string): string | undefined {
    if (key === "ORDER_PLACED") {
      return this.formatDate(this.order!.createdDate) // special case for synthetic step
    }
    const entry = this.order!.statusHistory.find((s) => s.statusCode === key)
    return entry ? this.formatDate(entry.createdAt) : undefined
  }

  getStatusDate(statusCode: ORDER_STATUS): string | undefined {
    const statusEntry = this.order!.statusHistory.find((s) => s.statusCode === statusCode)
    return statusEntry ? this.formatDate(statusEntry.createdAt) : undefined
  }

  // Enhanced progress percent with better color coding
  getProgressPercent(): number {
    if (!this.order?.currentOrderStatus) return 0

    const statusOrder = [
      ORDER_STATUS.ORDER_PENDING,
      ORDER_STATUS.ORDER_CONFIRMED,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED,
    ]

    const currentStatus = this.order.currentOrderStatus

    if (currentStatus === ORDER_STATUS.ORDER_CANCELLED || currentStatus === ORDER_STATUS.PAYMENT_REJECTED) {
      return 0 // Cancelled or rejected means no progress
    }

    const currentIndex = statusOrder.indexOf(currentStatus)
    if (currentIndex === -1) return 0

    return ((currentIndex + 1) / statusOrder.length) * 100
  }

  // Progress percent for payment status
  getPaymentProgressPercent(): number {
    if (!this.order?.paymentStatus) return 0

    const paymentStatusOrder = [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PAID, PAYMENT_STATUS.FAILED]

    const currentStatus = this.order.paymentStatus

    if (currentStatus === PAYMENT_STATUS.FAILED) return 0

    const currentIndex = paymentStatusOrder.indexOf(currentStatus)
    if (currentIndex === -1) return 0

    return ((currentIndex + 1) / paymentStatusOrder.length) * 100
  }

  // Get icon based on order status (using your ORDER_STATUS enum)
  getStatusIcon(status: ORDER_STATUS | string | undefined): string {
    switch (status) {
      case ORDER_STATUS.ORDER_PENDING:
        return "fas fa-clock"
      case ORDER_STATUS.PAID:
        return "fas fa-check-circle"
      case ORDER_STATUS.ORDER_CONFIRMED:
        return "fas fa-thumbs-up"
      case ORDER_STATUS.PACKED:
        return "fas fa-box"
      case ORDER_STATUS.SHIPPED:
      case ORDER_STATUS.OUT_FOR_DELIVERY:
        return "fas fa-truck"
      case ORDER_STATUS.DELIVERED:
        return "fas fa-box-open"
      case ORDER_STATUS.ORDER_CANCELLED:
        return "fas fa-times-circle"
      case ORDER_STATUS.PAYMENT_REJECTED:
        return "fas fa-exclamation-triangle"
      default:
        return "fas fa-info-circle"
    }
  }

  // Enhanced status message with better replacement order handling
  getStatusMessage(status: ORDER_STATUS | string | undefined, orderType: string | undefined = "NORMAL"): string {
    if (!status) return "Pending"

    // Define replacement-specific overrides with more context
    const replacementMessages: Record<string, string> = {
      [ORDER_STATUS.ORDER_PENDING]: "Replacement requested",
      PLACED: "Replacement requested",
      [ORDER_STATUS.ORDER_CANCELLED]: "Replacement cancelled",
      [ORDER_STATUS.ORDER_CONFIRMED]: "Replacement approved",
      [ORDER_STATUS.PACKED]: "Replacement packed",
      [ORDER_STATUS.SHIPPED]: "Replacement shipped",
      [ORDER_STATUS.OUT_FOR_DELIVERY]: "Replacement out for delivery",
      [ORDER_STATUS.DELIVERED]: "Replacement delivered",
    }

    // If replacement order and there's an override, return it
    if (orderType === "REPLACEMENT") {
      const replacementMsg = replacementMessages[status]
      if (replacementMsg) return replacementMsg
    }

    // Otherwise fallback to your original messages
    switch (status) {
      case ORDER_STATUS.ORDER_PENDING:
      case "PLACED":
        return "Waiting for payment"
      case PAYMENT_STATUS.FAILED:
      case ORDER_STATUS.ORDER_CANCELLED:
        return "Order was cancelled"
      case PAYMENT_STATUS.PAID:
        return "Payment confirmed"
      case ORDER_STATUS.ORDER_CONFIRMED:
        return "Payment approved"
      case ORDER_STATUS.PACKED:
        return "Order packed"
      case ORDER_STATUS.SHIPPED:
        return "Shipped"
      case ORDER_STATUS.OUT_FOR_DELIVERY:
        return "Out for delivery"
      case ORDER_STATUS.DELIVERED:
        return "Delivered"
      default:
        return "Unknown status"
    }
  }

  isRefundDisabled(): boolean {
    if (!this.order || this.order.currentOrderStatus !== "DELIVERED") {
      return true
    }
    return this.order.items.every((item) => item.maxReturnQty === 0)
  }

  getRefundButtonTooltip(): string {
    if (!this.order || this.order.currentOrderStatus !== "DELIVERED") {
      return "Refunds and replacements are allowed only after delivery"
    }

    const allItemsReturned = this.order.items.every((item) => item.maxReturnQty === 0)
    if (allItemsReturned) {
      return "All items in this order have already been refunded or replaced"
    }

    return ""
  }

  // getRefundsForItem(itemId: number) {
  //   if (!this.order?.refunds) return []
  //   // Filter refunds that contain this item id
  //   return this.order.refunds.filter((refund) =>
  //       refund.items.some((refundItem) => refundItem.quantity > 0
  //     ))
  // }

  getRefundsForItem(itemId: number) {
    return this.order?.refunds?.filter(refund =>
      refund.items?.some(refundItem => refundItem.orderItemId === itemId)
    ) || [];
  }

  // getRefundsForItem(itemId: number) {
  //   if (!this.order?.refunds) return [];

  //   return this.order.refunds.filter(refund =>
  //     refund.items.some(refundItem =>
  //       refundItem.id === itemId && refundItem.quantity > 0
  //     )
  //   );
  // }

}
