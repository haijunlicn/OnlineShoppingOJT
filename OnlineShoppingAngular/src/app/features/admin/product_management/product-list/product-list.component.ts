
import { Component, OnInit, viewChild, ViewChild } from "@angular/core"
import { Router } from "@angular/router"
import type { CategoryDTO } from "@app/core/models/category-dto"
import type { BrandDTO, ProductListItemDTO } from "@app/core/models/product.model"
import { AccessControlService } from "@app/core/services/AccessControl.service"
import { BrandService } from "@app/core/services/brand.service"
import { CategoryService } from "@app/core/services/category.service"
import { ProductService } from "@app/core/services/product.service"
import { Table } from "primeng/table"
import { PdfExportService } from '@app/core/services/pdf-export.service';
import { ExcelExportService } from '@app/core/services/excel-export.service';
import { OrderDetail } from "@app/core/models/order.dto"
import { OrderService } from "@app/core/services/order.service"

interface ExtendedProductListItemDTO extends ProductListItemDTO {
  status: string
}

@Component({
  selector: "app-premium-products",
  standalone: false,
  templateUrl: "./product-list.component.html",
  styleUrls: ["./product-list.component.css"],
})
export class ProductListComponent implements OnInit {

  @ViewChild("dt") dt!: Table

  // Data arrays
  products: ExtendedProductListItemDTO[] = []
  filteredProducts: ExtendedProductListItemDTO[] = []
  paginatedProducts: ExtendedProductListItemDTO[] = []
  categories: CategoryDTO[] = []
  brands: BrandDTO[] = []

  // Pagination properties (line 20 အရင်မှာ ထည့်ပါ)
  currentPage = 1
  itemsPerPage = 10
  totalItems = 0
  totalPages = 0
  itemsPerPageOptions = [10, 20, 50, 100]

  // Filter parameters
  filterParams = {
    search: "",
    brand: "",
    category: "",
    status: "",
    priceMin: null as number | null,
    priceMax: null as number | null,
  }

  // Sorting
  sortField = ""
  sortDirection: "asc" | "desc" = "asc"

  // Math object for template
  Math = Math
  // Filter states
  priceRange: number[] = [0, 1000]
  maxPrice = 1000
  minPrice = 0

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
  errorMessage = ""

