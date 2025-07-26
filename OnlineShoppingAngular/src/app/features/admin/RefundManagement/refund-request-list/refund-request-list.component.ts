import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RefundRequestDTO, RefundStatus } from '@app/core/models/refund.model';
import { RefundRequestService } from '@app/core/services/refundRequestService';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { PdfExportService } from '@app/core/services/pdf-export.service';
import { ExcelExportService } from '@app/core/services/excel-export.service';

interface FilterParams {
  status: string
  dateFrom: string
  dateTo: string
  search: string
}

@Component({
  selector: "app-refund-request-list",
  standalone: false,
  templateUrl: "./refund-request-list.component.html",
  styleUrl: "./refund-request-list.component.css",
})
export class RefundRequestListComponent implements OnInit, OnDestroy {
  // Data properties
  refundRequests: RefundRequestDTO[] = []
  filteredRequests: RefundRequestDTO[] = []
  isLoading = false
  errorMessage = ""

  // Filter/search properties
  filterParams: FilterParams = {
    status: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  }

  // Search debouncing
  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  // Pagination properties
  currentPage = 1
  itemsPerPage = 10
  totalItems = 0
  totalPages = 0
  paginatedRequests: RefundRequestDTO[] = []

  // Sorting
  sortField = "createdAt"
  sortDirection: "asc" | "desc" = "desc"

  // Expose enum for template use
  refundStatus = RefundStatus

  // Export columns definition
  exportColumns = [
    { header: 'Refund ID', field: 'id', width: 20 },
    { header: 'Order ID', field: 'orderId', width: 20 },
    { header: 'User ID', field: 'userId', width: 20 },
    { header: 'Items', field: 'items.length', width: 15 },
    { header: 'Status', field: 'status', width: 25 },
    { header: 'Created Date', field: 'createdAt', width: 35 }
  ];

