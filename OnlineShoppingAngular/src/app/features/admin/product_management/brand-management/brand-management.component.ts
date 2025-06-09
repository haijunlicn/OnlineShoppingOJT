import { Component, OnInit } from "@angular/core";
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

  brandForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService
  ) {
    this.brandForm = this.fb.group({
      id: [""],
      name: ["", Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  updateFilters(): void {
    const filter = this.brandFilter.toLowerCase();
    this.filteredBrands = this.brands.filter((b) =>
      b.name.toLowerCase().includes(filter)
    );
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

  openBrandDialog(brand?: BrandDTO): void {
    this.editingBrand = brand || null;
    this.brandForm.reset();

    if (brand) {
      this.brandForm.patchValue({
        id: brand.id,
        name: brand.name,
      });
    }

    this.brandDialogVisible = true;
  }

  saveBrand(): void {
    if (this.brandForm.invalid) return;

    const formValue = this.brandForm.value;

    const dto: BrandDTO = {
      id: this.editingBrand?.id || "", // blank ID for create
      name: formValue.name,
    };

    const action$ = this.editingBrand
      ? this.brandService.updateBrand(dto)
      : this.brandService.createBrand(dto);

    action$.subscribe({
      next: () => {
        this.loadBrands(); // ✅ Reload list to reflect accurate backend state
        this.brandDialogVisible = false;
      },
      error: (err) => {
        console.error(this.editingBrand ? "Error updating brand:" : "Error creating brand:", err);
      },
    });
  }

  editBrand(brand: BrandDTO): void {
    this.openBrandDialog(brand);
  }

  deleteBrand(brand: BrandDTO): void {
    if (confirm(`Are you sure you want to delete the brand "${brand.name}"?`)) {
      this.brandService.deleteBrand(+brand.id).subscribe({
        next: () => {
          this.loadBrands(); // ✅ Reload after deletion
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
