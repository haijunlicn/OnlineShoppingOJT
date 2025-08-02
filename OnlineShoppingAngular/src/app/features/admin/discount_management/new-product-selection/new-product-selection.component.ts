import { Component, Input, Output, EventEmitter, type OnInit, OnChanges, SimpleChanges } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router"
import { CategoryDTO } from "@app/core/models/category-dto"
import { BrandDTO, ProductDTO } from "@app/core/models/product.model"
import { DiscountService } from "@app/core/services/discount.service"
import { ProductSelectionService, Product as ServiceProduct } from "@app/core/services/product-selection.service"
import { DiscountDisplayDTO } from '@app/core/models/discount-display.model';
import Swal from 'sweetalert2';

// Configure SweetAlert globally for this component
Swal.mixin({
  customClass: {
    popup: 'swal2-simple-popup'
  },
  confirmButtonColor: '#000000',
  background: '#ffffff',
  color: '#000000'
});

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
  productDiscountInfo: { [key: number]: DiscountDisplayDTO[] } = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disocuntService: DiscountService

  ) { }

  ngOnInit() {
    console.log('🚀 Product Selection Component initialized');
    console.log('📋 Context:', this.context);
    console.log('📋 Selection Mode:', this.selectionMode);
    console.log('📋 Initial selected products:', this.selectedProducts?.length || 0);
    console.log('📋 Initial selected products array:', this.selectedProducts);
   
    this.disocuntService.getAllProducts().subscribe(products => {
      console.log('📦 Loaded products:', products.length);
      this.products = products.map(p => ({
        ...p,
        productVariants: p.productVariants ?? []
      }));
      this.applyFilters();
    });
    
    this.disocuntService.getAllCategories().subscribe(categories => {
      console.log('📂 Loaded categories:', categories.length);
      this.categories = categories;
    });
    
    this.disocuntService.getAllBrands().subscribe(brands => {
      console.log('🏷️ Loaded brands:', brands.length);
      this.brands = brands.map(b => ({ ...b, id: b.id.toString(), delFg: b.delFg }));
    });

    this.loadProductDiscountInfo();
    this.currentSelectedProducts = this.selectedProducts ? [...this.selectedProducts] : [];
    console.log('📋 Initial currentSelectedProducts:', this.currentSelectedProducts.length);
    console.log('📋 Initial currentSelectedProducts array:', this.currentSelectedProducts);
  }
  ngOnChanges(changes: SimpleChanges) {
    console.log('🔄 ngOnChanges called with changes:', changes);
    
    if (changes['selectedProducts']) {
      console.log('🔄 selectedProducts changed:', changes['selectedProducts']);
      console.log('🔄 New selectedProducts:', this.selectedProducts);
      console.log('🔄 Current currentSelectedProducts before update:', this.currentSelectedProducts);
      
      // Only update if the selectedProducts input actually changed and is not empty
      if (this.selectedProducts && this.selectedProducts.length > 0) {
        this.currentSelectedProducts = [...this.selectedProducts];
        console.log('🔄 Updated currentSelectedProducts:', this.currentSelectedProducts);
      } else {
        // Don't reset the array if selectedProducts is empty - keep current selections
        console.log('🔄 Skipping update - selectedProducts is empty, keeping current selections');
      }
    }
  }
  applyFilters() {
   this.filteredProducts = this.products.filter(product => {
      // Search filter
      const matchesSearch = !this.searchText || 
        product.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (product.category?.name && product.category.name.toLowerCase().includes(this.searchText.toLowerCase())) ||
        (product.brand?.name && product.brand.name.toLowerCase().includes(this.searchText.toLowerCase()));

      // Category filter
      const matchesCategory = !this.selectedCategory || 
        product.category?.id === this.selectedCategory;

      // Brand filter
      const matchesBrand = !this.selectedBrand || 
        product.brand?.name === this.selectedBrand;

      // Status filter
      const matchesStatus = !this.statusFilter || 
        this.getStatusLabel(product) === this.statusFilter;

      // Price filter
      const price = product.basePrice || 0;
      const matchesPrice = (!this.minPrice || price >= this.minPrice) && 
                          (!this.maxPrice || price <= this.maxPrice);

      // Date filter
      const createdDate = new Date(product.createdDate || '');
      const matchesDate = (!this.createdFromDate || createdDate >= new Date(this.createdFromDate)) && 
                         (!this.createdToDate || createdDate <= new Date(this.createdToDate));

      return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesPrice && matchesDate;
    });

  
  }

  private loadProductDiscountInfo() {
  
    
    this.disocuntService.getProductDiscountInfo().subscribe({
      next: (info) => {
       this.productDiscountInfo = info;
        
        // Log each product with its discounts
        Object.keys(info).forEach(productId => {
          const productIdNum = parseInt(productId);
          const discounts = info[productIdNum];
       
          
          // Log discount details
          discounts.forEach((discount, index) => {
          
          });
        });
        
      
      },
      error: (error) => {
      
      }
    });
  }

  hasDiscount(product: ProductDTO): boolean {
   
    const hasDiscount = !!(product.id && this.productDiscountInfo[product.id] && this.productDiscountInfo[product.id].length > 0);
    
   
    
    return hasDiscount;
  }

  getProductDiscounts(product: ProductDTO): DiscountDisplayDTO[] {
    return product.id ? (this.productDiscountInfo[product.id] || []) : [];
  }

  showDiscountDetails(product: ProductDTO): void {
    console.log('🔍 Showing discount details for product:', product.name);
    
    const discounts = this.getProductDiscounts(product);
    console.log('📋 Found discounts:', discounts);
    
    if (discounts.length === 0) {
      Swal.fire({
        title: 'No Discounts',
        text: `${product.name} has no active discounts.`,
        icon: 'info',
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#000000',
        background: '#ffffff',
        color: '#000000'
      });
      return;
    }
    
    // Create comma-separated discount names with links
    let discountNamesHtml = '';
    discounts.forEach((discount, index) => {
      const discountLink = `<a href="javascript:void(0)" onclick="window.openCustomerDiscount(${discount.id})" style="color: #000000; text-decoration: underline; font-weight: 600; cursor: pointer;">${discount.name}</a>`;
      
      if (index === 0) {
        discountNamesHtml += discountLink;
      } else {
        discountNamesHtml += `, ${discountLink}`;
      }
    });
    
    // Add global function for customer discount navigation
    (window as any).openCustomerDiscount = (discountId: number) => {
      window.open(`/customer/discount/${discountId}`, '_blank');
    };
    
    // Use setTimeout to ensure modal is fully rendered
    setTimeout(() => {
      Swal.fire({
        title: 'Discount Details',
        html: `
          <div style="text-align: left; color: #000000;">
            <h3 style="color: #000000; margin-bottom: 15px; font-size: 18px;">${product.name}</h3>
            <p style="color: #000000; margin-bottom: 20px; font-size: 14px;">This product is included in the following active discounts:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #dee2e6;">
              <p style="color: #000000; margin: 0; font-size: 14px; line-height: 1.5;">
                ${discountNamesHtml}
              </p>
            </div>
            <p style="color: #666666; font-size: 12px; margin-top: 15px; font-style: italic;">
              💡 Click on discount names to view full details
            </p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#000000',
        background: '#ffffff',
        color: '#000000',
        width: '400px',
        customClass: {
          popup: 'swal2-simple-popup'
        },
        allowOutsideClick: true,
        allowEscapeKey: true,
        backdrop: true,
        showCloseButton: false,
        didOpen: () => {
          // Force SweetAlert to be on top
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          const swalPopup = document.querySelector('.swal2-popup') as HTMLElement;
          const swalBackdrop = document.querySelector('.swal2-backdrop') as HTMLElement;
          
          if (swalContainer) swalContainer.style.zIndex = '999999';
          if (swalPopup) swalPopup.style.zIndex = '999999';
          if (swalBackdrop) swalBackdrop.style.zIndex = '999999';
        }
      });
    }, 100);
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
    console.log('🔍 toggleProductSelection called for product:', product.name);
    console.log('🔍 Product ID:', product.id);
    console.log('🔍 Current selected products before:', this.currentSelectedProducts.length);
    console.log('🔍 Current selected products array:', this.currentSelectedProducts);
    console.log('🔍 Is product already selected:', this.isProductSelected(product));
    console.log('🔍 Selection mode:', this.selectionMode);

    if (this.selectionMode === "single") {
      this.currentSelectedProducts = this.isProductSelected(product) ? [] : [product]
      console.log('🔍 Single mode - new array:', this.currentSelectedProducts);
    } else {
      const index = this.currentSelectedProducts.findIndex((p) => p.id === product.id)
      console.log('🔍 Found product at index:', index);
      
      if (index > -1) {
        // Remove product from selection
        const beforeRemove = [...this.currentSelectedProducts];
        this.currentSelectedProducts = this.currentSelectedProducts.filter((_, i) => i !== index)
        console.log('🔍 Removed product from selection');
        console.log('🔍 Before remove:', beforeRemove);
        console.log('🔍 After remove:', this.currentSelectedProducts);
      } else {
        // Add product to selection
        const beforeAdd = [...this.currentSelectedProducts];
        this.currentSelectedProducts = [...this.currentSelectedProducts, product]
        console.log('🔍 Added product to selection');
        console.log('🔍 Before add:', beforeAdd);
        console.log('🔍 After add:', this.currentSelectedProducts);
      }
    }

    console.log('🔍 Current selected products after:', this.currentSelectedProducts.length);
    console.log('🔍 Selected products:', this.currentSelectedProducts.map(p => p.name));
    
    // Force change detection
    this.currentSelectedProducts = [...this.currentSelectedProducts];
    console.log('🔍 Final array after force update:', this.currentSelectedProducts);
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