  constructor(
    private refundRequestService: RefundRequestService,
    private router: Router,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.applyFilters()
    })
  }

  ngOnInit(): void {
    this.loadRefundRequests()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  loadRefundRequests(): void {
    this.isLoading = true
    this.errorMessage = ""

    this.refundRequestService.getRefundRequestList().subscribe({
      next: (data) => {
        this.refundRequests = data
        this.sortRequests()
        this.filteredRequests = [...this.refundRequests]
        this.updatePagination()
        this.isLoading = false
        console.log("Refund requests loaded:", this.refundRequests)
      },
      error: (err) => {
        console.error("Error loading refund requests:", err)
        this.errorMessage = "Failed to load refund requests. Please try again."
        this.isLoading = false
      },
    })
  }

  // Real-time filtering methods
  onSearchChange(): void {
    this.searchSubject.next(this.filterParams.search)
  }

  onStatusChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onDateFromChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onDateToChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  onReset(): void {
    this.filterParams = {
      status: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    }
    this.currentPage = 1
    this.filteredRequests = [...this.refundRequests]
    this.updatePagination()
  }

  private applyFilters(): void {
    let filtered = [...this.refundRequests]

    // Status filter
    if (this.filterParams.status) {
      filtered = filtered.filter((request) => request.status === this.filterParams.status)
    }

    // Date range filter
    if (this.filterParams.dateFrom) {
      const fromDate = new Date(this.filterParams.dateFrom)
      filtered = filtered.filter((request) => {
        const requestDate = new Date(request.createdAt || 0)
        return requestDate >= fromDate
      })
    }

    if (this.filterParams.dateTo) {
      const toDate = new Date(this.filterParams.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((request) => {
        const requestDate = new Date(request.createdAt || 0)
        return requestDate <= toDate
      })
    }

    // Enhanced search - search across all relevant fields
    if (this.filterParams.search.trim()) {
      const searchTerm = this.filterParams.search.toLowerCase().trim()
      filtered = filtered.filter((request) => {
        return (
          // Refund Request ID
          request.id?.toString().includes(searchTerm) ||
          // Order ID
          request.orderId
            ?.toString()
            .includes(searchTerm) ||
          // User ID
          request.userId
            ?.toString()
            .includes(searchTerm) ||
          // Status
          this.getStatusDisplayText(request.status || "")
            .toLowerCase()
            .includes(searchTerm) ||
          // Tracking codes
          request.returnTrackingCode
            ?.toLowerCase()
            .includes(searchTerm) ||
          request.customerTrackingCode?.toLowerCase().includes(searchTerm) ||
          // Admin comment
          request.adminComment
            ?.toLowerCase()
            .includes(searchTerm) ||
          // Number of items
          request.items?.length
            .toString()
            .includes(searchTerm)
        )
      })
    }

    this.filteredRequests = filtered
    this.currentPage = 1 // Reset to first page
    this.updatePagination()
  }

  // Sorting methods
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
    } else {
      this.sortField = field
      this.sortDirection = "desc"
    }
    this.sortRequests()
    this.applyFilters()
  }

  private sortRequests(): void {
    this.refundRequests.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (this.sortField) {
        case "id":
          aValue = a.id || 0
          bValue = b.id || 0
          break
        case "orderId":
          aValue = a.orderId || 0
          bValue = b.orderId || 0
          break
        case "userId":
          aValue = a.userId || 0
          bValue = b.userId || 0
          break
        case "status":
          aValue = a.status || ""
          bValue = b.status || ""
          break
        case "itemCount":
          aValue = a.items?.length || 0
          bValue = b.items?.length || 0
          break
        case "createdAt":
        default:
          aValue = new Date(a.createdAt || 0).getTime()
          bValue = new Date(b.createdAt || 0).getTime()
          break
      }

      if (aValue < bValue) return this.sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return this.sortDirection === "asc" ? 1 : -1
      return 0
    })
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return "fa-sort"
    return this.sortDirection === "asc" ? "fa-sort-up" : "fa-sort-down"
  }

  private updatePagination(): void {
    this.totalItems = this.filteredRequests.length
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages
    }

    this.updatePaginatedRequests()
  }

  private updatePaginatedRequests(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedRequests = this.filteredRequests.slice(startIndex, endIndex)
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePaginatedRequests()
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePaginatedRequests()
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updatePaginatedRequests()
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = []
    const maxVisiblePages = 5

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i)
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2)
      let start = Math.max(1, this.currentPage - half)
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1)

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case RefundStatus.REQUESTED:
        return "badge bg-primary"
      case RefundStatus.IN_PROGRESS:
        return "badge bg-warning text-dark"
      case RefundStatus.COMPLETED:
        return "badge bg-success"
      case RefundStatus.REJECTED:
        return "badge bg-danger"
      default:
        return "badge bg-secondary"
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case RefundStatus.REQUESTED:
        return 'bi bi-pencil-square text-primary';
      case RefundStatus.IN_PROGRESS:
        return 'bi bi-hourglass-split text-warning';
      case RefundStatus.COMPLETED:
        return 'bi bi-check-circle text-success';
      case RefundStatus.REJECTED:
        return 'bi bi-x-circle text-danger';
      default:
        return 'bi bi-question-circle text-secondary';
    }
  }

  getStatusDisplayText(status: string): string {
    switch (status) {
      case RefundStatus.REQUESTED:
        return "Requested"
      case RefundStatus.IN_PROGRESS:
        return "In Progress"
      case RefundStatus.COMPLETED:
        return "Completed"
      case RefundStatus.REJECTED:
        return "Rejected"
      default:
        return status || "Unknown"
    }
  }

  // Navigation
  viewDetails(requestId: number): void {
    this.router.navigate(["/admin/refundRequestDetail", requestId])
  }

  // Utility methods
  getItemsPerPageOptions(): number[] {
    return [10, 25, 50, 100]
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1
    this.updatePagination()
  }

  refreshData(): void {
    this.loadRefundRequests()
  }

  trackByRequestId(index: number, request: any): number {
    return request.id
  }

  Math = Math

  getTotalItems(request: RefundRequestDTO): number {
    if (!request.items || !Array.isArray(request.items)) return 0;
    return request.items.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
  }

  onImageError(event: any): void {
    event.target.src = "assets/img/default-product.jpg";
  }

  exportRefundsToPdf() {
    const filename = this.filteredRequests.length === this.refundRequests.length
      ? 'RefundRequestList_All.pdf'
      : `RefundRequestList_Filtered_${this.filteredRequests.length}.pdf`;
    this.pdfExportService.exportTableToPdf(
      this.filteredRequests,
      this.exportColumns,
      filename,
      'Refund Request List Report',
      'refund' // Pass a custom type to suppress total value/products in footer
    );
  }

  async exportRefundsToExcel() {
    const filename = this.filteredRequests.length === this.refundRequests.length
      ? 'RefundRequests_All.xlsx'
      : `RefundRequests_Filtered_${this.filteredRequests.length}.xlsx`;
    await this.excelExportService.exportToExcel(
      this.filteredRequests,
      this.exportColumns,
      filename,
      'RefundRequests',
      'Refund Request List Report'
    );
  }

  exportSingleRefundToPdf(request: any) {
    const filename = `RefundRequest_${request.id}.pdf`;
    this.pdfExportService.exportTableToPdf(
      [request],
      this.exportColumns,
      filename,
      'Refund Request Detail',
      'refund'
    );
  }

  async exportSingleRefundToExcel(request: any) {
    const filename = `RefundRequest_${request.id}.xlsx`;
    await this.excelExportService.exportToExcel(
      [request],
      this.exportColumns,
      filename,
      'Refund Request Detail',
      'Refund Request Detail'
    );
  }

  exportTableToPdf() {
    this.exportRefundsToPdf();
  }

  async exportTableToExcel() {
    await this.exportRefundsToExcel();
  }
}
