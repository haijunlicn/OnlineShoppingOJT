import { Component, type OnInit, ViewChild, type ElementRef } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import type { PaymentMethodDTO } from "@app/core/models/payment"
import { PaymentMethodService } from "@app/core/services/paymentmethod.service"

@Component({
  selector: "app-payment-update",
  standalone: false,
  templateUrl: "./payment-update.component.html",
  styleUrls: ["./payment-update.component.css"],
})
export class PaymentUpdateComponent implements OnInit {
  // ViewChild references for file inputs
  @ViewChild("qrFileInput") qrFileInput!: ElementRef<HTMLInputElement>
  @ViewChild("logoFileInput") logoFileInput!: ElementRef<HTMLInputElement>

  // Original data for change tracking
  originalPaymentMethod: PaymentMethodDTO = {
    id: 0,
    methodName: "",
    description: "",
    qrPath: "",
    logo: "",
    status: 1,
  }

  // Current form data
  paymentMethod: PaymentMethodDTO = {
    id: 0,
    methodName: "",
    description: "",
    qrPath: "",
    logo: "",
    status: 1,
  }

  // Form state
  isActive = true
  isLoading = false

  // File handling
  selectedQRFile?: File
  selectedLogoFile?: File
  qrPreview = ""
  logoPreview = ""

  // Upload states
  uploading = false
  uploadStatus = ""
  uploadProgress = 0

  // Drag and drop states
  isDragOverQR = false
  isDragOverLogo = false

  // Messages
  message = ""

  constructor(
    private paymentmethodService: PaymentMethodService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadPaymentMethod()
  }

  private loadPaymentMethod(): void {
    const id = Number(this.route.snapshot.paramMap.get("id"))
    if (id) {
      this.isLoading = true
      this.paymentmethodService.getById(id).subscribe({
        next: (data) => {
          this.paymentMethod = { ...data }
          this.originalPaymentMethod = { ...data }
          this.isActive = this.paymentMethod.status === 1
          this.isLoading = false
        },
        error: (err) => {
          this.message = "Failed to load payment method: " + err.message
          this.isLoading = false
        },
      })
    }
  }

  // File selection handlers
  onQRFileSelected(event: any) {
    const file: File = event.target.files[0]
    if (file) {
      if (this.validateFile(file)) {
        this.selectedQRFile = file
        this.createPreview(file, "qr")
        this.clearMessage()
      }
    }
  }

  onLogoFileSelected(event: any) {
    const file: File = event.target.files[0]
    if (file) {
      if (this.validateFile(file)) {
        this.selectedLogoFile = file
        this.createPreview(file, "logo")
        this.clearMessage()
      }
    }
  }

  // Methods to trigger file input clicks
  triggerQRFileInput() {
    this.qrFileInput.nativeElement.click()
  }

  triggerLogoFileInput() {
    this.logoFileInput.nativeElement.click()
  }

  // Drag and drop handlers
  onDragOver(event: DragEvent, type: "qr" | "logo") {
    event.preventDefault()
    event.stopPropagation()
    if (type === "qr") {
      this.isDragOverQR = true
    } else {
      this.isDragOverLogo = true
    }
  }

  onDragLeave(event: DragEvent, type: "qr" | "logo") {
    event.preventDefault()
    event.stopPropagation()
    if (type === "qr") {
      this.isDragOverQR = false
    } else {
      this.isDragOverLogo = false
    }
  }

