import { Component, type OnInit } from "@angular/core"
import { FormBuilder, type FormGroup, Validators } from "@angular/forms"
import type { Faq } from "../../../../core/models/faq"
import { FaqService } from "@app/core/services/faq.service"
import { Router } from "@angular/router"

@Component({
  selector: "app-faq-create",
  standalone: false,
  templateUrl: "./faq-create.component.html",
  styleUrls: ["./faq-create.component.css"],
})
export class FaqCreateComponent implements OnInit {
  faqForm!: FormGroup
  message = ""
  isSubmitting = false

  constructor(
    private fb: FormBuilder,
    private faqService: FaqService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm()
  }

  private initializeForm(): void {
    this.faqForm = this.fb.group({
      question: [
        "",
        [Validators.required, Validators.maxLength(500), this.noWhitespaceValidator],
      ],
      answer: ["", [Validators.required, this.noWhitespaceValidator]],
    })
  }

  // Custom validator to prevent only whitespace
  private noWhitespaceValidator(control: any) {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true }
    }
    return null
  }

  onSubmit(): void {
    if (this.faqForm.invalid) {
      this.markFormGroupTouched()
      this.message = "Please fill out all required fields correctly."
      return
    }

    if (this.isSubmitting) {
      return
    }

    this.isSubmitting = true
    this.clearMessage()

    const faq: Faq = {
      question: this.faqForm.value.question.trim(),
      answer: this.faqForm.value.answer.trim(),
      delFg: 0,
    }

    this.faqService.createFaq(faq).subscribe({
      next: () => {
        this.showTemporaryMessage("FAQ created successfully!", "success")
        setTimeout(() => {
          this.router.navigate(["/admin/policy/faq-list"])
        }, 1500)
      },
      error: (err) => {
        console.error("Create error:", err)
        this.message = "Failed to create FAQ: " + (err.message || "Unknown error")
        this.isSubmitting = false
      },
    })
  }

  private markFormGroupTouched(): void {
    Object.keys(this.faqForm.controls).forEach((key) => {
      const control = this.faqForm.get(key)
      if (control) {
        control.markAsTouched()
      }
    })
  }

  resetForm(): void {
    this.faqForm.reset()
    this.clearMessage()
    
    // Reset form validation state
    Object.keys(this.faqForm.controls).forEach((key) => {
      const control = this.faqForm.get(key)
      if (control) {
        control.markAsUntouched()
        control.markAsPristine()
      }
    })
  }

  // Getter methods for form controls
  get question() {
    return this.faqForm.get("question")
  }

  get answer() {
    return this.faqForm.get("answer")
  }

  // Validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.faqForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  getFieldError(fieldName: string): string {
    const field = this.faqForm.get(fieldName)
    if (field && field.errors) {
      if (field.errors["required"]) {
        return `${this.getFieldDisplayName(fieldName)} is required`
      }
      if (field.errors["maxlength"]) {
        return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors["maxlength"].requiredLength} characters`
      }
      if (field.errors["whitespace"]) {
        return `${this.getFieldDisplayName(fieldName)} cannot be only whitespace`
      }
    }
    return ""
  }

  private getFieldDisplayName(fieldName: string): string {
    switch (fieldName) {
      case "question":
        return "Question"
      case "answer":
        return "Answer"
      default:
        return fieldName
    }
  }

  // Character count methods
  getCharacterCount(fieldName: string): number {
    const field = this.faqForm.get(fieldName)
    return field?.value?.length || 0
  }

  getMaxLength(fieldName: string): number {
    switch (fieldName) {
      case "question":
        return 500
      default:
        return 0
    }
  }

  // Message handling
  clearMessage(): void {
    this.message = ""
  }

  private showTemporaryMessage(message: string, type: "success" | "error" = "success"): void {
    // Create and show a temporary success message
    const alertDiv = document.createElement("div")
    alertDiv.className = `alert alert-${type === "success" ? "success" : "danger"} alert-dismissible fade show`
    alertDiv.innerHTML = `
      <i class="bi bi-${type === "success" ? "check-circle" : "exclamation-triangle"} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `

    const container = document.querySelector(".faq-create-container")
    if (container) {
      container.insertBefore(alertDiv, container.firstChild)

      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv)
        }
      }, 5000)
    }
  }

  // Navigation helper
  navigateToList(): void {
    this.router.navigate(["/admin/policy/faq-list"])
  }

  // Form state helpers
  isFormDirty(): boolean {
    return this.faqForm.dirty
  }

  isFormValid(): boolean {
    return this.faqForm.valid
  }

  hasUnsavedChanges(): boolean {
    return this.faqForm.dirty && !this.isSubmitting
  }
}
