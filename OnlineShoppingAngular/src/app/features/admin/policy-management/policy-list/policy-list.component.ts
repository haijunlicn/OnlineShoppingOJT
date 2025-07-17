import { Component, type OnInit } from "@angular/core"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { Router } from "@angular/router"
import { PolicyDTO } from "@app/core/models/policyDTO"
import { PolicyService } from "@app/core/services/policy.service"


declare var bootstrap: any

@Component({
  selector: "app-policy-list",
  standalone: false,
  templateUrl: "./policy-list.component.html",
  styleUrls: ["./policy-list.component.css"],
})
export class PolicyListComponent implements OnInit {
  // Data properties
  policies: PolicyDTO[] = []
  filteredPolicies: PolicyDTO[] = []
  paginatedPolicies: PolicyDTO[] = []
  message = ""
  error = ""

  // Loading state
  isLoading = false

  // Search and filter properties
  searchTerm = ""
  typeFilter = ""

  // Pagination properties
  currentPage = 1
  itemsPerPage = 10
  totalPages = 0
  totalItems = 0
  itemsPerPageOptions = [5, 10, 25, 50]

  // Sorting properties
  sortField = ""
  sortDirection: "asc" | "desc" = "asc"

  // Modal properties
  selectedPolicy: PolicyDTO | null = null
  policyToDelete: PolicyDTO | null = null

  // Policy types
  policyTypes = [
    { value: "privacy", label: "Privacy Policy" },
    { value: "terms", label: "Terms & Conditions" },
    { value: "cookie", label: "Cookie Policy" },
    { value: "refund", label: "Refund Policy" },
    { value: "shipping", label: "Shipping Policy" },
  ]

  // Expose Math to template
  Math = Math

  constructor(
    private policyService: PolicyService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadPolicies()
  }

  loadPolicies(): void {
    this.isLoading = true
    this.error = ""
    this.policyService.getAllPolicies().subscribe({
      next: (data) => {
        console.log("Loaded policies:", data)
        this.policies = data
        this.applyFilters()
        this.isLoading = false
      },
      error: (err) => {
        console.error("Error loading policies:", err)
        this.error = "Failed to load policies: " + (err.message || "Unknown error")
        this.isLoading = false
      },
    })
  }

  // Search and filter methods
  onSearch(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onFilterChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onReset(): void {
    this.searchTerm = ""
    this.typeFilter = ""
    this.currentPage = 1
    this.itemsPerPage = 10
    this.sortField = ""
    this.sortDirection = "asc"
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = [...this.policies]

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (policy) =>
          policy.title?.toLowerCase().includes(searchLower) ||
          this.getPlainTextDescription(policy.description || "")
            .toLowerCase()
            .includes(searchLower),
      )
    }

    // Apply type filter
    if (this.typeFilter) {
      filtered = filtered.filter((policy) => policy.type === this.typeFilter)
    }

    // Apply sorting
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aValue: any = this.getFieldValue(a, this.sortField)
        let bValue: any = this.getFieldValue(b, this.sortField)

        // Handle null/undefined values
        if (aValue == null) aValue = ""
        if (bValue == null) bValue = ""

        // Convert to string for comparison if needed
        if (typeof aValue === "string") aValue = aValue.toLowerCase()
        if (typeof bValue === "string") bValue = bValue.toLowerCase()

        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1

        return this.sortDirection === "desc" ? -comparison : comparison
      })
    }

    this.filteredPolicies = filtered
    this.totalItems = filtered.length
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)

    // Reset to page 1 if current page is beyond total pages
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1
    }

    this.updatePaginatedPolicies()
  }

  private getFieldValue(obj: any, field: string): any {
    switch (field) {
      case "id":
        return obj.id
      case "title":
        return obj.title
      case "type":
        return obj.type
      case "createdDate":
        return obj.createdDate
      default:
        return ""
    }
  }

  updatePaginatedPolicies(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedPolicies = this.filteredPolicies.slice(startIndex, endIndex)
  }

  // Sorting methods
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
    } else {
      this.sortField = field
      this.sortDirection = "asc"
    }
    this.applyFilters()
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return "fa-sort text-muted"
    }
    return this.sortDirection === "asc" ? "fa-sort-up text-primary" : "fa-sort-down text-primary"
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePaginatedPolicies()
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePaginatedPolicies()
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updatePaginatedPolicies()
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = []
    const maxPagesToShow = 5
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i)
      }
    } else {
      const half = Math.floor(maxPagesToShow / 2)
      let start = Math.max(1, this.currentPage - half)
      const end = Math.min(this.totalPages, start + maxPagesToShow - 1)

      if (end - start < maxPagesToShow - 1) {
        start = Math.max(1, end - maxPagesToShow + 1)
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    return pages
  }

  getItemsPerPageOptions(): number[] {
    return this.itemsPerPageOptions
  }

  // Content processing methods
  getDescriptionPreview(description: string): string {
    if (!description) return ""
    // Remove HTML tags and get plain text
    const plainText = this.getPlainTextDescription(description)
    // Truncate to 150 characters
    if (plainText.length > 150) {
      return plainText.substring(0, 150) + "..."
    }
    return plainText
  }

  getPlainTextDescription(description: string): string {
    if (!description) return ""
    // Create a temporary div to strip HTML tags
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = description
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content)
  }

  // Type methods
  getTypeLabel(value: string): string {
    const found = this.policyTypes.find((type) => type.value === value)
    return found ? found.label : value
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case "privacy":
        return "badge type-privacy"
      case "terms":
        return "badge type-terms"
      case "cookie":
        return "badge type-cookie"
      default:
        return "badge type-default"
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case "privacy":
        return "fa-shield-alt"
      case "terms":
        return "fa-file-contract"
      case "cookie":
        return "fa-cookie-bite"
      case "refund":
        return "fa-undo"
      case "shipping":
        return "fa-shipping-fast"
      default:
        return "fa-file-alt"
    }
  }

  // Action methods
  editPolicy(id: number): void {
    this.router.navigate(["/admin/policy/policy-update", id])
  }

  viewFullDescription(policy: PolicyDTO): void {
    this.selectedPolicy = policy
    const modal = new bootstrap.Modal(document.getElementById("policyDetailsModal"))
    modal.show()
  }

  confirmDelete(policy: PolicyDTO): void {
    this.policyToDelete = policy
    const modal = new bootstrap.Modal(document.getElementById("deleteModal"))
    modal.show()
  }

  deletePolicy(id: number): void {
    if (!id) {
      console.warn("Policy ID is undefined. Cannot delete.")
      return
    }

    this.policyService.deletePolicy(id).subscribe({
      next: () => {
        this.policies = this.policies.filter((policy) => policy.id !== id)
        this.applyFilters()
        this.policyToDelete = null
        this.showTemporaryMessage("Policy deleted successfully.", "success")
      },
      error: (err) => {
        console.error("Failed to delete policy:", err)
        this.error = "Failed to delete policy: " + (err.message || "Unknown error")
        this.policyToDelete = null
      },
    })
  }

  refreshData(): void {
    this.loadPolicies()
  }

  // Utility methods
  trackByPolicyId(index: number, policy: PolicyDTO): number {
    return policy.id || index
  }

  private showTemporaryMessage(message: string, type: "success" | "error" = "success"): void {
    if (type === "success") {
      this.message = message
      setTimeout(() => {
        this.message = ""
      }, 5000)
    } else {
      this.error = message
      setTimeout(() => {
        this.error = ""
      }, 5000)
    }
  }

  // Clear messages
  clearMessage(): void {
    this.message = ""
  }

  clearError(): void {
    this.error = ""
  }
}
