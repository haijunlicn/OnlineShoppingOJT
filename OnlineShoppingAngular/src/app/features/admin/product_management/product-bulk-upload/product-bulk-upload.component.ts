import { Component, ViewChild, type ElementRef } from "@angular/core"
import { type HttpErrorResponse, HttpEventType } from "@angular/common/http"
import { ProductService } from "@app/core/services/product.service"
import { Router } from "@angular/router"

declare var bootstrap: any

interface UploadHistory {
  id: number
  fileName: string
  uploadTime: Date
  status: "Success" | "Error" | "Processing"
  productsCount?: number
  errorCount?: number
  fileSize?: string
  errors?: string[]
}

@Component({
  selector: "app-product-bulk-upload",
  standalone: false,
  templateUrl: "./product-bulk-upload.component.html",
  styleUrls: ["./product-bulk-upload.component.css"],
})
export class ProductBulkUploadComponent {
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>

  // File handling
  zipFile: File | null = null
  isDragOver = false

  // Loading states
  isDownloading = false
  isUploading = false
  uploadProgress = 0

  // Messages
  successMessage = ""
  errorMessage = ""

  // Upload history
  uploadHistory: UploadHistory[] = []
  selectedUpload: UploadHistory | null = null

  constructor(
    private productService: ProductService,
    private router: Router,
  ) {
    this.loadUploadHistory()
  }

  // File selection methods
  onZipFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    this.handleFileSelection(file)
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click()
  }

  private handleFileSelection(file: File | undefined): void {
    if (!file) {
      return
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      this.errorMessage = "Please select a valid ZIP file"
      return
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      this.errorMessage = "File size must be less than 50MB"
      return
    }

    this.zipFile = file
    this.clearMessages()
    this.successMessage = `ZIP file selected: ${file.name} (${this.formatFileSize(file.size)})`
  }

  removeFile(): void {
    this.zipFile = null
    this.uploadProgress = 0
    this.clearMessages()
    if (this.fileInput) {
      this.fileInput.nativeElement.value = ""
    }
  }

  // Drag and drop methods
  onDragOver(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragOver = true
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragOver = false
  }

  onDrop(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragOver = false

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      this.handleFileSelection(files[0])
    }
  }

  // Template download
  downloadTemplate(): void {
    this.isDownloading = true
    this.clearMessages()

    this.productService.downloadTemplate().subscribe({
      next: (blob) => {
        this.isDownloading = false
        this.successMessage = "Template downloaded successfully!"

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "product_upload_template.xlsx"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      },
      error: (err: HttpErrorResponse) => {
        this.isDownloading = false
        console.error("Download error:", err)
        this.errorMessage = "Failed to download template. Please try again."
      },
    })
  }

  // File upload
  uploadZipFile(): void {
    if (!this.zipFile) {
      this.errorMessage = "Please select a ZIP file first"
      return
    }

    this.isUploading = true
    this.uploadProgress = 0
    this.clearMessages()

    const formData = new FormData()
    formData.append("zipFile", this.zipFile)

    this.productService.uploadZip(formData).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Calculate upload progress
          if (event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total)
          }
        } else if (event.type === HttpEventType.Response) {
          // Upload completed
          this.isUploading = false
          this.uploadProgress = 100
          this.successMessage = "Upload completed successfully!"

          // Add to upload history
          this.addToUploadHistory({
            id: Date.now(),
            fileName: this.zipFile!.name,
            uploadTime: new Date(),
            status: "Success",
            productsCount: event.body?.productsCount || 0,
            fileSize: this.formatFileSize(this.zipFile!.size),
          })

          // Reset form
          this.resetForm()

          // Show success message for longer
          setTimeout(() => {
            this.clearMessages()
          }, 5000)
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isUploading = false
        this.uploadProgress = 0
        console.error("Upload error:", err)

        let errorMessage = "Upload failed. Please try again."
        if (err.error?.message) {
          errorMessage = err.error.message
        } else if (err.status === 413) {
          errorMessage = "File is too large. Please reduce file size and try again."
        } else if (err.status === 415) {
          errorMessage = "Invalid file format. Please upload a valid ZIP file."
        }

        this.errorMessage = errorMessage

        // Add to upload history
        if (this.zipFile) {
          this.addToUploadHistory({
            id: Date.now(),
            fileName: this.zipFile.name,
            uploadTime: new Date(),
            status: "Error",
            fileSize: this.formatFileSize(this.zipFile.size),
            errors: [errorMessage],
          })
        }
      },
    })
  }

  // Upload history methods
  private loadUploadHistory(): void {
    // Load from localStorage or service
    const stored = localStorage.getItem("productUploadHistory")
    if (stored) {
      try {
        this.uploadHistory = JSON.parse(stored).map((item: any) => ({
          ...item,
          uploadTime: new Date(item.uploadTime),
        }))
      } catch (error) {
        console.error("Error loading upload history:", error)
        this.uploadHistory = []
      }
    }
  }

  private addToUploadHistory(upload: UploadHistory): void {
    this.uploadHistory.unshift(upload)
    // Keep only last 10 uploads
    if (this.uploadHistory.length > 10) {
      this.uploadHistory = this.uploadHistory.slice(0, 10)
    }
    // Save to localStorage
    localStorage.setItem("productUploadHistory", JSON.stringify(this.uploadHistory))
  }

  viewUploadDetails(upload: UploadHistory): void {
    this.selectedUpload = upload
    const modal = new bootstrap.Modal(document.getElementById("uploadDetailsModal"))
    modal.show()
  }

  // Status methods
  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case "success":
        return "status-success"
      case "error":
        return "status-error"
      case "processing":
        return "status-processing"
      default:
        return "bg-secondary"
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case "success":
        return "bi-check-circle"
      case "error":
        return "bi-x-circle"
      case "processing":
        return "bi-clock"
      default:
        return "bi-question-circle"
    }
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  private resetForm(): void {
    this.zipFile = null
    this.uploadProgress = 0
    if (this.fileInput) {
      this.fileInput.nativeElement.value = ""
    }
  }

  clearMessages(): void {
    this.successMessage = ""
    this.errorMessage = ""
  }

  // Navigation
  navigateToProducts(): void {
    this.router.navigate(["/admin/product-list"])
  }

  // Form state helpers
  get isLoading(): boolean {
    return this.isDownloading || this.isUploading
  }

  get canUpload(): boolean {
    return !!this.zipFile && !this.isUploading
  }

  get hasFile(): boolean {
    return !!this.zipFile
  }
}
