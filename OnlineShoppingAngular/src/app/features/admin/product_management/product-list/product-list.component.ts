// <<<<<<< HEAD
// import { Component, OnInit, ViewChild } from '@angular/core';
// import { Table } from 'primeng/table';
// import { BrandDTO, ProductListItemDTO } from '../../../../core/models/product.model';
// import { ProductService } from '../../../../core/services/product.service';
// import { CategoryService } from '../../../../core/services/category.service';
// import { CategoryDTO } from '../../../../core/models/category-dto';
// import { BrandService } from '@app/core/services/brand.service';
// import { Router } from '@angular/router';
// import { AccessControlService } from '@app/core/services/AccessControl.service';
// import { PdfExportService } from '@app/core/services/pdf-export.service';
// import { ExcelExportService } from '@app/core/services/excel-export.service';
// =======
import { Component, OnInit, ViewChild } from "@angular/core"
import { Router } from "@angular/router"
import { CategoryDTO } from "@app/core/models/category-dto"
import { BrandDTO, ProductListItemDTO } from "@app/core/models/product.model"
import { AccessControlService } from "@app/core/services/AccessControl.service"
import { BrandService } from "@app/core/services/brand.service"
import { CategoryService } from "@app/core/services/category.service"
import { ProductService } from "@app/core/services/product.service"
import { Table } from "primeng/table"
import { PdfExportService } from '@app/core/services/pdf-export.service';
import { ExcelExportService } from '@app/core/services/excel-export.service';


@Component({
  selector: "app-premium-products",
  standalone: false,
  templateUrl: "./product-list.component.html",
  styleUrls: ["./product-list.component.css"],
})
export class ProductListComponent implements OnInit {
  @ViewChild("dt") dt!: Table

  // Data arrays
  products: ProductListItemDTO[] = []
  categories: any[] = []
  brands: BrandDTO[] = []
  statuses: any[] = [
    { label: "In Stock", value: "In Stock" },
    { label: "Low Stock", value: "Low Stock" },
    { label: "Out of Stock", value: "Out of Stock" },
  ]

  // Filter states
  priceRange: number[] = [0, 1000]
  maxPrice = 1000
  minPrice = 0
  // selectedCategory: any = null
  // selectedBrand: any = null
  // selectedStatus: any = null
  // globalFilterValue = ""
  // showFilters = false

  // Filter values
  selectedCategory: any = null;
  selectedBrand: any = null;
  selectedStatus: any = null;
  globalFilterValue: string = '';

