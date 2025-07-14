import { Component, ViewChild, type ElementRef } from "@angular/core"
import { Router } from "@angular/router"
import type { PaymentMethodDTO } from "@app/core/models/payment"
import { PaymentMethodService } from "@app/core/services/paymentmethod.service"

@Component({
  selector: "app-payment-create",
  standalone: false,
  templateUrl: "./payment-create.component.html",
  styleUrls: ["./payment-create.component.css"],
})
export class PaymentCreateComponent {
  // ViewChild references for file inputs
  @ViewChild("qrFileInput") qrFileInput!: ElementRef<HTMLInputElement>
  @ViewChild("logoFileInput") logoFileInput!: ElementRef<HTMLInputElement>

  // Form fields
  methodName = ""
  description = ""
  isActive = true

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
    private router: Router,
  ) {}

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
    // Clear the file input
    if (this.qrFileInput) {
      this.qrFileInput.nativeElement.value = ""
    }
  }

  removeLogoFile() {
    this.selectedLogoFile = undefined
    this.logoPreview = ""
    // Clear the file input
    if (this.logoFileInput) {
      this.logoFileInput.nativeElement.value = ""
    }
  }

  // Form validation
  isFormValid(): boolean {
    return !!(this.methodName.trim() && this.selectedQRFile && this.selectedLogoFile)
  }

  // Upload and save
  async uploadAndSave() {
    if (!this.isFormValid()) {
      this.message = "Please fill in all required fields and select both QR code and logo images."
      return
    }

    this.uploading = true
    this.uploadProgress = 0
    this.clearMessage()

    try {
      // Upload QR code
      this.uploadStatus = "Uploading QR code..."
      this.uploadProgress = 25
      const qrUrl = await this.uploadFile(this.selectedQRFile!)

      // Upload Logo
      this.uploadStatus = "Uploading logo..."
      this.uploadProgress = 50
      const logoUrl = await this.uploadFile(this.selectedLogoFile!)

      // Create payment method
      this.uploadStatus = "Saving payment method..."
      this.uploadProgress = 75

      const dto: PaymentMethodDTO = {
        id: 0,
        methodName: this.methodName.trim(),
        description: this.description.trim() || undefined,
        qrPath: qrUrl,
        logo: logoUrl,
        status: this.isActive ? 1 : 0,
      }

      await this.createPaymentMethod(dto)

      this.uploadStatus = "Complete!"
      this.uploadProgress = 100

      // Show success message briefly before navigating
      setTimeout(() => {
        this.router.navigate(["/admin/payment-list"])
      }, 1000)
    } catch (error: any) {
      this.uploading = false
      this.uploadProgress = 0
      this.message = error.message || "An error occurred while saving the payment method."
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

  // Create payment method helper
  private createPaymentMethod(dto: PaymentMethodDTO): Promise<void> {
    return new Promise((resolve, reject) => {
      this.paymentmethodService.createPaymentMethod(dto).subscribe({
        next: () => resolve(),
        error: (err) => reject(new Error(`Failed to save payment method: ${err.message}`)),
      })
    })
  }

  // Clear message
  clearMessage() {
    this.message = ""
  }

  // Reset form
  resetForm() {
    this.methodName = ""
    this.description = ""
    this.isActive = true
    this.removeQRFile()
    this.removeLogoFile()
    this.clearMessage()
  }
}
