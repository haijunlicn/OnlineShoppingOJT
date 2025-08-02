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
import { PdfExportService } from '@app/core/services/pdf-export.service';
import { ExcelExportService } from '@app/core/services/excel-export.service';
import jsPDF from 'jspdf';

export interface TimelineItem extends TimelineStep {
  status: "completed" | "active" | "pending" | "cancelled"
  date?: string
  note?: string
}

@Component({
  selector: "app-admin-orders-detail",
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

  // Status comment properties
  statusComment = ""
  statusCommentTouched = false

  rejectionForm!: FormGroup
  rejectionReasons: RejectionReasonDTO[] = []
  showRejectionReasonModal = false
  ORDER_STATUS_LABELS = ORDER_STATUS_LABELS

  // Expose constants to template
  readonly ORDER_STATUS_CODES = ORDER_STATUS
  readonly PAYMENT_STATUS_CODES = PAYMENT_STATUS
  readonly ORDER_STATUSES = ORDER_STATUS

     showProofModal = false;
  proofImageUrl: string | null = null;
  
  // Export loading states
  isExportingPdf = false;
  isExportingExcel = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private rejectionReasonService: PaymentRejectionReasonService,
    private fb: FormBuilder,
    private alertService: AlertService,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService,
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

  // Handle status selection change
  onStatusSelectionChange(): void {
    this.statusComment = ""
    this.statusCommentTouched = false
  }

  updateOrderStatus(newStatus: ORDER_STATUS, note = "Status updated by admin", updatedBy = 1): void {
    if (!this.order) return

    this.updatingStatus = true
    this.updateStatusError = ""

    // Use the comment from the form if provided
    const finalNote = this.statusComment.trim() || note

    this.orderService.bulkUpdateOrderStatus([this.order.id], newStatus, finalNote, updatedBy).subscribe({
      next: () => {
        this.updatingStatus = false
        this.statusComment = ""
        this.statusCommentTouched = false
        this.loadOrderDetails()
        this.alertService.toast("Order status updated successfully!", "success")
      },
      error: (err) => {
        this.updatingStatus = false
        this.updateStatusError = "Failed to update order status."
        this.alertService.toast("Failed to update order status. Please try again.", "error")
      },
    })
  }

  // Confirm and update status with validation
  confirmStatusUpdate(): void {
    if (!this.order || !this.selectedStatus) return

    // Check if comment is required for cancellation
    if (this.selectedStatus === ORDER_STATUS.ORDER_CANCELLED && !this.statusComment.trim()) {
      this.statusCommentTouched = true
      this.alertService.toast("Comment is required when cancelling an order.", "error")
      return
    }

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
    const confirmText = this.statusComment.trim()
      ? `Change order status from "${ORDER_STATUS_LABELS[currentStatusCode]}" to "${ORDER_STATUS_LABELS[this.selectedStatus]}" with comment: "${this.statusComment.trim()}"?`
      : `Change order status from "${ORDER_STATUS_LABELS[currentStatusCode]}" to "${ORDER_STATUS_LABELS[this.selectedStatus]}"?`

    Swal.fire({
      title: "Confirm Status Update",
      text: confirmText,
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
            this.order = updatedOrder
            this.updatingPayment = false
            this.updateSelectedStatus()
            this.alertService.toast("Payment approved successfully!", "success")
          },
          error: (err) => {
            this.paymentError = err.error?.message || "Failed to approve payment"
            this.updatingPayment = false
            this.alertService.toast("Failed to approve payment. Please try again.", "error")
          },
        })
      }
    })
  }

  // Reject payment
  rejectPayment(): void {
    this.showRejectionReasonModal = true
  }

  // Confirm rejection with reason
  confirmRejection(): void {
    const reasonId = this.rejectionForm.get("reasonId")?.value
    const customReason = this.rejectionForm.get("customReasonText")?.value

    console.log("Selected reasonId:", reasonId)
    console.log("Entered customReason:", customReason)
    console.log("Should show custom reason field?", this.shouldShowCustomReasonField())

    if (!reasonId || (this.shouldShowCustomReasonField() && !customReason?.trim())) {
      console.warn("Validation failed. reasonId or customReason is missing.")
      this.rejectionForm.markAllAsTouched()
      return
    }

    const rejectionRequest = {
      reasonId,
      customReason,
    }

    console.log("Submitting rejection request:", rejectionRequest)

    this.updatingPayment = true
    this.closeRejectionReasonModal()

    this.orderService.updatePaymentStatus(this.order!.id, PAYMENT_STATUS.FAILED, rejectionRequest).subscribe({
      next: (updatedOrder) => {
        console.log("Payment rejected successfully. Updated order:", updatedOrder)
        this.order = updatedOrder
        this.updatingPayment = false
        this.updateSelectedStatus()
        this.alertService.toast("Payment rejected successfully!", "success")
      },
      error: (err) => {
        console.error("Error rejecting payment:", err)
        this.paymentError = err.error?.message || "Failed to reject payment"
        this.updatingPayment = false
        this.alertService.toast("Failed to reject payment. Please try again.", "error")
      },
    })
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
    if (this.order?.paymentProofPath) {
      this.proofImageUrl = this.order.paymentProofPath;
      this.showProofModal = true;
    }
  }

  closeProofModal(): void {
    this.showProofModal = false;
    this.proofImageUrl = null;
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
        stepClass = "cancelled"
        connectorClass = "cancelled"
      } else if (isFinal) {
        stepClass = "final"
      } else if (isCurrent) {
        stepClass = "current"
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
        this.alertService.toast("Tracking number copied to clipboard", "success")
      })
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

  // Discount-related helper methods
  hasItemDiscounts(item: any): boolean {
    return item.appliedDiscounts && item.appliedDiscounts.length > 0
  }

  getItemAutoDiscounts(item: any): any[] {
    if (!item.appliedDiscounts) return []
    return item.appliedDiscounts.filter((discount: any) => discount.mechanismType === "Discount")
  }

  getItemCouponDiscounts(item: any): any[] {
    if (!item.appliedDiscounts) return [];

    return item.appliedDiscounts.filter((discount: any) =>
      discount.mechanismType === 'Coupon' && discount.discountType === 'PERCENTAGE'
    );
  }

  getItemOriginalTotal(item: any): number {
    if (!item.appliedDiscounts || item.appliedDiscounts.length === 0) {
      return this.calculateItemTotal(item)
    }

    // Calculate original price by adding back all discounts,
    // excluding coupon -> fixed type
    const currentTotal = this.calculateItemTotal(item)
    const totalDiscounts = item.appliedDiscounts.reduce((sum: number, discount: any) => {
      const isCouponFixed = discount.mechanismType === "Coupon" && discount.discountType === "FIXED"
      if (isCouponFixed) return sum
      return sum + discount.discountAmount * item.quantity
    }, 0)

    return currentTotal + totalDiscounts
  }

  hasAnyDiscounts(): boolean {
    if (!this.order?.items) return false

    return this.order.items.some((item: any) => item.appliedDiscounts && item.appliedDiscounts.length > 0)
  }

  getOriginalSubtotal(): number {
    if (!this.order?.items) return 0

    return this.order.items.reduce((total: number, item: any) => {
      return total + this.getItemOriginalTotal(item)
    }, 0)
  }

  getDiscountedSubtotal(): number {
    if (!this.order?.items) return 0

    let subtotal = this.order.items.reduce((total: number, item: any) => {
      return total + this.calculateItemTotal(item)
    }, 0)

    // Find the fixed coupon (if any) and subtract it
    const fixedCoupon = this.order.items
      .flatMap((item: any) => item.appliedDiscounts || [])
      .find((discount: any) => discount.mechanismType === "Coupon" && discount.discountType === "FIXED")

    if (fixedCoupon) {
      subtotal -= fixedCoupon.discountAmount
    }

    return subtotal
  }

  getAutoDiscountSavings(): number {
    if (!this.order?.items) return 0

    return this.order.items.reduce((total: number, item: any) => {
      if (!item.appliedDiscounts) return total

      const autoDiscounts = item.appliedDiscounts.filter((discount: any) => discount.mechanismType === "Discount")

      return (
        total +
        autoDiscounts.reduce((sum: number, discount: any) => {
          return sum + discount.discountAmount * item.quantity
        }, 0)
      )
    }, 0)
  }

  getCouponDiscountSavings(): number {
    if (!this.order?.items) return 0

    return this.order.items.reduce((total: number, item: any) => {
      if (!item.appliedDiscounts) return total

      const couponDiscounts = item.appliedDiscounts.filter((discount: any) => discount.mechanismType === "Coupon")

      const itemSavings = couponDiscounts.reduce((sum: number, discount: any) => {
        const isPercentage = discount.discountType === "PERCENTAGE"
        const discountTotal = isPercentage ? discount.discountAmount * item.quantity : discount.discountAmount

        return sum + discountTotal
      }, 0)

      return total + itemSavings
    }, 0)
  }

  getCouponCode(): string {
    if (!this.order?.items) return ""
    for (const item of this.order.items) {
      if (item.appliedDiscounts) {
        const couponDiscount = item.appliedDiscounts.find(
          (discount) => discount.mechanismType === "Coupon" && discount.couponCode,
        )
        if (couponDiscount) {
          return couponDiscount.couponCode || ""
        }
      }
    }
    return ""
  }

  getTotalSavings(): number {
    return this.getAutoDiscountSavings() + this.getCouponDiscountSavings()
  }

  // Export Methods
  async exportOrderToPdf(): Promise<void> {
    if (!this.order) {
      this.alertService.error('No order data available for export');
      return;
    }

    this.isExportingPdf = true;
    
    try {
      const filename = `order-${this.order.id}-${this.formatDate(this.order.createdDate).replace(/\//g, '-')}.pdf`;
      
      // Create a comprehensive order report
      this.createOrderReportPdf(filename);
      
      this.alertService.success('Order exported to PDF successfully');
    } catch (error) {
      console.error('Error exporting order to PDF:', error);
      this.alertService.error('Failed to export order to PDF');
    } finally {
      this.isExportingPdf = false;
    }
  }

  private createOrderReportPdf(filename: string): void {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Colors - using dark theme like product catalog
    const darkBg: [number, number, number] = [20, 20, 20];
    const blackText: [number, number, number] = [0, 0, 0];
    const whiteText: [number, number, number] = [255, 255, 255];
    
    let y = 20;
    
    // Title Section with dark background
    pdf.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Add company name as white text
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('BRITIUM GALLERY', margin + 5, 18);
    
    // Main title
    pdf.setTextColor(whiteText[0], whiteText[1], whiteText[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('ORDER DETAIL REPORT', pageWidth / 2, 28, { align: 'center' });
    
    // Separator line
    y = 40;
    this.drawSeparatorLine(pdf, y, pageWidth, margin);
    y += 5;
    
    // Report Info Section
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    pdf.setTextColor(blackText[0], blackText[1], blackText[2]);
    pdf.text(`Generated On:`, margin, y);
    pdf.text(`${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, margin + 35, y);
    y += 5;
    
    pdf.text(`Generated By:`, margin, y);
    pdf.text(`Admin User`, margin + 35, y);
    y += 5;
    
    pdf.text(`Order ID:`, margin, y);
    pdf.text(`${this.order!.id}`, margin + 35, y);
    y += 5;
    
    pdf.text(`Order Type:`, margin, y);
    pdf.text(`${this.order!.orderType}`, margin + 35, y);
    y += 5;
    
    pdf.text(`Total Items:`, margin, y);
    pdf.text(`${this.getTotalItems()}`, margin + 35, y);
    y += 5;
    
    pdf.text(`Include Discounts:`, margin, y);
    pdf.text(`${this.hasAnyDiscounts() ? 'YES' : 'NO'}`, margin + 35, y);
    
    // Separator line
    y += 10;
    this.drawSeparatorLine(pdf, y, pageWidth, margin);
    y += 5;
    
    // Order Details Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`ORDER: ${this.order!.user.name}`, margin, y);
    y += 8;
    
    // Order details
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    pdf.text(`Order ID: ${this.order!.id}`, margin, y);
    y += 5;
    
    pdf.text(`Customer: ${this.order!.user.name}`, margin, y);
    y += 5;
    
    pdf.text(`Email: ${this.order!.user.email}`, margin, y);
    y += 5;
    
    pdf.text(`Status: ${this.order!.currentOrderStatus}`, margin, y);
    y += 5;
    
    pdf.text(`Created Date: ${this.formatDate(this.order!.createdDate)}`, margin, y);
    y += 5;
    
    pdf.text(`Payment Status: ${this.order!.paymentStatus}`, margin, y);
    y += 5;
    
    if (this.order!.orderType !== 'REPLACEMENT') {
      pdf.text(`Total Amount: ${this.formatCurrency(this.order!.totalAmount)}`, margin, y);
      y += 5;
    }
    
    // Separator line
    y += 5;
    this.drawSeparatorLine(pdf, y, pageWidth, margin);
    y += 5;
    
    // Items Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('ITEMS', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    // Table headers
    const tableHeaders = ['SKU', 'Product', 'Options', 'Qty', 'Price', 'Total'];
    const colWidths = [30, 50, 25, 15, 25, 30];
    let currentX = margin;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    tableHeaders.forEach((header, index) => {
      pdf.text(header, currentX, y);
      currentX += colWidths[index];
    });
    
    y += 5;
    
    // Table data
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    this.order!.items.forEach((item, index) => {
      if (y > pageHeight - 50) {
        pdf.addPage();
        y = 20;
      }
      
      currentX = margin;
      
      // SKU
      pdf.text(item.variant.sku, currentX, y);
      currentX += colWidths[0];
      
      // Product name (truncate if too long)
      const productName = item.product.name.length > 20 ? item.product.name.substring(0, 17) + '...' : item.product.name;
      pdf.text(productName, currentX, y);
      currentX += colWidths[1];
      
      // Options
      const options = item.variant.options?.map((opt: any) => opt.value).join(', ') || 'N/A';
      pdf.text(options, currentX, y);
      currentX += colWidths[2];
      
      // Quantity
      pdf.text(item.quantity.toString(), currentX, y);
      currentX += colWidths[3];
      
      // Price
      pdf.text(this.formatCurrency(this.calculateItemTotal(item)), currentX, y);
      currentX += colWidths[4];
      
      // Total
      pdf.text(this.formatCurrency(this.calculateItemTotal(item) * item.quantity), currentX, y);
      
      y += 4;
    });
    
    // Separator line
    y += 5;
    this.drawSeparatorLine(pdf, y, pageWidth, margin);
    y += 5;
    
    // Summary Section
    if (this.order!.orderType !== 'REPLACEMENT') {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('ORDER SUMMARY', pageWidth / 2, y, { align: 'center' });
      y += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      if (this.hasAnyDiscounts()) {
        pdf.text(`Original Subtotal: ${this.formatCurrency(this.getOriginalSubtotal())}`, margin, y);
        y += 5;
        
        if (this.getAutoDiscountSavings() > 0) {
          pdf.text(`Auto Discounts: -${this.formatCurrency(this.getAutoDiscountSavings())}`, margin, y);
          y += 5;
        }
        
        if (this.getCouponDiscountSavings() > 0) {
          pdf.text(`Coupon Discount: -${this.formatCurrency(this.getCouponDiscountSavings())}`, margin, y);
          y += 5;
        }
      }
      
      pdf.text(`Subtotal: ${this.formatCurrency(this.getDiscountedSubtotal())}`, margin, y);
      y += 5;
      
      pdf.text(`Shipping Fee: ${this.formatCurrency(this.order!.shippingFee)}`, margin, y);
      y += 5;
      
      if (this.getTotalSavings() > 0) {
        pdf.text(`Total Savings: ${this.formatCurrency(this.getTotalSavings())}`, margin, y);
        y += 5;
      }
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(`Total Amount: ${this.formatCurrency(this.order!.totalAmount)}`, margin, y);
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('REPLACEMENT SUMMARY', pageWidth / 2, y, { align: 'center' });
      y += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Items to Replace: ${this.getTotalItems()}`, margin, y);
      y += 5;
      pdf.text(`Replacement Value: ${this.formatCurrency(this.getSubtotal())}`, margin, y);
      y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Customer Cost: FREE`, margin, y);
    }
    
    // Save PDF
    pdf.save(filename);
  }

  private drawSeparatorLine(pdf: any, y: number, pageWidth: number, margin: number): void {
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(margin, y, pageWidth - margin, y);
    pdf.setLineDashPattern([], 0);
  }

  async exportOrderToExcel(): Promise<void> {
    if (!this.order) {
      this.alertService.error('No order data available for export');
      return;
    }

    this.isExportingExcel = true;

    try {
      const filename = `order-${this.order.id}-${this.formatDate(this.order.createdDate).replace(/\//g, '-')}.xlsx`;
      
      // Prepare order data for Excel export
      const orderData = this.prepareOrderDataForExport();
      
      await this.excelExportService.exportToExcel(
        orderData,
        this.getOrderExportColumns(),
        filename,
        'Order Details',
        `Order #${this.order.id} Report`
      );
      
      this.alertService.success('Order exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting order to Excel:', error);
      this.alertService.error('Failed to export order to Excel');
    } finally {
      this.isExportingExcel = false;
    }
  }

  private prepareOrderDataForExport(): any[] {
    if (!this.order) return [];

    const orderData = [];
    
    // Add order header information
    orderData.push({
      field: 'Order Information',
      value: `Order #${this.order.id}`,
      details: `Created: ${this.formatDate(this.order.createdDate)} | Status: ${this.order.currentOrderStatus} | Type: ${this.order.orderType}`
    });

    // Add customer information
    orderData.push({
      field: 'Customer Information',
      value: this.order.user.name,
      details: `Email: ${this.order.user.email} | Phone: ${this.order.shippingAddress.phoneNumber || 'N/A'}`
    });

    // Add shipping information
    orderData.push({
      field: 'Shipping Address',
      value: `${this.order.shippingAddress.address}, ${this.order.shippingAddress.township || ''}`,
      details: `${this.order.shippingAddress.city}, ${this.order.shippingAddress.zipCode}, ${this.order.shippingAddress.country}`
    });

    // Add delivery method
    orderData.push({
      field: 'Delivery Method',
      value: this.order.deliveryMethod.name,
      details: this.order.orderType !== 'REPLACEMENT' ? `Fee: ${this.formatCurrency(this.order.deliveryMethod.baseFee)}` : 'Replacement - No Fee'
    });

    // Add payment information (if not replacement)
    if (this.order.paymentMethod && this.order.orderType !== 'REPLACEMENT') {
      orderData.push({
        field: 'Payment Method',
        value: this.order.paymentMethod.methodName,
        details: `Type: ${this.order.paymentMethod.type} | Status: ${this.order.paymentStatus}`
      });
    }

    // Add order items
    this.order.items.forEach((item, index) => {
      orderData.push({
        field: `Item ${index + 1}`,
        value: item.product.name,
        details: `SKU: ${item.variant.sku} | Qty: ${item.quantity} | Price: ${this.formatCurrency(this.calculateItemTotal(item))}`
      });

      // Add discount information for each item
      if (this.hasItemDiscounts(item)) {
        const autoDiscounts = this.getItemAutoDiscounts(item);
        const couponDiscounts = this.getItemCouponDiscounts(item);
        
        autoDiscounts.forEach(discount => {
          orderData.push({
            field: `  - Auto Discount`,
            value: discount.description,
            details: `Amount: -${this.formatCurrency(discount.discountAmount * item.quantity)}`
          });
        });

        couponDiscounts.forEach(discount => {
          orderData.push({
            field: `  - Coupon Discount`,
            value: discount.description,
            details: `Amount: -${this.formatCurrency(discount.discountAmount * item.quantity)}`
          });
        });
      }
    });

    // Add order summary
    if (this.order.orderType !== 'REPLACEMENT') {
      if (this.hasAnyDiscounts()) {
        orderData.push({
          field: 'Original Subtotal',
          value: this.formatCurrency(this.getOriginalSubtotal()),
          details: `${this.getTotalItems()} items`
        });

        if (this.getAutoDiscountSavings() > 0) {
          orderData.push({
            field: 'Auto Discounts Applied',
            value: `-${this.formatCurrency(this.getAutoDiscountSavings())}`,
            details: 'Item-level discounts'
          });
        }

        if (this.getCouponDiscountSavings() > 0) {
          orderData.push({
            field: 'Coupon Discount',
            value: `-${this.formatCurrency(this.getCouponDiscountSavings())}`,
            details: `Coupon: ${this.getCouponCode()}`
          });
        }
      }

      orderData.push({
        field: 'Subtotal (after discounts)',
        value: this.formatCurrency(this.getDiscountedSubtotal()),
        details: this.hasAnyDiscounts() ? 'After all discounts applied' : 'No discounts applied'
      });

      orderData.push({
        field: 'Shipping Fee',
        value: this.formatCurrency(this.order.shippingFee),
        details: this.order.deliveryMethod.name
      });

      if (this.getTotalSavings() > 0) {
        orderData.push({
          field: 'Total Savings',
          value: this.formatCurrency(this.getTotalSavings()),
          details: 'Combined discount savings'
        });
      }

      orderData.push({
        field: 'Total Amount',
        value: this.formatCurrency(this.order.totalAmount),
        details: 'Final order total'
      });
    } else {
      // Replacement order summary
      orderData.push({
        field: 'Replacement Summary',
        value: 'FREE',
        details: `Items to replace: ${this.getTotalItems()} | Value: ${this.formatCurrency(this.getSubtotal())}`
      });
    }

    // Add order timeline
    const timelineSteps = this.getUnifiedStatusSteps();
    timelineSteps.forEach((step, index) => {
      orderData.push({
        field: `Timeline Step ${index + 1}`,
        value: step.label,
        details: step.date ? `${step.date}${step.note ? ` | Note: ${step.note}` : ''}` : step.note || 'Pending'
      });
    });

    return orderData;
  }

  private getOrderExportColumns(): { header: string; field: string; width?: number }[] {
    return [
      { header: 'Field', field: 'field', width: 30 },
      { header: 'Value', field: 'value', width: 40 },
      { header: 'Details', field: 'details', width: 50 }
    ];
  }
}
