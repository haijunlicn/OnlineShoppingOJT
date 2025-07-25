import { Component, OnInit } from "@angular/core";
import { Notification } from "@app/core/models/notification.model";
import { NotificationService } from "@app/core/services/notification.service";

@Component({
  selector: "app-admin-sent-notis",
  standalone : false,
  templateUrl: "./admin-sent-notis.component.html",
  styleUrls: ["./admin-sent-notis.component.css"],
})
export class AdminSentNotisComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  paginatedNotifications: Notification[] = [];
  isLoading = false;
  error: string | null = null;

  // Filter/search/pagination/sort
  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  sortField: string = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';
  Math = Math;

  // For modal
  selectedMetadata: any = null;
  showModal = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.error = null;

    this.notificationService.getCustomNotifications().subscribe({
      next: (data) => {
        this.notifications = data.map((n: any) => ({
          ...n,
          id: typeof n.id === 'string' ? parseInt(n.id, 10) : n.id,
        }));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = "Error loading sent notifications";
        this.isLoading = false;
      },
    });
  }

  // Filtering, search, pagination
  applyFilters(): void {
    let filtered = [...this.notifications];
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(noti =>
        (noti.title || '').toLowerCase().includes(term) ||
        (noti.message || '').toLowerCase().includes(term)
      );
    }
    this.filteredNotifications = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    this.applySorting();
    this.updatePagination();
  }

  applySorting(): void {
    if (!this.sortField) return;
    this.filteredNotifications.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      switch (this.sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'message':
          aValue = a.message || '';
          bValue = b.message || '';
          break;
        case 'scheduledAt':
          aValue = a.scheduledAt || '';
          bValue = b.scheduledAt || '';
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedNotifications = this.filteredNotifications.slice(startIndex, endIndex);
  }

  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.applySorting();
    this.updatePagination();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'fa-sort';
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getItemsPerPageOptions(): number[] {
    return [10, 25, 50, 100];
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  onReset(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Preview short message
  getMessagePreview(message?: string): string {
    if (!message) return "N/A";
    const maxLength = 100;
    return message.length > maxLength ? message.substring(0, maxLength) + "..." : message;
  }

  clearError(): void {
    this.error = null;
  }

  trackByNotificationId(index: number, notification: Notification): any {
    return notification.id;
  }

  // Modal Logic
  openMetadataModal(metadata: string | null): void {
    if (!metadata) {
      this.selectedMetadata = null;
    } else {
      try {
        this.selectedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      } catch {
        this.selectedMetadata = metadata;
      }
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedMetadata = null;
  }
}
