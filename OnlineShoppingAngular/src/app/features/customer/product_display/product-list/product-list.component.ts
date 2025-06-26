import { Component, ViewChild } from '@angular/core';
import { BrandDTO, ProductCardItem, ProductDTO, ProductListItemDTO } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { MatDialog } from '@angular/material/dialog';
import { WishlistService } from '../../../../core/services/wishlist.service';
import Swal from 'sweetalert2';
import { WishlistDialogComponent } from '../../general/wishlist-dialog/wishlist-dialog.component';
import { CategoryService } from '@app/core/services/category.service';
import { CategoryDTO } from '@app/core/models/category-dto';
import { TreeNode } from 'primeng/api';
import { BrandService } from '@app/core/services/brand.service';
import { FilterSidebarComponent, FilterState } from '../../common/filter-sidebar/filter-sidebar.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent {

  @ViewChild(FilterSidebarComponent) filterSidebar!: FilterSidebarComponent;

  // Data
  products: ProductCardItem[] = []
  filteredProducts: ProductCardItem[] = []
  categories: CategoryDTO[] = []
  brands: BrandDTO[] = []
  wishList = new Set<number>()

  // Filter state
  currentFilters: FilterState = {
    categories: [],
    brands: [],
    priceRange: { min: null, max: null },
    inStock: false,
    onSale: false,
    isNew: false,
    rating: null,
  }

  // UI state
  showFilters = true
  currentSort = "featured"
  currentSortLabel = "Featured"

  // Pagination
  currentPage = 1
  itemsPerPage = 20
  totalPages = 1

  // Loading states
  loadingCategories = false
  loadingBrands = false
  loadingProducts = false

  constructor(
    private productService: ProductService,
    private wishlistService: WishlistService,
    private dialog: MatDialog,
    private cartService: CartService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private router: Router,
    private authService: AuthService // inject AuthService
  ) { }

  ngOnInit() {
    this.loadCategories()
    this.loadBrands()
    this.loadWishlist()
    this.loadProducts()

    // Check screen size for initial sidebar state
    this.checkScreenSize()
    window.addEventListener("resize", () => this.checkScreenSize())
  }

  private checkScreenSize() {
    if (window.innerWidth < 768) {
      this.showFilters = false
    }
  }

  // Data loading methods
  loadProducts() {
    this.loadingProducts = true
    this.productService.getProductList().subscribe({
      next: (products) => {
        this.products = products.map((product) => ({
          ...product,
          status: this.getStockStatus(product),
        }))
        this.applyFiltersAndSort()
        this.loadingProducts = false
      },
      error: (err) => {
        console.error("Failed to load products", err)
        this.loadingProducts = false
      },
    })
  }

  loadCategories() {
    this.loadingCategories = true
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories
        this.loadingCategories = false
        console.log("Categories loaded:", this.categories)
      },
      error: (err) => {
        console.error("Failed to load categories", err)
        this.loadingCategories = false
      },
    })
  }

  loadBrands() {
    this.loadingBrands = true
    this.brandService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands = brands
        this.loadingBrands = false
        console.log("Brands loaded:", this.brands)
      },
      error: (err) => {
        console.error("Failed to load brands", err)
        this.loadingBrands = false
      },
    })
  }

  // Filter methods
  onFiltersChanged(filters: FilterState) {
    this.currentFilters = filters
    this.currentPage = 1 // Reset to first page
    this.applyFiltersAndSort()
  }

  private applyFiltersAndSort() {
    let filtered = [...this.products]

    // Apply category filter
    if (this.currentFilters.categories.length > 0) {
      const categoryIds = this.getAllDescendantCategoryIds(this.currentFilters.categories)
      filtered = filtered.filter((product) => categoryIds.includes(product.category.id!))
    }

    // Apply brand filter
    if (this.currentFilters.brands.length > 0) {
      filtered = filtered.filter((product) => this.currentFilters.brands.includes(product.brand.id))
    }

    // Apply price filter
    if (this.currentFilters.priceRange.min !== null || this.currentFilters.priceRange.max !== null) {
      filtered = filtered.filter((product) => {
        const price = this.getLowestPrice(product)
        const min = this.currentFilters.priceRange.min || 0
        const max = this.currentFilters.priceRange.max || Number.POSITIVE_INFINITY
        return price >= min && price <= max
      })
    }

    // Apply availability filters
    if (this.currentFilters.inStock) {
      filtered = filtered.filter((product) => this.hasStock(product))
    }

    if (this.currentFilters.onSale) {
      filtered = filtered.filter((product) => this.isOnSale(product))
    }

    if (this.currentFilters.isNew) {
      filtered = filtered.filter((product) => this.isNew(product))
    }

    // Apply sorting
    this.applySorting(filtered)

    this.filteredProducts = filtered
    this.updatePagination()
  }

  private getAllDescendantCategoryIds(categoryIds: number[]): number[] {
    const allIds = [...categoryIds]

    categoryIds.forEach((id) => {
      const descendants = this.getDescendantCategories(id)
      allIds.push(...descendants.map((cat) => cat.id!))
    })

    return [...new Set(allIds)] // Remove duplicates
  }

  private getDescendantCategories(parentId: number): CategoryDTO[] {
    const children = this.categories.filter((cat) => cat.parentCategoryId === parentId)
    const descendants = [...children]

    children.forEach((child) => {
      descendants.push(...this.getDescendantCategories(child.id!))
    })

    return descendants
  }

  private applySorting(products: ProductCardItem[]) {
    switch (this.currentSort) {
      case "price-asc":
        products.sort((a, b) => this.getLowestPrice(a) - this.getLowestPrice(b))
        break
      case "price-desc":
        products.sort((a, b) => this.getLowestPrice(b) - this.getLowestPrice(a))
        break
      case "name-asc":
        products.sort((a, b) => a.product.name.localeCompare(b.product.name))
        break
      case "newest":
        products.sort((a, b) => {
          const dateA = new Date(a.product.createdDate || 0)
          const dateB = new Date(b.product.createdDate || 0)
          return dateB.getTime() - dateA.getTime()
        })
        break
      case "rating":
        // Implement rating sort if you have rating data
        break
      default: // featured
        // Keep original order or implement featured logic
        break
    }
  }

  // UI interaction methods
  toggleFilters() {
    this.showFilters = !this.showFilters
  }

  toggleMobileFilters() {
    this.showFilters = !this.showFilters
  }

  closeMobileFilters() {
    if (window.innerWidth < 768) {
      this.showFilters = false
    }
  }

  setSortOption(sort: string) {
    this.currentSort = sort
    this.currentSortLabel = this.getSortLabel(sort)
    this.applyFiltersAndSort()
  }

  private getSortLabel(sort: string): string {
    const labels: { [key: string]: string } = {
      featured: "Featured",
      "price-asc": "Price: Low to High",
      "price-desc": "Price: High to Low",
      "name-asc": "Name: A to Z",
      newest: "Newest First",
      rating: "Highest Rated",
    }
    return labels[sort] || "Featured"
  }

  // Filter management
  hasActiveFilters(): boolean {
    return (
      this.currentFilters.categories.length > 0 ||
      this.currentFilters.brands.length > 0 ||
      this.currentFilters.priceRange.min !== null ||
      this.currentFilters.priceRange.max !== null ||
      this.currentFilters.inStock ||
      this.currentFilters.onSale ||
      this.currentFilters.isNew ||
      this.currentFilters.rating !== null
    )
  }

  get activeFilterCount(): number {
    let count = 0
    count += this.currentFilters.categories.length
    count += this.currentFilters.brands.length
    if (this.currentFilters.priceRange.min !== null || this.currentFilters.priceRange.max !== null) count++
    if (this.currentFilters.inStock) count++
    if (this.currentFilters.onSale) count++
    if (this.currentFilters.isNew) count++
    if (this.currentFilters.rating !== null) count++
    return count
  }

  clearAllFilters() {
    this.currentFilters = {
      categories: [],
      brands: [],
      priceRange: { min: null, max: null },
      inStock: false,
      onSale: false,
      isNew: false,
      rating: null,
    }
    this.applyFiltersAndSort();
    // Call the child clear method to clear local states
    this.filterSidebar.clearAllFiltersLocal();
  }

  onClearAllFilters() {
    this.clearAllFilters()
  }

  // Individual filter removal methods
  removeCategoryFilter(categoryId: number) {
    this.currentFilters.categories = this.currentFilters.categories.filter((id) => id !== categoryId)
    this.applyFiltersAndSort()
  }

  removeBrandFilter(brandId: string) {
    this.currentFilters.brands = this.currentFilters.brands.filter((id) => id !== brandId)
    this.applyFiltersAndSort()
  }

  removePriceFilter() {
    this.currentFilters.priceRange = { min: null, max: null }
    this.applyFiltersAndSort()
  }

  removeStockFilter() {
    this.currentFilters.inStock = false
    this.applyFiltersAndSort()
  }

  removeSaleFilter() {
    this.currentFilters.onSale = false
    this.applyFiltersAndSort()
  }

  // Helper methods for filter display
  getCategoryName(categoryId: number): string {
    const category = this.categories.find((cat) => cat.id === categoryId)
    return category ? category.name! : "Unknown Category"
  }

  getBrandName(brandId: string): string {
    const brand = this.brands.find((b) => b.id === brandId)
    return brand ? brand.name : "Unknown Brand"
  }

  // Pagination methods
  private updatePagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage)
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1
    }
  }

  get paginatedProducts(): ProductCardItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage
    const end = start + this.itemsPerPage
    return this.filteredProducts.slice(start, end)
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  getPageNumbers(): number[] {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(this.totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  // Category dropdown methods
  onCategorySelected(category: CategoryDTO) {
    // Add category to filters if not already present
    if (!this.currentFilters.categories.includes(category.id!)) {
      this.currentFilters.categories.push(category.id!)
      this.applyFiltersAndSort()
    }
  }

  onViewAllCategories() {
    // Navigate to categories page or show category modal
    console.log("View all categories")
  }

  // Product helper methods (keep your existing methods)
  getStockStatus(product: any): string {
    return product.variants.some((v: any) => v.stock > 0) ? "In Stock" : "Out of Stock"
  }

  getMainProductImage(product: any): string {
    if (product.productImages && product.productImages.length > 0) {
      const mainImage = product.productImages.find((img: any) => img.mainImageStatus)
      if (mainImage) {
        return mainImage.imgPath!
      } else if (product.productImages[0]) {
        return product.productImages[0].imgPath!
      }
    }
    return "assets/images/placeholder.jpg"
  }

  getLowestPrice(product: any): number {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map((v: any) => v.price)
      return Math.min(...prices)
    }
    return product.product.basePrice
  }

  hasStock(product: any): boolean {
    if (product.variants && product.variants.length > 0) {
      return product.variants.some((v: any) => v.stock > 0)
    }
    return false
  }

  isOnSale(product: any): boolean {
    if (product.variants && product.variants.length > 0) {
      return product.variants.some((v: any) => v.price < product.product.basePrice)
    }
    return false
  }

  isNew(product: any): boolean {
    if (product.product.createdDate) {
      const createdDate = new Date(product.product.createdDate)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - createdDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 14
    }
    return false
  }

  hasColorVariants(product: any): boolean {
    return this.getColorOptions(product).length > 0
  }

  getColorOptions(product: any): any[] {
    if (!product.options) return []

    const colorOption = product.options.find(
      (opt: any) => opt.name.toLowerCase().includes("color") || opt.name.toLowerCase().includes("colour"),
    )

    if (colorOption && colorOption.optionValues) {
      return colorOption.optionValues
    }

    return [];
  }

  quickView(product: any, event: Event): void {
    event.stopPropagation();
    // Implement quick view modal logic
    console.log('Quick view', product);
  }

  addToWishlist(product: any, event: Event): void {
    event.stopPropagation();
    // Implement wishlist logic
    console.log('Add to wishlist', product);
  }

  viewProduct(product: any): void {
    // Navigate to product detail page
    // this.router.navigate(['/product', product.id]);
    console.log('View product', product);
  }

  goToDetail(product: ProductCardItem): void {
    this.router.navigate(['/customer/product', product.id]);
  }

  sortByPriceAsc() {
    this.products.sort((a, b) => this.getLowestPrice(a) - this.getLowestPrice(b));
  }

  sortByBrand() {
    this.products.sort((a, b) => a.brand.name.localeCompare(b.brand.name));
  }
  
  loadWishlist() {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    this.wishlistService.getWishedProductIds(userId).subscribe({
      next: (wishedIds) => {
        this.wishList = new Set<number>(wishedIds);
      },
      error: (err) => console.error('Failed to load wishlist:', err)
    });
  }

  toggleWish(productId: number): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      console.error('User ID not found why?');
      return;
    }

    if (this.isWished(productId)) {
      this.wishlistService.removeProductFromWishlist(userId, productId).subscribe({
        next: () => {
          this.wishList.delete(productId);
          this.loadWishlist();
        },
        error: (err) => {
          console.error('Failed to remove from wishlist:', err);
        }
      });
    } else {
      const dialogRef = this.dialog.open(WishlistDialogComponent, {
        width: '400px',
        data: { productId }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result.added) {
          this.wishList.add(productId);
          this.loadWishlist();
        }
      });
    }
  }

  isWished(productId: number | string): boolean {
    const id = typeof productId === "string" ? +productId : productId
    return this.wishList.has(id)
  }

  // Add Math to component for template usage
  Math = Math
}
