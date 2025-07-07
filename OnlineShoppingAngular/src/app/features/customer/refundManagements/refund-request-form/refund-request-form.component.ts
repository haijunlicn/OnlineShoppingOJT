import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RefundReasonDTO } from '@app/core/models/refund-reason';
import { RefundRequestDTO, RequestedRefundAction, ReturnRequestPayload, ReturnRequestResponse } from '@app/core/models/refund.model';
import { AuthService } from '@app/core/services/auth.service';
import { CloudinaryService } from '@app/core/services/cloudinary.service';
import { OrderDetail, OrderItemDetail, OrderService } from '@app/core/services/order.service';
import { RefundReasonService } from '@app/core/services/refund-reason.service';
import { RefundRequestService } from '@app/core/services/refundRequestService';

@Component({
  selector: "app-refund-request-form",
  standalone: false,
  templateUrl: "./refund-request-form.component.html",
  styleUrl: "./refund-request-form.component.css",
})


export class RefundRequestFormComponent implements OnInit {
  returnRequestForm!: FormGroup
  refundReasons: RefundReasonDTO[] = []
  order: OrderDetail | null = null
  isLoading = false
  isSubmitting = false
  errorMessage = ""
  orderId: number | null = null
  userId = 0

  // Enum reference for template
  RequestedRefundAction = RequestedRefundAction

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private refundRequestService: RefundRequestService,
    private refundReasonService: RefundReasonService,
    private cloudinaryService: CloudinaryService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get("orderId"))
    this.initializeForm()
    this.loadData()
    this.userId = this.authService.getCurrentUser()?.id || 0
    this.logFinalReturnRequest();
  }

  hasSelectedReturnItems(): boolean {
    return this.itemsFormArray.value.some((item: any) => item.requestedAction && item.requestedAction !== "")
  }

  private initializeForm(): void {
    this.returnRequestForm = this.fb.group({
      orderId: ["", Validators.required],
      items: this.fb.array([]),
    })
  }

  private loadData(): void {
    this.isLoading = true
    this.errorMessage = ""

    if (!this.orderId || isNaN(this.orderId)) {
      this.errorMessage = "Invalid order ID"
      this.isLoading = false
      return
    }

    // Load refund reasons and order details
    Promise.all([
      this.refundReasonService.getAllPublicRefundReasons().toPromise(),
      this.refundRequestService.getOrderDetails(this.orderId).toPromise(),
    ])
      .then(([reasons, order]) => {
        this.refundReasons = reasons || []
        this.order = order || null

        console.log("Refund Reasons:", this.refundReasons)

        if (this.order) {
          this.returnRequestForm.patchValue({ orderId: this.order.id })
          this.populateItemsFormArray()
        } else {
          this.errorMessage = "Order not found"
        }

        this.isLoading = false
      })
      .catch((error) => {
        console.error("Error loading data:", error)
        this.errorMessage = error.message || "Failed to load data. Please try again."
        this.isLoading = false
      })
  }

  private populateItemsFormArray(): void {
    const itemsArray = this.returnRequestForm.get("items") as FormArray

    // Clear existing items
    while (itemsArray.length !== 0) {
      itemsArray.removeAt(0)
    }

    this.order?.items.forEach((item) => {
      const itemGroup = this.createItemFormGroup(item)
      itemsArray.push(itemGroup)
    })
  }

  private createItemFormGroup(orderItem: OrderItemDetail): FormGroup {
    const group = this.fb.group(
      {
        orderItemId: [orderItem.id, Validators.required],
        productName: [orderItem.product.name],
        sku: [orderItem.variant.sku],
        maxReturnQty: [orderItem.maxReturnQty],
        requestedAction: [""], // Step 1: Action selection
        returnQty: [0, [Validators.min(0), Validators.max(orderItem.maxReturnQty!)]],
        reasonId: [null],
        customReasonText: ["", [Validators.maxLength(500)]],
        proofs: [[]],
      },
      { validators: this.itemValidator.bind(this) },
    )

    return group
  }

  // private itemValidator(control: AbstractControl): { [key: string]: any } | null {
  //   const requestedAction = control.get("requestedAction")?.value
  //   const returnQty = control.get("returnQty")?.value || 0
  //   const reasonId = control.get("reasonId")?.value
  //   const customReasonText = control.get("customReasonText")?.value || ""
  //   const proofs = control.get("proofs")?.value || []

  //   // If no action selected, no validation needed

  //   if (!requestedAction || requestedAction === "") {
  //     return null; // no validation errors if no action selected
  //   }

  //   // If action is selected, validate step 2 fields
  //   if (requestedAction !== "") {
  //     if (returnQty <= 0) {
  //       return { returnQtyRequired: true }
  //     }
  //     if (!reasonId) {
  //       return { reasonRequired: true }
  //     }
  //     const reason = this.refundReasons.find((r) => r.id == reasonId)
  //     if (reason?.allowCustomText && !customReasonText.trim()) {
  //       return { customReasonRequired: true }
  //     }
  //     if (!proofs.length) {
  //       return { proofRequired: true }
  //     }
  //     if (proofs.length > 5) {
  //       return { proofLimitExceeded: true }
  //     }
  //   }

  //   return null
  // }

  private itemValidator(control: AbstractControl): { [key: string]: any } | null {
    const requestedAction = control.get("requestedAction")?.value;

    // ✅ Log for debugging
    console.log("🧪 Validating item:", control.value);

    if (!requestedAction || requestedAction === "") {
      console.log("✅ No action selected — skipping validation.");
      return null; // Clear any previous errors
    }

    const returnQty = control.get("returnQty")?.value || 0;
    const reasonId = control.get("reasonId")?.value;
    const customReasonText = control.get("customReasonText")?.value || "";
    const proofs = control.get("proofs")?.value || [];

    if (returnQty <= 0) {
      console.log("❌ Return quantity invalid");
      return { returnQtyRequired: true };
    }
    if (!reasonId) {
      console.log("❌ Reason required");
      return { reasonRequired: true };
    }
    const reason = this.refundReasons.find((r) => r.id == reasonId);
    if (reason?.allowCustomText && !customReasonText.trim()) {
      console.log("❌ Custom reason required");
      return { customReasonRequired: true };
    }
    if (!proofs.length) {
      console.log("❌ Proof image required");
      return { proofRequired: true };
    }
    if (proofs.length > 5) {
      console.log("❌ Proof limit exceeded");
      return { proofLimitExceeded: true };
    }

    console.log("✅ Item is valid");
    return null;
  }


  // private itemValidator(control: AbstractControl): { [key: string]: any } | null {
  //   const requestedAction = control.get("requestedAction")?.value;
  //   const returnQty = control.get("returnQty")?.value || 0;
  //   const reasonId = control.get("reasonId")?.value;
  //   const customReasonText = control.get("customReasonText")?.value || "";
  //   const proofs = control.get("proofs")?.value || [];

  //   console.log("🧪 Validating item:", {
  //     requestedAction,
  //     returnQty,
  //     reasonId,
  //     customReasonText,
  //     proofs,
  //   });

  //   // If no action selected, skip validation
  //   if (!requestedAction || requestedAction === "") {
  //     console.log("✅ No action selected — skipping validation.");
  //     return null;
  //   }

  //   // Begin field validation
  //   if (returnQty <= 0) {
  //     console.warn("❌ Return quantity invalid");
  //     return { returnQtyRequired: true };
  //   }

  //   if (!reasonId) {
  //     console.warn("❌ Reason required");
  //     return { reasonRequired: true };
  //   }

  //   const reason = this.refundReasons.find((r) => r.id == reasonId);
  //   if (reason?.allowCustomText && !customReasonText.trim()) {
  //     console.warn("❌ Custom reason required");
  //     return { customReasonRequired: true };
  //   }

  //   if (!proofs.length) {
  //     console.warn("❌ Proof image required");
  //     return { proofRequired: true };
  //   }

  //   if (proofs.length > 5) {
  //     console.warn("❌ Too many proofs");
  //     return { proofLimitExceeded: true };
  //   }

  //   console.log("✅ Item is valid");
  //   return null;
  // }

  get itemsFormArray(): FormArray {
    return this.returnRequestForm.get("items") as FormArray
  }

  getItemFormGroup(index: number): FormGroup {
    return this.itemsFormArray.at(index) as FormGroup
  }

  // Check if step 2 should be shown for an item
  shouldShowStep2(index: number): boolean {
    const itemGroup = this.getItemFormGroup(index)
    const requestedAction = itemGroup.get("requestedAction")?.value
    return requestedAction && requestedAction !== ""
  }

  // Get variant image URL
  getVariantImageUrl(orderItem: OrderItemDetail): string {
    if (orderItem.variant.imgPath) {
      return orderItem.variant.imgPath
    }
    if (orderItem.product.imgPath) {
      return orderItem.product.imgPath
    }
    if (orderItem.product.imgPath && orderItem.product.imgPath.length > 0) {
      return orderItem.product.imgPath[0]
    }
    return "/assets/images/product-placeholder.png"
  }

  // Get variant display name
  getVariantDisplayName(orderItem: OrderItemDetail): string {
    return orderItem.product.name
  }

  onActionChange(index: number): void {
    const itemGroup = this.getItemFormGroup(index);
    const requestedAction = itemGroup.get("requestedAction")?.value;

    if (!requestedAction) {
      // Reset step 2 fields when no action selected
      itemGroup.patchValue({
        returnQty: 0,
        reasonId: null,
        customReasonText: "",
        proofs: [],
      });

      itemGroup.markAsPristine();
      itemGroup.markAsUntouched();
      itemGroup.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    } else {
      // Set default return quantity to 1 when action is selected
      if (itemGroup.get("returnQty")?.value === 0) {
        itemGroup.patchValue({ returnQty: 1 });
      }

      itemGroup.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    }

    // 🔍 Re-check form validity after any toggle
    const isValid = this.isFormValid();
    console.log("🧪 isFormValid result:", isValid);

    this.logFinalReturnRequest();
  }


  // onActionChange(index: number): void {
  //   const itemGroup = this.getItemFormGroup(index)
  //   const requestedAction = itemGroup.get("requestedAction")?.value

  //   if (!requestedAction) {
  //     // Reset step 2 fields when no action selected
  //     itemGroup.patchValue({
  //       returnQty: 0,
  //       reasonId: null,
  //       customReasonText: "",
  //       proofs: [],
  //     })

  //     // ✅ Mark as untouched and update validity
  //     itemGroup.markAsPristine();
  //     itemGroup.markAsUntouched();
  //     itemGroup.updateValueAndValidity({ onlySelf: false, emitEvent: true });
  //   } else {
  //     // Set default return quantity to 1 when action is selected
  //     if (itemGroup.get("returnQty")?.value === 0) {
  //       itemGroup.patchValue({
  //         returnQty: 1,
  //       })
  //     }
  //     // Ensure validity rechecked in case user toggled back from "no action"
  //     itemGroup.updateValueAndValidity({ onlySelf: false, emitEvent: true });
  //   }

  //   this.logFinalReturnRequest();
  // }

  logFinalReturnRequest(): void {
    const payload = this.returnRequestForm.getRawValue(); // or build your actual payload manually
    console.log("📦 Final Return Request Payload:", payload);
  }


  onReturnQtyChange(index: number): void {
    const itemGroup = this.getItemFormGroup(index)
    const returnQty = itemGroup.get("returnQty")?.value || 0

    if (returnQty === 0) {
      itemGroup.patchValue({
        reasonId: null,
        customReasonText: "",
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
    // Check if at least one item has an action selected
    const items = this.itemsFormArray.value
    return items.some((item: any) => item.requestedAction && item.requestedAction !== "")
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid()) {
      this.markFormGroupTouched(this.returnRequestForm)
      return
    }

    this.isSubmitting = true
    this.errorMessage = ""

    const formValue = this.returnRequestForm.value
    const itemsToReturn = formValue.items.filter((item: any) => item.requestedAction && item.requestedAction !== "")

    try {
      // Upload all proofs for all items first
      const itemsWithUploadedUrls = await Promise.all(
        itemsToReturn.map(async (item: any) => {
          if (!item.proofs || item.proofs.length === 0) {
            return { ...item, proofImageUrls: [] }
          }
          const uploadedUrls = await Promise.all(
            item.proofs.map((file: File) => this.cloudinaryService.uploadImage(file).toPromise()),
          )
          return { ...item, proofImageUrls: uploadedUrls }
        }),
      )

      // Build payload including image URLs
      const payload: ReturnRequestPayload = {
        orderId: formValue.orderId,
        items: itemsWithUploadedUrls.map((item) => ({
          orderItemId: item.orderItemId,
          quantity: item.returnQty,
          reasonId: item.reasonId,
          customReasonText: item.customReasonText,
          proofImageUrls: item.proofImageUrls,
          requestedAction: item.requestedAction,
        })),
        userId: this.userId,
      }

      console.log("📦 Return request payload with image URLs:", payload)

      // Submit full payload to backend
      this.refundRequestService.submitReturnRequest(payload).subscribe({
        next: (response) => {
          console.log("Return request submitted with images:", payload)
          this.onSubmitSuccess()
        },
        error: (error) => {
          console.error("Error submitting return request:", error)
          this.errorMessage = error.message || "Failed to submit return request. Please try again."
          this.isSubmitting = false
        },
      })
    } catch (uploadError) {
      console.error("Error uploading proof images:", uploadError)
      this.errorMessage = "Failed to upload proof images. Please try again."
      this.isSubmitting = false
    }
  }

  private onSubmitSuccess(): void {
    this.isSubmitting = false
    alert("Return request submitted successfully!")
    this.router.navigate(["/customer/orders"])
  }

  onCancel(): void {
    this.router.navigate(["/customer/orderDetail", this.orderId])
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

  getReasonById(reasonId: number): RefundReasonDTO | undefined {
    return this.refundReasons.find((r) => r.id == reasonId)
  }

  shouldShowCustomReasonField(index: number): boolean {
    const itemGroup = this.getItemFormGroup(index)
    const reasonId = itemGroup.get("reasonId")?.value
    const reason = this.getReasonById(reasonId)
    return !!reason && !!reason.allowCustomText
  }

  getItemError(index: number, field: string): string {
    const itemGroup = this.getItemFormGroup(index)
    const control = itemGroup.get(field)

    if (control?.touched && control.errors) {
      if (control.errors["required"]) {
        return `${this.getFieldLabel(field)} is required`
      }
      if (control.errors["min"]) {
        return `Minimum value is ${control.errors["min"].min}`
      }
      if (control.errors["max"]) {
        return `Maximum value is ${control.errors["max"].max}`
      }
      if (control.errors["maxlength"]) {
        return `Maximum length is ${control.errors["maxlength"].requiredLength}`
      }
    }

    if (itemGroup.touched && itemGroup.errors) {
      if (field === "returnQty" && itemGroup.errors["returnQtyRequired"]) {
        return "Return quantity is required"
      }
      if (field === "reasonId" && itemGroup.errors["reasonRequired"]) {
        return "Reason is required"
      }
      if (field === "customReasonText" && itemGroup.errors["customReasonRequired"]) {
        return "Custom reason text is required"
      }
      if (field === "proofs" && itemGroup.errors["proofRequired"]) {
        return "At least one proof image is required"
      }
    }

    return ""
  }

  private getFieldLabel(field: string): string {
    switch (field) {
      case "returnQty":
        return "Return Quantity"
      case "reasonId":
        return "Return Reason"
      case "customReasonText":
        return "Custom Reason"
      case "requestedAction":
        return "Action"
      default:
        return field
    }
  }

  hasReturnItems(): boolean {
    return this.itemsFormArray.controls.some((ctrl, i) => this.getItemFormGroup(i).get("requestedAction")?.value !== "")
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement
    if (target) {
      target.src = "/assets/images/product-placeholder.png"
    }
  }

  logFormErrors(): void {
    console.log("🔍 Checking form errors...");

    this.itemsFormArray.controls.forEach((control, index) => {
      const group = control as FormGroup;
      const errors = group.errors;
      console.log(`🧩 Item ${index} group errors:`, errors);

      Object.keys(group.controls).forEach((key) => {
        const childControl = group.get(key);
        if (childControl?.invalid) {
          console.log(`  ❌ Control '${key}' error:`, childControl.errors);
        }
      });
    });

    console.log("📋 Overall form valid?", this.returnRequestForm.valid);
  }

}
