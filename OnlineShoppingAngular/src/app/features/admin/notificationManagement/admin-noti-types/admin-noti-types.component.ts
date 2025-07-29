import { Component, type OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { NotificationType } from "@app/core/models/notification.model"
import { NotificationTypeService } from "@app/core/services/notificatiiontype.service"

// Import interfaces from service
type NotificationTypeMethod = {
  notificationTypeId: number;
  notificationTypeName: string;
  method: string;
  status: number;
}

declare var bootstrap: any // Declare bootstrap for modal functionality
@Component({
  selector: "app-admin-noti-types",
  standalone: false,
  templateUrl: "./admin-noti-types.component.html",
  styleUrls: ["./admin-noti-types.component.css"],
})
export class AdminNotiTypesComponent implements OnInit {
  // Data arrays
  notificationTypes: NotificationType[] = []
  filteredNotificationTypes: NotificationType[] = []
  paginatedNotificationTypes: NotificationType[] = []
  notificationTypeMethods: NotificationTypeMethod[] = []

  // Form for creating new notification types
  createForm: FormGroup

  // Pagination properties
  currentPage = 1
  itemsPerPage = 10
  totalItems = 0
  totalPages = 0
  itemsPerPageOptions = [5, 10, 25, 50]

  // Filter parameters
  searchTerm = "" // For future search functionality if needed

  // Sorting
  sortField = ""
  sortDirection: "asc" | "desc" = "asc"

  // Math object for template
  Math = Math

  // Loading and message states
  isLoading = false
  message = "" // For success messages
  error = "" // For error messages

  // Modal properties
  notificationTypeToDelete: NotificationType | null = null
  showCreateForm = false // To toggle visibility of the create form
  selectedNotificationType: NotificationType | null = null

  constructor(
    private notificationTypeService: NotificationTypeService,
    private fb: FormBuilder,
  ) {
    this.createForm = this.fb.group({
      name: ["", [Validators.required]],
      titleTemplate: ["", [Validators.required]],
      adminOnly: [false],
    })
  }

  ngOnInit(): void {
    this.loadInitialData()
  }

  /**
   * Load all initial data (notification types)
   */
  private loadInitialData(): void {
    this.isLoading = true
    this.error = "" // Clear previous errors

    Promise.all([
      this.loadNotificationTypes(),
      this.loadNotificationTypeMethods()
    ])
      .then(() => {
        this.applyFilters() // Apply filters and sorting after data is loaded
      })
      .catch((err) => {
        this.error = "Failed to load notification types. Please try again."
        console.error("Error loading initial data:", err)
      })
      .finally(() => {
        this.isLoading = false
      })
  }

  /**
   * Load notification types from service
   */
  loadNotificationTypes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.notificationTypeService.getNotificationTypesForAdmin().subscribe({
        next: (data) => {
          this.notificationTypes = data
          resolve()
        },
        error: (err) => {
          console.error("Failed to load notification types", err)
          reject(err)
        },
      })
    })
  }

  /**
   * Load notification type methods from service
   */
  loadNotificationTypeMethods(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.notificationTypeService.getNotificationTypeMethods().subscribe({
        next: (data) => {
          this.notificationTypeMethods = data
          resolve()
        },
        error: (err) => {
          console.error("Failed to load notification type methods", err)
          reject(err)
        },
      })
    })
  }

  /**
   * Get method status for a specific notification type and method
   */
  getMethodStatus(notificationTypeId: number, method: string): number {
    const methodData = this.notificationTypeMethods.find(
      (m) => m.notificationTypeId === notificationTypeId && m.method === method
    )
    return methodData ? methodData.status : 0
  }

  /**
   * Handle checkbox change for method status
   */
  onMethodStatusChange(notificationTypeId: number, method: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const isChecked = target.checked;
    const status = isChecked ? 1 : 0
    
    this.notificationTypeService.updateNotificationMethodStatus(notificationTypeId, method, status).subscribe({
      next: () => {
        // Update local data
        const methodData = this.notificationTypeMethods.find(
          (m) => m.notificationTypeId === notificationTypeId && m.method === method
        )
        if (methodData) {
          methodData.status = status
        }
        this.message = `${method} method status updated successfully!`
        setTimeout(() => this.message = "", 3000)
      },
      error: (err) => {
        this.error = `Failed to update ${method} method status.`
        console.error("Error updating method status:", err)
        setTimeout(() => this.error = "", 5000)
      }
    })
  }

  /**
   * View message template modal
   */
  viewMessageTemplate(notificationTypeId: number): void {
    this.selectedNotificationType = null
    this.notificationTypeService.getNotificationTypeById(notificationTypeId).subscribe({
      next: (data) => {
        this.selectedNotificationType = data
        // Show modal using Bootstrap
        const modal = new bootstrap.Modal(document.getElementById('messageTemplateModal'))
        modal.show()
      },
      error: (err) => {
        this.error = "Failed to load notification type details."
        console.error("Error loading notification type details:", err)
      }
    })
  }

  /**
   * Handle form submission for creating a new notification type
   */
  onSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched() // Mark all fields as touched to show validation errors
      return
    }

    this.isLoading = true
    this.error = ""
    this.message = ""

    const newType: NotificationType = this.createForm.value
    this.notificationTypeService.createNotificationType(newType).subscribe({
      next: (created) => {
        this.message = "Notification type created successfully!"
        this.notificationTypes.push(created)
        this.createForm.reset({ adminOnly: false }) // Reset form and keep adminOnly checkbox unchecked
        this.applyFilters() // Re-apply filters to update the list with the new item
        this.closeCreateForm() // Close the form after successful creation
      },
      error: (err) => {
        this.error = err.error?.message || "Failed to create notification type."
        console.error("Error creating notification type:", err)
      },
      complete: () => {
        this.isLoading = false
      },
    })
  }

  /**
   * Confirm deletion of a notification type
   */
  confirmDelete(nt: NotificationType): void {
    this.notificationTypeToDelete = nt
    const modal = new bootstrap.Modal(document.getElementById("deleteModal"))
    modal.show()
  }

  refreshData(): void {
    this.loadInitialData()
  }

  // Filter and Sorting methods
  applyFilters(): void {
    let filtered = [...this.notificationTypes]

    // Apply search filter (if searchTerm is implemented)
    if (this.searchTerm.trim()) {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (nt) =>
          nt.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          nt.titleTemplate.toLowerCase().includes(lowerCaseSearchTerm),
      )
    }

    this.filteredNotificationTypes = filtered
    this.totalItems = filtered.length
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)

    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1
    }

    this.applySorting()
    this.updatePagination()
  }

  applySorting(): void {
    if (!this.sortField) return

    this.filteredNotificationTypes.sort((a, b) => {
      let valueA: any
      let valueB: any

      switch (this.sortField) {
        case "id":
          valueA = a.id
          valueB = b.id
          break
        case "name":
          valueA = a.name
          valueB = b.name
          break
        case "titleTemplate":
          valueA = a.titleTemplate
          valueB = b.titleTemplate
          break
        case "adminOnly":
          valueA = a.adminOnly
          valueB = b.adminOnly
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

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedNotificationTypes = this.filteredNotificationTypes.slice(startIndex, endIndex)
  }

  sort(field: string): void {
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
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePagination()
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePagination()
    }
  }

  goToNextPage(): void {
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

  onItemsPerPageChange(): void {
    this.currentPage = 1
    this.applyFilters()
  }

  getItemsPerPageOptions(): number[] {
    return this.itemsPerPageOptions
  }

  onReset(): void {
    this.searchTerm = ""
    this.currentPage = 1
    this.sortField = ""
    this.sortDirection = "asc"
    this.applyFilters()
  }

  // Utility methods
  trackByNotificationTypeId(index: number, nt: NotificationType): any {
    return nt.id
  }

  getStatusBadgeClass(adminOnly: boolean): string {
    return adminOnly ? "badge bg-success" : "badge bg-secondary"
  }

  getStatusIcon(adminOnly: boolean): string {
    return adminOnly ? "fa-check-circle" : "fa-times-circle"
  }

  // Message handling
  clearMessage(): void {
    this.message = ""
  }

  clearError(): void {
    this.error = ""
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

  // Form visibility toggles
  openCreateForm(): void {
    this.showCreateForm = true
    this.createForm.reset({ adminOnly: false })
  }

  closeCreateForm(): void {
    this.showCreateForm = false
  }
}
