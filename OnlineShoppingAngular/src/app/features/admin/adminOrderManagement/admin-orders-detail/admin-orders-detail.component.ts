import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../../core/services/order.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RejectionReasonDTO } from '@app/core/models/refund-reason';
import { PaymentRejectionReasonService } from '@app/core/services/payment-rejection-reason.service';
import { ORDER_STATUS, ORDER_STATUS_LABELS, OrderDetail, OrderItemDetail, PAYMENT_STATUS, STATUS_TRANSITIONS, StatusStep, TIMELINE_STEPS, TimelineStep } from '@app/core/models/order.dto';
import { AlertService } from '@app/core/services/alert.service';

export interface TimelineItem extends TimelineStep {
  status: "completed" | "active" | "pending" | "cancelled"
  date?: string
  note?: string
}

@Component({
  selector: "app-admin-order-detail",
  standalone: false,
  templateUrl: "./admin-orders-detail.component.html",
  styleUrl: "./admin-orders-detail.component.css",
})
export class AdminOrdersDetailComponent implements OnInit, OnDestroy {
  orderId = 0
  order: OrderDetail | null = null
  loading = true
  error = ""
  updatingStatus = false
  updatingPayment = false
  updateStatusError = ""
  paymentError = ""
  private subscriptions: Subscription[] = []
  selectedStatus: ORDER_STATUS | null = null

  rejectionForm!: FormGroup
  rejectionReasons: RejectionReasonDTO[] = []
  showRejectionReasonModal = false
  ORDER_STATUS_LABELS = ORDER_STATUS_LABELS

