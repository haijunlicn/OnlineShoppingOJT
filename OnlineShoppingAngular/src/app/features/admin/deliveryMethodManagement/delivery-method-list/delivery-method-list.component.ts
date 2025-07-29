import { Component, OnInit } from '@angular/core';
import { DeliveryMethodService } from '@app/core/services/delivery-method.service';
import { DeliveryMethod } from '@app/core/models/delivery-method.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-delivery-method-list',
  standalone: false,
  templateUrl: './delivery-method-list.component.html',
  styleUrls: ['./delivery-method-list.component.css']
})
export class DeliveryMethodListComponent implements OnInit {
  deliveryMethods: DeliveryMethod[] = [];
  filteredDeliveryMethods: DeliveryMethod[] = [];
  paginatedMethods: DeliveryMethod[] = [];
  isLoading = false;
  error = '';
  searchTerm = '';
  selectedType = '';
  selectedMethod: DeliveryMethod | null = null;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Sorting
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Search debouncing
  private searchSubject = new Subject<string>();

  constructor(private deliveryMethodService: DeliveryMethodService) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit() {
    this.loadMethods();
  }

  loadMethods() {
    this.isLoading = true;
    this.deliveryMethodService.getAll().subscribe({
      next: (methods) => {
        this.deliveryMethods = methods;
        this.sortMethods();
        this.filteredDeliveryMethods = [...this.deliveryMethods];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load delivery methods';
        this.isLoading = false;
      }
    });
  }

  // Search and filtering methods
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onTypeChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.currentPage = 1;
    this.filteredDeliveryMethods = [...this.deliveryMethods];
    this.updatePagination();
  }

  private applyFilters(): void {
    let filtered = [...this.deliveryMethods];

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter((method) => method.type === parseInt(this.selectedType));
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const searchTerm = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((method) =>
        method.name.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredDeliveryMethods = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Sorting methods
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortMethods();
    this.applyFilters();
  }

  private sortMethods(): void {
    this.deliveryMethods.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortField) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'minDistance':
          aValue = a.minDistance || 0;
          bValue = b.minDistance || 0;
          break;
        case 'maxDistance':
          aValue = a.maxDistance || 0;
          bValue = b.maxDistance || 0;
          break;
        case 'baseFee':
          aValue = a.baseFee || 0;
          bValue = b.baseFee || 0;
          break;
        case 'feePerKm':
          aValue = a.feePerKm || 0;
          bValue = b.feePerKm || 0;
          break;
        case 'feePerKmOutCity':
          aValue = a.feePerKmOutCity || 0;
          bValue = b.feePerKmOutCity || 0;
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
          break;
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'fa-sort';
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  // Pagination methods
  private updatePagination(): void {
    this.totalItems = this.filteredDeliveryMethods.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    this.updatePaginatedMethods();
  }

  private updatePaginatedMethods(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedMethods = this.filteredDeliveryMethods.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedMethods();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedMethods();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedMethods();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, this.currentPage - half);
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getItemsPerPageOptions(): number[] {
    return [10, 25, 50, 100];
  }

  // Utility methods
  trackByMethodId(index: number, method: any): number {
    return method.id;
  }

  Math = Math;

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  confirmDelete(method: DeliveryMethod) {
    this.selectedMethod = method;
  }

  deleteMethod() {
    if (!this.selectedMethod) return;
    this.deliveryMethodService.delete(this.selectedMethod.id).subscribe({
      next: () => {
        this.loadMethods();
        this.selectedMethod = null;
      },
      error: () => {
        this.error = 'Failed to delete delivery method';
      }
    });
  }
}

