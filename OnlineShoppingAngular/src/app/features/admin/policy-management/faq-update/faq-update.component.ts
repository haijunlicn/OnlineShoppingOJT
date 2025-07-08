import { Component, OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { ActivatedRoute, Router } from "@angular/router"
import { Faq } from "@app/core/models/faq"
import { FaqService } from "@app/core/services/faq.service"


declare var bootstrap: any

@Component({
  selector: "app-faq-update",
  standalone: false,
  templateUrl: "./faq-update.component.html",
  styleUrls: ["./faq-update.component.css"],
})
export class FaqUpdateComponent implements OnInit {
  faqForm!: FormGroup
  faqId!: number
  faq: Faq = {
    id: 0,
    question: "",
    answer: "",
    delFg: 0,
  }
  originalFaq: Faq = {
    id: 0,
    question: "",
    answer: "",
    delFg: 0,
  }

  // Component state
  message = ""
  isSubmitting = false
  isLoading = false

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private faqService: FaqService,
  ) {}

  ngOnInit(): void {
    this.initializeForm()
    this.loadFaq()
  }

  private initializeForm(): void {
    this.faqForm = this.fb.group({
      question: ["", [Validators.required, Validators.maxLength(500), this.noWhitespaceValidator]],
      answer: ["", [Validators.required, this.noWhitespaceValidator]],
    })
  }

  private loadFaq(): void {
    this.faqId = Number(this.route.snapshot.paramMap.get("id"))
    if (!this.faqId) {
      this.message = "Invalid FAQ ID"
      return
    }

    this.isLoading = true
    this.faqService.getFaqById(this.faqId).subscribe({
      next: (data) => {
        this.faq = { ...data }
        this.originalFaq = { ...data }
        this.populateForm()
        this.isLoading = false
      },
      error: (err) => {
        console.error("Load error:", err)
        this.message = "Failed to load FAQ: " + (err.message || "Unknown error")
        this.isLoading = false
      },
    })
  }

  private populateForm(): void {
    this.faqForm.patchValue({
      question: this.faq.question || "",
      answer: this.faq.answer || "",
    })

    // Mark form as pristine after loading data
    this.faqForm.markAsPristine()
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

    if (!this.hasChanges()) {
      this.message = "No changes detected."
      return
    }

    if (this.isSubmitting) {
      return
    }

    this.isSubmitting = true
    this.clearMessage()

    const updatedFaq: Faq = {
      ...this.faq,
      question: this.faqForm.value.question.trim(),
      answer: this.faqForm.value.answer.trim(),
    }

    this.faqService.updateFaq(updatedFaq).subscribe({
      next: () => {
        this.showTemporaryMessage("FAQ updated successfully!", "success")
        setTimeout(() => {
          this.router.navigate(["/admin/policy/faq-list"])
        }, 1500)
      },
      error: (err) => {
        console.error("Update error:", err)
        this.message = "Failed to update FAQ: " + (err.message || "Unknown error")
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
    this.populateForm()
    this.clearMessage()
  }

  // Change detection methods
  hasChanges(): boolean {
    if (!this.originalFaq) return false

    const currentQuestion = this.faqForm.get("question")?.value?.trim() || ""
    const currentAnswer = this.faqForm.get("answer")?.value?.trim() || ""

    return currentQuestion !== (this.originalFaq.question || "") || currentAnswer !== (this.originalFaq.answer || "")
  }

  isQuestionChanged(): boolean {
    if (!this.originalFaq) return false
    const currentQuestion = this.faqForm.get("question")?.value?.trim() || ""
    return currentQuestion !== (this.originalFaq.question || "")
  }

  isAnswerChanged(): boolean {
    if (!this.originalFaq) return false
    const currentAnswer = this.faqForm.get("answer")?.value?.trim() || ""
    return currentAnswer !== (this.originalFaq.answer || "")
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

  // Preview functionality
  viewPreview(): void {
    if (this.faqForm.invalid) {
      this.markFormGroupTouched()
      this.message = "Please fix form errors before previewing."
      return
    }

    const modal = new bootstrap.Modal(document.getElementById("previewModal"))
    modal.show()
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

    const container = document.querySelector(".faq-update-container")
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

  // Navigation helpers
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
    return this.hasChanges() && !this.isSubmitting
  }

  // Utility methods
  canSave(): boolean {
    return this.faqForm.valid && this.hasChanges() && !this.isSubmitting
  }

  canReset(): boolean {
    return this.hasChanges()
  }
}
