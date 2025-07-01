import { Component, Input, Output, EventEmitter, type ElementRef, ViewChild } from "@angular/core"

@Component({
  selector: "app-file-upload",
  standalone: false,
  templateUrl: "./file-upload.component.html",
  styleUrls: ["./file-upload.component.css"],
})
export class FileUploadComponent {
  @Input() maxFiles = 5
  @Input() maxFileSize = 2097152 // 2MB in bytes
  @Input() acceptedTypes: string[] = ["image/jpeg", "image/png", "image/jpg"]
  @Output() filesSelected = new EventEmitter<File[]>()

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>

  selectedFiles: File[] = []
  dragOver = false
  errorMessage = ""

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files) {
      this.handleFiles(Array.from(input.files))
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault()
    this.dragOver = true
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault()
    this.dragOver = false
  }

  onDrop(event: DragEvent): void {
    event.preventDefault()
    this.dragOver = false

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files))
    }
  }

  private handleFiles(files: File[]): void {
    this.errorMessage = ""
    const validFiles: File[] = []

    for (const file of files) {
      if (this.selectedFiles.length + validFiles.length >= this.maxFiles) {
        this.errorMessage = `Maximum ${this.maxFiles} files allowed`
        break
      }

      if (!this.acceptedTypes.includes(file.type)) {
        this.errorMessage = `File type ${file.type} not allowed`
        continue
      }

      if (file.size > this.maxFileSize) {
        this.errorMessage = `File ${file.name} exceeds maximum size of ${this.formatFileSize(this.maxFileSize)}`
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      this.selectedFiles = [...this.selectedFiles, ...validFiles]
      this.filesSelected.emit(this.selectedFiles)
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1)
    this.filesSelected.emit(this.selectedFiles)
    this.errorMessage = ""
  }

  clearAll(): void {
    this.selectedFiles = []
    this.filesSelected.emit(this.selectedFiles)
    this.errorMessage = ""
    if (this.fileInput) {
      this.fileInput.nativeElement.value = ""
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  getFilePreview(file: File): string {
    return URL.createObjectURL(file)
  }
}