  onDrop(event: DragEvent, type: "qr" | "logo") {
    event.preventDefault()
    event.stopPropagation()

    if (type === "qr") {
      this.isDragOverQR = false
    } else {
      this.isDragOverLogo = false
    }

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (this.validateFile(file)) {
        if (type === "qr") {
          this.selectedQRFile = file
          this.createPreview(file, "qr")
        } else {
          this.selectedLogoFile = file
          this.createPreview(file, "logo")
        }
        this.clearMessage()
      }
    }
  }

  // File validation
  private validateFile(file: File): boolean {
    // Check file type
    if (!file.type.startsWith("image/")) {
      this.message = "Please select a valid image file (PNG, JPG, GIF, etc.)"
      return false
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      this.message = "File size must be less than 5MB"
      return false
    }

    return true
  }

  // Create image preview
  private createPreview(file: File, type: "qr" | "logo") {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (type === "qr") {
        this.qrPreview = e.target?.result as string
      } else {
        this.logoPreview = e.target?.result as string
      }
    }
    reader.readAsDataURL(file)
  }

  // Remove file handlers
  removeQRFile() {
    this.selectedQRFile = undefined
    this.qrPreview = ""
    if (this.qrFileInput) {
      this.qrFileInput.nativeElement.value = ""
    }
  }

  removeLogoFile() {
    this.selectedLogoFile = undefined
    this.logoPreview = ""
    if (this.logoFileInput) {
      this.logoFileInput.nativeElement.value = ""
    }
  }

  // Remove current images
  removeCurrentQR() {
    this.paymentMethod.qrPath = ""
  }

  removeCurrentLogo() {
    this.paymentMethod.logo = ""
  }

  // Status change handler
  onStatusChange() {
    this.paymentMethod.status = this.isActive ? 1 : 0
  }

  // Form validation
  isFormValid(): boolean {
    return !!(this.paymentMethod.methodName && this.paymentMethod.methodName.trim())
  }

  // Change detection
  hasChanges(): boolean {
    const fieldsChanged =
      this.paymentMethod.methodName !== this.originalPaymentMethod.methodName ||
      this.paymentMethod.description !== this.originalPaymentMethod.description ||
      this.paymentMethod.status !== this.originalPaymentMethod.status ||
      this.paymentMethod.qrPath !== this.originalPaymentMethod.qrPath ||
      this.paymentMethod.logo !== this.originalPaymentMethod.logo

    const filesSelected = !!(this.selectedQRFile || this.selectedLogoFile)

    return fieldsChanged || filesSelected
  }

  getChangedFields(): string[] {
    const changes: string[] = []

    if (this.paymentMethod.methodName !== this.originalPaymentMethod.methodName) {
      changes.push("Method Name")
    }
    if (this.paymentMethod.description !== this.originalPaymentMethod.description) {
      changes.push("Description")
    }
    if (this.paymentMethod.status !== this.originalPaymentMethod.status) {
      changes.push("Status")
    }
    if (this.paymentMethod.qrPath !== this.originalPaymentMethod.qrPath) {
      changes.push("QR Code")
    }
    if (this.paymentMethod.logo !== this.originalPaymentMethod.logo) {
      changes.push("Logo")
    }

    return changes
  }

  // Status display methods
  getStatusBadgeClass(): string {
    return this.isActive ? "bg-success" : "bg-secondary"
  }

  getStatusIcon(): string {
    return this.isActive ? "bi-check-circle" : "bi-x-circle"
  }

  getStatusDisplayText(): string {
    return this.isActive ? "Active" : "Inactive"
  }

  // Update and save
  async updateAndSave() {
    if (!this.isFormValid()) {
      this.message = "Please fill in all required fields."
      return
    }

    if (!this.hasChanges()) {
      this.message = "No changes detected."
      return
    }

    this.uploading = true
    this.uploadProgress = 0
    this.clearMessage()

    try {
      let qrUrl = this.paymentMethod.qrPath
      let logoUrl = this.paymentMethod.logo

      // Upload QR code if selected
      if (this.selectedQRFile) {
        this.uploadStatus = "Uploading QR code..."
        this.uploadProgress = 25
        qrUrl = await this.uploadFile(this.selectedQRFile)
      }

      // Upload Logo if selected
      if (this.selectedLogoFile) {
        this.uploadStatus = "Uploading logo..."
        this.uploadProgress = 50
        logoUrl = await this.uploadFile(this.selectedLogoFile)
      }

      // Update payment method
      this.uploadStatus = "Updating payment method..."
      this.uploadProgress = 75

      const updatedPaymentMethod: PaymentMethodDTO = {
        ...this.paymentMethod,
        qrPath: qrUrl,
        logo: logoUrl,
        updatedDate: new Date().toISOString(),
      }

      await this.updatePaymentMethod(updatedPaymentMethod)

      this.uploadStatus = "Complete!"
      this.uploadProgress = 100

      // Show success message briefly before navigating
      setTimeout(() => {
        this.router.navigate(["/admin/payment-list"])
      }, 1000)
    } catch (error: any) {
      this.uploading = false
      this.uploadProgress = 0
      this.message = error.message || "An error occurred while updating the payment method."
    }
  }

  // Upload file helper
  private uploadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      this.paymentmethodService.uploadImage(file).subscribe({
        next: (url: string) => resolve(url),
        error: (err) => reject(new Error(`Upload failed: ${err.message}`)),
      })
    })
  }

  // Update payment method helper
  private updatePaymentMethod(dto: PaymentMethodDTO): Promise<void> {
    return new Promise((resolve, reject) => {
      this.paymentmethodService.updatePaymentMethod(dto).subscribe({
        next: () => resolve(),
        error: (err) => reject(new Error(`Failed to update payment method: ${err.message}`)),
      })
    })
  }

  // Reset form
  resetForm() {
    this.paymentMethod = { ...this.originalPaymentMethod }
    this.isActive = this.paymentMethod.status === 1
    this.removeQRFile()
    this.removeLogoFile()
    this.clearMessage()
  }

  // View details
  viewDetails() {
    // Implement view details logic
    console.log("View details for payment method:", this.paymentMethod.id)
    // You can navigate to a details page or open a modal
  }

  // Clear message
  clearMessage() {
    this.message = ""
  }
}