  showFilters = false;
  isExportingExcel = false;
  isExportingLayoutPdf = false;
  // Loading states
  isLoading = false

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private accessControl: AccessControlService,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadInitialData()
  }

  /**
   * Load all initial data
   */
  private loadInitialData() {
    this.isLoading = true
    Promise.all([this.loadProducts(), this.loadCategories(), this.loadBrands()]).finally(() => {
      this.isLoading = false
    })
  }

  /**
   * Load products from service
   */
  loadProducts(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.productService.getProductList().subscribe({
        next: (products) => {
          console.log("product list : ", products)
          this.products = products.map((product) => ({
            ...product,
            status: this.getStockStatus(product),
          }))

          if (products.length > 0) {
            const prices = products.map((p) => p.product.basePrice)
            this.minPrice = Math.min(...prices)
            this.maxPrice = Math.max(...prices)
            this.priceRange = [this.minPrice, this.maxPrice]
          }
          resolve()
        },
        error: (err) => {
          console.error("Failed to load products", err)
          reject(err)
        },
      })
    })
  }

  /**
   * Load categories from service
   */
  loadCategories(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.categoryService.getAllCategories().subscribe({
        next: (categories: CategoryDTO[]) => {
          this.categories = categories.map((cat) => ({
            label: cat.name,
            value: cat.name,
          }))
          resolve()
        },
        error: (error) => {
          console.error("Error loading categories:", error)
          reject(error)
        },
      })
    })
  }

  /**
   * Load brands from service
   */
  loadBrands(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.brandService.getAllBrands().subscribe({
        next: (brands: BrandDTO[]) => {
          this.brands = brands.map((brand) => ({
            id: brand.id,
            name: brand.name,
            logo: brand.logo,
          }))
          resolve()
        },
        error: (error) => {
          console.error("Error loading brands:", error)
          reject(error)
        },
      })
    })
  }

  /**
   * Toggle filters visibility
   */
  toggleFilters() {
    this.showFilters = !this.showFilters
    if (!this.showFilters) {
      this.clearAllFilters()
    }
  }

  /**
   * Clear all applied filters
   */
  clearAllFilters() {
    this.dt.clear()
    this.selectedCategory = null
    this.selectedBrand = null
    this.selectedStatus = null
    this.globalFilterValue = ""
    this.priceRange = [this.minPrice, this.maxPrice]
  }

  /**
   * Get stock status based on total stock
   */
  getStockStatus(product: ProductListItemDTO): string {
    const totalStock = this.getTotalStock(product)
    if (totalStock === 0) return "Out of Stock"
    if (totalStock <= 10) return "Low Stock"
    return "In Stock"
  }

  /**
   * Calculate total stock from all variants
   */
  getTotalStock(product: ProductListItemDTO): number {
    return product.variants.reduce((total, variant) => total + variant.stock, 0)
  }

  /**
   * Get CSS class for stock status
   */
  getOverallStockClass(product: ProductListItemDTO): string {
    const status = this.getStockStatus(product)
    switch (status) {
      case "Out of Stock":
        return "status-inactive"
      case "Low Stock":
        return "status-low"
      default:
        return "status-active"
    }
  }

  /**
   * Get status icon class
   */
  getStatusIcon(product: ProductListItemDTO): string {
    const status = this.getStockStatus(product)
    switch (status) {
      case "Out of Stock":
        return "bi bi-x-circle-fill"
      case "Low Stock":
        return "bi bi-exclamation-triangle-fill"
      default:
        return "bi bi-check-circle-fill"
    }
  }

  /**
   * Get color for status
   */
  getStatusColor(status: string): string {
    switch (status) {
      case "In Stock":
        return "#28a745"
      case "Low Stock":
        return "#fd7e14"
      case "Out of Stock":
        return "#dc3545"
      default:
        return "#6c757d"
    }
  }

  /**
   * Handle global filter input
   */
  onGlobalFilter(event: Event) {
    const input = event.target as HTMLInputElement
    this.globalFilterValue = input.value
    this.dt.filterGlobal(input.value, "contains")
  }

  /**
   * Select category filter
   */
  selectCategory(category: any) {
    this.selectedCategory = category
    this.dt.filter(category?.value ?? null, "category.name", "equals")
  }

  /**
   * Select brand filter
   */
  selectBrand(brand: BrandDTO | null) {
    this.selectedBrand = brand
    this.dt.filter(brand?.name ?? null, "brand.name", "equals")
  }

  /**
   * Select status filter
   */
  selectStatus(status: any) {
    this.selectedStatus = status
    this.dt.filter(status?.value ?? null, "status", "equals")
  }

  /**
   * Handle price range change
   */
  onPriceChange() {
    this.dt.filter(this.priceRange, "product.basePrice", "between")
  }

  /**
   * Handle price input change with validation
   */
  onPriceInputChange() {
    // Prevent invalid range
    if (this.priceRange[0] > this.priceRange[1]) {
      this.priceRange[1] = this.priceRange[0]
    }

    // Ensure values are within bounds
    if (this.priceRange[0] < this.minPrice) {
      this.priceRange[0] = this.minPrice
    }
    if (this.priceRange[1] > this.maxPrice) {
      this.priceRange[1] = this.maxPrice
    }

    this.onPriceChange()
  }

  /**
   * Get selected category name for display
   */
  getSelectedCategoryName(): string {
    return this.selectedCategory ? this.selectedCategory.label : ""
  }

  /**
   * Get selected brand name for display
   */
  getSelectedBrandName(): string {
    return this.selectedBrand ? this.selectedBrand.name : ""
  }

  /**
   * Get selected status name for display
   */
  getSelectedStatusName(): string {
    return this.selectedStatus ? this.selectedStatus.label : ""
  }

  /**
   * View product details
   */
  viewProduct(product: ProductListItemDTO): void {
    console.log("View product details:", product)
    this.router.navigate(["/admin/product", product.id])
  }

  /**
   * Edit product
   */
  editProduct(product: ProductListItemDTO): void {
    console.log("Edit product:", product)
    this.router.navigate(["/admin/product/edit", product.id])
  }

  /**
   * Delete product with confirmation
   */
  deleteProduct(product: ProductListItemDTO): void {
    if (confirm(`Are you sure you want to delete "${product.product.name}"?`)) {
      console.log("Delete product:", product)
      // Implement delete logic here
      // this.productService.deleteProduct(product.id).subscribe(...)
    }
  }

  /**
   * Get main product image
   */
  getMainProductImage(product: ProductListItemDTO): string {
    const mainImage = product.product.productImages?.find((img) => img.mainImageStatus)
    return mainImage?.imgPath || "/assets/img/default-product.jfif"
  }

  /**
   * Check if user can create products
   */
  get canCreateProduct(): boolean {
    return this.accessControl.hasAny("PRODUCT_CREATE", "SUPERADMIN_PERMISSION")
  }

  /**
   * Check if user can bulk upload products
   */
  get canBulkUploadProducts(): boolean {
    return this.accessControl.hasAny("PRODUCT_CREATE", "SUPERADMIN_PERMISSION")
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    this.loadInitialData()
  }

  /**
   * Export products data
   */
  exportProducts(): void {
    // Implement export functionality
    console.log("Export products")
  }

  /**
   * Get filtered products count
   */
  get filteredProductsCount(): number {
    return this.dt?.filteredValue?.length ?? this.products.length
  }

  // 🔍 Helper method to get filtered data for export
  getExportData(): ProductListItemDTO[] {
    // If filters are applied, use filteredValue; otherwise, use all products
    return this.dt && this.dt.filteredValue ? this.dt.filteredValue : this.products;
  }

  // 🎨 Professional Table PDF Export (Client-side) - Filtered Data
  async exportProfessionalPdf() {
    this.isExportingLayoutPdf = true;
    try {
      const columns = [
        { header: 'Product Name', field: 'product.name', width: 60 },
        { header: 'Brand', field: 'brand.name', width: 40 },
        { header: 'Category', field: 'category.name', width: 40 },
        { header: 'Price (MMK)', field: 'product.basePrice', width: 35 },
        { header: 'Stock Status', field: 'status', width: 30 },
        { header: 'Created Date', field: 'product.createdDate', width: 45 }
      ];

      const exportData = this.getExportData();
      const filename = exportData.length === this.products.length 
        ? 'ProductList_All_Products.pdf' 
        : `ProductList_Filtered_${exportData.length}_Products.pdf`;

      this.pdfExportService.exportTableToPdf(
        exportData, // Use filtered data instead of all products
        columns,
        filename,
        'Product List Report',
        'product' // Pass type as 'product' for correct footer
      );
    } catch (error: any) {
      console.error('Error exporting professional PDF:', error);
      alert('Error exporting professional PDF. Please try again.');
    } finally {
      this.isExportingLayoutPdf = false;
    }
  }

  // 🅱️ Excel Export - Filtered Data
  async exportToExcel() {
    this.isExportingExcel = true;
    try {
      const columns = [
        { header: 'Product Name', field: 'product.name', width: 25 },
        { header: 'Brand', field: 'brand.name', width: 15 },
        { header: 'Category', field: 'category.name', width: 15 },
        { header: 'Price (MMK)', field: 'product.basePrice', width: 15 },
        { header: 'Stock Status', field: 'status', width: 15 },
        { header: 'Created Date', field: 'product.createdDate', width: 20 }
      ];

      const exportData = this.getExportData();
      const filename = exportData.length === this.products.length 
        ? 'ProductList_All_Products.xlsx' 
        : `ProductList_Filtered_${exportData.length}_Products.xlsx`;

      await this.excelExportService.exportToExcel(
        exportData, // Use filtered data instead of all products
        columns,
        filename,
        'Products'
      );
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel. Please try again.');
    } finally {
      this.isExportingExcel = false;
    }
  }
}
