import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderItemDetail } from '@app/core/models/order.dto';
import { RefundReasonDTO, RejectionReasonDTO } from '@app/core/models/refund-reason';
import { RefundItemDTO, RefundItemStatus, RefundItemStatusHistoryDTO, RefundRequestDTO, RefundStatus, RefundStatusHistoryDTO, RequestedRefundAction } from '@app/core/models/refund.model';
import { AuthService } from '@app/core/services/auth.service';
import { RefundReasonService } from '@app/core/services/refund-reason.service';
import { RefundRequestService } from '@app/core/services/refundRequestService';
import { RejectionReasonService } from '@app/core/services/rejection-reason.service';
import { Subject, takeUntil } from 'rxjs';
import { PdfExportService } from '@app/core/services/pdf-export.service';
import { ExcelExportService } from '@app/core/services/excel-export.service';
import jsPDF from 'jspdf';

// Interface for per-item decisions
interface ItemDecision {
  itemId: number
  action: "approve" | "reject" | "no-action"
  rejectionReasonId?: number
  comment?: string
}

// Interface for manual status updates
export interface StatusUpdateRequest {
  itemId: number
  newStatus: RefundItemStatus
  note?: string
  rejectionReasonId?: number
  rejectionComment?: string
  adminId?: number
}

// Interface for status history
interface StatusHistoryItem {
  status: RefundItemStatus
  timestamp: Date
  adminId?: number
  adminName?: string
  note?: string
}

@Component({
  selector: "app-refund-request-detail",
  standalone: false,
  templateUrl: "./refund-request-detail.component.html",
  styleUrl: "./refund-request-detail.component.css",
})
export class RefundRequestDetailComponent implements OnInit, OnDestroy {
  // Data properties
  refundRequest: RefundRequestDTO | null = null
  refundReasons: RefundReasonDTO[] = []
  rejectionReasons: RejectionReasonDTO[] = []
  isLoading = false
  errorMessage = ""
  successMessage = ""

  // Example structure: Map itemId to array of history entries
  refundRequestStatusHistoriesByItem: { [itemId: number]: RefundItemStatusHistoryDTO[] } = {};


  // Per-item decisions (local state)
  itemDecisions: Map<number, ItemDecision> = new Map()

  // Modal states
  showImageModal = false
  showRejectionReasonModal = false
  showStatusUpdateModal = false
  showStatusHistoryModal = false
  selectedImage = ""
  selectedImageIndex = 0
  selectedItemImages: string[] = []
  selectedItemForRejection: RefundItemDTO | null = null
  selectedItemForStatusUpdate: RefundItemDTO | null = null

  // Reactive Forms
  rejectionForm: FormGroup
  statusUpdateForm: FormGroup

  // UI state
  isSubmitting = false
  hasChanges = false
  isUpdatingStatus = false

  // Expose enums for template
  refundStatus = RefundStatus
  refundItemStatus = RefundItemStatus
  requestedRefundAction = RequestedRefundAction

  userId = 0

  private destroy$ = new Subject<void>()

  // Export columns definition
  exportColumns = [
    { header: 'Refund Item ID', field: 'id', width: 20 },
    { header: 'Product Name', field: 'productName', width: 50 },
    { header: 'SKU', field: 'sku', width: 30 },
    { header: 'Quantity', field: 'quantity', width: 20 },
    { header: 'Requested Action', field: 'requestedAction', width: 35 },
    { header: 'Status', field: 'status', width: 30 },
    { header: 'Reason', field: 'reasonId', width: 40 },
    { header: 'Custom Reason', field: 'customReasonText', width: 50 },
    { header: 'Admin Comment', field: 'adminComment', width: 50 },
    { header: 'Created At', field: 'createdAt', width: 40 }
  ];

