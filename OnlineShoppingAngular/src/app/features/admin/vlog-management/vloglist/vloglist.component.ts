import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VlogDTO, VlogFileDTO } from '@app/core/models/vlog';
import { VlogService } from '@app/core/services/vlog.service';
import { VlogFileService } from '@app/core/services/vlogfiles.service';

@Component({
  selector: 'app-vloglist',
  standalone: false,
  templateUrl: './vloglist.component.html',
  styleUrls: ['./vloglist.component.css'],
})
export class VlogListComponent implements OnInit {
  vlogs: VlogDTO[] = [];
  vlogFiles: VlogFileDTO[] = [];
  allVlogFiles: VlogFileDTO[] = [];
  currentVlogId: number | null = null;
  loading = false;
  errorMessage = '';

  // Filter/search properties
  filterParams = {
    search: '',
    dateFrom: '',
    dateTo: '',
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  filteredVlogs: VlogDTO[] = [];
  paginatedVlogs: VlogDTO[] = [];

  // Sorting
  sortField: string = 'createdDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  Math = Math;

  constructor(
    private vlogService: VlogService,
    private vlogFileService: VlogFileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadVlogs();
    this.loadVlogFiles();
  }

  loadVlogs(): void {
    this.loading = true;
    this.errorMessage = '';
    this.vlogService.getAllVlogs().subscribe({
      next: (data) => {
        this.vlogs = data;
        this.sortVlogs();
        this.filteredVlogs = [...this.vlogs];
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load vlogs: ' + (err.message || err.statusText);
        this.loading = false;
        console.error(err);
      },
    });
  }

  refreshData(): void {
    this.loadVlogs();
  }

  // Filtering
  onSearchChange(): void {
    this.applyFilters();
  }

  onDateFromChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onDateToChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onReset(): void {
    this.filterParams = {
      search: '',
      dateFrom: '',
      dateTo: '',
    };
    this.currentPage = 1;
    this.filteredVlogs = [...this.vlogs];
    this.updatePagination();
  }

  private applyFilters(): void {
    let filtered = [...this.vlogs];
    // Date range filter
    if (this.filterParams.dateFrom) {
      const fromDate = new Date(this.filterParams.dateFrom);
      filtered = filtered.filter((vlog) => {
        const vlogDate = new Date(vlog.createdDate || 0);
        return vlogDate >= fromDate;
      });
    }
    if (this.filterParams.dateTo) {
      const toDate = new Date(this.filterParams.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((vlog) => {
        const vlogDate = new Date(vlog.createdDate || 0);
        return vlogDate <= toDate;
      });
    }
    // Search filter
    if (this.filterParams.search.trim()) {
      const searchTerm = this.filterParams.search.toLowerCase().trim();
      filtered = filtered.filter((vlog) => {
        return (
          vlog.id?.toString().includes(searchTerm) ||
          vlog.title?.toLowerCase().includes(searchTerm) ||
          vlog.vlogContent?.toLowerCase().includes(searchTerm)
        );
      });
    }
    this.filteredVlogs = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Sorting
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.sortVlogs();
    this.applyFilters();
  }

  private sortVlogs(): void {
    this.vlogs.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      switch (this.sortField) {
        case 'id':
          aValue = a.id || 0;
          bValue = b.id || 0;
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'createdDate':
        default:
          aValue = new Date(a.createdDate || 0).getTime();
          bValue = new Date(b.createdDate || 0).getTime();
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

  // Pagination
  private updatePagination(): void {
    this.totalItems = this.filteredVlogs.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    this.updatePaginatedVlogs();
  }

  private updatePaginatedVlogs(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedVlogs = this.filteredVlogs.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedVlogs();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedVlogs();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedVlogs();
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

  getItemsPerPageOptions(): number[] {
    return [10, 25, 50, 100];
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  trackByVlogId(index: number, vlog: VlogDTO): number {
    return typeof vlog.id === 'number' ? vlog.id : index;
  }

  loadVlogFiles(): void {
    this.loading = true;
    this.vlogFileService.getFiles().subscribe({
      next: (files) => {
        this.allVlogFiles = files;
        console.log('Loaded allVlogFiles:', this.allVlogFiles);
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = "Failed to load vlog files.";
        this.loading = false;
        console.error(err);
      }
    });
  }

  applyFilter(): void {
    if (this.currentVlogId && this.currentVlogId > 0) {
      this.vlogFiles = this.allVlogFiles.filter(f => f.vlogId === this.currentVlogId);
    } else {
      this.vlogFiles = this.allVlogFiles;
    }
  }

  getFilesForVlog(vlogId: number): VlogFileDTO[] {
    const files = this.allVlogFiles.filter(f => f.vlogId === vlogId);
    console.log('Files for vlogId', vlogId, ':', files);
    return files;
  }

  deleteVlogFile(id: number | undefined): void {
    if (id === undefined) {
      this.errorMessage = "Cannot delete: Vlog file ID is missing.";
      return;
    }
    if (!confirm("Are you sure you want to delete this vlog file?")) {
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    this.vlogFileService.deleteVlogFile(id).subscribe({
      next: () => {
        this.vlogFiles = this.vlogFiles.filter((file) => file.id !== id);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = "Failed to delete vlog file: " + (err.message || err.statusText);
        this.loading = false;
        console.error("Error deleting vlog file:", err);
      },
    });
  }

  isImage(fileType?: string): boolean {
    if (!fileType) return false;
    const type = fileType.toLowerCase();
    return type.startsWith('image') || type.endsWith('jpg') || type.endsWith('jpeg') || type.endsWith('png') || type.endsWith('gif');
  }

  isVideo(fileType?: string): boolean {
    if (!fileType) return false;
    const type = fileType.toLowerCase();
    return type.includes('video') || type.includes('mp4');
  }

  goToEdit(id?: number): void {
    if (id) this.router.navigate(['/vlog/edit', id]);
  }

  deleteVlog(id?: number): void {
    if (!id) return;

    if (!confirm('Are you sure you want to delete this vlog?')) return;

    this.loading = true;
    this.errorMessage = '';
    this.vlogService.deleteVlog(id).subscribe({
      next: () => {
        this.vlogs = this.vlogs.filter((v) => v.id !== id);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to delete vlog: ' + (err.message || err.statusText);
        this.loading = false;
        console.error(err);
      },
    });
  }

  goToCreateBlog(): void {
    this.router.navigate(['/admin/blogcreate']);
  }

  getRowClass(blog: VlogDTO): string {
    const id = typeof blog.id === 'number' ? blog.id : 0;
    return id % 2 === 0 ? 'row-even' : 'row-odd';
  }
}
