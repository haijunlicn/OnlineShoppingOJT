<<<<<<< Updated upstream
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { BrandDTO } from "../../../../core/models/product.model";
import { BrandService } from "../../../../core/services/brand.service";
=======
import { Component, OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { BrandDTO } from "../../../../core/models/product.model"
import { BrandService } from "../../../../core/services/brand.service"
>>>>>>> Stashed changes

@Component({
  selector: "app-brand-management",
  standalone: false,
  templateUrl: "./brand-management.component.html",
  styleUrls: ["./brand-management.component.css"],
})
export class BrandManagementComponent implements OnInit {
<<<<<<< Updated upstream
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
=======
  brands: BrandDTO[] = []
  filteredBrands: BrandDTO[] = []
  brandFilter = ""

  // Loading state
  loadingBrands = false

  // Dialog visibility
  brandDialogVisible = false

  // Edit state
  editingBrand: BrandDTO | null = null

  // Form
  brandForm: FormGroup

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService,
>>>>>>> Stashed changes
  ) {
    this.brandForm = this.fb.group({
      id: [""],
      name: ["", Validators.required],
<<<<<<< Updated upstream
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
=======
    })
  }

  ngOnInit(): void {
    this.loadBrands()
  }

  updateFilters(): void {
    this.filteredBrands = this.brands.filter((brand) =>
      brand.name.toLowerCase().includes(this.brandFilter.toLowerCase()),
    )
  }

  loadBrands(): void {
    this.loadingBrands = true
    this.brandService.getAllBrands().subscribe({
      next: (brands: BrandDTO[]) => {
        this.brands = brands
        this.updateFilters()
        this.loadingBrands = false
      },
      error: (error) => {
        console.error("Error loading brands:", error)
        this.loadingBrands = false
      },
    })
  }

  openBrandDialog(brand?: BrandDTO): void {
    this.editingBrand = brand || null
>>>>>>> Stashed changes

    if (brand) {
      this.brandForm.patchValue({
        id: brand.id,
        name: brand.name,
<<<<<<< Updated upstream
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
=======
      })
    } else {
      this.brandForm.reset()
    }

    this.brandDialogVisible = true
  }

  saveBrand(): void {
    if (this.brandForm.invalid) return

    const formValue = this.brandForm.value

    if (this.editingBrand) {
      // Update existing brand
      const updateData: BrandDTO = {
        id: this.editingBrand.id,
        name: formValue.name,
      }

      this.brandService.updateBrand(updateData).subscribe({
        next: (updatedBrand) => {
          const index = this.brands.findIndex((b) => b.id === this.editingBrand!.id)
          if (index !== -1) {
            this.brands[index] = updatedBrand
          }
          this.updateFilters()
          this.brandDialogVisible = false
        },
        error: (error) => {
          console.error("Error updating brand:", error)
        },
      })
    } else {
      // Create new brand
      const newBrand: BrandDTO = {
        id: "", // Backend will generate
        name: formValue.name,
      }

      this.brandService.createBrand(newBrand).subscribe({
        next: (createdBrand) => {
          this.brands.push(createdBrand)
          this.updateFilters()
          this.brandDialogVisible = false
        },
        error: (error) => {
          console.error("Error creating brand:", error)
        },
      })
    }
  }

  editBrand(brand: BrandDTO): void {
    this.openBrandDialog(brand)
>>>>>>> Stashed changes
  }

  deleteBrand(brand: BrandDTO): void {
    if (confirm(`Are you sure you want to delete the brand "${brand.name}"?`)) {
<<<<<<< Updated upstream
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
=======
      this.brandService.deleteBrand(Number.parseInt(brand.id)).subscribe({
        next: () => {
          this.brands = this.brands.filter((b) => b.id !== brand.id)
          this.updateFilters()
        },
        error: (error) => {
          console.error("Error deleting brand:", error)
          if (error.status === 400) {
            alert("Cannot delete brand. It may have products associated with it.")
          }
        },
      })
>>>>>>> Stashed changes
    }
  }
}