  orders: OrderDetail[] = [] // Add orders array
  productOrderCounts: Map<number, number> = new Map() // Product ID -> Order Count
  variantOrderCounts: Map<number, number> = new Map() // Variant ID -> Order Count

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private accessControl: AccessControlService,
    private orderService: OrderService,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadInitialData()
  }


  private loadInitialData() {
    this.isLoading = true
    this.errorMessage = ""

    Promise.all([this.loadProducts(), this.loadCategories(), this.loadBrands(), this.loadOrders()])
      .then(() => {
        this.calculateOrderCounts()
        this.applyFilters() // ဒါကို ထည့်ပါ
      })
      .catch((error) => {
        this.errorMessage = "Failed to load data. Please try again."
        console.error("Error loading initial data:", error)
      })
      .finally(() => {
        this.isLoading = false
      })
  }

  loadProducts(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.productService.getProductList().subscribe({
        next: (products) => {
          console.log("product list : ", products)
          this.products = products.map(
            (product) =>
              ({
                ...product,
                status: this.getStockStatus(product),
              }) as ExtendedProductListItemDTO,
          )

          if (products.length > 0) {
            const prices = products.map((p) => p.product.basePrice)
            this.minPrice = Math.min(...prices)
            this.maxPrice = Math.max(...prices)
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

  loadCategories(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.categoryService.getAllCategories().subscribe({
        next: (categories: CategoryDTO[]) => {
          this.categories = categories
          resolve()
        },
        error: (error) => {
          console.error("Error loading categories:", error)
          reject(error)
        },
      })
    })
  }

  loadBrands(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.brandService.getAllBrands().subscribe({
        next: (brands: BrandDTO[]) => {
          this.brands = brands
          resolve()
        },
        error: (error) => {
          console.error("Error loading brands:", error)
          reject(error)
        },
      })
    })
  }

  loadOrders(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.orderService.getAllOrders().subscribe({
        next: (orders: OrderDetail[]) => {
          this.orders = orders
          resolve()
        },
        error: (error) => {
          console.error("Error loading orders:", error)
          reject(error)
        },
      })
    })
  }

  calculateOrderCounts(): void {
    // Reset counts
    this.productOrderCounts.clear()
    this.variantOrderCounts.clear()

    // Calculate product order counts
    this.orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.id
        const variantId = item.variant.id

        // Count product orders
        this.productOrderCounts.set(productId, (this.productOrderCounts.get(productId) || 0) + 1)

        // Count variant orders
        this.variantOrderCounts.set(variantId, (this.variantOrderCounts.get(variantId) || 0) + 1)
      })
    })
  }

  // Filter methods
  onItemsPerPageChange() {
    this.currentPage = 1
    this.applyFilters()
  }

  onReset() {
    this.filterParams = {
      search: "",
      brand: "",
      category: "",
      status: "",
      priceMin: null,
      priceMax: null,
    }
    this.currentPage = 1
    this.sortField = ""
    this.sortDirection = "asc"
    this.applyFilters()
  }

  // Sorting methods
  sort(field: string) {
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
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePagination()
    }
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePagination()
    }
  }

  goToNextPage() {
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

  getItemsPerPageOptions(): number[] {
    return this.itemsPerPageOptions
  }

  // Track by function
  trackByProductId(index: number, product: ExtendedProductListItemDTO): any {
    return product.id
  }

  // Status methods
  getStatusDisplayText(status: string): string {
    switch (status) {
      case "ACTIVE":
      case "In Stock":
        return "In Stock"
      case "LOW_STOCK":
      case "Low Stock":
        return "Low Stock"
      case "OUT_OF_STOCK":
      case "Out of Stock":
        return "Out of Stock"
      case "INACTIVE":
        return "Inactive"
      default:
        return status
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case "ACTIVE":
      case "In Stock":
        return "badge bg-success"
      case "LOW_STOCK":
      case "Low Stock":
        return "badge bg-warning"
      case "OUT_OF_STOCK":
      case "Out of Stock":
        return "badge bg-danger"
      case "INACTIVE":
        return "badge bg-secondary"
      default:
        return "badge bg-secondary"
    }
  }

  // Product methods
  getProductImage(product: ProductListItemDTO): string {
    const mainImage = product.product.productImages?.find((img) => img.mainImageStatus)
    return mainImage?.imgPath || "/assets/img/default-product.jfif"
  }

  addProduct(): void {
    this.router.navigate(["/admin/productCreate"])
  }

  duplicateProduct(productId: string): void {
    console.log("Duplicate product:", productId)
    // Implement duplicate logic here
  }

  // Core filtering and pagination logic
  applyFilters() {
    let filtered = [...this.products]

    // Search filter
    if (this.filterParams.search.trim()) {
      const searchTerm = this.filterParams.search.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.product.name.toLowerCase().includes(searchTerm) ||
          (product.brand?.name && product.brand.name.toLowerCase().includes(searchTerm)) ||
          (product.category?.name && product.category.name.toLowerCase().includes(searchTerm)) ||
          product.status.toLowerCase().includes(searchTerm),
      )
    }

    // Brand filter
    if (this.filterParams.brand) {
      filtered = filtered.filter((product) => product.brand?.id?.toString() === this.filterParams.brand)
    }

    // Category filter
    if (this.filterParams.category) {
      filtered = filtered.filter((product) => product.category?.id?.toString() === this.filterParams.category)
    }

    // Status filter
    if (this.filterParams.status) {
      filtered = filtered.filter((product) => product.status === this.filterParams.status)
    }

    // Price range filter
    if (this.filterParams.priceMin !== null) {
      filtered = filtered.filter((product) => product.product.basePrice >= this.filterParams.priceMin!)
    }
    if (this.filterParams.priceMax !== null) {
      filtered = filtered.filter((product) => product.product.basePrice <= this.filterParams.priceMax!)
    }

    this.filteredProducts = filtered
    this.totalItems = filtered.length
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)

    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1
    }

    this.applySorting()
    this.updatePagination()
  }

  applySorting() {
    if (!this.sortField) return

    this.filteredProducts.sort((a, b) => {
      let valueA: any
      let valueB: any

      switch (this.sortField) {
        case "name":
          valueA = a.product.name
          valueB = b.product.name
          break
        case "brand":
          valueA = a.brand?.name || ""
          valueB = b.brand?.name || ""
          break
        case "price":
          valueA = a.product.basePrice
          valueB = b.product.basePrice
          break
        case "status":
          valueA = a.status
          valueB = b.status
          break
        case "createdAt":
          valueA = a.product.createdDate ? new Date(a.product.createdDate) : new Date(0)
          valueB = b.product.createdDate ? new Date(b.product.createdDate) : new Date(0)
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

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex)
  }

  /**
   * Handle search input change
   */
  onSearchChange() {
    this.currentPage = 1
    this.applyFilters()
  }

  /**
   * Handle brand filter change
   */
  onBrandChange() {
    this.currentPage = 1
    this.applyFilters()
  }

  /**
   * Handle category filter change
   */
  onCategoryChange() {
    this.currentPage = 1
    this.applyFilters()
  }

  /**
   * Handle status filter change
   */
  onStatusChange() {
    this.currentPage = 1
    this.applyFilters()
  }


  onPriceChange() {
    this.currentPage = 1
    this.applyFilters()
  }


  toggleFilters() {
    this.showFilters = !this.showFilters
    if (!this.showFilters) {
      this.clearAllFilters()
    }
  }
  exportSingleProductToPdf(product: any): void {
    // PDF export logic goes here
    console.log("Exporting to PDF:", product);
  }

  exportSingleProductToExcel(product: any): void {
    // Excel export logic goes here
    console.log("Exporting to Excel:", product);
  }

  onImageError(event: any): void {
    event.target.src = "assets/img/default-product.jpg";
  }


  clearAllFilters() {
    this.dt.clear()
    this.selectedCategory = null
    this.selectedBrand = null
    this.selectedStatus = null
    this.globalFilterValue = ""
    this.priceRange = [this.minPrice, this.maxPrice]
  }

  getStockStatus(product: ProductListItemDTO): string {
    const totalStock = this.getTotalStock(product)
    if (totalStock === 0) return "OUT_OF_STOCK"
    if (totalStock <= 10) return "LOW_STOCK"
    return "ACTIVE"
  }


  getTotalStock(product: ProductListItemDTO): number {
    return product.variants.reduce((total, variant) => total + variant.stock, 0)
  }


  getStatusIcon(status: string): string {
    switch (status) {
      case "ACTIVE":
        return "fa-check-circle"
      case "LOW_STOCK":
        return "fa-exclamation-triangle"
      case "OUT_OF_STOCK":
        return "fa-times-circle"
      case "INACTIVE":
        return "fa-pause-circle"
      default:
        return "fa-question-circle"
    }
  }

  viewProduct(productId: string): void {
    this.router.navigate(["/admin/product", productId])
  }


  editProduct(productId: string): void {
    this.router.navigate(["/admin/product/edit", productId])
  }


  deleteProduct(productId: string): void {
    const product = this.products.find((p) => p.id?.toString() === productId)
    if (product && confirm(`Are you sure you want to delete "${product.product.name}"?`)) {
      console.log("Delete product:", productId)
      // Implement delete logic here
      // this.productService.deleteProduct(productId).subscribe(...)
    }
  }

  bulkUpload(): void {
    this.router.navigate(["/admin/bulkUploadProduct"])
  }


  get canCreateProduct(): boolean {
    return this.accessControl.hasAny("PRODUCT_CREATE", "SUPERADMIN_PERMISSION")
  }


  get canBulkUploadProducts(): boolean {
    return this.accessControl.hasAny("PRODUCT_CREATE", "SUPERADMIN_PERMISSION")
  }

  refreshData(): void {
    this.loadInitialData()
  }


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
    // Check if any filters are applied
    const hasFilters = this.filterParams.search.trim() ||
      this.filterParams.brand ||
      this.filterParams.category ||
      this.filterParams.status ||
      this.filterParams.priceMin !== null ||
      this.filterParams.priceMax !== null;

    // If filters are applied, use filteredProducts; otherwise, use all products
    if (hasFilters) {
      return this.filteredProducts;
    } else {
      return this.products;
    }
  }

    // 🔍 Computed property for export data count (for template use)
  // get exportDataCount(): number {
  //   return this.getExportData().length;
  // }

  // // 🔍 Computed property to check if data is filtered
  // get isDataFiltered(): boolean {
  //   return this.getExportData().length !== this.products.length;
  // }


  // getExportData(): ProductListItemDTO[] {
  //   // If filters are applied, use filteredValue; otherwise, use all products
  //   return this.dt && this.dt.filteredValue ? this.dt.filteredValue : this.products;
  // }

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

  exportTableToPdf() {
    this.exportProfessionalPdf();
  }

  async exportTableToExcel() {
    await this.exportToExcel();
  }

   // 🔍 Helper method to get complete data with all required fields
  getCompleteExportData(): any[] {
    const exportData = this.getExportData();



    
    return exportData.map(product => ({
      id: product.id,
      product: {
        id: product.product.id || product.id,
        name: product.product.name,
        basePrice: product.product.basePrice || 0,
        createdDate: product.product.createdDate || '',
        productImages: product.product.productImages || [],
        discountPrice: product.product.discountPrice,
        originalPrice: product.product.originalPrice,
        orderCount: this.productOrderCounts.get(product.product.id || product.id || 0) || 0
      },
      brand: {
        id: product.brand?.id || '',
        name: product.brand?.name || 'N/A'
      },
      category: {
        id: product.category?.id || '',
        name: product.category?.name || 'N/A'
      },
      variants: (product.variants || []).map(variant => ({
        id: variant.id,
        sku: variant.sku || 'N/A',
        price: variant.price || 0,
        stock: variant.stock || 0,
        imgPath: variant.imgPath || 'N/A',
        orderCount: this.variantOrderCounts.get(variant.id || 0) || 0,
        options: (variant.options || []).map(option => ({
          optionId: option.optionId,
          optionValueId: option.optionValueId,
          optionName: option.optionName || 'N/A',
          valueName: option.valueName || 'N/A'
        })),
        priceHistory: variant.priceHistory || []
      })),
      options: product.options || [],
      status: this.getStockStatus(product)
    }));
  }

  // 🎨 Product Catalog Report PDF Export (Dark Theme Design)
  async exportProductCatalogPdf() {
    this.isExportingLayoutPdf = true;
    try {
      const exportData = this.getCompleteExportData();
      const isFiltered = exportData.length !== this.products.length;
      const filename = isFiltered 
        ? `ProductCatalog_Filtered_${exportData.length}_Products.pdf` 
        : 'ProductCatalog_All_Products.pdf';

      // Get current filters
      const filters: any = {};
      if (this.filterParams.brand) {
        const brand = this.brands.find(b => b.id?.toString() === this.filterParams.brand);
        if (brand) filters['Brand'] = brand.name;
      }
      if (this.filterParams.category) {
        const category = this.categories.find(c => c.id?.toString() === this.filterParams.category);
        if (category) filters['Category'] = category.name;
      }
      if (this.filterParams.status) {
        filters['Status'] = this.filterParams.status;
      }
      if (this.filterParams.search.trim()) {
        filters['Search'] = this.filterParams.search;
      }
      if (this.filterParams.priceMin !== null) {
        filters['Min Price'] = `${this.filterParams.priceMin} MMK`;
      }
      if (this.filterParams.priceMax !== null) {
        filters['Max Price'] = `${this.filterParams.priceMax} MMK`;
      }

      await this.pdfExportService.exportProductCatalogReport(
        exportData,
        filename,
        {
          includeVariants: true,
          includeImages: false,
          filters: filters,
          generatedBy: 'Admin User'
        }
      );
    } catch (error: any) {
      console.error('Error exporting product catalog PDF:', error);
      alert('Error exporting product catalog PDF. Please try again.');
    } finally {
      this.isExportingLayoutPdf = false;
    }
  }


  // 🅱️ Product Catalog Report Excel Export (Dark Theme Design)
  async exportProductCatalogExcel() {
    this.isExportingExcel = true;
    try {
      const exportData = this.getCompleteExportData();
      const isFiltered = exportData.length !== this.products.length;
      const filename = isFiltered 
        ? `ProductCatalog_Filtered_${exportData.length}_Products.xlsx` 
        : 'ProductCatalog_All_Products.xlsx';

      // Get current filters
      const filters: any = {};
      if (this.filterParams.brand) {
        const brand = this.brands.find(b => b.id?.toString() === this.filterParams.brand);
        if (brand) filters['Brand'] = brand.name;
      }
      if (this.filterParams.category) {
        const category = this.categories.find(c => c.id?.toString() === this.filterParams.category);
        if (category) filters['Category'] = category.name;
      }
      if (this.filterParams.status) {
        filters['Status'] = this.filterParams.status;
      }
      if (this.filterParams.search.trim()) {
        filters['Search'] = this.filterParams.search;
      }
      if (this.filterParams.priceMin !== null) {
        filters['Min Price'] = `${this.filterParams.priceMin} MMK`;
      }
      if (this.filterParams.priceMax !== null) {
        filters['Max Price'] = `${this.filterParams.priceMax} MMK`;
      }

      await this.excelExportService.exportProductCatalogReport(
        exportData,

        filename,
        {
          includeVariants: true,
          includeImages: false,
          filters: filters,
          generatedBy: 'Admin User'
        }
      );
    } catch (error: any) {
      console.error('Error exporting product catalog Excel:', error);
      alert('Error exporting product catalog Excel. Please try again.');
    } finally {
      this.isExportingExcel = false;
    }
  }
  // New methods for catalog reports
  exportCatalogToPdf() {
    this.exportProductCatalogPdf();
  }

  async exportCatalogToExcel() {
    await this.exportProductCatalogExcel();
  }

}
