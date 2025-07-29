import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ProductListComponent } from '../product-list/product-list.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductCardItem, ProductDTO, ProductImageDTO, ProductListItemDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import Swal from 'sweetalert2';
import { WishlistDialogComponent } from '../../general/wishlist-dialog/wishlist-dialog.component';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { MatDialog } from '@angular/material/dialog';
import { DiscountConditionGroupEA_C, DiscountDisplayDTO, MechanismType } from '@app/core/models/discount';
import { evaluateCartConditions } from '@app/core/services/discountChecker';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';
import { CartItem } from '@app/core/models/cart.model';
import { DiscountTextService } from '@app/core/services/discount-text.service';
import { AuthService } from '@app/core/services/auth.service';
import { CloudinaryService } from '@app/core/services/cloudinary.service';
import { ReviewService } from '@app/core/services/review.service';
import { ProductReview } from '@app/core/models/review';
import { AlertService } from '@app/core/services/alert.service';
import { DiscountDetailDisplayService } from '@app/core/services/discount-detail-display.service';


// Change editReviewData type and default value
declare interface EditReviewData {
  rating: number
  comment: string
  images: { imageUrl: string }[]
}

@Component({
  selector: "app-product-detail",
  standalone: false,
  templateUrl: "./product-detail.component.html",
  styleUrl: "./product-detail.component.css",
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private carouselInterval: any

  // Product data
  product!: ProductCardItem
  relatedProducts: ProductDTO[] = []
  mainImageUrl = ""
  allImages: Array<{ url: string; variantId?: string }> = []
  currentImageIndex = 0

  // Form and selections
  form!: FormGroup
  selectedOptions: { [optionId: number]: number } = {}
  selectedVariant?: ProductVariantDTO
  quantity = 1

  // Discount system
  discountHints: DiscountDisplayDTO[] = []
  discountGroups: DiscountConditionGroupEA_C[] = []
  eligibleDiscounts: DiscountDisplayDTO[] = []
  conditionalDiscounts: DiscountDisplayDTO[] = []
  progressConditionalDiscounts: DiscountDisplayDTO[] = []
  visibleDiscounts: DiscountDisplayDTO[] = []
  isEligibleForDiscount = false
  discountsExpanded = false
  stickyProgressDismissed = false

  // Discount carousel state
  currentDiscountIndex = 0

  // Cart and wishlist
  cartItems: CartItem[] = []
  wishList = new Set<number>()

  // Shipping
  shipping = { city: "", cost: 0 }

  @Input() categoryId!: number
  @Input() productId!: number
  @ViewChild("scrollContainer", { static: false }) scrollContainer!: ElementRef
  @ViewChild("mobileDiscounts", { static: false }) mobileDiscounts!: ElementRef
  @ViewChild("discountCarousel", { static: false }) discountCarousel!: ElementRef

  // Review system state
  reviews: any[] = []
  reviewTotal = 0
  reviewAverage = 0
  reviewBreakdown: { [key: number]: number } = {}
  reviewPage = 1
  reviewPageSize = 4
  reviewSort = "date_desc"
  reviewFilterRating?: number
  isLoadingReviews = false
  newReview: { rating: number; comment: string } = { rating: 5, comment: "" }
  isSubmittingReview = false
  uploadedReviewImages: { imageUrl: string }[] = []
  userId?: number
  userName?: string
  isLoggedIn = false
  hasPurchasedProduct = false
  hasReviewedProduct = false
  editingReview: any = null
  editReviewData: EditReviewData = { rating: 5, comment: "", images: [] }
  showAddReviewModal = false;
  showEditReviewModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private dialog: MatDialog,
    private discountDisplayService: DiscountDisplayService,
    private discountTextService: DiscountTextService,
    private discountDetailDisplayService: DiscountDetailDisplayService, // Inject the new service
    private reviewService: ReviewService,
    private cloudinaryService: CloudinaryService,
    private authService: AuthService,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn;
    });
    // Set userId and userName from AuthService if available
    if (this.authService.user$) {
      this.authService.user$.subscribe((user) => {
        if (user) {
          this.userId = user.id;
          this.userName = user.name || user.email || undefined;
        }
      });
    }

    this.route.paramMap.subscribe((params) => {
      const id = params.get("id")
      if (id) {
        this.fetchProductDetail(+id)
      }
    })
    this.subscribeToCartChanges()
    this.loadStickyProgressState()
    this.updateVisibleDiscounts()
    this.startDiscountCarouselAutoplay()
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval)
    }
  }

  private subscribeToCartChanges(): void {
    this.cartService.cartItems$.subscribe((cart) => {
      this.cartItems = cart
      this.refreshCartData()

      // Re-evaluate discounts when cart changes
      if (this.discountHints.length > 0) {
        this.evaluateDiscountEligibility()
      }
    })
  }

  private loadStickyProgressState(): void {
    this.stickyProgressDismissed = localStorage.getItem("stickyProgressDismissed") === "true"
  }

  private refreshCartData(): void {
    // Update cart items for discount calculations
    this.cartItems = this.cartService.getCart()
  }

  hasStock(product: ProductDTO): boolean {
    return !!(product.productVariants && product.productVariants.some((v) => v.stock > 0))
  }

  fetchProductDetail(id: number): void {
    this.productService.getPublicProductById(id).subscribe({
      next: (data) => {
        this.product = data
        this.initializeComponent()
        this.loadRelatedProducts()
        this.loadDiscountHints()
        this.checkPurchaseStatus()
      },
      error: (err) => {
        console.error("Error fetching product:", err)
        this.router.navigate(["/customer/productList"])
      },
    })
  }

  initializeComponent(): void {
    this.initForm()
    this.setDefaultSelections()
    this.buildImagesList()
    this.setDefaultMainImage()
  }

  private loadDiscountHints(): void {
    if (!this.product?.id) return

    this.discountDisplayService.getProductDiscountHints().subscribe({
      next: (hintMap) => {
        const productId = this.product.id
        const hints: DiscountDisplayDTO[] = hintMap?.[productId] || []

        this.discountHints = hints
        this.discountGroups = hints.flatMap((h) => h.conditionGroups || [])
        this.categorizeDiscounts()
        this.evaluateDiscountEligibility()
      },
      error: (err) => {
        console.error("Error loading discount hints:", err)
      },
    })
  }

  private categorizeDiscounts(): void {
    // Separate conditional discounts (requiring frontend checking)
    this.conditionalDiscounts = this.discountHints.filter((hint) => hint.requireFrontendChecking === true)

    // Filter discounts where NO condition in any conditionGroup has eligible === false
    // Optionally require at least one condition eligible === true
    this.progressConditionalDiscounts = this.discountHints.filter((hint) => {
      if (!hint.requireFrontendChecking) return false
      if (!hint.conditionGroups || hint.conditionGroups.length === 0) return false

      // Flatten all conditions of all groups
      const allConditions = hint.conditionGroups.flatMap((group) => group.conditions ?? [])

      // No condition should have eligible === false
      const hasFalse = allConditions.some((cond) => cond.eligible === false)
      if (hasFalse) return false

      return true
    })

    console.log("🎯 Conditional discounts:", this.conditionalDiscounts)
    console.log(
      "✅ Progress conditional discounts (no condition false & some true):",
      this.progressConditionalDiscounts,
    )
    console.log("🔍 All discount hints:", this.discountHints)
  }

  private evaluateDiscountEligibility(): void {
    if (!this.discountHints || this.discountHints.length === 0) {
      this.eligibleDiscounts = []
      this.isEligibleForDiscount = false
      return
    }

    // Use the discount service to evaluate eligibility
    this.eligibleDiscounts = this.discountDisplayService.evaluateEligibleDiscounts(this.discountHints, this.cartItems)

    this.isEligibleForDiscount = this.eligibleDiscounts.length > 0

    console.log("✅ Eligible discounts:", this.eligibleDiscounts)
  }

  // Get visible discounts (exclude B2B)
  getVisibleDiscounts(): DiscountDisplayDTO[] {
    return this.discountHints.filter((discount) => discount.mechanismType !== MechanismType.B2B)
  }

  updateVisibleDiscounts(): void {
    this.visibleDiscounts = this.discountHints.filter((discount) => discount.mechanismType !== MechanismType.B2B)
  }

  goToDetail(product: ProductDTO): void {
    this.router.navigate(["/customer/product", product.id])
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Discount carousel methods
  private startDiscountCarouselAutoplay(): void {
    this.carouselInterval = setInterval(() => {
      if (this.visibleDiscounts.length > 1) {
        this.nextDiscountSlide()
      }
    }, 5000)
  }

  nextDiscountSlide(): void {
    const maxIndex = this.getVisibleDiscounts().length - 1
    if (this.currentDiscountIndex < maxIndex) {
      this.currentDiscountIndex++
    } else {
      this.currentDiscountIndex = 0
    }
  }

  prevDiscountSlide(): void {
    const maxIndex = this.getVisibleDiscounts().length - 1
    if (this.currentDiscountIndex > 0) {
      this.currentDiscountIndex--
    } else {
      this.currentDiscountIndex = maxIndex
    }
  }

  goToDiscountSlide(index: number): void {
    this.currentDiscountIndex = index
  }

  // UPDATED: Use the new service for showing discount details
  showDiscountDetail(discount: DiscountDisplayDTO): void {
    this.discountDetailDisplayService.showDiscountDetail(discount)
  }

  /**
   * Get linked condition text for template usage
   */
  getLinkedConditionText(discount: DiscountDisplayDTO): { text: string; linkedEntities: any[] } {
    return this.discountDetailDisplayService.getLinkedConditionText(discount)
  }

  /**
   * Render text with clickable links for template usage
   */
  renderTextWithLinks(textOutput: { text: string; linkedEntities: any[] }): string {
    return this.discountDetailDisplayService.renderTextWithLinks(textOutput)
  }

  /**
   * Handle entity clicks in template
   */
  onEntityClick(event: Event, linkedEntities: any[]): void {
    this.discountDetailDisplayService.onEntityClick(event, linkedEntities)
  }

  // Mobile scroll to discounts
  scrollToDiscounts(): void {
    if (this.mobileDiscounts) {
      this.mobileDiscounts.nativeElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  // ... rest of the component methods remain the same ...
  // (I'm truncating here for brevity, but all other methods would remain unchanged)

  initForm(): void {
    const group: { [key: string]: any } = {}

    this.product.options.forEach((option) => {
      if (option.optionValues.length > 0) {
        const firstValueId = option.optionValues[0].id!
        group[option.id] = [firstValueId]
        this.selectedOptions[option.id] = firstValueId
      }
    })

    this.form = this.fb.group(group)
  }

  setDefaultSelections(): void {
    this.updateSelectedVariant()
  }

  updateSelectedVariant(): void {
    this.selectedVariant = this.product.variants.find((variant) => {
      const variantOptions = variant.options ?? []

      if (variantOptions.length === 0 && Object.keys(this.selectedOptions).length === 0) {
        return true
      }

      return variantOptions.every(
        (variantOption) => this.selectedOptions[variantOption.optionId] === variantOption.optionValueId,
      )
    })
  }

  buildImagesList(): void {
    this.allImages = []

    if (this.product.product.productImages) {
      const sortedProductImages = this.product.product.productImages.sort((a, b) => a.displayOrder - b.displayOrder)

      sortedProductImages.forEach((img) => {
        if (img.imgPath) {
          this.allImages.push({
            url: img.imgPath,
          })
        }
      })
    }

    this.product.variants.forEach((variant) => {
      if (variant.imgPath && !this.allImages.some((img) => img.url === variant.imgPath)) {
        this.allImages.push({
          url: variant.imgPath,
          variantId: variant.sku,
        })
      }
    })
  }

  setDefaultMainImage(): void {
    if (this.product.product.productImages && this.product.product.productImages.length > 0) {
      const sortedImages = this.product.product.productImages.sort((a, b) => a.displayOrder - b.displayOrder)
      const mainImage = sortedImages.find((img) => img.mainImageStatus) || sortedImages[0]
      this.mainImageUrl = mainImage.imgPath || ""

      const mainImageIndex = this.allImages.findIndex((img) => img.url === this.mainImageUrl)
      if (mainImageIndex !== -1) {
        this.currentImageIndex = mainImageIndex
      }
    }

    if (!this.mainImageUrl && this.selectedVariant?.imgPath) {
      this.mainImageUrl = this.selectedVariant.imgPath
      const variantImageIndex = this.allImages.findIndex((img) => img.url === this.mainImageUrl)
      if (variantImageIndex !== -1) {
        this.currentImageIndex = variantImageIndex
      }
    }
  }

  // Image navigation methods
  nextImage(): void {
    if (this.currentImageIndex < this.allImages.length - 1) {
      this.currentImageIndex++
    } else {
      this.currentImageIndex = 0
    }
    this.mainImageUrl = this.allImages[this.currentImageIndex].url
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--
    } else {
      this.currentImageIndex = this.allImages.length - 1
    }
    this.mainImageUrl = this.allImages[this.currentImageIndex].url
  }

  setActiveImage(index: number): void {
    this.currentImageIndex = index
    this.mainImageUrl = this.allImages[index].url
  }

  // Option selection methods
  onOptionChange(optionId: number, valueId: number): void {
    this.form.get(optionId.toString())?.setValue(valueId)
    this.selectedOptions[optionId] = valueId
    this.updateSelectedVariant()
    this.autoSelectVariantImage()
    this.quantity = 1
  }

  autoSelectVariantImage(): void {
    if (this.selectedVariant?.imgPath) {
      this.mainImageUrl = this.selectedVariant.imgPath
      const imageIndex = this.allImages.findIndex((img) => img.url === this.selectedVariant?.imgPath)
      if (imageIndex !== -1) {
        this.currentImageIndex = imageIndex
      }
    }
  }

  getOptionValuesWithAvailability(optionId: number, allValues: any[]): { value: any; enabled: boolean }[] {
    const selected = { ...this.selectedOptions }
    delete selected[optionId]

    const validValueIds = new Set<number>()

    for (const variant of this.product.variants) {
      const matches = variant.options.every((vo) => {
        return selected[vo.optionId] == null || selected[vo.optionId] === vo.optionValueId
      })

      if (matches) {
        const match = variant.options.find((vo) => vo.optionId === optionId)
        if (match) validValueIds.add(match.optionValueId)
      }
    }

    return allValues.map((val) => ({
      value: val,
      enabled: validValueIds.has(val.id),
    }))
  }

  isSelected(optionId: number, valueId: number): boolean {
    return this.selectedOptions[optionId] === valueId
  }

  // Stock methods
  getStockStatus(): string {
    if (!this.selectedVariant) return ""
    if (this.selectedVariant.stock === 0) return "Out of Stock"
    if (this.selectedVariant.stock <= 5) return `Low Stock (Only ${this.selectedVariant.stock} left)`
    return "In Stock"
  }

  getStockClass(): string {
    if (!this.selectedVariant) return ""
    if (this.selectedVariant.stock === 0) return "text-danger"
    if (this.selectedVariant.stock <= 5) return "text-warning"
    return "text-success"
  }

  getStockIcon(): string {
    if (!this.selectedVariant) return ""
    if (this.selectedVariant.stock === 0) return "bi-x-circle-fill"
    if (this.selectedVariant.stock <= 5) return "bi-exclamation-circle-fill"
    return "bi-check-circle-fill"
  }

  // Pricing methods
  getCurrentDisplayPrice(): number {
    return this.selectedVariant?.price || this.getLowestPrice()
  }

  getLowestPrice(): number {
    if (this.product.variants && this.product.variants.length > 0) {
      const prices = this.product.variants.map((v) => v.price)
      return Math.min(...prices)
    }
    return this.product.product.basePrice
  }

  hasActiveDiscounts(productId: number): boolean {
    return this.eligibleDiscounts.some(
      (d) => d.mechanismType?.toLowerCase() !== "coupon" && d.offeredProductIds?.includes(productId),
    )
  }

  getDiscountedPrice(productId: number): number {
    if (!this.hasActiveDiscounts(productId)) {
      return this.getCurrentDisplayPrice()
    }

    const currentPrice = this.getCurrentDisplayPrice()

    const applicableDiscounts = this.eligibleDiscounts.filter(
      (d) => d.mechanismType?.toLowerCase() !== "coupon" && d.offeredProductIds?.includes(productId),
    )

    const result = this.discountDisplayService.calculateDiscountedPrice(currentPrice, applicableDiscounts)

    return result.discountedPrice
  }

  getSavingsAmount(productId: number): number {
    return this.getCurrentDisplayPrice() - this.getDiscountedPrice(productId)
  }

  // Discount methods - now delegating to discount text service
  toggleDiscountsExpanded(): void {
    this.discountsExpanded = !this.discountsExpanded
  }

  getConditionalDiscounts(): DiscountDisplayDTO[] {
    return this.conditionalDiscounts
  }

  getProgressConditionalDiscounts(): DiscountDisplayDTO[] {
    return this.progressConditionalDiscounts
  }

  getCurrentCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  getRequiredAmount(discount: DiscountDisplayDTO): number {
    if (!discount.conditionSummary) return 0

    // Extract required amount from condition summary
    const match = discount.conditionSummary.match(/(\d+)/)
    return match ? Number.parseInt(match[1]) : 0
  }

  formatDiscountBadge(discount: DiscountDisplayDTO): string {
    return this.discountTextService.formatDiscountValue(discount)
  }

  // ===== DELEGATE DISCOUNT DISPLAY METHODS TO DISCOUNT TEXT SERVICE =====

  getDiscountPercentage(discount: DiscountDisplayDTO): string {
    return this.discountTextService.getDiscountPercentage(discount)
  }

  getDiscountTypeLabel(discount: DiscountDisplayDTO): string {
    return this.discountTextService.getDiscountTypeLabel(discount)
  }

  getMechanismBasedMessage(discount: DiscountDisplayDTO): string {
    return this.discountDetailDisplayService.getPlainMechanismMessage(discount)
  }

  getDiscountInfoSections(discount: any): { validity: string; usageLimits: string } {
    let validity = ""
    let usageLimits = ""

    // Validity dates
    if (discount.startDate && discount.endDate) {
      const start = new Date(discount.startDate).toLocaleDateString()
      const end = new Date(discount.endDate).toLocaleDateString()
      validity = `Valid: ${start} - ${end}`
    } else {
      validity = "No expiration date"
    }

    // Usage limits (combine per user and total)
    const limits: string[] = []
    if (discount.usageLimitPerUser) {
      limits.push(`Per User: ${discount.usageLimitPerUser}`)
    }
    if (discount.usageLimitTotal) {
      limits.push(`Total: ${discount.usageLimitTotal}`)
    }
    usageLimits = limits.length > 0 ? limits.join(" · ") : "No usage limits"

    return { validity, usageLimits }
  }


  // getMechanismBasedMessage(discount: DiscountDisplayDTO): string {
  //   return this.discountTextService.getMechanismBasedMessage(discount)
  // }

  isConditionsMet(discount: DiscountDisplayDTO): boolean {
    return this.discountTextService.isConditionsMet(discount)
  }

  isHighValueDiscount(discount: DiscountDisplayDTO): boolean {
    return this.discountTextService.isHighValueDiscount(discount)
  }

  getSimpleDescription(discount: DiscountDisplayDTO): string {
    return this.discountTextService.getSimpleDescription(discount)
  }

  copyToClipboard(text: string): void {
    this.discountTextService
      .copyToClipboard(text)
      .then(() => {
        this.showAlert(`Coupon code "${text}" copied to clipboard`, "success")
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
      })
  }

  // Sticky progress methods
  onStickyProgressDismissed(): void {
    this.stickyProgressDismissed = true
    localStorage.setItem("stickyProgressDismissed", "true")
  }

  onAddMoreItemsClicked(): void {
    this.router.navigate(["/customer/productList"])
  }

  // Cart methods
  getCurrentVariantCartQuantity(): number {
    if (!this.selectedVariant) return 0
    return this.cartService.getVariantQuantity(this.product.product.id!, this.selectedVariant.id!)
  }

  getCurrentVariantRemainingStock(): number {
    if (!this.selectedVariant) return 0
    const inCart = this.getCurrentVariantCartQuantity()
    return this.selectedVariant.stock - inCart
  }

  incrementQuantity(): void {
    const maxAllowed = this.getCurrentVariantRemainingStock()
    if (this.quantity < maxAllowed) {
      this.quantity++
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--
    }
  }

  addToCart(item: ProductListItemDTO): void {
    if (!this.selectedVariant) {
      this.showAlert("Please select all options.", "warning")
      return
    }
    console.log("May",item);
    const stock = this.selectedVariant.stock
    const inCart = this.getCurrentVariantCartQuantity()

    if (stock === 0 || inCart >= stock) {
      this.showAlert(
        `${item.product.name} (${this.selectedVariant.sku}) is ${stock === 0 ? "currently out of stock." : "out of stock."}`,
        stock === 0 ? "error" : "warning",
      )
      return
    }

    const fallbackImage =
      this.selectedVariant.imgPath?.trim() ||
      item.product.productImages?.find((img) => img.mainImageStatus)?.imgPath?.trim() ||
      "assets/images/default.jpg"

    for (let i = 0; i < this.quantity; i++) {
      this.cartService.addToCart({
        id: item.product.id!,
        name: item.product.name,
        variantId: this.selectedVariant.id!,
        variantSku: this.selectedVariant.sku,
        stock: this.selectedVariant.stock,
        price: this.selectedVariant.price,
        image: fallbackImage,
        brandId: Number(item.product.brandId),
        categoryId: Number(item.product.categoryId),
      })
      const cart = this.cartService.getCart();   
    }

    this.showAlert(
      `${this.quantity} x ${item.product.name} (${this.selectedVariant.sku}) added successfully.`,
      "success",
    )

    this.quantity = 1
  }

  private showAlert(message: string, type: "success" | "error" | "warning"): void {
    const config = {
      success: { icon: "🛒", background: "#f0fff0" },
      error: { icon: "❌", background: "#ffe6e6" },
      warning: { icon: "⚠️", background: "#e8d7c3" },
    }

    Swal.fire({
      title: `${config[type].icon} ${type === "success" ? "Added to Cart!" : type === "error" ? "Out of Stock!" : "Stock Limit Reached"}`,
      text: message,
      icon: type,
      toast: true,
      position: "top",
      showConfirmButton: false,
      timer: 2500,
      background: config[type].background,
      color: "#333",
      customClass: { popup: "custom-toast-popup" },
    })
  }
  // Coupon methods - simplified since copyToClipboard is now handled by service
  onCouponCopied(code: string): void {
    this.showAlert(`Coupon code "${code}" copied to clipboard`, "success")
  }

  onCouponApplied(code: string): void {
    this.showAlert(`Coupon code "${code}" has been applied`, "success")
  }

  // Wishlist methods
  toggleWish(productId: number): void {
    const userId = 4 // Replace with actual user ID

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
    const id = typeof productId === "string" ? +productId : this.productId
    return this.wishList.has(id)
  }

  loadWishlist(): void {
    const userId = 4 // Replace with actual user ID
    this.wishlistService.getWishedProductIds(userId).subscribe({
      next: (wishedIds) => {
        this.wishList = new Set<number>(wishedIds)
      },
      error: (err) => console.error("Failed to load wishlist:", err),
    })
  }

  // Related products methods
  loadRelatedProducts(): void {
    if (!this.product || !this.product.product || !this.product.id || !this.product.product.categoryId) {
      console.warn("Missing product or category data")
      return
    }

    const categoryId = +this.product.product.categoryId
    const currentProductId = +this.product.id

    this.productService.getRelatedProducts(categoryId, currentProductId).subscribe({
      next: (products) => {
        this.relatedProducts = products
      },
      error: (err) => {
        console.error("Failed to load related products:", err)
      },
    })
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

  scrollLeft(): void {
    const container = this.scrollContainer.nativeElement
    const cardWidth = container.querySelector(".related-product-card")?.offsetWidth || 250
    const scrollAmount = (cardWidth + 16) * 4
    container.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    })
  }

  scrollRight(): void {
    const container = this.scrollContainer.nativeElement
    const cardWidth = container.querySelector(".related-product-card")?.offsetWidth || 250
    const scrollAmount = (cardWidth + 16) * 4
    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    })
  }

  // Utility methods
  trackByOptionId(index: number, option: any): number {
    return option.id
  }

  trackByOptionValue(index: number, value: any): number {
    return value.id
  }

  trackByImageUrl(index: number, image: any): string {
    return image.url
  }

  openAddReviewModal() {
    this.showAddReviewModal = true;
  }
  closeAddReviewModal() {
    this.showAddReviewModal = false;
  }
  openEditReviewModal() {
    this.showEditReviewModal = true;
  }
  closeEditReviewModal() {
    this.showEditReviewModal = false;
    this.editingReview = null;
  }

  // Override openEditReview to use modal
  openEditReview(review: any) {
    this.editingReview = review;
    this.editReviewData = {
      rating: review.rating,
      comment: review.comment,
      images: review.images ? review.images.map((img: any) => ({ imageUrl: img.imageUrl })) : [],
    };
    this.openEditReviewModal();
  }

  closeEditReview() {
    this.editingReview = null
  }

  submitEditReview() {
    if (!this.editingReview) return
    const filteredImages = this.editReviewData.images.filter((img) => img.imageUrl && img.imageUrl.trim() !== "")
    const updatedReview = {
      ...this.editingReview,
      rating: this.editReviewData.rating,
      comment: this.editReviewData.comment,
      images: filteredImages,
    }
    this.reviewService.updateReview(updatedReview).subscribe({
      next: () => {
        this.closeEditReviewModal()
        this.loadReviews()
      },
      error: () => {
        alert("Failed to update review")
      },
    })
  }

  deleteReview(review: any) {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this review?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        this.reviewService.deleteReview(review.id).subscribe({
          next: () => {
            Swal.fire("Deleted!", "Your review has been deleted.", "success")
            this.loadReviews()
          },
          error: () => {
            Swal.fire("Error", "Failed to delete review.", "error")
          },
        })
      }
    })
  }

  loadReviews(): void {
    if (!this.product?.product?.id) return
    this.isLoadingReviews = true

    this.reviewService
      .getProductReviews(
        this.product.product.id,
        this.reviewPage,
        this.reviewPageSize,
        this.reviewSort,
        this.reviewFilterRating,
      )
      .subscribe({
        next: (res) => {
          this.reviews = res.reviews
          this.reviewTotal = res.total
          this.reviewAverage = res.average
          this.reviewBreakdown = res.breakdown
          this.isLoadingReviews = false
        },
        error: () => {
          this.reviews = []
          this.reviewTotal = 0
          this.reviewAverage = 0
          this.reviewBreakdown = {}
          this.isLoadingReviews = false
        },
      })
  }

  onReviewImageSelected(event: any): void {
    const files: FileList = event.target.files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file type and size
      const validation = this.cloudinaryService.validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        continue // Skip this file
      }

      this.cloudinaryService.uploadImage(file).subscribe({
        next: (url: string) => {
          this.uploadedReviewImages.push({ imageUrl: url })
        },
        error: () => {
          alert("Image upload failed")
        },
      })
    }
  }

  removeReviewImage(i: number): void {
    this.uploadedReviewImages.splice(i, 1)
  }

  submitReview(): void {
    if (!this.product?.product?.id) return
    this.isSubmittingReview = true

    const reviewPayload: Partial<ProductReview> = {
      productId: this.product.product.id,
      rating: this.newReview.rating,
      comment: this.newReview.comment,
      images: this.uploadedReviewImages,
    }
    console.log("Review payload:", reviewPayload)
    this.reviewService.addReview(reviewPayload).subscribe({
      next: (review) => {
        this.isSubmittingReview = false
        this.newReview = { rating: 5, comment: "" }
        this.uploadedReviewImages = []
        this.loadReviews() // Refresh review list
        this.hasReviewedProduct = true;
        this.closeAddReviewModal();
        Swal.fire({
          title: "Success!",
          text: "Your review has been submitted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        })
      },
      error: (error) => {
        this.isSubmittingReview = false
        let errorMessage = "Failed to submit review. Please try again."

        if (error.error && error.error.message) {
          errorMessage = error.error.message
        } else if (error.status === 403) {
          errorMessage = "You are not allowed to give review again"
        } else if (error.message) {
          errorMessage = error.message
        }
        Swal.fire({
          title: "Error!",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK",
        })
      },
    })
  }

  checkPurchaseStatus(): void {
    // Always load reviews for everyone (logged in or not)
    this.loadReviews()

    // Only check purchase status if user is logged in
    if (!this.isLoggedIn || !this.product?.product?.id) {
      this.hasPurchasedProduct = false
      console.log("❌ Not logged in or no product ID")
      return
    }

    console.log("🔍 Checking purchase status for product:", this.product.product.id)
    console.log("👤 User ID:", this.userId)

    // Call backend API to check if user has purchased and received this product
    this.reviewService.checkPurchaseStatus(this.product.product.id).subscribe({
      next: (response) => {
        console.log("✅ Purchase check response:", response)
        this.hasPurchasedProduct = response.canReview
        this.hasReviewedProduct = response.hasReviewed
        console.log("📝 Can review:", this.hasPurchasedProduct)
        console.log("📝 Has reviewed:", this.hasReviewedProduct)
      },
      error: (error) => {
        console.error("❌ Purchase check error:", error)
        this.hasPurchasedProduct = false
        this.hasReviewedProduct = false
      },
    })
  }

  // --- For template: Math functions ---
  getRounded(value: number): number {
    return Math.round(value)
  }

  getPages(): number[] {
    return Array(Math.ceil(this.reviewTotal / this.reviewPageSize))
      .fill(0)
      .map((x, i) => i + 1)
  }

  onEditReviewImageSelected(event: any, idx: number): void {
    const file: File = event.target.files[0]
    if (!file) return
    const validation = this.cloudinaryService.validateImageFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (url: string) => {
        this.editReviewData.images[idx].imageUrl = url
      },
      error: () => {
        alert("Image upload failed")
      },
    })
  }

  removeEditReviewImage(idx: number): void {
    this.editReviewData.images.splice(idx, 1)
  }

  addEditReviewImage(input: HTMLInputElement) {
    input.value = ""
    input.click()
  }

  onAddEditReviewImageSelected(event: any) {
    const file: File = event.target.files[0]
    if (!file) return
    const validation = this.cloudinaryService.validateImageFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (url: string) => {
        if (url && url.startsWith("http")) {
          this.editReviewData.images.push({ imageUrl: url })
        } else {
          alert("Image upload failed: Invalid URL")
        }
      },
      error: () => {
        alert("Image upload failed")
      },
    })
  }

  onReviewSortChange(sort: string): void {
    this.reviewSort = sort
    this.loadReviews()
  }

  onReviewFilterChange(rating?: number): void {
    this.reviewFilterRating = rating
    this.loadReviews()
  }

  onReviewPageChange(page: number): void {
    this.reviewPage = page
    this.loadReviews()
  }

  onOfferClicked(discountId: number): void {
    this.router.navigate(['/customer/discount', discountId]);
  }

  // Method to trigger file input click for review images
  triggerFileInput(inputId: string): void {
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

}
