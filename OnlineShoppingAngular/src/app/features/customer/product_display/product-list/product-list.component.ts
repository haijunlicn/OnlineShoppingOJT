import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { BrandDTO, ProductCardItem, ProductDTO, ProductListItemDTO } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { MatDialog } from '@angular/material/dialog';
import { WishlistService } from '../../../../core/services/wishlist.service';
import Swal from 'sweetalert2';
import { WishlistDialogComponent } from '../../general/wishlist-dialog/wishlist-dialog.component';
import { CategoryService } from '@app/core/services/category.service';
import { CategoryDTO } from '@app/core/models/category-dto';
import { TreeNode } from 'primeng/api';
import { BrandService } from '@app/core/services/brand.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FilterSidebarComponent, FilterState } from '../../common/filter-sidebar/filter-sidebar.component';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';
import { DiscountDisplayDTO } from '@app/core/models/discount';
import { DiscountTextService } from '@app/core/services/discount-text.service';

@Component({
  selector: "app-product-list",
  standalone: false,
  templateUrl: "./product-list.component.html",
  styleUrl: "./product-list.component.css",
})
export class ProductListComponent {
  @ViewChild(FilterSidebarComponent) filterSidebar!: FilterSidebarComponent

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

  // Data loaded flags
  private categoriesLoaded = false
  private brandsLoaded = false
  private productsLoaded = false
  private initialUrlParams: any = null
  private pendingQueryParams: any = null
  private filtersRestored = false

  constructor(
    private productService: ProductService,
    private wishlistService: WishlistService,
    private dialog: MatDialog,
    private cartService: CartService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private discountDisplayService: DiscountDisplayService,
    private discountTextService: DiscountTextService, // Add this line
  ) { }

  ngOnInit() {
    // Store initial URL params immediately
    this.initialUrlParams = this.route.snapshot.queryParams
    console.log("🔵 Initial URL params:", this.initialUrlParams)

    this.loadCategories()
    this.loadBrands()
    this.loadWishlist()
    this.loadProducts()

    this.checkScreenSize()
    window.addEventListener("resize", () => this.checkScreenSize())

    // Subscribe to future query param changes (for navigation)
    this.route.queryParams.subscribe((params) => {
      // Only process if this is not the initial load and filters haven't been restored yet
      if (this.categoriesLoaded && this.brandsLoaded && this.productsLoaded && this.filtersRestored) {
        console.log("🔄 Processing query param changes:", params)
        this.restoreFiltersFromUrl(params)
      }
    })

    // 🔁 Listen for auth status changes and refresh discounts
    this.authService.isLoggedIn$.subscribe((isLoggedIn) => {
      console.log("🔁 Auth status changed:", isLoggedIn);

      // 🔄 Re-fetch just discount hints and reapply them
      this.reloadDiscountHints();
    });

  }

  ngAfterViewInit() {
    // Try to restore filters after view is initialized
    setTimeout(() => {
      this.tryRestoreInitialFilters()
    }, 100)
  }

  private getCategoryIdByName(name: string): number | null {
    const normalizedInput = this.formatNameForUrl(decodeURIComponent(name))
    console.log("🔍 Looking for category with normalized name:", normalizedInput)

    const found = this.categories.find((cat) => {
      const categoryUrlName = this.formatNameForUrl(cat.name!)
      const matches = categoryUrlName === normalizedInput
      if (matches) {
        console.log(`✅ Found match: "${cat.name}" (ID: ${cat.id})`)
      }
      return matches
    })

    if (!found) {
      console.warn("❌ Category not found for:", normalizedInput)
      console.log(
        "Available categories:",
        this.categories.map((c) => ({ name: c.name, formatted: this.formatNameForUrl(c.name!) })),
      )
    }

    return found ? +found.id! : null
  }

  private getBrandIdsByNames(names: string[]): number[] {
    const ids = names.map((name) => this.getBrandIdByName(name)).filter((id): id is number => id !== null)
    console.log("🔍 Resolved brand names to IDs:", names, "→", ids)
    return ids
  }

  private getBrandIdByName(name: string): number | null {
    const decodedName = decodeURIComponent(name).trim().toLowerCase()
    console.log("🔍 Looking for brand with name:", decodedName)

    const found = this.brands.find((brand) => brand.name.toLowerCase() === decodedName)

    if (!found) {
      console.warn("❌ Brand not found for:", decodedName)
      console.log(
        "Available brands:",
        this.brands.map((b) => b.name.toLowerCase()),
      )
    } else {
      console.log(`✅ Found brand match: "${found.name}" (ID: ${found.id})`)
    }

    return found ? +found.id : null
  }

