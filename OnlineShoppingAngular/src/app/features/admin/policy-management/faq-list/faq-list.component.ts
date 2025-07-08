import { Component, type OnInit } from "@angular/core"
import type { Faq } from "../../../../core/models/faq"
import { FaqService } from "@app/core/services/faq.service"
import { Router } from "@angular/router"

declare var bootstrap: any

@Component({
  selector: "app-faq-list",
  standalone: false,
  templateUrl: "./faq-list.component.html",
  styleUrls: ["./faq-list.component.css"],
})
export class FaqListComponent implements OnInit {
  // Data properties
  faqList: Faq[] = []
  filteredFaqs: Faq[] = []
  paginatedFaqs: Faq[] = []
  message = ""

  // Loading state
  isLoading = false

  // Search and filter properties
  searchTerm = ""

  // Pagination properties
  currentPage = 1
  itemsPerPage = 10
  totalPages = 0
  totalItems = 0

  // Modal properties
  selectedFaq: Faq | null = null
  faqToDelete: Faq | null = null

  // Expose Math to template
  Math = Math

  constructor(
    private faqService: FaqService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadFaqs()
  }

  loadFaqs(): void {
    this.isLoading = true
    this.faqService.getAllFaqs().subscribe({
      next: (data) => {
        this.faqList = data.filter((faq) => !faq.delFg) // only active
        this.applyFilters()
        this.isLoading = false
      },
      error: (err) => {
        console.error("Error fetching FAQs:", err)
        this.message = "Failed to load FAQs: " + err.message
        this.isLoading = false
      },
    })
  }

  // Search and filter methods
  onSearch(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onReset(): void {
    this.searchTerm = ""
    this.currentPage = 1
    this.itemsPerPage = 10
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = [...this.faqList]

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (faq) =>
          faq.question?.toLowerCase().includes(searchLower) ||
          this.getPlainTextAnswer(faq.answer || "")
            .toLowerCase()
            .includes(searchLower),
      )
    }

    this.filteredFaqs = filtered
    this.totalItems = filtered.length
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)

    // Reset to page 1 if current page is beyond total pages
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1
    }

    this.updatePaginatedFaqs()
  }

  updatePaginatedFaqs(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedFaqs = this.filteredFaqs.slice(startIndex, endIndex)
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePaginatedFaqs()
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePaginatedFaqs()
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updatePaginatedFaqs()
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

  // Content processing methods
  getAnswerPreview(answer: string): string {
    if (!answer) return ""

    // Remove HTML tags and get plain text
    const plainText = this.getPlainTextAnswer(answer)

    // Truncate to 100 characters
    if (plainText.length > 100) {
      return plainText.substring(0, 100) + "..."
    }

    return plainText
  }

  getPlainTextAnswer(answer: string): string {
    if (!answer) return ""

    // Create a temporary div to strip HTML tags
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = answer
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  // Action methods
  editFaq(id: number): void {
    this.router.navigate(["/admin/policy/faq-update", id])
  }

  viewFullAnswer(faq: Faq): void {
    this.selectedFaq = faq
    const modal = new bootstrap.Modal(document.getElementById("faqDetailsModal"))
    modal.show()
  }

  confirmDelete(faq: Faq): void {
    this.faqToDelete = faq
    const modal = new bootstrap.Modal(document.getElementById("deleteModal"))
    modal.show()
  }

  deleteFaq(id: number): void {
    if (!id) return

    this.faqService.deleteFaq(id).subscribe({
      next: () => {
        this.message = ""
        this.loadFaqs()
        this.faqToDelete = null

        // Show success message temporarily
        this.showTemporaryMessage("FAQ deleted successfully.", "success")
      },
      error: (err) => {
        console.error("Delete error:", err)
        this.message = "Delete failed: " + err.message
        this.faqToDelete = null
      },
    })
  }

  // Utility methods
  trackByFaqId(index: number, faq: Faq): number {
    return faq.id || index
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

    const container = document.querySelector(".faq-list-container")
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
  clearMessage(): void {
    this.message = ""
  }
}
