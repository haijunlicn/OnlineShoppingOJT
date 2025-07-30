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
  delFg?: number
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
  selector: "app-product-selection",
  standalone: false,
  templateUrl: "./product-selection.component.html",
  styleUrls: ["./product-selection.component.css"],
})
export class ProductSelectionComponent implements OnInit, OnChanges {
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
 

  // Sample data
  // categories: Category[] = [
  //   { id: 1, name: "Electronics" },
  //   { id: 2, name: "Clothing & Fashion" },
  //   { id: 3, name: "Books & Media" },
  //   { id: 4, name: "Sports & Outdoors" },
  //   { id: 5, name: "Home & Garden" },
  //   { id: 6, name: "Beauty & Personal Care" },
  //   { id: 7, name: "Toys & Games" },
  //   { id: 8, name: "Automotive" },
  //   { id: 9, name: "Health & Wellness" },
  //   { id: 10, name: "Food & Beverages" },
  //   { id: 11, name: "Office Supplies" },
  //   { id: 12, name: "Pet Supplies" },
  //   { id: 13, name: "Travel & Luggage" },
  //   { id: 14, name: "Musical Instruments" },
  //   { id: 15, name: "Jewelry & Accessories" },
  // ]

  // brands: Brand[] = [
  //   { id: 1, name: "Apple" },
  //   { id: 2, name: "Samsung" },
  //   { id: 3, name: "Nike" },
  //   { id: 4, name: "Adidas" },
  //   { id: 5, name: "Sony" },
  //   { id: 6, name: "LG" },
  //   { id: 7, name: "Canon" },
  //   { id: 8, name: "Dell" },
  //   { id: 9, name: "HP" },
  //   { id: 10, name: "Lenovo" },
  //   { id: 11, name: "Microsoft" },
  //   { id: 12, name: "Google" },
  //   { id: 13, name: "Amazon" },
  //   { id: 14, name: "Xiaomi" },
  //   { id: 15, name: "Huawei" },
  //   { id: 16, name: "Asus" },
  //   { id: 17, name: "Acer" },
  //   { id: 18, name: "Panasonic" },
  //   { id: 19, name: "Philips" },
  //   { id: 20, name: "Bosch" },
  // ]

  // products: Product[] = [
  //   {
  //     id: 1,
  //     name: "iPhone 15 Pro",
  //     sku: "IPH15PRO001",
  //     category: "Electronics",
  //     brand: "Apple",
  //     price: 999.99,
  //     stock: 25,
  //     status: "active",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-01-20",
  //   },
  //   {
  //     id: 2,
  //     name: "Samsung Galaxy S24",
  //     sku: "SGS24001",
  //     category: "Electronics",
  //     brand: "Samsung",
  //     price: 899.99,
  //     stock: 30,
  //     status: "active",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-01-25",
  //   },
  //   {
  //     id: 3,
  //     name: "Nike Air Max 270",
  //     sku: "NAM270001",
  //     category: "Sports & Outdoors",
  //     brand: "Nike",
  //     price: 150.0,
  //     stock: 0,
  //     status: "out_of_stock",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-02-01",
  //   },
  //   {
  //     id: 4,
  //     name: "Adidas Ultraboost 22",
  //     sku: "AUB22001",
  //     category: "Sports & Outdoors",
  //     brand: "Adidas",
  //     price: 180.0,
  //     stock: 15,
  //     status: "active",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-02-10",
  //   },
  //   {
  //     id: 5,
  //     name: "Sony WH-1000XM5",
  //     sku: "SWH1000XM5",
  //     category: "Electronics",
  //     brand: "Sony",
  //     price: 399.99,
  //     stock: 12,
  //     status: "active",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-02-15",
  //   },
  //   {
  //     id: 6,
  //     name: 'LG OLED C3 55"',
  //     sku: "LGOLED55C3",
  //     category: "Electronics",
  //     brand: "LG",
  //     price: 1499.99,
  //     stock: 8,
  //     status: "active",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-02-20",
  //   },
  //   {
  //     id: 7,
  //     name: "Canon EOS R6 Mark II",
  //     sku: "CEOSR6M2",
  //     category: "Electronics",
  //     brand: "Canon",
  //     price: 2499.99,
  //     stock: 5,
  //     status: "active",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-02-28",
  //   },
  //   {
  //     id: 8,
  //     name: "Dell XPS 13",
  //     sku: "DXPS13001",
  //     category: "Electronics",
  //     brand: "Dell",
  //     price: 1299.99,
  //     stock: 20,
  //     status: "active",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-03-05",
  //   },
  //   {
  //     id: 9,
  //     name: "HP Spectre x360",
  //     sku: "HPSX360001",
  //     category: "Electronics",
  //     brand: "HP",
  //     price: 1199.99,
  //     stock: 0,
  //     status: "inactive",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-03-10",
  //   },
  //   {
  //     id: 10,
  //     name: "Lenovo ThinkPad X1",
  //     sku: "LTPX1001",
  //     category: "Electronics",
  //     brand: "Lenovo",
  //     price: 1599.99,
  //     stock: 18,
  //     status: "active",
  //     image: "/placeholder.svg?height=40&width=40",
  //     createdDate: "2024-03-15",
  //   },
  // ]

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disocuntService:DiscountService
    
  ) {}

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
      this.brands = brands.map(b => ({ ...b, id: b.id.toString(), delFg: b.delFg }));
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
          const childIds = [selectedCat.id, ...this.getChildCategoryIds(selectedCat.id)];
          if (product.category?.id === undefined || !childIds.includes(product.category.id)) return false;
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

  // Helper to get all child category ids recursively
  getChildCategoryIds(parentId: number): number[] {
    const children = this.categories.filter(cat => cat.parentCategoryId === parentId);
    let ids = children.map(cat => cat.id).filter((id): id is number => id !== undefined);
    for (const child of children) {
      if (child.id !== undefined) {
        ids = ids.concat(this.getChildCategoryIds(child.id));
      }
    }
    return ids;
  }

  // Optional: Helper to get selected category name for dropdown display
  getSelectedCategoryName(): string {
    if (this.selectedCategory === null) return 'All Categories';
    const cat = this.categories.find(c => c.id === this.selectedCategory);
    return cat && cat.name ? cat.name : 'All Categories';
  }
}
