import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, OrderItem, RefundReason, ReturnRequestPayload } from '@app/core/models/refund.model';
import { RefundRequestService } from '@app/core/services/refundRequestService';

@Component({
  selector: 'app-refund-request-form',
  standalone: false,
  templateUrl: './refund-request-form.component.html',
  styleUrl: './refund-request-form.component.css'
})

export class RefundRequestFormComponent implements OnInit {
  returnRequestForm!: FormGroup
  refundReasons: RefundReason[] = []
  order: Order | null = null
  isLoading = false
  isSubmitting = false
  errorMessage = ""

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private refundRequestService: RefundRequestService,
  ) { }

  ngOnInit(): void {
    this.initializeForm()
    this.loadData()
  }

  hasSelectedReturnItems(): boolean {
    return this.itemsFormArray.value.some((item: any) => item.returnQty > 0);
  }


  private initializeForm(): void {
    this.returnRequestForm = this.fb.group({
      orderId: ["", Validators.required],
      items: this.fb.array([]),
      overallNote: ["", [Validators.maxLength(1000)]],
    })
  }

  private loadData(): void {
    this.isLoading = true
    const orderId = Number(this.route.snapshot.paramMap.get("orderId"))

    // Load refund reasons and order details
    Promise.all([
      this.refundRequestService.getRefundReasons().toPromise(),
      this.refundRequestService.getOrderDetails(orderId).toPromise(),
    ])
      .then(([reasons, order]) => {
        this.refundReasons = reasons || []
        this.order = order || null

        if (this.order) {
          this.returnRequestForm.patchValue({ orderId: this.order.id })
          this.populateItemsFormArray()
        }

        this.isLoading = false
      })
      .catch((error) => {
        this.errorMessage = "Failed to load data. Please try again."
        this.isLoading = false
      })
  }

  private populateItemsFormArray(): void {
    const itemsArray = this.returnRequestForm.get("items") as FormArray

    this.order?.items.forEach((item) => {
      const itemGroup = this.createItemFormGroup(item)
      itemsArray.push(itemGroup)
    })
  }

  private createItemFormGroup(orderItem: OrderItem): FormGroup {
    return this.fb.group(
      {
        orderItemId: [orderItem.id],
        productName: [orderItem.productName],
        sku: [orderItem.sku],
        maxReturnQty: [orderItem.maxReturnQty],
        returnQty: [0, [Validators.min(0), Validators.max(orderItem.maxReturnQty)]],
        reasonId: [null],
        customReasonText: ["", [Validators.maxLength(500)]],
        customerNote: ["", [Validators.maxLength(500)]],
        proofs: [[]],
      },
      { validators: this.itemValidator },
    )
  }

  private itemValidator(control: AbstractControl): { [key: string]: any } | null {
    const returnQty = control.get("returnQty")?.value || 0
    const reasonId = control.get("reasonId")?.value
    const customReasonText = control.get("customReasonText")?.value || ""

    if (returnQty > 0) {
      if (!reasonId) {
        return { reasonRequired: true }
      }

      // Check if custom text is required for selected reason
      const reason = this.refundReasons.find((r) => r.id === reasonId)
      if (reason?.allowCustomText && !customReasonText.trim()) {
        return { customReasonRequired: true }
      }
    }

    return null
  }

  get itemsFormArray(): FormArray {
    return this.returnRequestForm.get("items") as FormArray
  }

  getItemFormGroup(index: number): FormGroup {
    return this.itemsFormArray.at(index) as FormGroup
  }

  onReturnQtyChange(index: number): void {
    const itemGroup = this.getItemFormGroup(index)
    const returnQty = itemGroup.get("returnQty")?.value || 0

    if (returnQty === 0) {
      itemGroup.patchValue({
        reasonId: null,
        customReasonText: "",
        customerNote: "",
        proofs: [],
      })
    }
  }

  onReasonChange(index: number): void {
    const itemGroup = this.getItemFormGroup(index)
    const reasonId = itemGroup.get("reasonId")?.value
    const reason = this.refundReasons.find((r) => r.id === reasonId)

    if (!reason?.allowCustomText) {
      itemGroup.patchValue({ customReasonText: "" })
    }
  }

  onFilesSelected(index: number, files: File[]): void {
    const itemGroup = this.getItemFormGroup(index)
    itemGroup.patchValue({ proofs: files })
  }

  isFormValid(): boolean {
    if (!this.returnRequestForm.valid) {
      return false
    }

    // Check if at least one item has returnQty > 0
    const items = this.itemsFormArray.value
    return items.some((item: any) => item.returnQty > 0)
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.markFormGroupTouched(this.returnRequestForm)
      return
    }

    this.isSubmitting = true
    const formValue = this.returnRequestForm.value

    // Filter items with returnQty > 0
    const itemsToReturn = formValue.items.filter((item: any) => item.returnQty > 0)

    const payload: ReturnRequestPayload = {
      orderId: formValue.orderId,
      items: itemsToReturn.map((item: any) => ({
        orderItemId: item.orderItemId,
        returnQty: item.returnQty,
        reasonId: item.reasonId,
        customReasonText: item.customReasonText || undefined,
        customerNote: item.customerNote || undefined,
      })),
      overallNote: formValue.overallNote || undefined,
    }

    this.refundRequestService.submitReturnRequest(payload).subscribe({
      next: (response) => {
        // Handle file uploads if any
        this.handleFileUploads(itemsToReturn, response.id)
      },
      error: (error) => {
        this.errorMessage = "Failed to submit return request. Please try again."
        this.isSubmitting = false
      },
    })
  }

  private handleFileUploads(items: any[], requestId: number): void {
    const uploadPromises = items
      .filter((item) => item.proofs && item.proofs.length > 0)
      .map((item) => this.refundRequestService.uploadProofImages(item.orderItemId, item.proofs).toPromise())

    if (uploadPromises.length === 0) {
      this.onSubmitSuccess()
      return
    }

    Promise.all(uploadPromises)
      .then(() => {
        this.onSubmitSuccess()
      })
      .catch(() => {
        this.errorMessage = "Return request submitted but some files failed to upload."
        this.isSubmitting = false
      })
  }

  private onSubmitSuccess(): void {
    this.isSubmitting = false
    // Show success message and redirect
    alert("Return request submitted successfully!")
    this.router.navigate(["/orders"])
  }

  onCancel(): void {
    this.router.navigate(["/orders"])
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key)
      control?.markAsTouched()

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control)
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl)
          }
        })
      }
    })
  }

  getReasonById(reasonId: number): RefundReason | undefined {
    return this.refundReasons.find((r) => r.id === reasonId)
  }

  shouldShowCustomReasonField(index: number): boolean {
    const itemGroup = this.getItemFormGroup(index)
    const reasonId = itemGroup.get("reasonId")?.value
    const reason = this.getReasonById(reasonId)
    return reason?.allowCustomText || false
  }

  getItemError(index: number, field: string): string {
    const itemGroup = this.getItemFormGroup(index)
    const control = itemGroup.get(field)

    if (control?.touched && control?.errors) {
      if (control.errors["required"]) return `${field} is required`
      if (control.errors["min"]) return `Minimum value is ${control.errors["min"].min}`
      if (control.errors["max"]) return `Maximum value is ${control.errors["max"].max}`
      if (control.errors["maxlength"]) return `Maximum length is ${control.errors["maxlength"].requiredLength}`
    }

    if (itemGroup.touched && itemGroup.errors) {
      if (itemGroup.errors["reasonRequired"]) return "Reason is required when return quantity > 0"
      if (itemGroup.errors["customReasonRequired"]) return "Custom reason text is required"
    }

    return ""
  }
}
