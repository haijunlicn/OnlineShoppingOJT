import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
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
import { DiscountConditionGroupEA_C, DiscountDisplayDTO } from '@app/core/models/discount';
import { evaluateCartConditions } from '@app/core/services/discountChecker';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';
import { CartItem } from '@app/core/models/cart.model';

@Component({
  selector: "app-product-detail",
  standalone: false,
  templateUrl: "./product-detail.component.html",
  styleUrl: "./product-detail.component.css",
})

export class ProductDetailComponent implements OnInit {
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
  isEligibleForDiscount = false
  discountsExpanded = false
  stickyProgressDismissed = false

  // Cart and wishlist
  cartItems: CartItem[] = []
  wishList = new Set<number>()

  // Shipping
  shipping = { city: "", cost: 0 }

  @Input() categoryId!: number
  @Input() productId!: number
  @ViewChild("scrollContainer", { static: false }) scrollContainer!: ElementRef

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private dialog: MatDialog,
    private discountDisplayService: DiscountDisplayService,
  ) { }

  ngOnInit(): void {
    this.initializeComponent()
    this.subscribeToCartChanges()
    this.loadStickyProgressState()
  }

  private initializeComponent(): void {
    this.fetchProductDetail()
    this.loadWishlist()
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

  fetchProductDetail(): void {
    const id = this.route.snapshot.paramMap.get("id")
    if (!id) {
      this.router.navigate(["/customer/productList"])
      return
    }

    this.productService.getPublicProductById(+id).subscribe({
      next: (data) => {
        this.product = data
        this.initializeProductData()
        this.loadRelatedProducts()
        this.loadDiscountHints()
      },
      error: (err) => {
        console.error("Error fetching product:", err)
        this.router.navigate(["/customer/productList"])
      },
    })
  }

  private initializeProductData(): void {
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
    this.conditionalDiscounts = this.discountHints.filter(hint => hint.requireFrontendChecking === true);

    // Filter discounts where NO condition in any conditionGroup has eligible === false
    // Optionally require at least one condition eligible === true
    this.progressConditionalDiscounts = this.discountHints.filter(hint => {
      if (!hint.requireFrontendChecking) return false;
      if (!hint.conditionGroups || hint.conditionGroups.length === 0) return false;

      // Flatten all conditions of all groups
      const allConditions = hint.conditionGroups.flatMap(group => group.conditions ?? []);

      // No condition should have eligible === false
      const hasFalse = allConditions.some(cond => cond.eligible === false);
      if (hasFalse) return false;

      // Optionally, require at least one eligible === true condition
      // const hasTrue = allConditions.some(cond => cond.eligible === true);
      // if (!hasTrue) return false;

      return true;
    });

    console.log("🎯 Conditional discounts:", this.conditionalDiscounts);
    console.log("✅ Progress conditional discounts (no condition false & some true):", this.progressConditionalDiscounts);
    console.log("🔍 All discount hints:", this.discountHints);
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

  hasActiveDiscounts(): boolean {
    return this.eligibleDiscounts.length > 0
  }

  getDiscountedPrice(): number {
    if (!this.hasActiveDiscounts()) {
      return this.getCurrentDisplayPrice()
    }

    const currentPrice = this.getCurrentDisplayPrice()
    const result = this.discountDisplayService.calculateDiscountedPrice(currentPrice, this.eligibleDiscounts)
    return result.discountedPrice
  }

  getSavingsAmount(): number {
    return this.getCurrentDisplayPrice() - this.getDiscountedPrice()
  }

  // Discount methods
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
    if (discount.discountType === "PERCENTAGE" && discount.value) {
      return `${discount.value}% Off`
    } else if (discount.discountType === "FIXED" && discount.value) {
      return `MMK ${discount.value} Off`
    }
    return discount.shortLabel || discount.name || "Discount"
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

  // Coupon methods
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
    const id = typeof productId === "string" ? +productId : productId
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
}
