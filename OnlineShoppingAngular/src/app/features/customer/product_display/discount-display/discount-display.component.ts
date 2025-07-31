import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DiscountDisplayDTO } from '@app/core/models/discount';
import { DiscountTextService } from '@app/core/services/discount-text.service';
import { Router } from '@angular/router';

@Component({
  selector: "app-discount-display",
  standalone: false,
  templateUrl: "./discount-display.component.html",
  styleUrl: "./discount-display.component.css",
})
export class DiscountDisplayComponent implements OnInit, OnChanges {
  @Input() discountHints: DiscountDisplayDTO[] = []
  @Input() displayMode: "grid" | "detail" | "cart" = "grid"
  @Input() originalPrice?: number
  @Input() discountedPrice?: number
  @Input() showTitle = true // Add this missing property

  @Output() couponCopied = new EventEmitter<string>()
  @Output() couponApplied = new EventEmitter<string>()

  copiedCode: string | null = null

  // Categorized discounts for better display
  discountBadges: DiscountDisplayDTO[] = []
  couponCards: DiscountDisplayDTO[] = []
  regularDiscounts: DiscountDisplayDTO[] = []

  // Detect parent component for conditional styling
  isHomePage = false
  isProductList = false

  constructor(
    private discountTextService: DiscountTextService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.categorizeDiscounts()
    this.detectParentComponent()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["discountHints"] || changes["displayMode"]) {
      this.categorizeDiscounts()
    }
  }

  private detectParentComponent(): void {
    const currentUrl = this.router.url;
    console.log("🔍 Current URL for discount display:", currentUrl);
    
    // Check if we're in home page (multiple possible patterns)
    if (currentUrl.includes('/customer/home') || 
        currentUrl === '/customer/home' || 
        currentUrl === '/customer' ||
        currentUrl === '/') {
      this.isHomePage = true;
      console.log("🏠 Detected: Home page discount display");
    }
    // Check if we're in product list (multiple possible patterns)
    else if (currentUrl.includes('/customer/productList') || 
             currentUrl === '/customer/productList' ||
             currentUrl.includes('/customer/products')) {
      this.isProductList = true;
      console.log("📋 Detected: Product list discount display");
    }
    // Default to product list if not home page
    else {
      this.isProductList = true;
      console.log("📋 Default: Product list discount display");
    }
    
    console.log("📍 Component context:", {
      isHomePage: this.isHomePage,
      isProductList: this.isProductList,
      currentUrl: currentUrl
    });
  }

  // Get conditional margin class for discount badges
  getDiscountBadgesMarginClass(): string {
    if (this.isHomePage) {
      return 'home-page-discount-badges';
    }
    return 'product-list-discount-badges';
  }

  private categorizeDiscounts(): void {
    if (!this.discountHints) return

    // Reset categories
    this.discountBadges = []
    this.couponCards = []
    this.regularDiscounts = []

    // Categorize discounts based on mechanism type and display mode
    this.discountHints.forEach((hint) => {
      switch (hint.mechanismType) {
        case "Discount":
          if (this.displayMode === "grid") {
            this.discountBadges.push(hint)
          } else {
            this.regularDiscounts.push(hint)
          }
          break

        case "Coupon":
          if (this.displayMode === "detail" || this.displayMode === "cart") {
            this.couponCards.push(hint)
          }
          break

        default:
          // Handle other types if needed
          break
      }
    })
  }

  // ===== DELEGATE TO DISCOUNT TEXT SERVICE =====

  getDiscountIcon(mechanismType: string): string {
    switch (mechanismType) {
      case "Coupon":
        return "pi-tag"
      case "Discount":
        return "pi-percentage"
      default:
        return "pi-dollar"
    }
  }

  getDiscountBadgeClass(mechanismType: string): string {
    switch (mechanismType) {
      case "Coupon":
        return "badge-coupon"
      case "Discount":
        return "badge-discount"
      default:
        return "badge-default"
    }
  }

  // formatDiscountBadge(discount: DiscountDisplayDTO): string {
  //   return this.discountTextService.formatDiscountValue(discount)
  // }

  formatDiscountBadge(discount: DiscountDisplayDTO): string {
    let base = this.discountTextService.formatDiscountValue(discount);

    // If it's a percentage discount with a max cap
    if (
      discount.discountType === 'PERCENTAGE' &&
      discount.maxDiscountAmount &&
      Number(discount.maxDiscountAmount) > 0
    ) {
      base += ` (Up to MMK ${discount.maxDiscountAmount.toLocaleString()})`;
    }

    return base;
  }


  // ===== LEGACY METHODS FOR BACKWARD COMPATIBILITY =====

  getVisibleDiscounts(): DiscountDisplayDTO[] {
    return this.regularDiscounts
  }

  getDiscountBadges(): DiscountDisplayDTO[] {
    return this.discountBadges
  }

  getCouponCards(): DiscountDisplayDTO[] {
    return this.couponCards
  }

  // ===== CLIPBOARD AND COUPON METHODS =====

  async copyCouponCode(code: string): Promise<void> {
    try {
      await this.discountTextService.copyToClipboard(code)

      this.copiedCode = code
      this.couponCopied.emit(code)

      setTimeout(() => {
        this.copiedCode = null
      }, 2000)
    } catch (err) {
      console.error("Failed to copy coupon code:", err)
    }
  }

  applyCoupon(code: string): void {
    this.couponApplied.emit(code)
  }

  // ===== DISPLAY STATE METHODS =====

  hasVisibleDiscounts(): boolean {
    return this.regularDiscounts.length > 0
  }

  hasDiscountBadges(): boolean {
    return this.discountBadges.length > 0
  }

  hasCouponCards(): boolean {
    return this.couponCards.length > 0
  }

  shouldShowPriceComparison(): boolean {
    return (
      this.originalPrice !== undefined &&
      this.discountedPrice !== undefined &&
      this.discountedPrice < this.originalPrice &&
      this.getApplicableDiscountCount() > 0
    )
  }

  getTotalDiscountCount(): number {
    return this.discountHints.length
  }

  getApplicableDiscountCount(): number {
    switch (this.displayMode) {
      case "grid":
        return this.discountBadges.length
      case "detail":
        return this.couponCards.length + this.regularDiscounts.length
      case "cart":
        return this.couponCards.length + this.regularDiscounts.length
      default:
        return 0
    }
  }

  getSavingsAmount(): number {
    if (this.shouldShowPriceComparison()) {
      return this.originalPrice! - this.discountedPrice!
    }
    return 0
  }

  getSavingsPercentage(): number {
    if (this.shouldShowPriceComparison() && this.originalPrice! > 0) {
      return Math.round(((this.originalPrice! - this.discountedPrice!) / this.originalPrice!) * 100)
    }
    return 0
  }

  // ===== UTILITY METHODS =====

  isDiscountExpired(discount: DiscountDisplayDTO): boolean {
    // Add logic to check if discount is expired
    // This would require end date information in the DiscountDisplayDTO
    return false
  }

  getDiscountUrgencyLevel(discount: DiscountDisplayDTO): "high" | "medium" | "low" {
    // Add logic to determine urgency based on expiry date, usage limits, etc.
    return "medium"
  }

  formatConditionSummary(conditionSummary: string): string {
    // Format condition summary for better readability
    return conditionSummary
      .replace(/(\d+)/g, "<strong>$1</strong>")
      .replace(/minimum/gi, "Minimum")
      .replace(/purchase/gi, "purchase")
  }
}
