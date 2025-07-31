import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BrandDTO } from '../../../../core/models/product.model';
import { BrandService } from '../../../../core/services/brand.service';
import { AlertService } from '@app/core/services/alert.service';

@Component({
  selector: 'app-brand-management',
  standalone: false,
  templateUrl: './brand-management.component.html',
  styleUrls: ['./brand-management.component.css'],
})
export class BrandManagementComponent implements OnInit {
  // Brand list and filters
  brands: BrandDTO[] = [];
  filteredBrands: BrandDTO[] = [];
  brandFilter: string = '';
  statusFilter: number | null = null;

  // Dialog and state management
  loadingBrands: boolean = false;
  brandDialogVisible: boolean = false;
  editingBrand: BrandDTO | null = null;

  // Input/Output for optional modal use
  @Input() modalMode: boolean = false;
  @Input() showCreateOnly: boolean = false;
  @Output() brandCreated = new EventEmitter<BrandDTO>();
  @Output() brandSelected = new EventEmitter<BrandDTO>();

  // Status filter options
  statusOptions = [
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 0 },
  ];

  constructor(
    private brandService: BrandService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    if (!this.showCreateOnly) {
      this.loadBrands();
    }

    // Auto-open create modal in certain cases
    if (this.showCreateOnly && this.modalMode) {
      this.openBrandDialog();
    }
  }

  /** Load all brands from backend */
  loadBrands(): void {
    this.loadingBrands = true;
    this.brandService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.loadProductCounts();
        this.updateFilters();
        this.loadingBrands = false;
        console.log("this.brands : ", this.brands);
        
      },
      error: (err) => {
        console.error('Error loading brands:', err);
        this.loadingBrands = false;
        this.alertService.toast('Failed to load brands.', 'error');
      },
    });
  }

  /** Load product counts for each brand */
  loadProductCounts(): void {
    this.brandService.getProductCountsByBrand().subscribe({
      next: (productCounts) => {
        // Map product counts to brands
        this.brands = this.brands.map(brand => ({
          ...brand,
          productCount: productCounts[brand.id] || 0
        }));
        this.updateFilters();
      },
      error: (err) => {
        console.error('Error loading product counts:', err);
        // Set default product count of 0 if loading fails
        this.brands = this.brands.map(brand => ({
          ...brand,
          productCount: 0
        }));
        this.updateFilters();
      }
    });
  }

  /** Filter brands based on name and status */
  updateFilters(): void {
    const nameFilter = this.brandFilter.toLowerCase().trim();

    this.filteredBrands = this.brands.filter((brand) => {
      const matchesName = brand.name.toLowerCase().includes(nameFilter);
      
      // Use delFg for status filtering: 1=active, 0=inactive
      const brandStatus = brand.delFg ?? 1; // Default to active if delFg is not set
      const matchesStatus = this.statusFilter === null || brandStatus === this.statusFilter;
      
      return matchesName && matchesStatus;
    });
  }

  /** Open brand dialog (create or edit) */
  openBrandDialog(brand?: BrandDTO): void {
    this.editingBrand = brand || null;
    this.brandDialogVisible = true;
  }

  /** Handler when a brand is saved in the dialog */
  onBrandSaved(savedBrand: BrandDTO): void {
    if (!this.showCreateOnly) {
      this.loadBrands();
    }
    this.brandDialogVisible = false;

    // Emit create or select event
    if (!this.editingBrand) {
      this.brandCreated.emit(savedBrand);
    }
    this.brandSelected.emit(savedBrand);
  }

  /** Open dialog for editing a brand */
  editBrand(brand: BrandDTO): void {
    this.openBrandDialog(brand);
  }

  /** Delete a brand with confirmation */
  deleteBrand(brand: BrandDTO): void {
    const isCurrentlyActive = (brand.delFg ?? 1) === 1;
    const confirmMessage = isCurrentlyActive 
      ? `Are you sure you want to deactivate the brand "${brand.name}"?`
      : `Are you sure you want to restore the brand "${brand.name}" to active status?`;

    this.alertService
      .confirm(confirmMessage, isCurrentlyActive ? 'Deactivate Brand' : 'Restore Brand')
      .then((confirmed) => {
        if (confirmed) {
          this.brandService.deleteBrand(+brand.id).subscribe({
            next: () => {
              const successMessage = isCurrentlyActive 
                ? `"${brand.name}" has been deactivated.`
                : `"${brand.name}" has been restored to active status.`;
              this.alertService.toast(successMessage, 'success');
              
              // Update the local brand status
              brand.delFg = isCurrentlyActive ? 0 : 1;
              
              // Reload brands to get updated data
              this.loadBrands();
            },
            error: (err) => {
              console.error('Error updating brand status:', err);
              if (err.status === 400) {
                this.alertService.toast(
                  'Cannot update brand. It may have products associated with it.',
                  'error'
                );
              } else {
                this.alertService.toast('Failed to update brand status.', 'error');
              }
            },
          });
        }
      });
  }
}
