import { Component, Input, Output, EventEmitter, type OnInit, OnChanges, SimpleChanges } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { CategoryDTO } from "@app/core/models/category-dto"
import { BrandDTO, ProductDTO } from "@app/core/models/product.model"
import { DiscountService } from "@app/core/services/discount.service"
import { ProductSelectionService, Product as ServiceProduct } from "@app/core/services/product-selection.service"

export interface Rule {
  id: string
  type: string
  field: string
  operator: string
  values: string[]
}

export interface ValidationError {
  ruleId: string
  valueIndex: number
  message: string
}

export interface Group {
  name: string
}

export interface Category {
  id: number
  name: string
}

export interface Brand {
  id: number
  name: string
}

export interface City {
  name: string
  region: string
}

export interface Product {
  id: number
  name: string
  sku: string
  category: string
  brand: string
  price: number
  stock: number
  status: string
  image: string
  createdDate: string
  // Additional properties for create-discount component compatibility
  description?: string
  basePrice?: number
}

@Component({
  selector: "app-new-product-selection",
  standalone: false,
  templateUrl: "./new-product-selection.component.html",
  styleUrls: ["./new-product-selection.component.css"],
})
export class NewProductSelectionComponent implements OnInit, OnChanges {
  @Input() context = ""
  @Input() selectionMode: "single" | "multiple" = "multiple"
  @Output() onBack = new EventEmitter<void>()
  @Output() onProductsSelected = new EventEmitter<ProductDTO[]>()
  @Input() selectedProducts: ProductDTO[] = []

  // Service state
  private selectionState: any = null

  // Filter states
  searchText = ""
  selectedCategory: number | null = null;
  selectedBrand: string = '';
  statusFilter = ""
  minPrice: number | null = null
  maxPrice: number | null = null
  createdFromDate: string | null = null
  createdToDate: string | null = null
  quickDateFilter = ""

  // Dropdown states
  categoryFilterOpen = false
  brandFilterOpen = false

  // Selection state
  filteredProducts: ProductDTO[] = []
  currentSelectedProducts: ProductDTO[] = []


  products: ProductDTO[] = [];
  categories: CategoryDTO[] = [];
  brands: BrandDTO[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disocuntService: DiscountService

  ) { }