  // Export loading states
  isExportingPdf = false;
  isExportingExcel = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private refundRequestService: RefundRequestService,
    private refundReasonService: RefundReasonService,
    private rejectionReasonService: RejectionReasonService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService,
  ) {
    // Initialize reactive forms
    this.rejectionForm = this.formBuilder.group({
      reasonId: ["", Validators.required],
      customReasonText: [""],
    })

    this.statusUpdateForm = this.formBuilder.group({
      newStatus: ["", Validators.required],
      note: [""],
      rejectionReasonId: [""],
      rejectionComment: [""],
    })
  }

  ngOnInit(): void {
    this.loadRefundRequestDetail()
    this.loadReasons()
    this.userId = this.authService.getCurrentUser()?.id!
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  loadRefundRequestDetail(): void {
    const id = Number(this.route.snapshot.paramMap.get("id"))

    if (!id || isNaN(id)) {
      this.errorMessage = "Invalid refund request ID"
      return
    }

    this.isLoading = true
    this.errorMessage = ""

    this.refundRequestService
      .getRefundRequestDetail(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (request) => {
          this.refundRequest = request
          this.initializeItemDecisions()
          this.isLoading = false
          console.log("Refund request loaded:", request)
        },
        error: (error) => {
          console.error("Error loading refund request:", error)
          this.errorMessage = "Failed to load refund request details. Please try again."
          this.isLoading = false
        },
      })
  }

  private loadReasons(): void {
    this.refundReasonService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.refundReasons = reasons || []
        },
        error: (error) => {
          console.error("Error loading refund reasons:", error)
        },
      })

    this.rejectionReasonService
      .getAllRejectionReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.rejectionReasons = reasons || []
          console.log("Rejection reasons loaded:", this.rejectionReasons)
        },
        error: (error) => {
          console.error("Error loading rejection reasons:", error)
        },
      })
  }

  // Initialize item decisions with default 'no-action'
  private initializeItemDecisions(): void {
    if (!this.refundRequest?.items) return

    this.itemDecisions.clear()
    this.refundRequest.items.forEach((item) => {
      if (item.id && item.status === RefundItemStatus.REQUESTED) {
        this.itemDecisions.set(item.id, {
          itemId: item.id,
          action: "no-action",
        })
      }
    })
    this.updateHasChanges()
  }

  // Handle per-item decision changes
  onItemDecisionChange(item: RefundItemDTO, action: "approve" | "reject" | "no-action"): void {
    if (!item.id) return

    if (action === "reject") {
      // Open rejection reason modal
      this.selectedItemForRejection = item
      this.rejectionForm.reset()
      this.showRejectionReasonModal = true
      return
    }

    // For approve or no-action, update directly
    const decision: ItemDecision = {
      itemId: item.id,
      action: action,
    }

    this.itemDecisions.set(item.id, decision)
    this.updateHasChanges()
  }

  // Handle rejection reason change to update validation
  onRejectionReasonChange(): void {
    const reasonId = this.rejectionForm.get("reasonId")?.value
    const selectedReason = this.rejectionReasons.find((r) => r.id == reasonId)

    const customReasonTextControl = this.rejectionForm.get("customReasonText")

    if (selectedReason?.allowCustomText) {
      // Make custom text required
      customReasonTextControl?.setValidators([Validators.required])
    } else {
      // Remove required validation
      customReasonTextControl?.clearValidators()
    }

    // Update validation status
    customReasonTextControl?.updateValueAndValidity()
  }

  // Check if custom reason field should be shown as required
  shouldShowCustomReasonField(): boolean {
    const reasonId = this.rejectionForm.get("reasonId")?.value
    const selectedReason = this.rejectionReasons.find((r) => r.id == reasonId)
    return selectedReason?.allowCustomText === true
  }

  // Handle rejection reason modal
  confirmRejection(): void {
    if (!this.selectedItemForRejection?.id || !this.rejectionForm.valid) return

    const formValue = this.rejectionForm.value
    const decision: ItemDecision = {
      itemId: this.selectedItemForRejection.id,
      action: "reject",
      rejectionReasonId: Number(formValue.reasonId),
      comment: formValue.customReasonText,
    }

    this.itemDecisions.set(this.selectedItemForRejection.id, decision)
    this.updateHasChanges()
    this.closeRejectionReasonModal()
  }

  closeRejectionReasonModal(): void {
    // If there was a selected item and no reason was provided, reset to no-action
    if (this.selectedItemForRejection?.id && !this.rejectionForm.get("reasonId")?.value) {
      const decision: ItemDecision = {
        itemId: this.selectedItemForRejection.id,
        action: "no-action",
      }
      this.itemDecisions.set(this.selectedItemForRejection.id, decision)
      this.updateHasChanges()
    }

    this.showRejectionReasonModal = false
    this.selectedItemForRejection = null
    this.rejectionForm.reset()
  }

  // Manual Status Update Methods
  openStatusUpdateModal(item: RefundItemDTO): void {
    this.selectedItemForStatusUpdate = item
    this.statusUpdateForm.reset()
    this.showStatusUpdateModal = true
  }

  closeStatusUpdateModal(): void {
    this.showStatusUpdateModal = false
    this.selectedItemForStatusUpdate = null
    this.statusUpdateForm.reset()
    // Clear any validation errors
    Object.keys(this.statusUpdateForm.controls).forEach((key) => {
      this.statusUpdateForm.get(key)?.clearValidators()
      this.statusUpdateForm.get(key)?.updateValueAndValidity()
    })
  }

  // Enhanced Status Flow Validation - Strict Sequential Flow
  getNextStatusOptions(item: RefundItemDTO): RefundItemStatus[] {
    const currentStatus = item.status
    const requestedAction = item.requestedAction

    // Strict sequential flow - no skipping allowed
    switch (currentStatus) {
      case RefundItemStatus.APPROVED:
        if (requestedAction === RequestedRefundAction.REFUND_ONLY) {
          // Direct refund: APPROVED -> REFUNDED only
          return [RefundItemStatus.REFUNDED]
        } else if (requestedAction === RequestedRefundAction.RETURN_AND_REFUND) {
          // Return & refund: APPROVED -> RETURN_PENDING only (must wait for return)
          return [RefundItemStatus.RETURN_PENDING]
        } else if (requestedAction === RequestedRefundAction.REPLACEMENT) {
          // Replacement: APPROVED -> RETURN_PENDING only (must wait for return)
          return [RefundItemStatus.RETURN_PENDING]
        }
        break

      case RefundItemStatus.RETURN_PENDING:
        // From return pending, can only go to received or rejected
        return [RefundItemStatus.RETURN_RECEIVED, RefundItemStatus.RETURN_REJECTED]

      case RefundItemStatus.RETURN_RECEIVED:
        if (requestedAction === RequestedRefundAction.RETURN_AND_REFUND) {
          // After return received, can process refund or reject the return
          return [RefundItemStatus.REFUNDED, RefundItemStatus.RETURN_REJECTED]
        } else if (requestedAction === RequestedRefundAction.REPLACEMENT) {
          // After return received, can send replacement or reject the return
          return [RefundItemStatus.REPLACED, RefundItemStatus.RETURN_REJECTED]
        }
        break

      // Final statuses - no further transitions allowed
      case RefundItemStatus.REFUNDED:
      case RefundItemStatus.REPLACED:
      case RefundItemStatus.REJECTED:
      case RefundItemStatus.RETURN_REJECTED:
        return []

      default:
        return []
    }

    return []
  }

  canUpdateStatus(item: RefundItemDTO): boolean {
    const nextOptions = this.getNextStatusOptions(item)
    return nextOptions.length > 0
  }

  // Validation method to check if status transition is valid
  isValidStatusTransition(
    currentStatus: RefundItemStatus,
    newStatus: RefundItemStatus,
    requestedAction: RequestedRefundAction,
  ): boolean {
    const allowedNextStatuses = this.getNextStatusOptionsForStatus(currentStatus, requestedAction)
    return allowedNextStatuses.includes(newStatus)
  }

  private getNextStatusOptionsForStatus(
    currentStatus: RefundItemStatus,
    requestedAction: RequestedRefundAction,
  ): RefundItemStatus[] {
    // Same logic as getNextStatusOptions but for validation
    switch (currentStatus) {
      case RefundItemStatus.APPROVED:
        if (requestedAction === RequestedRefundAction.REFUND_ONLY) {
          return [RefundItemStatus.REFUNDED]
        } else if (requestedAction === RequestedRefundAction.RETURN_AND_REFUND) {
          return [RefundItemStatus.RETURN_PENDING]
        } else if (requestedAction === RequestedRefundAction.REPLACEMENT) {
          return [RefundItemStatus.RETURN_PENDING]
        }
        break

      case RefundItemStatus.RETURN_PENDING:
        return [RefundItemStatus.RETURN_RECEIVED, RefundItemStatus.RETURN_REJECTED]

      case RefundItemStatus.RETURN_RECEIVED:
        if (requestedAction === RequestedRefundAction.RETURN_AND_REFUND) {
          return [RefundItemStatus.REFUNDED, RefundItemStatus.RETURN_REJECTED]
        } else if (requestedAction === RequestedRefundAction.REPLACEMENT) {
          return [RefundItemStatus.REPLACED, RefundItemStatus.RETURN_REJECTED]
        }
        break

      default:
        return []
    }
    return []
  }

  isRejectionStatus(status: RefundItemStatus): boolean {
    return status === RefundItemStatus.RETURN_REJECTED || status === RefundItemStatus.REJECTED
  }

  onStatusUpdateChange(): void {
    const selectedStatus = this.statusUpdateForm.get("newStatus")?.value
    const rejectionReasonControl = this.statusUpdateForm.get("rejectionReasonId")
    const rejectionCommentControl = this.statusUpdateForm.get("rejectionComment")
    const noteControl = this.statusUpdateForm.get("note")

    if (this.isRejectionStatus(selectedStatus)) {
      // Make rejection reason required for rejection statuses
      rejectionReasonControl?.setValidators([Validators.required])
      // Clear and disable note field for rejections
      noteControl?.setValue("")
      noteControl?.clearValidators()
    } else {
      // Clear rejection fields for non-rejection statuses
      rejectionReasonControl?.clearValidators()
      rejectionCommentControl?.clearValidators()
      rejectionReasonControl?.setValue("")
      rejectionCommentControl?.setValue("")
      // Note field is optional for non-rejection statuses
      noteControl?.clearValidators()
    }

    rejectionReasonControl?.updateValueAndValidity()
    rejectionCommentControl?.updateValueAndValidity()
    noteControl?.updateValueAndValidity()
  }

  onStatusUpdateRejectionReasonChange(): void {
    const reasonId = this.statusUpdateForm.get("rejectionReasonId")?.value
    const selectedReason = this.rejectionReasons.find((r) => r.id == reasonId)
    const rejectionCommentControl = this.statusUpdateForm.get("rejectionComment")

    if (selectedReason?.allowCustomText) {
      rejectionCommentControl?.setValidators([Validators.required])
    } else {
      rejectionCommentControl?.clearValidators()
    }

    rejectionCommentControl?.updateValueAndValidity()
  }

  shouldShowStatusUpdateCustomReasonField(): boolean {
    const reasonId = this.statusUpdateForm.get("rejectionReasonId")?.value
    const selectedReason = this.rejectionReasons.find((r) => r.id == reasonId)
    return selectedReason?.allowCustomText === true
  }

  confirmStatusUpdate(): void {
    if (!this.selectedItemForStatusUpdate?.id || !this.statusUpdateForm.valid) return

    const formValue = this.statusUpdateForm.value
    const newStatus = formValue.newStatus as RefundItemStatus

    // Validate the status transition
    if (
      !this.isValidStatusTransition(
        this.selectedItemForStatusUpdate.status!,
        newStatus,
        this.selectedItemForStatusUpdate.requestedAction!,
      )
    ) {
      this.errorMessage = "Invalid status transition. Please follow the proper workflow sequence."
      return
    }

    const updateRequest: StatusUpdateRequest = {
      itemId: this.selectedItemForStatusUpdate.id,
      newStatus: newStatus,
      adminId: this.userId,
    }

    // Add rejection data if it's a rejection status
    if (this.isRejectionStatus(newStatus)) {
      updateRequest.rejectionReasonId = Number(formValue.rejectionReasonId)
      updateRequest.rejectionComment = formValue.rejectionComment || undefined
    } else {
      // Add note for non-rejection statuses
      updateRequest.note = formValue.note || undefined
    }

    this.isUpdatingStatus = true

    // Call API to update status
    this.refundRequestService
      .updateItemStatus(updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccessMessage("Item status updated successfully!")
          this.isUpdatingStatus = false
          this.closeStatusUpdateModal()
          // Reload data after successful update
          setTimeout(() => {
            console.log("loading refund request detail after status update");
            this.loadRefundRequestDetail()
          }, 200)
        },
        error: (error) => {
          console.error("Error updating item status:", error)
          this.errorMessage = "Failed to update item status. Please try again."
          this.isUpdatingStatus = false
        },
      })
  }

  // Status History Modal Methods
  openStatusHistoryModal(): void {
    this.showStatusHistoryModal = true
  }

  closeStatusHistoryModal(): void {
    this.showStatusHistoryModal = false
  }


  // Mock status history - replace with actual API call
  getStatusHistory(): RefundStatusHistoryDTO[] {
    console.log(
      "status history : ",
      (this.refundRequest?.statusHistory || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    )

    return (this.refundRequest?.statusHistory || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  }

  selectedItem: RefundItemDTO | null = null;
  showItemStatusHistoryModal = false;

  openItemStatusHistoryModal(item: RefundItemDTO) {
    this.selectedItem = item;
    this.showItemStatusHistoryModal = true;
  }

  closeItemStatusHistoryModal() {
    this.selectedItem = null;
    this.showItemStatusHistoryModal = false;
  }

  getItemStatusHistory(item: RefundItemDTO): RefundItemStatusHistoryDTO[] {
    console.log("getItemStatusHistory called for item:", item);

    return (item.statusHistory || []).slice().sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  // Get current decision for an item
  getItemDecision(item: RefundItemDTO): "approve" | "reject" | "no-action" {
    if (!item.id) return "no-action"
    return this.itemDecisions.get(item.id)?.action || "no-action"
  }

  // Check if item can be reviewed (only requested items)
  canReviewItem(item: RefundItemDTO): boolean {
    return item.status === RefundItemStatus.REQUESTED
  }

  // Update hasChanges flag
  private updateHasChanges(): void {
    this.hasChanges = Array.from(this.itemDecisions.values()).some((decision) => decision.action !== "no-action")
  }

  // Submit all decisions in one batch
  submitReview(): void {
    if (!this.refundRequest?.id || !this.hasChanges) return

    this.isSubmitting = true
    this.errorMessage = ""

    // Prepare batch request data
    const decisions = Array.from(this.itemDecisions.values()).filter((decision) => decision.action !== "no-action")

    const batchRequest = {
      refundRequestId: this.refundRequest.id,
      itemDecisions: decisions,
      adminId: this.userId,
    }

    console.log("Submitting batch request:", batchRequest)

    // Call batch API
    this.refundRequestService
      .submitBatchItemDecisions(batchRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccessMessage("Review submitted successfully!")
          this.isSubmitting = false
          // Reload data after successful submit
          setTimeout(() => {
            this.loadRefundRequestDetail()
          }, 1000)
        },
        error: (error) => {
          console.error("Error submitting review:", error)
          this.errorMessage = "Failed to submit review. Please try again."
          this.isSubmitting = false
        },
      })
  }

  // Reset all decisions
  resetDecisions(): void {
    this.initializeItemDecisions()
  }

  // Enhanced Financial Breakdown Methods
  getTotalItems(): number {
    return this.refundRequest?.items?.length || 0
  }

  // Direct refundable now (APPROVED items under REFUND_ONLY)
  getDirectRefundableAmount(): number {
    if (!this.refundRequest?.items || !this.refundRequest?.orderDetail?.items) return 0

    return this.refundRequest.items
      .filter((item) => {
        return item.status === RefundItemStatus.APPROVED && item.requestedAction === RequestedRefundAction.REFUND_ONLY
      })
      .reduce((total, refundItem) => {
        const orderItem = this.refundRequest!.orderDetail!.items.find((oi : OrderItemDetail) => oi.id === refundItem.orderItemId)
        const unitPrice = orderItem?.price || 0
        return total + unitPrice * refundItem.quantity
      }, 0)
  }

  // Pending refund after return (APPROVED/RETURN_RECEIVED under RETURN_AND_REFUND)
  getPendingRefundAmount(): number {
    if (!this.refundRequest?.items || !this.refundRequest?.orderDetail?.items) return 0

    return this.refundRequest.items
      .filter((item) => {
        const decision = item.id ? this.itemDecisions.get(item.id) : null

        const isApprovedOrReceived =
          decision?.action === "approve" ||
          item.status === RefundItemStatus.APPROVED ||
          item.status === RefundItemStatus.RETURN_PENDING ||
          item.status === RefundItemStatus.RETURN_RECEIVED

        return isApprovedOrReceived && item.requestedAction === RequestedRefundAction.RETURN_AND_REFUND
      })
      .reduce((total, refundItem) => {
        const orderItem = this.refundRequest!.orderDetail!.items.find((oi : OrderItemDetail) => oi.id === refundItem.orderItemId)
        const unitPrice = orderItem?.price || 0
        return total + unitPrice * refundItem.quantity
      }, 0)
  }

  // Total refund requested (all items regardless of flow)
  getTotalRefundRequested(): number {
    if (!this.refundRequest?.items || !this.refundRequest?.orderDetail?.items) return 0

    return this.refundRequest.items
      .filter((item) => {
        return (
          item.requestedAction === RequestedRefundAction.REFUND_ONLY ||
          item.requestedAction === RequestedRefundAction.RETURN_AND_REFUND
        )
      })
      .reduce((total, refundItem) => {
        const orderItem = this.refundRequest!.orderDetail!.items.find((oi : OrderItemDetail) => oi.id === refundItem.orderItemId)
        const unitPrice = orderItem?.price || 0
        return total + unitPrice * refundItem.quantity
      }, 0)
  }

  // Legacy method for backward compatibility
  getTotalRefundAmount(): number {
    if (!this.refundRequest?.items || !this.refundRequest?.orderDetail?.items) return 0;

    return this.refundRequest.items
      .filter(item => item.status === RefundItemStatus.REFUNDED)
      .reduce((total, refundItem) => {
        const orderItem = this.refundRequest!.orderDetail!.items.find((oi : OrderItemDetail) => oi.id === refundItem.orderItemId);
        const unitPrice = orderItem?.price || 0;
        return total + unitPrice * refundItem.quantity;
      }, 0);
  }


  getApprovedCount(): number {
    if (!this.refundRequest?.items) return 0

    return this.refundRequest.items.filter((item) => {
      const decision = item.id ? this.itemDecisions.get(item.id) : null
      return (
        decision?.action === "approve" ||
        item.status === RefundItemStatus.APPROVED ||
        item.status === RefundItemStatus.RETURN_PENDING ||
        item.status === RefundItemStatus.RETURN_RECEIVED ||
        item.status === RefundItemStatus.REFUNDED ||
        item.status === RefundItemStatus.REPLACED
      )
    }).length
  }

  getRejectedCount(): number {
    if (!this.refundRequest?.items) return 0

    return this.refundRequest.items.filter((item) => {
      const decision = item.id ? this.itemDecisions.get(item.id) : null
      return (
        decision?.action === "reject" ||
        item.status === RefundItemStatus.REJECTED ||
        item.status === RefundItemStatus.RETURN_REJECTED
      )
    }).length
  }

  // Get count of items pending return
  getReturnPendingCount(): number {
    if (!this.refundRequest?.items) return 0

    return this.refundRequest.items.filter((item) => {
      return item.status === RefundItemStatus.RETURN_PENDING
    }).length
  }

  // Get count of approved items that require return or replacement
  getReturnReplacementCount(): number {
    if (!this.refundRequest?.items) return 0

    return this.refundRequest.items.filter((item) => {
      const decision = item.id ? this.itemDecisions.get(item.id) : null
      const isApproved =
        decision?.action === "approve" ||
        item.status === RefundItemStatus.APPROVED ||
        item.status === RefundItemStatus.RETURN_PENDING ||
        item.status === RefundItemStatus.RETURN_RECEIVED ||
        item.status === RefundItemStatus.REFUNDED ||
        item.status === RefundItemStatus.REPLACED

      const requiresReturnOrReplace =
        item.requestedAction === RequestedRefundAction.RETURN_AND_REFUND ||
        item.requestedAction === RequestedRefundAction.REPLACEMENT

      return isApproved && requiresReturnOrReplace
    }).length
  }

  // Status display methods with updated statuses
  getItemStatusBadgeClass(status: string): string {
    switch (status) {
      case RefundItemStatus.REQUESTED:
        return "badge bg-primary"
      case RefundItemStatus.APPROVED:
        return "badge bg-success"
      case RefundItemStatus.RETURN_PENDING:
        return "badge bg-warning"
      case RefundItemStatus.RETURN_RECEIVED:
        return "badge bg-info"
      case RefundItemStatus.REFUNDED:
        return "badge bg-success"
      case RefundItemStatus.REPLACED:
        return "badge bg-success"
      case RefundItemStatus.REJECTED:
        return "badge bg-danger"
      case RefundItemStatus.RETURN_REJECTED:
        return "badge bg-danger"
      default:
        return "badge bg-secondary"
    }
  }

  getItemStatusIcon(status: string): string {
    switch (status) {
      case RefundItemStatus.REQUESTED:
        return 'bi bi-pencil-square text-primary';
      case RefundItemStatus.APPROVED:
        return 'bi bi-check-circle text-success';
      case RefundItemStatus.RETURN_PENDING:
        return 'bi bi-hourglass-split text-warning';
      case RefundItemStatus.RETURN_RECEIVED:
        return 'bi bi-box-arrow-in-down text-info';
      case RefundItemStatus.REFUNDED:
        return 'bi bi-cash-coin text-success';
      case RefundItemStatus.REPLACED:
        return 'bi bi-arrow-repeat text-success';
      case RefundItemStatus.REJECTED:
        return 'bi bi-x-circle text-danger';
      case RefundItemStatus.RETURN_REJECTED:
        return 'bi bi-x-octagon text-danger';
      default:
        return 'bi bi-question-circle text-secondary';
    }
  }

  getItemStatusDisplayText(status: string): string {
    switch (status) {
      case RefundItemStatus.REQUESTED:
        return "Requested"
      case RefundItemStatus.APPROVED:
        return "Approved"
      case RefundItemStatus.RETURN_PENDING:
        return "Return Pending"
      case RefundItemStatus.RETURN_RECEIVED:
        return "Return Received"
      case RefundItemStatus.REFUNDED:
        return "Refunded"
      case RefundItemStatus.REPLACED:
        return "Replaced"
      case RefundItemStatus.REJECTED:
        return "Rejected"
      case RefundItemStatus.RETURN_REJECTED:
        return "Return Rejected"
      default:
        return status || "Unknown"
    }
  }

  // Enhanced status flow methods
  showStatusFlow(item: RefundItemDTO): boolean {
    return item.status !== RefundItemStatus.REQUESTED;
  }

  // showStatusFlow(item: RefundItemDTO): boolean {
  //   // Show for items that are in return flow or require return process
  //   return this.isCurrentlyInReturnFlow(item) || this.isReturnProcessItem(item) || this.isRejectedAfterReturn(item)
  // }

  isCurrentlyInReturnFlow(item: RefundItemDTO): boolean {
    return item.status === RefundItemStatus.RETURN_PENDING || item.status === RefundItemStatus.RETURN_RECEIVED
  }

  isReturnProcessItem(item: RefundItemDTO): boolean {
    return (
      item.requestedAction === RequestedRefundAction.RETURN_AND_REFUND ||
      item.requestedAction === RequestedRefundAction.REPLACEMENT
    )
  }

  isRejectedAfterReturn(item: RefundItemDTO): boolean {
    return item.status === RefundItemStatus.RETURN_REJECTED
  }

  getReviewRequiredCount(): number {
    return this.refundRequest!.items.filter(item => this.canReviewItem(item)).length;
  }

  getReturnInProgressCount(): number {
    return this.refundRequest!.items.filter(item =>
      item.status === 'RETURN_PENDING' || item.status === 'RETURN_RECEIVED'
    ).length;
  }

  getRefundedCount(): number {
    return this.refundRequest!.items.filter(item => item.status === 'REFUNDED').length;
  }

  getReplacedCount(): number {
    return this.refundRequest!.items.filter(item => item.status === 'REPLACED').length;
  }



  // Enhanced status flow description
  getStatusFlowDescription(item: RefundItemDTO): string {
    if (item.requestedAction === RequestedRefundAction.REFUND_ONLY) {
      switch (item.status) {
        case RefundItemStatus.APPROVED:
          return "Direct refund approved - processing payment"
        case RefundItemStatus.REFUNDED:
          return "Refund completed"
        default:
          return "Direct refund - no return required"
      }
    } else if (item.requestedAction === RequestedRefundAction.RETURN_AND_REFUND) {
      switch (item.status) {
        case RefundItemStatus.APPROVED:
          return "Approved - awaiting item return before refund"
        case RefundItemStatus.RETURN_PENDING:
          return "Awaiting item return - customer must ship item back"
        case RefundItemStatus.RETURN_RECEIVED:
          return "Item returned and received - refund can now be processed"
        case RefundItemStatus.REFUNDED:
          return "Item returned and refund completed"
        case RefundItemStatus.RETURN_REJECTED:
          return "Item return rejected - no refund issued"
        default:
          return "Return & refund process"
      }
    } else if (item.requestedAction === RequestedRefundAction.REPLACEMENT) {
      switch (item.status) {
        case RefundItemStatus.APPROVED:
          return "Approved - processing replacement"
        case RefundItemStatus.RETURN_PENDING:
          return "Awaiting item return before sending replacement"
        case RefundItemStatus.RETURN_RECEIVED:
          return "Item returned - sending replacement"
        case RefundItemStatus.REPLACED:
          return "Replacement item sent"
        case RefundItemStatus.RETURN_REJECTED:
          return "Item return rejected - replacement canceled"
        default:
          return "Replacement process"
      }
    }
    return ""
  }

  // Action badge methods (unchanged)
  getActionBadgeClass(item: RefundItemDTO): string {
    const action = (item as any).requestedAction || "REFUND_ONLY"

    switch (action) {
      case RequestedRefundAction.REFUND_ONLY:
        return "action-badge refund-only"
      case RequestedRefundAction.RETURN_AND_REFUND:
        return "action-badge return-refund"
      case RequestedRefundAction.REPLACEMENT:
        return "action-badge replacement"
      default:
        return "action-badge"
    }
  }

  getActionDisplayText(item: RefundItemDTO): string {
    const action = (item as any).requestedAction || "REFUND_ONLY"

    switch (action) {
      case RequestedRefundAction.REFUND_ONLY:
        return "Refund Only"
      case RequestedRefundAction.RETURN_AND_REFUND:
        return "Return & Refund"
      case RequestedRefundAction.REPLACEMENT:
        return "Replacement"
      default:
        return "Unknown Action"
    }
  }

  // Status display methods
  getStatusBadgeClass(status?: RefundStatus): string {
    switch (status) {
      case RefundStatus.REQUESTED:
        return "badge bg-primary"
      case RefundStatus.IN_PROGRESS:
        return "badge bg-info"
      case RefundStatus.COMPLETED:
        return "badge bg-success"
      case RefundStatus.REJECTED:
        return "badge bg-danger"
      default:
        return "badge bg-secondary"
    }
  }

  getStatusDisplayText(status?: RefundStatus): string {
    switch (status) {
      case RefundStatus.REQUESTED:
        return "Requested"
      case RefundStatus.IN_PROGRESS:
        return "In Progress"
      case RefundStatus.COMPLETED:
        return "Completed"
      case RefundStatus.REJECTED:
        return "Rejected"
      default:
        return "Unknown"
    }
  }

  // Utility methods
  getRefundReasonLabel(reasonId: number): string {
    const reason = this.refundReasons.find((r) => r.id === reasonId)
    return reason?.label || "Unknown Reason"
  }

  getRejectionReasonLabel(reasonId: number): string {
    const reason = this.rejectionReasons.find((r) => r.id === reasonId)
    return reason?.label || "Unknown Reason"
  }

  // Image handling
  openImageModal(images: string[], startIndex = 0): void {
    this.selectedItemImages = images
    this.selectedImageIndex = startIndex
    this.selectedImage = images[startIndex]
    this.showImageModal = true
  }

  closeImageModal(): void {
    this.showImageModal = false
    this.selectedImage = ""
    this.selectedItemImages = []
    this.selectedImageIndex = 0
  }

  previousImage(): void {
    if (this.selectedImageIndex > 0) {
      this.selectedImageIndex--
      this.selectedImage = this.selectedItemImages[this.selectedImageIndex]
    }
  }

  nextImage(): void {
    if (this.selectedImageIndex < this.selectedItemImages.length - 1) {
      this.selectedImageIndex++
      this.selectedImage = this.selectedItemImages[this.selectedImageIndex]
    }
  }

  getImagePaths(images: { imgPath: string }[]): string[] {
    return images.map((img) => img.imgPath)
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement
    if (target) {
      target.src = "/assets/images/product-placeholder.png"
    }
  }

  // Form validation
  isRejectionReasonFormValid(): boolean {
    return this.rejectionForm.valid
  }

  isStatusUpdateFormValid(): boolean {
    return this.statusUpdateForm.valid
  }

  // Utility methods
  private showSuccessMessage(message: string): void {
    this.successMessage = message
    setTimeout(() => {
      this.successMessage = ""
    }, 5000)
  }

  // Navigation
  goBack(): void {
    this.router.navigate(["/admin/refundRequestList"])
  }

  goToOrder(): void {
    if (this.refundRequest?.orderId) {
      this.router.navigate(["/admin/orders", this.refundRequest.orderId])
    }
  }

  goToCustomer(): void {
    if (this.refundRequest?.userId) {
      this.router.navigate(["/admin/customers", this.refundRequest.userId])
    }
  }

  // Get count of items that can be reviewed
  getReviewableItemsCount(): number {
    if (!this.refundRequest?.items) return 0
    return this.refundRequest.items.filter((item) => item.status === RefundItemStatus.REQUESTED).length
  }

  // Get count of items that have been decided (not no-action)
  getDecidedItemsCount(): number {
    return Array.from(this.itemDecisions.values()).filter((decision) => decision.action !== "no-action").length
  }

  // Get review progress percentage
  getReviewProgress(): number {
    const total = this.getReviewableItemsCount()
    if (total === 0) return 100
    const decided = this.getDecidedItemsCount()
    return Math.round((decided / total) * 100)
  }

  // Check if all items have been reviewed (can submit)
  canSubmitReview(): boolean {
    const reviewableCount = this.getReviewableItemsCount()
    const decidedCount = this.getDecidedItemsCount()
    return reviewableCount > 0 && decidedCount === reviewableCount
  }

  getPreviousStatus(item: RefundItemDTO): string | null {
    if (!item.statusHistory || item.statusHistory.length < 2) return null;

    // Find the status just before the last (current) one
    const sorted = [...item.statusHistory].sort((a, b) => {
      return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
    });

    // Second to last status
    return sorted[sorted.length - 2]?.status || null;
  }

  async exportDetailToPdf() {
    if (!this.refundRequest) {
      this.errorMessage = 'No refund request data available for export';
      return;
    }

    this.isExportingPdf = true;
    
    try {
      const filename = `refund-request-${this.refundRequest.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Create a comprehensive refund request report
      this.createRefundRequestReportPdf(filename);
      
      this.showSuccessMessage('Refund request exported to PDF successfully');
    } catch (error) {
      console.error('Error exporting refund request to PDF:', error);
      this.errorMessage = 'Failed to export refund request to PDF';
    } finally {
      this.isExportingPdf = false;
    }
  }

  async exportDetailToExcel() {
    if (!this.refundRequest) {
      this.errorMessage = 'No refund request data available for export';
      return;
    }

    this.isExportingExcel = true;

    try {
      const filename = `refund-request-${this.refundRequest.id}-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Prepare refund request data for Excel export
      const refundData = this.prepareRefundRequestDataForExport();
      
      await this.excelExportService.exportToExcel(
        refundData,
        this.getRefundRequestExportColumns(),
        filename,
        'Refund Request Details',
        `Refund Request #${this.refundRequest.id} Report`
      );
      
      this.showSuccessMessage('Refund request exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting refund request to Excel:', error);
      this.errorMessage = 'Failed to export refund request to Excel';
    } finally {
      this.isExportingExcel = false;
    }
  }

  private createRefundRequestReportPdf(filename: string): void {
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
    pdf.text('REFUND REQUEST DETAIL REPORT', pageWidth / 2, 28, { align: 'center' });
    
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
    
    pdf.text(`Refund Request ID:`, margin, y);
    pdf.text(`${this.refundRequest!.id}`, margin + 35, y);
    y += 5;
    
    pdf.text(`Order Tracking:`, margin, y);
    pdf.text(`${this.refundRequest!.orderDetail?.trackingNumber || 'N/A'}`, margin + 35, y);
    y += 5;
    
    pdf.text(`Customer Name:`, margin, y);
    pdf.text(`${this.refundRequest!.orderDetail?.user?.name || 'N/A'}`, margin + 35, y);
    y += 5;
    
    pdf.text(`Total Items:`, margin, y);
    pdf.text(`${this.refundRequest!.items.length}`, margin + 35, y);
    y += 5;
    
    pdf.text(`Request Status:`, margin, y);
    pdf.text(`${this.getStatusDisplayText(this.refundRequest!.status)}`, margin + 35, y);
    
    // Separator line
    y += 10;
    this.drawSeparatorLine(pdf, y, pageWidth, margin);
    y += 5;
    
    // Refund Request Details Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`REFUND REQUEST: #${this.refundRequest!.id}`, margin, y);
    y += 8;
    
    // Request details
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    pdf.text(`Request ID: ${this.refundRequest!.id}`, margin, y);
    y += 5;
    
    pdf.text(`Order Tracking: ${this.refundRequest!.orderDetail?.trackingNumber || 'N/A'}`, margin, y);
    y += 5;
    
    pdf.text(`Customer Name: ${this.refundRequest!.orderDetail?.user?.name || 'N/A'}`, margin, y);
    y += 5;
    
    pdf.text(`Status: ${this.getStatusDisplayText(this.refundRequest!.status)}`, margin, y);
    y += 5;
    
    pdf.text(`Created Date: ${new Date(this.refundRequest!.createdAt || '').toLocaleDateString()}`, margin, y);
    y += 5;
    
    // Financial Summary
    pdf.text(`Total Refund Requested: MMK ${this.getTotalRefundRequested().toLocaleString()}`, margin, y);
    y += 5;
    
    pdf.text(`Direct Refundable: MMK ${this.getDirectRefundableAmount().toLocaleString()}`, margin, y);
    y += 5;
    
    pdf.text(`Pending (After Return): MMK ${this.getPendingRefundAmount().toLocaleString()}`, margin, y);
    y += 5;
    
    pdf.text(`Total Refunded: MMK ${this.getTotalRefundAmount().toLocaleString()}`, margin, y);
    
    // Separator line
    y += 10;
    this.drawSeparatorLine(pdf, y, pageWidth, margin);
    y += 5;
    
    // Items Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('REFUND ITEMS', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    // Table headers
    const tableHeaders = ['Product', 'SKU', 'Qty', 'Action', 'Status', 'Reason'];
    const colWidths = [50, 30, 15, 35, 25, 30];
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
    
    this.refundRequest!.items.forEach((item, index) => {
      if (y > pageHeight - 50) {
        pdf.addPage();
        y = 20;
      }
      
      currentX = margin;
      
      // Product name (truncate if too long)
      const productName = (item.productName || 'N/A').length > 20 ? 
        (item.productName || 'N/A').substring(0, 17) + '...' : (item.productName || 'N/A');
      pdf.text(productName, currentX, y);
      currentX += colWidths[0];
      
      // SKU
      pdf.text(item.sku || 'N/A', currentX, y);
      currentX += colWidths[1];
      
      // Quantity
      pdf.text(item.quantity.toString(), currentX, y);
      currentX += colWidths[2];
      
      // Requested Action
      pdf.text(this.getActionDisplayText(item), currentX, y);
      currentX += colWidths[3];
      
      // Status
      pdf.text(this.getItemStatusDisplayText(item.status || ''), currentX, y);
      currentX += colWidths[4];
      
      // Reason
      const reason = this.getRefundReasonLabel(item.reasonId || 0);
      const reasonText = reason.length > 15 ? reason.substring(0, 12) + '...' : reason;
      pdf.text(reasonText, currentX, y);
      
      y += 4;
    });
    
    // Separator line
    y += 5;
    this.drawSeparatorLine(pdf, y, pageWidth, margin);
    y += 5;
    
    // Summary Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('REFUND SUMMARY', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    pdf.text(`Review Required: ${this.getReviewRequiredCount()} items`, margin, y);
    y += 5;
    
    pdf.text(`Return In Progress: ${this.getReturnInProgressCount()} items`, margin, y);
    y += 5;
    
    pdf.text(`Refunded: ${this.getRefundedCount()} items`, margin, y);
    y += 5;
    
    pdf.text(`Replaced: ${this.getReplacedCount()} items`, margin, y);
    y += 5;
    
    pdf.text(`Rejected: ${this.getRejectedCount()} items`, margin, y);
    y += 5;
    
    pdf.text(`Approved: ${this.getApprovedCount()} items`, margin, y);
    
    // Save PDF
    pdf.save(filename);
  }

  private prepareRefundRequestDataForExport(): any[] {
    if (!this.refundRequest) return [];

    const refundData = [];
    
    // Add refund request header information
    refundData.push({
      field: 'Refund Request Information',
      value: `Refund Request #${this.refundRequest.id}`,
      details: `Tracking: ${this.refundRequest.orderDetail?.trackingNumber || 'N/A'} | Customer: ${this.refundRequest.orderDetail?.user?.name || 'N/A'} | Status: ${this.getStatusDisplayText(this.refundRequest.status)}`
    });

    // Add request details
    refundData.push({
      field: 'Request Details',
      value: `Created: ${new Date(this.refundRequest.createdAt || '').toLocaleDateString()}`,
      details: `Status: ${this.getStatusDisplayText(this.refundRequest.status)} | Total Items: ${this.refundRequest.items.length}`
    });

    // Add order information
    refundData.push({
      field: 'Order Information',
      value: `Tracking: ${this.refundRequest.orderDetail?.trackingNumber || 'N/A'}`,
      details: `Order Date: ${this.refundRequest.orderDetail?.createdDate ? new Date(this.refundRequest.orderDetail.createdDate).toLocaleDateString() : 'N/A'}`
    });

    // Add customer information
    refundData.push({
      field: 'Customer Information',
      value: this.refundRequest.orderDetail?.user?.name || 'N/A',
      details: `Email: ${this.refundRequest.orderDetail?.user?.email || 'N/A'}`
    });

    // Add financial summary
    refundData.push({
      field: 'Financial Summary',
      value: `Total Requested: MMK ${this.getTotalRefundRequested().toLocaleString()}`,
      details: `Direct Refundable: MMK ${this.getDirectRefundableAmount().toLocaleString()} | Pending: MMK ${this.getPendingRefundAmount().toLocaleString()} | Refunded: MMK ${this.getTotalRefundAmount().toLocaleString()}`
    });

    // Add refund items
    this.refundRequest.items.forEach((item, index) => {
      refundData.push({
        field: `Item ${index + 1}`,
        value: item.productName || 'N/A',
        details: `SKU: ${item.sku || 'N/A'} | Qty: ${item.quantity} | Action: ${this.getActionDisplayText(item)} | Status: ${this.getItemStatusDisplayText(item.status || '')}`
      });

      // Add reason information
      refundData.push({
        field: `  - Refund Reason`,
        value: this.getRefundReasonLabel(item.reasonId || 0),
        details: item.customReasonText ? `Custom: ${item.customReasonText}` : 'No custom reason provided'
      });

      // Add admin comment if exists
      if (item.adminComment) {
        refundData.push({
          field: `  - Admin Comment`,
          value: item.adminComment,
          details: 'Admin feedback on this item'
        });
      }
    });

    // Add item summary
    refundData.push({
      field: 'Item Summary',
      value: `Review Required: ${this.getReviewRequiredCount()}`,
      details: `Return In Progress: ${this.getReturnInProgressCount()} | Refunded: ${this.getRefundedCount()} | Replaced: ${this.getReplacedCount()} | Rejected: ${this.getRejectedCount()} | Approved: ${this.getApprovedCount()}`
    });

    return refundData;
  }

  private getRefundRequestExportColumns(): { header: string; field: string; width?: number }[] {
    return [
      { header: 'Field', field: 'field', width: 30 },
      { header: 'Value', field: 'value', width: 40 },
      { header: 'Details', field: 'details', width: 50 }
    ];
  }

  private drawSeparatorLine(pdf: any, y: number, pageWidth: number, margin: number): void {
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(margin, y, pageWidth - margin, y);
    pdf.setLineDashPattern([], 0);
  }

}
