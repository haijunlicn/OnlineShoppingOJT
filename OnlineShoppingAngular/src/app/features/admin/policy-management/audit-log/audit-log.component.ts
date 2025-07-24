import { Component, OnInit } from "@angular/core"
import { AuditLog } from "@app/core/models/audit-log"
import { AuditLogService } from "@app/core/services/audit-log.service"


@Component({
  selector: "app-audit-log",
  standalone: false,
  templateUrl: "./audit-log.component.html",
  styleUrls: ["./audit-log.component.css"],
})
export class AuditLogComponent implements OnInit {
  auditLogs: AuditLog[] = []
  entityTypeFilter = ""
  loading = false
  error = ""
  message = ""

  isModalOpen = false
  selectedChangedData: any = null

  isLoading = false // For navigation bar refresh button

  // Pagination properties
  currentPage = 1
  itemsPerPage = 10 // Default items per page
  totalItems = 0
  totalPages = 0

  // Expose Math object to the template
  Math = Math

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.fetchAuditLogs()
  }

  fetchAuditLogs(): void {
    this.loading = true
    this.error = ""
    this.auditLogService.getAuditLogsByEntityType(this.entityTypeFilter).subscribe({
      next: (logs) => {
        console.log("📄 Audit Logs Fetched:", logs)
        this.auditLogs = logs
        this.totalItems = logs.length
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)
        // Reset current page if it's out of bounds after filtering
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages
        } else if (this.totalPages === 0) {
          this.currentPage = 1
        }
        this.loading = false
        this.isLoading = false
      },
      error: (err) => {
        this.error = "Failed to load audit logs. Please check the server and network."
        this.loading = false
        this.isLoading = false
        console.error("Error fetching audit logs:", err)
      },
    })
  }

  onFilterChange(): void {
    this.currentPage = 1 // Reset to first page on filter change
    this.fetchAuditLogs()
  }

  openChangedDataModal(data: any): void {
    this.selectedChangedData = data
    this.isModalOpen = true
  }

  closeChangedDataModal(): void {
    this.isModalOpen = false
    this.selectedChangedData = null
  }

  refreshData(): void {
    this.isLoading = true
    this.fetchAuditLogs()
  }

  onResetFilters(): void {
    this.entityTypeFilter = ""
    this.currentPage = 1 // Reset to first page on filter reset
    this.fetchAuditLogs()
  }

  // Pagination methods
  get paginatedAuditLogs(): AuditLog[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    return this.auditLogs.slice(startIndex, endIndex)
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
    }
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1)
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1)
  }

  getPageNumbers(): number[] {
    const pageNumbers: number[] = []
    const maxPagesToShow = 5 // Number of page buttons to display
    let startPage: number, endPage: number

    if (this.totalPages <= maxPagesToShow) {
      // Less than max pages, show all
      startPage = 1
      endPage = this.totalPages
    } else {
      // More than max pages, calculate start and end pages
      const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2)
      const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1

      if (this.currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1
        endPage = maxPagesToShow
      } else if (this.currentPage + maxPagesAfterCurrentPage >= this.totalPages) {
        startPage = this.totalPages - maxPagesToShow + 1
        endPage = this.totalPages
      } else {
        startPage = this.currentPage - maxPagesBeforeCurrentPage
        endPage = this.currentPage + maxPagesAfterCurrentPage
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    return pageNumbers
  }

  getItemsPerPageOptions(): number[] {
    return [5, 10, 25, 50]
  }

  onItemsPerPageChange(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)
    this.currentPage = 1 // Reset to first page when items per page changes
    // No need to re-fetch, as `paginatedAuditLogs` getter will re-slice
  }

  trackByAuditLogId(index: number, item: AuditLog): number {
    return item.entityId // Use entityId as the unique identifier
  }
}
