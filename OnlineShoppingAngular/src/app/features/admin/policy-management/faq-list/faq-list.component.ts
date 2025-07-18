import { Component, type OnInit } from "@angular/core"
import { Router } from "@angular/router"
import { Faq } from "@app/core/models/faq"
import { FaqService } from "@app/core/services/faq.service"


declare var bootstrap: any

@Component({
  selector: "app-faq-list",
  standalone: false,
  templateUrl: "./faq-list.component.html",
  styleUrls: ["./faq-list.component.css"],
})
export class FaqListComponent implements OnInit {
  // Data arrays
  faqList: Faq[] = []
  filteredFaqs: Faq[] = []
  paginatedFaqs: Faq[] = []

  // Pagination properties
  currentPage = 1
  itemsPerPage = 10
  totalItems = 0
  totalPages = 0
  itemsPerPageOptions = [5, 10, 25, 50]

  // Filter parameters
  searchTerm = ""

  // Sorting
  sortField = ""
  sortDirection: "asc" | "desc" = "asc"

  // Math object for template
  Math = Math

  // Loading states
  isLoading = false
  message = ""
  error = ""

  // Modal properties
  selectedFaq: Faq | null = null
  faqToDelete: Faq | null = null

  constructor(
    private faqService: FaqService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadInitialData()
  }

  /**
   * Load all initial data
   */
  private loadInitialData() {
    this.isLoading = true
    this.error = ""

    this.loadFaqs()
      .then(() => {
        this.applyFilters()
      })
      .catch((error) => {
        this.error = "Failed to load data. Please try again."
        console.error("Error loading initial data:", error)
      })
      .finally(() => {
        this.isLoading = false
      })
  }

  /**
   * Load FAQs from service
   */
  loadFaqs(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.faqService.getAllFaqs().subscribe({
        next: (faqs) => {
          console.log("FAQ list : ", faqs)
          this.faqList = faqs.filter((faq) => !faq.delFg) // only active FAQs
          resolve()
        },
        error: (err) => {
          console.error("Failed to load FAQs", err)
          reject(err)
        },
      })
    })
  }

  // Filter methods
  onItemsPerPageChange() {
    this.currentPage = 1
    this.applyFilters()
  }

  onReset() {
    this.searchTerm = ""
    this.currentPage = 1
    this.sortField = ""
    this.sortDirection = "asc"
    this.applyFilters()
  }

  // Sorting methods
  sort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
    } else {
      this.sortField = field
      this.sortDirection = "asc"
    }
    this.applySorting()
    this.updatePagination()
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return "fa-sort text-muted"
    }
    return this.sortDirection === "asc" ? "fa-sort-up text-primary" : "fa-sort-down text-primary"
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePagination()
    }
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePagination()
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updatePagination()
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  getItemsPerPageOptions(): number[] {
    return this.itemsPerPageOptions
  }

  // Track by function
  trackByFaqId(index: number, faq: Faq): any {
    return faq.id
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
    if (!id) {
      console.warn("FAQ ID is undefined. Cannot delete.")
      return
    }

    this.faqService.deleteFaq(id).subscribe({
      next: () => {
        this.faqList = this.faqList.filter((faq) => faq.id !== id)
        this.applyFilters()
        this.faqToDelete = null
        this.showTemporaryMessage("FAQ deleted successfully.", "success")
      },
      error: (err) => {
        console.error("Failed to delete FAQ:", err)
        this.error = "Failed to delete FAQ: " + (err.message || "Unknown error")
        this.faqToDelete = null
      },
    })
  }

  refreshData(): void {
    this.loadInitialData()
  }

  // Core filtering and pagination logic
  applyFilters() {
    let filtered = [...this.faqList]

    // Search filter
    if (this.searchTerm.trim()) {
      const searchTerm = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (faq) =>
          faq.question?.toLowerCase().includes(searchTerm) ||
          this.getPlainTextAnswer(faq.answer || "")
            .toLowerCase()
            .includes(searchTerm),
      )
    }

    this.filteredFaqs = filtered
    this.totalItems = filtered.length
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)

    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1
    }

    this.applySorting()
    this.updatePagination()
  }

  applySorting() {
    if (!this.sortField) return

    this.filteredFaqs.sort((a, b) => {
      let valueA: any
      let valueB: any

      switch (this.sortField) {
        case "id":
          valueA = a.id
          valueB = b.id
          break
        case "question":
          valueA = a.question || ""
          valueB = b.question || ""
          break
        case "createdDate":
          valueA = a.createdDate ? new Date(a.createdDate) : new Date(0)
          valueB = b.createdDate ? new Date(b.createdDate) : new Date(0)
          break
        default:
          return 0
      }

      if (valueA < valueB) {
        return this.sortDirection === "asc" ? -1 : 1
      }
      if (valueA > valueB) {
        return this.sortDirection === "asc" ? 1 : -1
      }
      return 0
    })
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedFaqs = this.filteredFaqs.slice(startIndex, endIndex)
  }

  /**
   * Handle search input change
   */
  onSearch() {
    this.currentPage = 1
    this.applyFilters()
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

  private getFieldValue(obj: any, field: string): any {
    switch (field) {
      case "id":
        return obj.id
      case "question":
        return obj.question
      case "createdDate": // Add this case
        return obj.createdDate
      default:
        return ""
    }
  }
}
