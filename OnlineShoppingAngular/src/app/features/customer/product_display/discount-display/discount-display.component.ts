import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DiscountDisplayDTO } from '@app/core/models/discount';

@Component({
  selector: 'app-discount-display',
  standalone: false,
  templateUrl: './discount-display.component.html',
  styleUrl: './discount-display.component.css'
})

export class DiscountDisplayComponent implements OnInit, OnChanges {
  @Input() discountHints: DiscountDisplayDTO[] = []
  @Input() displayMode: "grid" | "detail" | "cart" = "grid"
  @Input() originalPrice?: number
  @Input() discountedPrice?: number

  @Output() couponCopied = new EventEmitter<string>()
  @Output() couponApplied = new EventEmitter<string>()

  copiedCode: string | null = null

  // Categorized discounts for better display
  discountBadges: DiscountDisplayDTO[] = []
  couponCards: DiscountDisplayDTO[] = []
  freeGiftBanners: DiscountDisplayDTO[] = []
  regularDiscounts: DiscountDisplayDTO[] = []

  ngOnInit(): void {
    this.categorizeDiscounts()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["discountHints"] || changes["displayMode"]) {
      this.categorizeDiscounts()
    }
  }

  private categorizeDiscounts(): void {
    if (!this.discountHints) return

    // Reset categories
    this.discountBadges = []
    this.couponCards = []
    this.freeGiftBanners = []
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

        case "coupon":
          if (this.displayMode === "detail" || this.displayMode === "cart") {
            this.couponCards.push(hint)
          }
          break

        case "freeGift":
          if (this.displayMode === "detail") {
            this.freeGiftBanners.push(hint)
          }
          break

        default:
          // Handle other types if needed
          break
      }
    })

    console.log("📊 Categorized discounts:", {
      badges: this.discountBadges.length,
      coupons: this.couponCards.length,
      freeGifts: this.freeGiftBanners.length,
      regular: this.regularDiscounts.length,
    })
  }

  getDiscountIcon(mechanismType: string): string {
    switch (mechanismType) {
      case "coupon":
        return "pi-tag"
      case "freeGift":
        return "pi-gift"
      case "Discount":
        return "pi-percentage"
      case "wholeSale":
        return "pi-shopping-cart"
      default:
        return "pi-dollar"
    }
  }

  getDiscountBadgeClass(mechanismType: string): string {
    switch (mechanismType) {
      case "coupon":
        return "badge-coupon"
      case "freeGift":
        return "badge-gift"
      case "Discount":
        return "badge-discount"
      case "wholeSale":
        return "badge-wholesale"
      default:
        return "badge-default"
    }
  }

  formatDiscountBadge(discount: DiscountDisplayDTO): string {
    if (discount.discountType === "PERCENTAGE" && discount.value) {
      return `${discount.value}% Off`
    } else if (discount.discountType === "FIXED" && discount.value) {
      return `MMK ${discount.value} Off`
    }
    return discount.shortLabel || discount.name || "Discount"
  }

  // Legacy methods for backward compatibility
  getVisibleDiscounts(): DiscountDisplayDTO[] {
    return this.regularDiscounts
  }

  getDiscountBadges(): DiscountDisplayDTO[] {
    return this.discountBadges
  }

  getCouponCards(): DiscountDisplayDTO[] {
    return this.couponCards
  }

  getFreeGiftBanners(): DiscountDisplayDTO[] {
    return this.freeGiftBanners
  }

  async copyCouponCode(code: string): Promise<void> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(code)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = code
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }

      this.copiedCode = code
      this.couponCopied.emit(code)

      setTimeout(() => {
        this.copiedCode = null
      }, 2000)

      console.log(`📋 Coupon code copied: ${code}`)
    } catch (err) {
      console.error("Failed to copy coupon code:", err)
    }
  }

  applyCoupon(code: string): void {
    this.couponApplied.emit(code)
    console.log(`🎟️ Coupon applied: ${code}`)
  }

  hasVisibleDiscounts(): boolean {
    return this.regularDiscounts.length > 0
  }

  hasDiscountBadges(): boolean {
    return this.discountBadges.length > 0
  }

  hasCouponCards(): boolean {
    return this.couponCards.length > 0
  }

  hasFreeGiftBanners(): boolean {
    return this.freeGiftBanners.length > 0
  }

  shouldShowPriceComparison(): boolean {
    return (
      this.displayMode === "grid" &&
      this.originalPrice !== undefined &&
      this.discountedPrice !== undefined &&
      this.discountedPrice < this.originalPrice
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
        return this.couponCards.length + this.freeGiftBanners.length + this.regularDiscounts.length
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