  loadProducts() {
    this.loadingProducts = true
    this.productService.getPublicProductList().subscribe({
      next: (products) => {
        // Initialize products with basic data
        this.products = products.map((product) => ({
          ...product,
          status: this.getStockStatus(product),
          originalPrice: 0,
          discountedPrice: 0,
        }))
        this.productsLoaded = true
        this.loadingProducts = false

        console.log("✅ Products loaded:", this.products.length)

        // Load discount hints and precompute prices
        this.discountDisplayService.getProductDiscountHints().subscribe({
          next: (hintMap) => {
            console.log("✅ Discount hints received from backend:", hintMap)
            this.precomputeProductPrices(hintMap)
            this.filteredProducts = [...this.products]
            this.tryRestoreInitialFilters()
          },
          error: (err) => {
            console.error("Failed to load discount hints", err)
            this.precomputeProductPrices({})
            this.filteredProducts = [...this.products]
            this.tryRestoreInitialFilters()
          },
        })
      },
      error: (err) => {
        console.error("Failed to load products", err)
        this.loadingProducts = false
      },
    })
  }

  loadCategories() {
    this.loadingCategories = true
    this.categoryService.getAllPublicCategories().subscribe({
      next: (categories) => {
        this.categories = categories
        this.categoriesLoaded = true
        this.loadingCategories = false
        console.log("✅ Categories loaded:", this.categories.length)
        this.tryRestoreInitialFilters()
      },
      error: (err) => {
        console.error("Failed to load categories", err)
        this.loadingCategories = false
      },
    })
  }

  loadBrands() {
    this.loadingBrands = true
    this.brandService.getAllPublicBrands().subscribe({
      next: (brands) => {
        this.brands = brands
        this.brandsLoaded = true
        this.loadingBrands = false
        console.log("✅ Brands loaded:", this.brands.length)
        this.tryRestoreInitialFilters()
      },
      error: (err) => {
        console.error("Failed to load brands", err)
        this.loadingBrands = false
      },
    })
  }

  onFiltersChanged(filters: FilterState) {
    console.log("🔄 Filters changed from sidebar:", filters)
    this.currentFilters = filters
    this.currentPage = 1
    this.applyFiltersAndSort()
    this.updateUrlWithFilters(filters)
  }

  private precomputeProductPrices(hintMap: { [productId: number]: DiscountDisplayDTO[] }) {
    console.log("🚀 Precomputing product prices for performance optimization...")

    const cart = this.cartService.getCart()
    console.log("precomputing method cart : ", cart);
    

    for (const product of this.products) {
      const allHints = hintMap[product.id] || []
      product.discountHints = allHints

      const eligibleHints = this.discountDisplayService.evaluateEligibleDiscounts(allHints, cart)
      product.originalPrice = this.calculateLowestVariantPrice(product)

      // 👇 Filter only the hints that actually affect this product
      const affectingHints = eligibleHints.filter(hint =>
        hint.offeredProductIds?.includes(product.id)
      )

      const result = this.discountDisplayService.calculateDiscountedPrice(
        product.originalPrice,
        affectingHints
      )

      product.discountedPrice = result.discountedPrice
      product.discountBreakdown = result.breakdown
    }

    console.log("✅ Price precomputation completed!")
  }

