import { Component, OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { ActivatedRoute, Router } from "@angular/router"
import { PolicyDTO } from "@app/core/models/policyDTO"
import { PolicyService } from "@app/core/services/policy.service"


declare var bootstrap: any

@Component({
  selector: "app-policy-update",
  standalone: false,
  templateUrl: "./policy-update.component.html",
  styleUrls: ["./policy-update.component.css"],
})
export class PolicyUpdateComponent implements OnInit {
  policyForm!: FormGroup
  policyId!: number
  policy: PolicyDTO = {
    id: 0,
    title: "",
    type: "",
    description: "",
    icon: "",
  }
  originalPolicy: PolicyDTO = {
    id: 0,
    title: "",
    type: "",
    description: "",
    icon: "",
  }

  // Component state
  message = ""
  isSubmitting = false
  isLoading = false

  policyTypes = [
    { value: "privacy", label: "Privacy Policy" },
    { value: "terms", label: "Terms & Conditions" },
    { value: "cookie", label: "Cookie Policy" },
    { value: "refund", label: "Refund Policy" },
    { value: "shipping", label: "Shipping Policy" },
    { value: "data", label: "Data Protection Policy" },
    { value: "security", label: "Security Policy" },
  ]

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private policyService: PolicyService,
  ) {}

  ngOnInit(): void {
    this.initializeForm()
    this.loadPolicy()
  }

  private initializeForm(): void {
    this.policyForm = this.fb.group({
      title: [
        "",
        [Validators.required, Validators.minLength(3), Validators.maxLength(200), this.noWhitespaceValidator],
      ],
      type: ["", Validators.required],
      description: ["", [Validators.required, Validators.minLength(10), this.noWhitespaceValidator]],
    })
  }

  private loadPolicy(): void {
    this.policyId = Number(this.route.snapshot.paramMap.get("id"))
    if (!this.policyId) {
      this.message = "Invalid policy ID"
      return
    }

    this.isLoading = true
    this.policyService.getPolicyById(this.policyId).subscribe({
      next: (data) => {
        this.policy = { ...data }
        this.originalPolicy = { ...data }
        this.populateForm()
        this.isLoading = false
      },
      error: (err) => {
        console.error("Load error:", err)
        this.message = "Failed to load policy: " + (err.message || "Unknown error")
        this.isLoading = false
      },
    })
  }

  private populateForm(): void {
    this.policyForm.patchValue({
      title: this.policy.title || "",
      type: this.policy.type || "",
      description: this.policy.description || "",
    })

    // Mark form as pristine after loading data
    this.policyForm.markAsPristine()
  }

  // Custom validator to prevent only whitespace
  private noWhitespaceValidator(control: any) {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true }
    }
    return null
  }

  onSubmit(): void {
    if (this.policyForm.invalid) {
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

    const updatedPolicy: PolicyDTO = {
      ...this.policy,
      title: this.policyForm.value.title.trim(),
      type: this.policyForm.value.type,
      description: this.policyForm.value.description.trim(),
      icon: this.getTypeIcon(this.policyForm.value.type), // Update icon based on type
      updatedDate: new Date().toISOString(),
    }

    this.policyService.updatePolicy(updatedPolicy).subscribe({
      next: () => {
        this.showTemporaryMessage("Policy updated successfully!", "success")
        setTimeout(() => {
          this.router.navigate(["/admin/policy/policy-list"])
        }, 1500)
      },
      error: (err) => {
        console.error("Update error:", err)
        this.message = "Failed to update policy: " + (err.message || "Unknown error")
        this.isSubmitting = false
      },
    })
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      const confirmLeave = confirm("You have unsaved changes. Are you sure you want to leave?")
      if (!confirmLeave) {
        return
      }
    }
    this.router.navigate(["/admin/policy/policy-list"])
  }

  private markFormGroupTouched(): void {
    Object.keys(this.policyForm.controls).forEach((key) => {
      const control = this.policyForm.get(key)
      if (control) {
        control.markAsTouched()
      }
    })
  }

  resetForm(): void {
    this.populateForm()
    this.clearMessage()
  }

  onStatusChange(): void {
    // This method can be used for additional logic when status changes
    this.policyForm.markAsDirty()
  }

  // Change detection methods
  hasChanges(): boolean {
    if (!this.originalPolicy) return false

    const currentTitle = this.policyForm.get("title")?.value?.trim() || ""
    const currentType = this.policyForm.get("type")?.value || ""
    const currentDescription = this.policyForm.get("description")?.value?.trim() || ""

    return (
      currentTitle !== (this.originalPolicy.title || "") ||
      currentType !== (this.originalPolicy.type || "") ||
      currentDescription !== (this.originalPolicy.description || "")
    )
  }

  isTitleChanged(): boolean {
    if (!this.originalPolicy) return false
    const currentTitle = this.policyForm.get("title")?.value?.trim() || ""
    return currentTitle !== (this.originalPolicy.title || "")
  }

  isTypeChanged(): boolean {
    if (!this.originalPolicy) return false
    const currentType = this.policyForm.get("type")?.value || ""
    return currentType !== (this.originalPolicy.type || "")
  }

  isDescriptionChanged(): boolean {
    if (!this.originalPolicy) return false
    const currentDescription = this.policyForm.get("description")?.value?.trim() || ""
    return currentDescription !== (this.originalPolicy.description || "")
  }

  isStatusChanged(): boolean {
    // Always return false since isActive is not in PolicyDTO
    return false
  }

  // Validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.policyForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  getFieldError(fieldName: string): string {
    const field = this.policyForm.get(fieldName)
    if (field && field.errors) {
      if (field.errors["required"]) {
        return `${this.getFieldDisplayName(fieldName)} is required`
      }
      if (field.errors["minlength"]) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors["minlength"].requiredLength} characters`
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
      case "title":
        return "Policy title"
      case "type":
        return "Policy type"
      case "description":
        return "Policy description"
      default:
        return fieldName
    }
  }

  // Character count methods
  getCharacterCount(fieldName: string): number {
    const field = this.policyForm.get(fieldName)
    return field?.value?.length || 0
  }

  getMaxLength(fieldName: string): number {
    switch (fieldName) {
      case "title":
        return 200
      default:
        return 0
    }
  }

  // Type methods
  getTypeLabel(value: string): string {
    if (!value) return ""
    const found = this.policyTypes.find((type) => type.value === value)
    return found ? found.label : value
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case "privacy":
        return "type-privacy"
      case "terms":
        return "type-terms"
      case "cookie":
        return "type-cookie"
      default:
        return "type-default"
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case "privacy":
        return "bi-shield-lock"
      case "terms":
        return "bi-file-text"
      case "cookie":
        return "bi-cookie"
      case "refund":
        return "bi-arrow-return-left"
      case "shipping":
        return "bi-truck"
      case "data":
        return "bi-database"
      case "security":
        return "bi-shield-check"
      default:
        return "bi-file-earmark-text"
    }
  }

  // Preview functionality
  viewPreview(): void {
    if (this.policyForm.invalid) {
      this.markFormGroupTouched()
      this.message = "Please fix form errors before previewing."
      return
    }

    const modal = new bootstrap.Modal(document.getElementById("previewModal"))
    modal.show()
  }

  // Getter methods for form controls
  get title() {
    return this.policyForm.get("title")
  }

  get type() {
    return this.policyForm.get("type")
  }

  get description() {
    return this.policyForm.get("description")
  }

  get isActive() {
    return this.policyForm.get("isActive")
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

    const container = document.querySelector(".policy-update-container")
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

  // Form state helpers
  isFormDirty(): boolean {
    return this.policyForm.dirty
  }

  isFormValid(): boolean {
    return this.policyForm.valid
  }

  hasUnsavedChanges(): boolean {
    return this.hasChanges() && !this.isSubmitting
  }

  // Navigation helper
  navigateToList(): void {
    this.router.navigate(["/admin/policy/policy-list"])
  }

  // Utility methods
  canSave(): boolean {
    return this.policyForm.valid && this.hasChanges() && !this.isSubmitting
  }

  canReset(): boolean {
    return this.hasChanges()
  }
}