  ngOnInit() {
    this.disocuntService.getAllProducts().subscribe(products => {
      // this.products = products;
      this.products = products.map(p => ({
        ...p,
        productVariants: p.productVariants ?? []
      }));
      this.applyFilters();
    });
    this.disocuntService.getAllCategories().subscribe(categories => {
      this.categories = categories;
    });

    this.disocuntService.getAllBrands().subscribe(brands => {
      this.brands = brands.map(b => ({ ...b, id: b.id.toString() }));
    });

    this.currentSelectedProducts = this.selectedProducts ? [...this.selectedProducts] : [];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedProducts'] && !changes['selectedProducts'].firstChange) {

    }
    if (changes['selectionMode']) {

    }
  }
  applyFilters() {
    this.filteredProducts = this.products.filter((product) => {
      // Search filter
      if (this.searchText) {
        const searchLower = this.searchText.toLowerCase()
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          (product.category?.name?.toLowerCase().includes(searchLower) ?? false) ||
          (product.brand?.name?.toLowerCase().includes(searchLower) ?? false)
        if (!matchesSearch) return false
      }

      // Category filter
      if (this.selectedCategory !== null) {
        const selectedCat = this.categories.find(cat => cat.id === this.selectedCategory);
        if (selectedCat && selectedCat.id !== undefined) {
          if (product.category?.id === undefined || product.category.id !== selectedCat.id) return false;
        }
      }

      // Brand filter
      if (this.selectedBrand) {
        if (product.brand?.name !== this.selectedBrand) return false;
      }

      // Status filter
      if (this.statusFilter && this.statusFilter !== "all") {
        const stock = this.getProductStock(product);
        const status = stock === 0 ? 'Out of Stock' : 'Active';
        if (status !== this.statusFilter) return false;
      }

      // Price range filter
      if (this.minPrice !== null && (product.basePrice ?? 0) < this.minPrice) return false
      if (this.maxPrice !== null && (product.basePrice ?? 0) > this.maxPrice) return false

      // Date filtering
      if (this.createdFromDate || this.createdToDate) {
        if (!product.createdDate) return false;
        const productDate = new Date(product.createdDate);
        if (this.createdFromDate) {
          const fromDate = new Date(this.createdFromDate)
          if (productDate < fromDate) return false
        }
        if (this.createdToDate) {
          const toDate = new Date(this.createdToDate)
          toDate.setHours(23, 59, 59, 999)
          if (productDate > toDate) return false
        }
      }

      return true
    });
  }

  getProductStock(product: ProductDTO): number {
    return product.productVariants ? product.productVariants.length : 0;
  }

  getStatusLabel(product: ProductDTO): string {
    const stock = this.getProductStock(product);
    return stock === 0 ? 'Out of Stock' : 'Active';
  }
  getStatusClass(product: ProductDTO): string {
    const stock = this.getProductStock(product);
    return stock === 0 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  }
  getProductImage(product: ProductDTO): string {
    const mainImg = product.productImages?.find(img => img.mainImageStatus);
    return mainImg?.imgPath || '/placeholder.svg';
  }
  getProductPriceMMK(product: ProductDTO): string {
    return product.basePrice ? product.basePrice.toLocaleString('en-US') + ' MMK' : '';
  }
  getProductCreateDate(product: ProductDTO): string {
    if (!product.createdDate) return '';
    const date = new Date(product.createdDate);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
  }


  onSearchChange() {
    this.applyFilters()
  }

  onStatusFilterChange() {
    this.applyFilters()
  }

  onPriceChange() {
    this.applyFilters()
  }

  onDateChange() {
    this.applyFilters()
  }

  selectCategory(id: number | null) {
    this.selectedCategory = id;
    this.categoryFilterOpen = false;
    this.applyFilters();
  }

  selectBrand(name: string) {
    this.selectedBrand = name;
    this.brandFilterOpen = false;
    this.applyFilters();
  }

  clearAllFilters() {
    this.searchText = ""
    this.selectedCategory = null;
    this.selectedBrand = '';
    this.statusFilter = ""
    this.minPrice = null
    this.maxPrice = null
    this.createdFromDate = null
    this.createdToDate = null
    this.quickDateFilter = ""
    this.applyFilters()
  }

  handleQuickDateFilterChange() {
    const today = new Date()
    switch (this.quickDateFilter) {
      case "last_7_days":
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        this.createdFromDate = sevenDaysAgo.toISOString().split("T")[0]
        this.createdToDate = today.toISOString().split("T")[0]
        break
      case "last_30_days":
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        this.createdFromDate = thirtyDaysAgo.toISOString().split("T")[0]
        this.createdToDate = today.toISOString().split("T")[0]
        break
      case "last_90_days":
        const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        this.createdFromDate = ninetyDaysAgo.toISOString().split("T")[0]
        this.createdToDate = today.toISOString().split("T")[0]
        break
      default:
        this.createdFromDate = null
        this.createdToDate = null
    }
    this.applyFilters()
  }

  isProductSelected(product: ProductDTO): boolean {
    return this.currentSelectedProducts.some((p) => p.id === product.id)
  }

  toggleProductSelection(product: ProductDTO) {

    if (this.selectionMode === "single") {
      this.currentSelectedProducts = this.isProductSelected(product) ? [] : [product]
    } else {
      const index = this.currentSelectedProducts.findIndex((p) => p.id === product.id)
      if (index > -1) {
        // Create a new array to trigger change detection
        this.currentSelectedProducts = this.currentSelectedProducts.filter((_, i) => i !== index)
      } else {
        // Create a new array to trigger change detection
        this.currentSelectedProducts = [...this.currentSelectedProducts, product]
      }
    }

  }

  selectAllVisible() {
    if (this.selectionMode === "multiple") {
      const newSelections = this.filteredProducts.filter((product) => !this.isProductSelected(product))
      this.currentSelectedProducts = [...this.currentSelectedProducts, ...newSelections]
    }
  }

  clearSelection() {
    this.currentSelectedProducts = []

  }

  isAllVisibleSelected(): boolean {
    return this.filteredProducts.length > 0 && this.filteredProducts.every((product) => this.isProductSelected(product))
  }

  isSomeVisibleSelected(): boolean {
    return this.filteredProducts.some((product) => this.isProductSelected(product)) && !this.isAllVisibleSelected()
  }


  confirmSelection() {
    this.onProductsSelected.emit([...this.currentSelectedProducts]);

  }
  handleBack() {
    this.onBack.emit();
  }

  getStockClass(stock: number): string {
    if (stock === 0) return "text-red-600 bg-red-100"
    if (stock < 10) return "text-yellow-600 bg-yellow-100"
    return "text-green-600 bg-green-100"
  }



  toggleAllVisibleSelection() {
    if (this.isAllVisibleSelected()) {
      // Remove all visible products from selection
      this.currentSelectedProducts = this.currentSelectedProducts.filter(
        (selected) => !this.filteredProducts.some((visible) => visible.id === selected.id),
      )
    } else {
      // Add all visible products to selection
      this.selectAllVisible()
    }
  }

  isCategorySelected(categoryId: number | null): boolean {
    return this.selectedCategory === categoryId;
  }

  isBrandSelected(brandName: string): boolean {
    return this.selectedBrand === brandName;
  }

  areAllCategoriesSelected(): boolean {
    return this.selectedCategory === null;
  }

  areAllBrandsSelected(): boolean {
    return !this.selectedBrand;
  }

  selectAllCategories() {
    this.selectedCategory = null;
    this.applyFilters()
  }

  selectAllBrands() {
    this.selectedBrand = '';
    this.applyFilters()
  }

  // Optional: Helper to get selected category name for dropdown display
  getSelectedCategoryName(): string {
    if (this.selectedCategory === null) return 'All Categories';
    const cat = this.categories.find(c => c.id === this.selectedCategory);
    return cat && cat.name ? cat.name : 'All Categories';
  }

  Math = Math

}