  private calculateLowestVariantPrice(product: ProductCardItem): number {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map((v: any) => v.price)
      return Math.min(...prices)
    }
    return product.product.basePrice
  }

  private checkScreenSize() {
    if (window.innerWidth < 768) {
      this.showFilters = false
    }
  }

  private getAllDescendantCategoryIds(categoryIds: number[]): number[] {
    const allIds = [...categoryIds]
    return [...new Set(allIds)]
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
        products.sort((a, b) => a.discountedPrice! - b.discountedPrice!)
        break
      case "price-desc":
        products.sort((a, b) => b.discountedPrice! - a.discountedPrice!)
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
        break
      default:
        break
    }
  }

  private updateUrlWithFilters(filters: FilterState) {
    const queryParams: any = {}

    if (filters.categories.length > 0) {
      const categoryNames = this.getCategoryNamesByIds(filters.categories)
      if (categoryNames.length > 0) {
        queryParams.categories = categoryNames.map((name) => this.sanitizeForUrl(name.trim())).join(",")
      }
    }

    if (filters.brands.length > 0) {
      const brandNames = this.getBrandNamesByIds(filters.brands)
      if (brandNames.length > 0) {
        queryParams.brands = brandNames.map((name) => this.sanitizeForUrl(name.trim())).join(",")
      }
    }

    if (filters.priceRange.min !== null) {
      queryParams.priceMin = filters.priceRange.min
    }
    if (filters.priceRange.max !== null) {
      queryParams.priceMax = filters.priceRange.max
    }

    if (filters.inStock) {
      queryParams.inStock = "true"
    }
    if (filters.onSale) {
      queryParams.onSale = "true"
    }
    if (filters.isNew) {
      queryParams.isNew = "true"
    }

    if (filters.rating !== null) {
      queryParams.rating = filters.rating
    }

    if (this.currentSort !== "featured") {
      queryParams.sort = this.currentSort
    }

    if (this.currentPage > 1) {
      queryParams.page = this.currentPage
    }

    console.log("🔗 Updating URL with params:", queryParams)

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: "replace",
    })
  }

  private getCategoryNamesByIds(ids: number[]): string[] {
    return ids.map((id) => this.getCategoryNameById(id)).filter((name) => name !== null) as string[]
  }

  private getCategoryNameById(id: number): string | null {
    const category = this.categories.find((cat) => cat.id === id)
    return category ? this.formatNameForUrl(category.name!) : null
  }

  private getBrandNamesByIds(ids: number[]): string[] {
    return ids.map((id) => this.getBrandNameById(id)).filter((name) => name !== null) as string[]
  }

  private getBrandNameById(id: number): string | null {
    const brand = this.brands.find((b) => +b.id === id)
    return brand ? this.formatNameForUrl(brand.name) : null
  }

  private formatNameForUrl(name: string): string {
    return encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))
  }

  private sanitizeForUrl(name: string): string {
    return encodeURIComponent(name.trim())
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
    this.updateUrlWithFilters(this.currentFilters)
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
    this.currentPage = 1

    this.applyFiltersAndSort()
    this.updateUrlWithFilters(this.currentFilters)

    if (this.filterSidebar) {
      this.filterSidebar.clearAllFiltersLocal()
    }
  }

  onClearAllFilters() {
    this.clearAllFilters()
  }

  // Individual filter removal methods
  removeCategoryFilter(categoryId: number) {
    const categoryIdNumber = +categoryId
    this.currentFilters.categories = this.currentFilters.categories.filter((id: number) => id !== categoryIdNumber)
    this.applyFiltersAndSort()
    this.updateUrlWithFilters(this.currentFilters)
    this.updateFilterSidebarFromFilters()
  }

  removeBrandFilter(brandId: number) {
    this.currentFilters.brands = this.currentFilters.brands.filter((id: number) => id !== brandId)
    this.applyFiltersAndSort()
    this.updateUrlWithFilters(this.currentFilters)
    this.updateFilterSidebarFromFilters()
  }

  removePriceFilter() {
    this.currentFilters.priceRange = { min: null, max: null }
    this.applyFiltersAndSort()
    this.updateUrlWithFilters(this.currentFilters)
    this.updateFilterSidebarFromFilters()
  }

  removeStockFilter() {
    this.currentFilters.inStock = false
    this.applyFiltersAndSort()
    this.updateUrlWithFilters(this.currentFilters)
    this.updateFilterSidebarFromFilters()
  }

  removeSaleFilter() {
    this.currentFilters.onSale = false
    this.applyFiltersAndSort()
    this.updateUrlWithFilters(this.currentFilters)
    this.updateFilterSidebarFromFilters()
  }

  // Helper methods for filter display
  getCategoryName(categoryId: number): string {
    const category = this.categories.find((cat) => cat.id === categoryId)
    return category ? category.name! : "Unknown Category"
  }

  getBrandName(brandId: number): string {
    const brand = this.brands.find((b) => +b.id === brandId)
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
      this.updateUrlWithFilters(this.currentFilters)
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
    if (!this.currentFilters.categories.includes(category.id!)) {
      this.currentFilters.categories.push(category.id!)
      this.applyFiltersAndSort()
      this.updateUrlWithFilters(this.currentFilters)
      this.updateFilterSidebarFromFilters()
    }
  }

  onViewAllCategories() {
    console.log("View all categories")
  }

  // Product helper methods
  getStockStatus(product: ProductListItemDTO): string {
    return product.variants.some((v) => v.stock > 0) ? "In Stock" : "Out of Stock"
  }

  getMainProductImage(product: ProductDTO): string {
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

  getOriginalPrice(product: ProductCardItem): number {
    return product.originalPrice!
  }

  getLowestDiscountedPrice(product: ProductCardItem): number {
    return product.discountedPrice!
  }

  hasStock(product: any): boolean {
    if (product.variants && product.variants.length > 0) {
      return product.variants.some((v: any) => v.stock > 0)
    }
    return false
  }

  isOnSale(product: ProductCardItem): boolean {
    return product.discountedPrice! < product.originalPrice!
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

    return []
  }

  quickView(product: any, event: Event): void {
    event.stopPropagation()
    console.log("Quick view", product)
  }

  addToWishlist(product: any, event: Event): void {
    event.stopPropagation()
    console.log("Add to wishlist", product)
  }

  viewProduct(product: any): void {
    console.log("View product", product)
  }

  goToDetail(product: ProductCardItem): void {
    this.router.navigate(["/customer/product", product.id])
  }

  sortByPriceAsc() {
    this.products.sort((a, b) => a.discountedPrice! - b.discountedPrice!)
  }

  sortByBrand() {
    this.products.sort((a, b) => a.brand.name.localeCompare(b.brand.name))
  }

  loadWishlist() {
    const userId = this.authService.getCurrentUser()?.id
    if (!userId) {
      console.error("User ID not found")
      return
    }

    this.wishlistService.getWishedProductIds(userId).subscribe({
      next: (wishedIds) => {
        this.wishList = new Set<number>(wishedIds)
      },
      error: (err) => console.error("Failed to load wishlist:", err),
    })
  }

  toggleWish(productId: number): void {
    const userId = this.authService.getCurrentUser()?.id
    if (!userId) {
      console.error("User ID not found why?")
      return
    }

    if (this.isWished(productId)) {
      this.wishlistService.removeProductFromWishlist(userId, productId).subscribe({
        next: () => {
          this.wishList.delete(productId)
          this.loadWishlist()
        },
        error: (err) => {
          console.error("Failed to remove from wishlist:", err)
        },
      })
    } else {
      const dialogRef = this.dialog.open(WishlistDialogComponent, {
        width: "400px",
        data: { productId },
      })

      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.added) {
          this.wishList.add(productId)
          this.loadWishlist()
        }
      })
    }
  }

  isWished(productId: number | string): boolean {
    const id = typeof productId === "string" ? +productId : productId
    return this.wishList.has(id)
  }


  // NEW METHODS FOR DISCOUNT BADGE FUNCTIONALITY
  hasUnappliedDiscounts(product: ProductCardItem): boolean {
    if (!product.discountHints || product.discountHints.length === 0) {
      return false
    }

    const cart = this.cartService.getCart()
    const eligibleHints = this.discountDisplayService.evaluateEligibleDiscounts(product.discountHints, cart)

    // Has hints but none are currently eligible/applied
    return product.discountHints.length > 0
    //&& eligibleHints.length === 0
  }

  hasAppliedDiscounts(product: ProductCardItem): boolean {
    if (!product.discountHints || product.discountHints.length === 0) {
      return false
    }

    const cart = this.cartService.getCart()
    const eligibleHints = this.discountDisplayService.evaluateEligibleDiscounts(product.discountHints, cart)

    return eligibleHints.length > 0
  }

  getUnappliedDiscountHints(product: ProductCardItem): DiscountDisplayDTO[] {
    if (!product.discountHints || product.discountHints.length === 0) {
      return []
    }

    const cart = this.cartService.getCart()
    const eligibleHints = this.discountDisplayService.evaluateEligibleDiscounts(product.discountHints, cart)
    const eligibleIds = new Set(eligibleHints.map((h) => h.id))

    return product.discountHints.filter(hint => {
      const isProductOffered = hint.offeredProductIds?.includes(product.id)
      const isEligible = eligibleIds.has(hint.id)
      return !isProductOffered || (isProductOffered && !isEligible)
    })
  }

  getAppliedDiscountHints(product: ProductCardItem): DiscountDisplayDTO[] {
    if (!product.discountHints || product.discountHints.length === 0) {
      return []
    }

    const cart = this.cartService.getCart()
    return this.discountDisplayService.evaluateEligibleDiscounts(product.discountHints, cart)
  }

  getAvailableDiscountLabel(hint: DiscountDisplayDTO): string {
    return this.discountTextService.getAvailableDiscountLabel(hint)
  }

  getCombinedDiscountLabel(product: ProductCardItem): string {
    const hints = this.getUnappliedDiscountHints(product);
    return this.discountTextService.getCombinedDiscountLabel(hints);
  }

  getDiscountConditionTooltip(hint: DiscountDisplayDTO): string {
    return this.discountTextService.getDiscountConditionTooltip(hint)
  }

  // Keep all your existing methods unchanged...
  private tryRestoreInitialFilters() {
    if (this.categoriesLoaded && this.brandsLoaded && this.productsLoaded && !this.filtersRestored) {
      console.log("🟢 All data loaded, restoring initial filters:", this.initialUrlParams)
      this.restoreFiltersFromUrl(this.initialUrlParams)
      this.filtersRestored = true
    }
  }

  private restoreFiltersFromUrl(params: any) {
    console.log("🟡 Restoring filters from URL:", params)
    if (!params || Object.keys(params).length === 0) {
      console.warn("⚠️ No URL parameters to restore. Applying default filters.")
      this.applyFiltersAndSort()
      return
    }

    // ===== Categories =====
    if (params["categories"]) {
      const raw = params["categories"]
      const categoryNames = raw.split(",").map((name: string) => decodeURIComponent(name.trim()))
      console.log("📁 Decoded category names:", categoryNames)

      const categoryIds = this.getCategoryIdsByNames(categoryNames)
      console.log("✅ Matched category IDs:", categoryIds)
      this.currentFilters.categories = categoryIds
    } else if (params["category"]) {
      const decodedName = decodeURIComponent(params["category"].trim())
      const categoryId = this.getCategoryIdByName(decodedName)
      console.log("📁 Decoded single category name:", decodedName)
      if (categoryId !== null) {
        this.currentFilters.categories = [categoryId]
        console.log("✅ Restored single category ID:", categoryId)
      } else {
        console.warn("❌ Category not found for name:", decodedName)
      }
    }

    // ===== Brands =====
    if (params["brands"]) {
      const brandNames = params["brands"].split(",").map((name: string) => decodeURIComponent(name.trim()))
      console.log("🏷️ Decoded brand names:", brandNames)

      const brandIds = this.getBrandIdsByNames(brandNames)
      console.log("✅ Matched brand IDs:", brandIds)

      this.currentFilters.brands = brandIds
    }

    // ===== Price Range =====
    if (params["priceMin"] || params["priceMax"]) {
      const min = params["priceMin"] ? Number.parseFloat(params["priceMin"]) : null
      const max = params["priceMax"] ? Number.parseFloat(params["priceMax"]) : null
      this.currentFilters.priceRange = { min, max }
      console.log("💰 Restored price range:", this.currentFilters.priceRange)
    }

    // ===== Availability =====
    this.currentFilters.inStock = params["inStock"] === "true"
    this.currentFilters.onSale = params["onSale"] === "true"
    this.currentFilters.isNew = params["isNew"] === "true"
    console.log(
      "📦 Restored availability filters: inStock =",
      this.currentFilters.inStock,
      ", onSale =",
      this.currentFilters.onSale,
      ", isNew =",
      this.currentFilters.isNew,
    )

    // ===== Rating =====
    if (params["rating"]) {
      const rating = Number.parseInt(params["rating"])
      this.currentFilters.rating = !isNaN(rating) ? rating : null
      console.log("⭐ Restored rating:", this.currentFilters.rating)
    }

    // ===== Sort Option =====
    if (params["sort"]) {
      this.currentSort = params["sort"]
      this.currentSortLabel = this.getSortLabel(params["sort"])
      console.log("⬇️ Restored sort:", this.currentSort)
    }

    // ===== Pagination =====
    if (params["page"]) {
      const page = Number.parseInt(params["page"])
      this.currentPage = !isNaN(page) && page > 0 ? page : 1
      console.log("📄 Restored page:", this.currentPage)
    }

    console.log("🔄 Applying restored filters to product list...")
    this.applyFiltersAndSort()

    console.log("🔄 Syncing filter sidebar with restored filters...")
    this.updateFilterSidebarFromFilters()
    this.updateUrlWithFilters(this.currentFilters)
    console.log("🟢 Filter restoration completed!")
  }

  private applyFiltersAndSort() {
    console.log("🔍 Applying filters:", this.currentFilters)

    let filtered = [...this.products]
    console.log("📊 Starting with", filtered.length, "products")

    // Apply category filter
    if (this.currentFilters.categories.length > 0) {
      const categoryIds = this.getAllDescendantCategoryIds(this.currentFilters.categories)
      console.log("📁 Filtering by category IDs:", categoryIds)

      const beforeCount = filtered.length
      filtered = filtered.filter((product) => categoryIds.includes(product.category.id!))
      console.log(`📁 Category filter: ${beforeCount} → ${filtered.length} products`)
    }

    // Apply brand filter
    if (this.currentFilters.brands.length > 0) {
      console.log("🏷️ Filtering by brand IDs:", this.currentFilters.brands)

      const beforeCount = filtered.length
      filtered = filtered.filter((product) => this.currentFilters.brands.includes(+product.brand.id))
      console.log(`🏷️ Brand filter: ${beforeCount} → ${filtered.length} products`)
    }

    // Apply price filter
    if (this.currentFilters.priceRange.min !== null || this.currentFilters.priceRange.max !== null) {
      const beforeCount = filtered.length
      filtered = filtered.filter((product) => {
        const price = product.discountedPrice
        const min = this.currentFilters.priceRange.min || 0
        const max = this.currentFilters.priceRange.max || Number.POSITIVE_INFINITY
        return price! >= min && price! <= max
      })
      console.log(`💰 Price filter: ${beforeCount} → ${filtered.length} products`)
    }

    // Apply availability filters
    if (this.currentFilters.inStock) {
      const beforeCount = filtered.length
      filtered = filtered.filter((product) => this.hasStock(product))
      console.log(`📦 Stock filter: ${beforeCount} → ${filtered.length} products`)
    }

    if (this.currentFilters.onSale) {
      const beforeCount = filtered.length
      filtered = filtered.filter((product) => this.isOnSale(product))
      console.log(`🏷️ Sale filter: ${beforeCount} → ${filtered.length} products`)
    }

    if (this.currentFilters.isNew) {
      const beforeCount = filtered.length
      filtered = filtered.filter((product) => this.isNew(product))
      console.log(`✨ New filter: ${beforeCount} → ${filtered.length} products`)
    }

    // Apply sorting
    this.applySorting(filtered)
    console.log("🔄 Applied sorting:", this.currentSort)

    this.filteredProducts = filtered
    this.updatePagination()

    console.log("✅ Final filtered products count:", this.filteredProducts.length)
  }

  private updateFilterSidebarFromFilters() {
    if (!this.filterSidebar) {
      console.warn("⚠️ Filter sidebar not available yet")
      return
    }

    console.log("🔄 Updating filter sidebar with filters:", this.currentFilters)

    // Update categories
    this.filterSidebar.selectedCategories.clear()
    this.currentFilters.categories.forEach((categoryId) => {
      this.filterSidebar.selectedCategories.add(categoryId)
    })
    console.log("📁 Updated sidebar categories:", Array.from(this.filterSidebar.selectedCategories))

    // Update brands
    this.filterSidebar.selectedBrands.clear()
    this.currentFilters.brands.forEach((brandId) => {
      this.filterSidebar.selectedBrands.add(brandId)
    })
    console.log("🏷️ Updated sidebar brands:", Array.from(this.filterSidebar.selectedBrands))

    // Update price range
    this.filterSidebar.customPriceMin = this.currentFilters.priceRange.min
    this.filterSidebar.customPriceMax = this.currentFilters.priceRange.max

    // Update availability filters
    this.filterSidebar.inStockOnly = this.currentFilters.inStock
    this.filterSidebar.onSaleOnly = this.currentFilters.onSale
    this.filterSidebar.newItemsOnly = this.currentFilters.isNew

    // Update rating
    this.filterSidebar.minRating = this.currentFilters.rating

    console.log("✅ Filter sidebar updated successfully")
  }

  private getCategoryIdsByNames(names: string[]): number[] {
    const ids = names.map((name) => this.getCategoryIdByName(name)).filter((id): id is number => id !== null)
    console.log("🔍 Resolved category names to IDs:", names, "→", ids)
    return ids
  }

  reloadDiscountHints() {
    this.discountDisplayService.getProductDiscountHints().subscribe({
      next: (hintMap) => {
        this.precomputeProductPrices(hintMap)
      },
      error: (err) => {
        console.error("❌ Failed to reload discount hints", err)
      }
    })
  }

  Math = Math
}
