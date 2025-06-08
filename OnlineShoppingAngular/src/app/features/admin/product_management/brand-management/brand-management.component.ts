import { Component, OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { BrandDTO } from "../../../../core/models/product.model"
import { BrandService } from "../../../../core/services/brand.service"

@Component({
  selector: "app-brand-management",
  standalone: false,
  templateUrl: "./brand-management.component.html",
  styleUrls: ["./brand-management.component.css"],
})
export class BrandManagementComponent implements OnInit {
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
  ) {
    this.brandForm = this.fb.group({
      id: [""],
      name: ["", Validators.required],
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

    if (brand) {
      this.brandForm.patchValue({
        id: brand.id,
        name: brand.name,
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
  }

  deleteBrand(brand: BrandDTO): void {
    if (confirm(`Are you sure you want to delete the brand "${brand.name}"?`)) {
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
    }
  }
}