  // Expose constants to template
  readonly ORDER_STATUS_CODES = ORDER_STATUS
  readonly PAYMENT_STATUS_CODES = PAYMENT_STATUS
  readonly ORDER_STATUSES = ORDER_STATUS

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private rejectionReasonService: PaymentRejectionReasonService,
    private fb: FormBuilder,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        this.orderId = +params["id"]
        if (this.orderId) {
          this.loadOrderDetails()
          this.initRejectionForm()
          this.loadRejectionReasons()
        } else {
          this.error = "Invalid order ID"
          this.loading = false
        }
      }),
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }

  // Load order details from the service
  loadOrderDetails(): void {
    this.loading = true
    this.error = ""
    const orderSub = this.orderService.getOrderDetails(this.orderId).subscribe({
      next: (order: OrderDetail) => {
        this.order = order
        this.loading = false
        this.updateSelectedStatus()
        console.log("Order details loaded:", this.order)
      },
      error: (err) => {
        this.error = "Failed to load order details. Please try again."
        this.loading = false
      },
    })
    this.subscriptions.push(orderSub)
  }

  // Update selected status based on current status and allowed transitions
  private updateSelectedStatus(): void {
    if (!this.order?.currentOrderStatus) {
      this.selectedStatus = null
      return
    }
    const currentStatusCode = this.order.currentOrderStatus as ORDER_STATUS
    const allowedTransitions = STATUS_TRANSITIONS[currentStatusCode] || []
    this.selectedStatus = allowedTransitions.length > 0 ? allowedTransitions[0] : null
  }

  // Get allowed transitions for current status
  getAllowedTransitions(): ORDER_STATUS[] {
    if (!this.order?.currentOrderStatus) return []
    return STATUS_TRANSITIONS[this.order.currentOrderStatus as ORDER_STATUS] || []
  }

  updateOrderStatus(newStatus: ORDER_STATUS, note = "Status updated by admin", updatedBy = 1): void {
    if (!this.order) return

    this.updatingStatus = true
    this.updateStatusError = ""

    this.orderService.bulkUpdateOrderStatus([this.order.id], newStatus, note, updatedBy).subscribe({
      next: () => {
        this.updatingStatus = false;
        this.loadOrderDetails();
        this.alertService.toast('Order status updated successfully!', 'success');
      },
      error: (err) => {
        this.updatingStatus = false;
        this.updateStatusError = 'Failed to update order status.';
        this.alertService.toast('Failed to update order status. Please try again.', 'error');
      },
    });
  }

  // Confirm and update status with validation
  confirmStatusUpdate(): void {
    if (!this.order || !this.selectedStatus) return

    const currentStatusCode = this.order.currentOrderStatus as ORDER_STATUS
    const allowedTransitions = STATUS_TRANSITIONS[currentStatusCode] || []
    const isValidTransition = allowedTransitions.includes(this.selectedStatus)

    if (!isValidTransition) {
      Swal.fire({
        icon: "error",
        title: "Invalid Status Change",
        text: `You can only change status from "${ORDER_STATUS_LABELS[currentStatusCode]}" to "${allowedTransitions.map((s) => ORDER_STATUS_LABELS[s]).join(", ") || "No further status"}".`,
        customClass: {
          popup: "luxury-alert",
          confirmButton: "luxury-btn luxury-btn-primary",
        },
      })
      return
    }

    // Show confirmation dialog
    Swal.fire({
      title: "Confirm Status Update",
      text: `Change order status from "${ORDER_STATUS_LABELS[currentStatusCode]}" to "${ORDER_STATUS_LABELS[this.selectedStatus]}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "luxury-alert",
        confirmButton: "luxury-btn luxury-btn-primary",
        cancelButton: "luxury-btn luxury-btn-outline",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateOrderStatus(this.selectedStatus!)
      }
    })
  }

  // Format date for display
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Format currency for display
  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return "0 MMK"
    return (
      new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + " MMK"
    )
  }

  // Get CSS class for status badge
  getStatusClass(status: ORDER_STATUS | undefined): string {
    switch (status) {
      case ORDER_STATUS.ORDER_PENDING:
        return "badge-warning"
      case ORDER_STATUS.PAID:
      case ORDER_STATUS.ORDER_CONFIRMED:
        return "badge-info"
      case ORDER_STATUS.PACKED:
        return "badge-primary"
      case ORDER_STATUS.SHIPPED:
      case ORDER_STATUS.OUT_FOR_DELIVERY:
        return "badge-info"
      case ORDER_STATUS.DELIVERED:
        return "badge-success"
      case ORDER_STATUS.ORDER_CANCELLED:
      case ORDER_STATUS.PAYMENT_REJECTED:
        return "badge-danger"
      default:
        return "badge-secondary"
    }
  }

  // Get icon for status badge
  getStatusIcon(status: ORDER_STATUS | undefined): string {
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
        return "fas fa-home"
      case ORDER_STATUS.ORDER_CANCELLED:
        return "fas fa-ban"
      case ORDER_STATUS.PAYMENT_REJECTED:
        return "fas fa-times-circle"
      default:
        return "fas fa-info-circle"
    }
  }

  getPaymentStatusClass(status: PAYMENT_STATUS | undefined): string {
    switch (status) {
      case PAYMENT_STATUS.PENDING:
        return "badge-warning"
      case PAYMENT_STATUS.PAID:
        return "badge-success"
      case PAYMENT_STATUS.FAILED:
        return "badge-danger"
      default:
        return "badge-secondary"
    }
  }

  getPaymentStatusIcon(status: PAYMENT_STATUS | undefined): string {
    switch (status) {
      case PAYMENT_STATUS.PENDING:
        return "fas fa-clock"
      case PAYMENT_STATUS.PAID:
        return "fas fa-check-circle"
      case PAYMENT_STATUS.FAILED:
        return "fas fa-times-circle"
      default:
        return "fas fa-info-circle"
    }
  }

  // Calculate total for an item
  calculateItemTotal(item: any): number {
    if (!item || !item.quantity || !item.price) return 0
    return item.quantity * item.price
  }

  // Get total number of items in the order
  getTotalItems(): number {
    if (!this.order?.items) return 0
    return this.order.items.reduce((total: number, item: OrderItemDetail) => total + (item.quantity || 0), 0)
  }

  getSubtotal(): number {
    if (!this.order?.items) return 0
    return this.order.items.reduce((total: number, item: OrderItemDetail) => total + this.calculateItemTotal(item), 0)
  }

  // Handle image error for product/variant images
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement
    if (target) {
      target.src = "assets/img/default-product.jpg"
    }
  }

  // Get icon for delivery method
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

  // Check if payment is pending
  isPaymentPending(): boolean {
    return this.order?.paymentStatus === PAYMENT_STATUS.PENDING
  }

  // Check if payment is paid
  isPaymentPaid(): boolean {
    return this.order?.paymentStatus === PAYMENT_STATUS.PAID
  }

  // Back to orders list
  goBack(): void {
    this.router.navigate(["/admin/AdminOrder"])
  }

  // Approve payment
  approvePayment(): void {
    if (!this.order) return

    Swal.fire({
      title: "Approve Payment",
      text: "Are you sure you want to approve this payment?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "luxury-alert",
        confirmButton: "luxury-btn luxury-btn-primary",
        cancelButton: "luxury-btn luxury-btn-outline",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.updatingPayment = true
        this.paymentError = ""

        this.orderService.updatePaymentStatus(this.order!.id, PAYMENT_STATUS.PAID).subscribe({
          next: (updatedOrder) => {
            this.order = updatedOrder;
            this.updatingPayment = false;
            this.updateSelectedStatus();
            this.alertService.toast('Payment approved successfully!', 'success');
          },
          error: (err) => {
            this.paymentError = err.error?.message || 'Failed to approve payment';
            this.updatingPayment = false;
            this.alertService.toast('Failed to approve payment. Please try again.', 'error');
          },
        });
      }
    })
  }

  // Reject payment
  rejectPayment(): void {
    this.showRejectionReasonModal = true
  }

  // Confirm rejection with reason
  confirmRejection(): void {
    const reasonId = this.rejectionForm.get('reasonId')?.value;
    const customReason = this.rejectionForm.get('customReasonText')?.value;

    console.log('Selected reasonId:', reasonId);
    console.log('Entered customReason:', customReason);
    console.log('Should show custom reason field?', this.shouldShowCustomReasonField());

    if (!reasonId || (this.shouldShowCustomReasonField() && !customReason?.trim())) {
      console.warn('Validation failed. reasonId or customReason is missing.');
      this.rejectionForm.markAllAsTouched();
      return;
    }

    const rejectionRequest = {
      reasonId,
      customReason
    };

    console.log('Submitting rejection request:', rejectionRequest);

    this.updatingPayment = true;
    this.closeRejectionReasonModal();

    this.orderService.updatePaymentStatus(this.order!.id, PAYMENT_STATUS.FAILED, rejectionRequest).subscribe({
      next: (updatedOrder) => {
        console.log('Payment rejected successfully. Updated order:', updatedOrder);
        this.order = updatedOrder;
        this.updatingPayment = false;
        this.updateSelectedStatus();
        this.alertService.toast('Payment rejected successfully!', 'success');
      },
      error: (err) => {
        console.error('Error rejecting payment:', err);
        this.paymentError = err.error?.message || 'Failed to reject payment';
        this.updatingPayment = false;
        this.alertService.toast('Failed to reject payment. Please try again.', 'error');
      },
    });
  }

  // Initialize rejection form
  initRejectionForm(): void {
    this.rejectionForm = this.fb.group({
      reasonId: ["", Validators.required],
      customReasonText: [""],
    })
  }

  // Load rejection reasons
  loadRejectionReasons(): void {
    this.rejectionReasonService.getAll().subscribe({
      next: (reasons) => (this.rejectionReasons = reasons),
      error: () => console.error("Failed to load rejection reasons"),
    })
  }

  // Check if custom reason field should be shown
  shouldShowCustomReasonField(): boolean {
    const selectedId = this.rejectionForm.get("reasonId")?.value
    const selectedReason = this.rejectionReasons.find((r) => r.id === +selectedId)
    return selectedReason?.allowCustomText || false
  }

  // Handle rejection reason change
  onRejectionReasonChange(): void {
    const allowCustom = this.shouldShowCustomReasonField()
    const commentCtrl = this.rejectionForm.get("customReasonText")
    if (allowCustom) {
      commentCtrl?.setValidators([Validators.required])
    } else {
      commentCtrl?.clearValidators()
    }
    commentCtrl?.updateValueAndValidity()
  }

  // Check if rejection form is valid
  isRejectionReasonFormValid(): boolean {
    return this.rejectionForm.valid
  }

  // Close rejection modal
  closeRejectionReasonModal(): void {
    this.showRejectionReasonModal = false
    this.rejectionForm.reset()
  }

  viewPaymentProof(): void {
    if (!this.order?.paymentProofPath) return
    window.open(this.order.paymentProofPath, "_blank")
  }

  // Get user initials for avatar
  getUserInitials(name: string): string {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Get unified status steps for vertical timeline (similar to customer side)
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

      // if (isCurrent) {
      //   stepClass = "current"
      // } else if (
      //   isFailure ||
      //   timelineStep.code === ORDER_STATUS.ORDER_CANCELLED ||
      //   timelineStep.code === ORDER_STATUS.PAYMENT_REJECTED
      // ) {
      //   stepClass = "cancelled"
      //   connectorClass = "cancelled"
      // } else if (isFinal) {
      //   stepClass = "final"
      // }

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

  copyTrackingNumber(): void {
    if (this.order?.trackingNumber) {
      navigator.clipboard.writeText(this.order.trackingNumber).then(() => {
        this.alertService.toast('Tracking number copied to clipboard', 'success');
      });
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
}
