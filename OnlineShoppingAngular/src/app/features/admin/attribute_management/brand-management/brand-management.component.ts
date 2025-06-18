import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { BrandDTO } from "../../../../core/models/product.model";
import { BrandService } from "../../../../core/services/brand.service";

@Component({
  selector: "app-brand-management",
  standalone: false,
  templateUrl: "./brand-management.component.html",
  styleUrls: ["./brand-management.component.css"],
})
export class BrandManagementComponent implements OnInit {
 brands: BrandDTO[] = [];
  filteredBrands: BrandDTO[] = [];
  brandFilter = "";

  loadingBrands = false;
  brandDialogVisible = false;
  editingBrand: BrandDTO | null = null;

  @Input() modalMode = false;
  @Input() showCreateOnly = false;
  @Output() brandCreated = new EventEmitter<BrandDTO>();
  @Output() brandSelected = new EventEmitter<BrandDTO>();

  constructor(private brandService: BrandService) {}

  ngOnInit(): void {
    if (!this.showCreateOnly) {
      this.loadBrands();
    }
    if (this.showCreateOnly && this.modalMode) {
      this.openBrandDialog();
    }
  }

  loadBrands(): void {
    this.loadingBrands = true;
    this.brandService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.updateFilters();
        this.loadingBrands = false;
      },
      error: (err) => {
        console.error("Error loading brands:", err);
        this.loadingBrands = false;
      },
    });
  }

  updateFilters(): void {
    const filter = this.brandFilter.toLowerCase();
    this.filteredBrands = this.brands.filter((b) =>
      b.name.toLowerCase().includes(filter)
    );
  }

  openBrandDialog(brand?: BrandDTO): void {
    this.editingBrand = brand || null;
    this.brandDialogVisible = true;
  }

  onBrandSaved(savedBrand: BrandDTO): void {
    if (!this.showCreateOnly) {
      this.loadBrands();
    }
    this.brandDialogVisible = false;

    if (!this.editingBrand) {
      this.brandCreated.emit(savedBrand);
    }
    this.brandSelected.emit(savedBrand);
  }

  editBrand(brand: BrandDTO): void {
    this.openBrandDialog(brand);
  }

  deleteBrand(brand: BrandDTO): void {
    if (confirm(`Are you sure you want to delete the brand "${brand.name}"?`)) {
      this.brandService.deleteBrand(+brand.id).subscribe({
        next: () => {
          this.loadBrands();
        },
        error: (err) => {
          console.error("Error deleting brand:", err);
          if (err.status === 400) {
            alert("Cannot delete brand. It may have products associated with it.");
          }
        },
      });
    }
  }
}
