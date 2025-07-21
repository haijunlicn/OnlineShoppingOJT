import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { CartItem } from '../../../../core/models/cart.model';
import { DiscountDisplayDTO } from '@app/core/models/discount';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';
import { evaluateCartConditions } from '@app/core/services/discountChecker';


interface AppliedDiscount {
  discount: DiscountDisplayDTO
  appliedAmount: number
  appliedToItems: { productId: number; variantId: number; discountAmount: number }[]
}

@Component({
  selector: "app-cart",
  standalone: false,
  templateUrl: "./cart.component.html",
  styleUrls: ["./cart.component.css"],
})
export class CartComponent implements OnInit {
  cart: CartItem[] = []

  // Coupon code logic
  couponCode = ""
  couponMessage = ""
  couponSuccess = false

  // Discount system
  availableDiscounts: DiscountDisplayDTO[] = []
  appliedDiscount: AppliedDiscount | null = null

  // Shipping for discount calculations
  shipping = { city: "", cost: 0 }

  constructor(
    private cartService: CartService,
    private router: Router,
    private discountDisplayService: DiscountDisplayService,
  ) {}

  ngOnInit(): void {
    this.loadCart()
    this.loadAvailableDiscounts()
  }

  loadCart(): void {
    this.cart = this.cartService.getCart()
  }

  loadAvailableDiscounts(): void {
    this.discountDisplayService.getProductDiscountHints().subscribe({
      next: (hintMap) => {
        // Extract all coupon-type discounts from the hint map
        this.availableDiscounts = []
        Object.values(hintMap).forEach((hints) => {
          hints.forEach((hint) => {
            if (hint.type === "COUPON" && hint.couponcode) {
              this.availableDiscounts.push(hint)
            }
          })
        })
      },
      error: (err) => {
        console.error("Error loading discount hints:", err)
      },
    })
  }

  changeQty(productId: number, variantId: number, change: number): void {
    this.cartService.updateQuantity(productId, variantId, change)
    this.loadCart()
    // Recalculate discounts when cart changes
    if (this.appliedDiscount) {
      this.recalculateDiscount()
    }
  }

  removeItem(productId: number, variantId: number): void {
    this.cartService.removeFromCart(productId, variantId)
    this.loadCart()
    // Recalculate discounts when cart changes
    if (this.appliedDiscount) {
      this.recalculateDiscount()
    }
  }

  getSubtotal(): number {
    return this.cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  getTotal(): number {
    const subtotal = this.getSubtotal()
    const discountAmount = this.appliedDiscount?.appliedAmount || 0
    return Math.max(0, subtotal - discountAmount)
  }

  getItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0)
  }

  clearCart(): void {
    this.cartService.clearCart()
    this.loadCart()
    this.appliedDiscount = null
    this.couponCode = ""
    this.couponMessage = ""
  }

  proceedToCheckout(): void {
    if (this.cart.length === 0) {
      alert("Your cart is empty. Please add items before proceeding to checkout.")
      return
    }

    this.router.navigate(["/customer/order"], {
      state: {
        cartItems: this.cart,
        cartTotal: this.getTotal(),
        appliedDiscount: this.appliedDiscount,
      },
    })
  }

  calculateDiscountAmount(discount: DiscountDisplayDTO, subtotal: number): number {
    if (!discount.value) return 0

    const value = Number.parseFloat(discount.value)

    if (discount.discountType === "PERCENTAGE") {
      let discountAmount = subtotal * (value / 100)

      // Apply max discount cap if specified
      if (discount.maxDiscountAmount) {
        const maxCap = Number.parseFloat(discount.maxDiscountAmount)
        discountAmount = Math.min(discountAmount, maxCap)
      }

      return discountAmount
    } else if (discount.discountType === "FIXED") {
      return Math.min(value, subtotal) // Don't exceed subtotal
    }

    return 0
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponMessage = "Please enter a coupon code"
      this.couponSuccess = false
      return
    }

    // Check if coupon already applied
    if (this.appliedDiscount) {
      this.couponMessage = "Only one coupon can be applied per order. Remove the current coupon to apply a new one."
      this.couponSuccess = false
      return
    }

    // Find matching discount
    const matchingDiscount = this.availableDiscounts.find(
      (discount) => discount.couponcode?.toLowerCase() === this.couponCode.toLowerCase(),
    )

    if (!matchingDiscount) {
      this.couponMessage = "The coupon code you entered is not valid or has expired."
      this.couponSuccess = false
      return
    }

    // Check if discount conditions are met using your existing discount checker
    if (matchingDiscount.conditionGroups && matchingDiscount.conditionGroups.length > 0) {
      const conditionsMet = evaluateCartConditions(matchingDiscount.conditionGroups, this.cart, this.shipping)
      if (!conditionsMet) {
        this.couponMessage = matchingDiscount.conditionSummary || "This coupon cannot be applied to your current cart."
        this.couponSuccess = false
        return
      }
    }

    const subtotal = this.getSubtotal()
    const discountAmount = this.calculateDiscountAmount(matchingDiscount, subtotal)

    // Calculate how discount is applied to each item (proportionally)
    const appliedToItems = this.cart.map((item) => {
      const itemTotal = item.price * item.quantity
      const itemProportion = itemTotal / subtotal
      const itemDiscountAmount = discountAmount * itemProportion

      return {
        productId: item.productId,
        variantId: item.variantId,
        discountAmount: itemDiscountAmount,
      }
    })

    this.appliedDiscount = {
      discount: matchingDiscount,
      appliedAmount: discountAmount,
      appliedToItems,
    }

    this.couponMessage = `${matchingDiscount.name} has been applied to your order.`
    this.couponSuccess = true
  }

  removeCoupon(): void {
    this.appliedDiscount = null
    this.couponCode = ""
    this.couponMessage = "Coupon has been removed from your order."
    this.couponSuccess = true
  }

  recalculateDiscount(): void {
    if (!this.appliedDiscount) return

    const subtotal = this.getSubtotal()
    if (subtotal === 0) {
      this.appliedDiscount = null
      return
    }

    const discountAmount = this.calculateDiscountAmount(this.appliedDiscount.discount, subtotal)

    // Recalculate proportional distribution
    const appliedToItems = this.cart.map((item) => {
      const itemTotal = item.price * item.quantity
      const itemProportion = itemTotal / subtotal
      const itemDiscountAmount = discountAmount * itemProportion

      return {
        productId: item.productId,
        variantId: item.variantId,
        discountAmount: itemDiscountAmount,
      }
    })

    this.appliedDiscount = {
      ...this.appliedDiscount,
      appliedAmount: discountAmount,
      appliedToItems,
    }
  }

  getItemDiscountAmount(productId: number, variantId: number): number {
    if (!this.appliedDiscount) return 0

    const itemDiscount = this.appliedDiscount.appliedToItems.find(
      (item) => item.productId === productId && item.variantId === variantId,
    )

    return itemDiscount?.discountAmount || 0
  }

  getItemFinalTotal(item: CartItem): number {
    const itemTotal = item.price * item.quantity
    const itemDiscount = this.getItemDiscountAmount(item.productId, item.variantId)
    return itemTotal - itemDiscount
  }
}
