import { Component, type OnInit } from "@angular/core"
import type { PaymentMethodDTO } from "@app/core/models/payment"
import { PaymentMethodService } from "@app/core/services/paymentmethod.service"

declare var bootstrap: any

@Component({
  selector: "app-payment-list",
  standalone: false,
  templateUrl: "./payment-list.component.html",
  styleUrls: ["./payment-list.component.css"],
})
export class PaymentListComponent implements OnInit {
  // Data properties
  payments: PaymentMethodDTO[] = []
  filteredPayments: PaymentMethodDTO[] = []
  paginatedPayments: PaymentMethodDTO[] = []
  message = ""

  // Loading state
  isLoading = false

  // Filter properties
  searchTerm = ""
  statusFilter = ""
  qrFilter = ""

  // Pagination properties
  currentPage = 1
  itemsPerPage = 10
  totalPages = 0
  totalItems = 0

  // Sorting properties
  sortField = ""
  sortDirection: "asc" | "desc" = "asc"

  // Modal properties
  paymentToDelete: PaymentMethodDTO | null = null

  // Expose Math to template
  Math = Math

  constructor(private paymentmethodService: PaymentMethodService) {}

  ngOnInit() {
    this.loadPayments()
  }

  loadPayments() {
    this.isLoading = true
    this.paymentmethodService.getAllPaymentMethods().subscribe({
      next: (data) => {
        this.payments = data
        this.applyFilters()
        this.isLoading = false
      },
      error: (err) => {
        this.message = "Failed to load payment methods: " + err.message
        this.isLoading = false
      },
    })
  }

  // Filter methods
  onSearch() {
    this.currentPage = 1
    this.applyFilters()
  }

  onFilterChange() {
    this.currentPage = 1
    this.applyFilters()
  }

  onReset() {
    this.searchTerm = ""
    this.statusFilter = ""
    this.qrFilter = ""
    this.currentPage = 1
    this.sortField = ""
    this.sortDirection = "asc"
    this.applyFilters()
  }

  applyFilters() {
    let filtered = [...this.payments]

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (payment) =>
          payment.methodName?.toLowerCase().includes(searchLower) ||
          payment.description?.toLowerCase().includes(searchLower),
      )
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter((payment) => {
        const status = String(payment.status || "active").toLowerCase()
        const filterStatus = this.statusFilter.toLowerCase()

        // Handle both string and numeric status values
        return (
          status === filterStatus ||
          (filterStatus === "active" && (status === "1" || status === "active")) ||
          (filterStatus === "inactive" && (status === "0" || status === "inactive"))
        )
      })
    }

    // Apply QR filter
    if (this.qrFilter) {
      if (this.qrFilter === "yes") {
        filtered = filtered.filter((payment) => payment.qrPath && payment.qrPath.trim() !== "")
      } else if (this.qrFilter === "no") {
        filtered = filtered.filter((payment) => !payment.qrPath || payment.qrPath.trim() === "")
      }
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

    this.filteredPayments = filtered
    this.totalItems = filtered.length
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)

    // Reset to page 1 if current page is beyond total pages
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1
    }

    this.updatePaginatedPayments()
  }

  private getFieldValue(obj: any, field: string): any {
    switch (field) {
      case "id":
        return obj.id
      case "methodName":
        return obj.methodName
      case "description":
        return obj.description
      case "status":
        return String(obj.status || "active")
      case "createdAt":
        return obj.createdAt
      default:
        return ""
    }
  }

  updatePaginatedPayments() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedPayments = this.filteredPayments.slice(startIndex, endIndex)
  }

  // Sorting methods
  sort(field: string) {
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
      return "bi-chevron-expand"
    }
    return this.sortDirection === "asc" ? "bi-chevron-up" : "bi-chevron-down"
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePaginatedPayments()
    }
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePaginatedPayments()
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updatePaginatedPayments()
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

  // Status methods
  getStatusBadgeClass(status: string | number): string {
    const statusStr = String(status || "active").toLowerCase()
    switch (statusStr) {
      case "active":
      case "1":
        return "status-active"
      case "inactive":
      case "0":
        return "status-inactive"
      default:
        return "status-active"
    }
  }

  getStatusIcon(status: string | number): string {
    const statusStr = String(status || "active").toLowerCase()
    switch (statusStr) {
      case "active":
      case "1":
        return "bi-check-circle"
      case "inactive":
      case "0":
        return "bi-x-circle"
      default:
        return "bi-check-circle"
    }
  }

  getStatusDisplayText(status: string | number): string {
    const statusStr = String(status || "active").toLowerCase()
    switch (statusStr) {
      case "active":
      case "1":
        return "Active"
      case "inactive":
      case "0":
        return "Inactive"
      default:
        return "Active"
    }
  }

  // Action methods
  viewDetails(id: number) {
    // Implement view details logic
    console.log("View details for payment method:", id)
    // You can navigate to a details page or open a modal
    // this.router.navigate(['/admin/payment-details', id]);
  }

  confirmDelete(payment: PaymentMethodDTO) {
    this.paymentToDelete = payment
    const modal = new bootstrap.Modal(document.getElementById("deleteModal"))
    modal.show()
  }

  deletePayment() {
    if (this.paymentToDelete && this.paymentToDelete.id) {
      this.paymentmethodService.deletePaymentMethod(this.paymentToDelete.id).subscribe({
        next: () => {
          this.message = ""
          this.loadPayments()
          this.paymentToDelete = null

          // Show success message temporarily
          const successMessage = "Payment method deleted successfully."
          this.showTemporaryMessage(successMessage, "success")
        },
        error: (err) => {
          this.message = "Delete failed: " + err.message
          this.paymentToDelete = null
        },
      })
    }
  }

  // Utility methods
  trackByPaymentId(index: number, payment: PaymentMethodDTO): number {
    return payment.id || index
  }

  private showTemporaryMessage(message: string, type: "success" | "error" = "success") {
    // Create and show a temporary success message
    const alertDiv = document.createElement("div")
    alertDiv.className = `alert alert-${type === "success" ? "success" : "danger"} alert-dismissible fade show`
    alertDiv.innerHTML = `
      <i class="bi bi-${type === "success" ? "check-circle" : "exclamation-triangle"} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `

    const container = document.querySelector(".payment-list-container")
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

  // Clear message
  clearMessage() {
    this.message = ""
  }
}
