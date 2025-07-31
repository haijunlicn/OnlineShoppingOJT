import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { AppliedCoupon, CartItem, CartItemWithDiscounts } from '../../../../core/models/cart.model';
import { DiscountDisplayDTO, DiscountType } from '@app/core/models/discount';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';
import { evaluateCartConditions } from '@app/core/services/discountChecker';
import { AuthService } from '@app/core/services/auth.service';


@Component({
  selector: "app-cart",
  standalone: false,
  templateUrl: "./cart.component.html",
  styleUrls: ["./cart.component.css"],
})

export class CartComponent implements OnInit {
  cart: CartItem[] = []
  cartWithDiscounts: CartItemWithDiscounts[] = []

  // Coupon code logic
  couponCode = ""
  couponMessage = ""
  couponSuccess = false

  // Discount system
  allDiscountHints: { [productId: number]: DiscountDisplayDTO[] } = {}
  eligibleAutoDiscounts: DiscountDisplayDTO[] = []
  appliedCoupon: AppliedCoupon | null = null
  availableCoupons: DiscountDisplayDTO[] = []

  // Shipping for discount calculations
  shipping = { city: "", cost: 0 }

  constructor(
    private cartService: CartService,
    private router: Router,
    private discountDisplayService: DiscountDisplayService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.loadCart()
    this.loadDiscountHints()

    // Listen for cart changes and recalculate discounts
    this.cartService.cartItems$.subscribe((cartItems) => {
      this.cart = cartItems
      this.recalculateAllDiscounts()
    })

    // Listen for auth changes and reload discounts
    this.authService.isLoggedIn$.subscribe(() => {
      this.loadDiscountHints()
    })
  }

  loadCart(): void {
    // Try to get the full cart data with discounts first
    const fullCart = this.cartService.getFullCart();

    if (fullCart && fullCart.cartItems && fullCart.cartItems.length) {
      this.cartWithDiscounts = fullCart.cartItems;
    } else {
      // No full cart stored, fallback to basic cart items with default discount info
      const basicCart = this.cartService.getCartItemsOnly();

      this.cartWithDiscounts = basicCart.map(item => ({
        ...item,
        originalPrice: item.price,
        discountedPrice: item.price,
        appliedDiscounts: [],
        discountBreakdown: []
      }));
    }

    // Also update plain cart (if needed)
    this.cart = this.cartWithDiscounts;
  }


  // loadCart(): void {
  //   this.cart = this.cartService.getCart()
  // }

  loadDiscountHints(): void {
    this.discountDisplayService.getProductDiscountHints().subscribe({
      next: (hintMap) => {
        this.allDiscountHints = hintMap
        this.extractAvailableCoupons()
        this.recalculateAllDiscounts()
      },
      error: (err) => {
        console.error("Error loading discount hints:", err)
      },
    })
  }

  private extractAvailableCoupons(): void {
    this.availableCoupons = []
    Object.values(this.allDiscountHints).forEach((hints) => {
      hints.forEach((hint) => {
        if (hint.mechanismType === "Coupon" && hint.couponcode) {
          // Avoid duplicates
          if (!this.availableCoupons.find((c) => c.couponcode === hint.couponcode)) {
            this.availableCoupons.push(hint)
          }
        }
      })
    })
  }

  private recalculateAllDiscounts(): void {
    if (!this.cart.length || !Object.keys(this.allDiscountHints).length) {
      this.cartWithDiscounts = this.cart.map((item) => ({
        ...item,
        originalPrice: item.price,
        discountedPrice: item.price,
        appliedDiscounts: [],
        discountBreakdown: [],
      }))
      return
    }

    // Calculate automatic discounts for each item
    this.cartWithDiscounts = this.cart.map((item) => {
      const productHints = this.allDiscountHints[item.productId] || []

      // Filter out coupon discounts for automatic application
      const autoDiscountHints = productHints.filter((hint) => hint.mechanismType !== "Coupon")

      // Evaluate which discounts are eligible
      const eligibleHints = this.discountDisplayService.evaluateEligibleDiscounts(autoDiscountHints, this.cart)

      // Filter to only discounts that affect this specific product
      const applicableHints = eligibleHints.filter((hint) => hint.offeredProductIds?.includes(item.productId))
      const result = this.discountDisplayService.calculateDiscountedPrice(item.price, applicableHints)

      return {
        ...item,
        originalPrice: item.price,
        discountedPrice: result.discountedPrice,
        appliedDiscounts: applicableHints,
        discountBreakdown: result.breakdown,
      }
    })

    // Recalculate coupon if applied
    if (this.appliedCoupon) {
      this.recalculateCouponDiscount()
    }
  }

  changeQty(productId: number, variantId: number, change: number): void {
    this.cartService.updateQuantity(productId, variantId, change)
    // Cart subscription will handle recalculation
  }

  removeItem(productId: number, variantId: number): void {
    this.cartService.removeFromCart(productId, variantId)
    // Cart subscription will handle recalculation
  }

  getSubtotal(): number {
    return this.cartWithDiscounts.reduce((total, item) => total + item.discountedPrice * item.quantity, 0)
  }

  getOriginalSubtotal(): number {
    return this.cartWithDiscounts.reduce((total, item) => total + item.originalPrice * item.quantity, 0)
  }

  getAutoDiscountSavings(): number {
    return this.getOriginalSubtotal() - this.getSubtotal()
  }

  getTotal(): number {
    const subtotal = this.getSubtotal()
    const couponDiscount = this.appliedCoupon?.appliedAmount || 0
    return Math.max(0, subtotal - couponDiscount)
  }

  getTotalSavings(): number {
    const autoSavings = this.getAutoDiscountSavings()
    const couponSavings = this.appliedCoupon?.appliedAmount || 0
    return autoSavings + couponSavings
  }

  getItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0)
  }

  clearCart(): void {
    this.cartService.clearCart()
    this.appliedCoupon = null
    this.couponCode = ""
    this.couponMessage = ""
  }

  proceedToCheckout(): void {
    if (this.cart.length === 0) {
      alert("Your cart is empty. Please add items before proceeding to checkout.")
      return
    }

    this.cartService.setCartWithDiscounts(this.cartWithDiscounts, this.getTotal(), this.appliedCoupon, this.getAutoDiscountSavings())
    this.router.navigate(['/customer/order'])
  }

  // Coupon-specific methods
  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponMessage = "Please enter a coupon code"
      this.couponSuccess = false
      return
    }

    if (this.appliedCoupon) {
      this.couponMessage = "Only one coupon can be applied per order. Remove the current coupon to apply a new one."
      this.couponSuccess = false
      return
    }

    const matchingCoupon = this.availableCoupons.find(
      (coupon) => coupon.couponcode?.toLowerCase() === this.couponCode.toLowerCase(),
    )

    if (!matchingCoupon) {
      this.couponMessage = "The coupon code you entered is not valid or has expired."
      this.couponSuccess = false
      return
    }

    // Check usage limit asynchronously
    this.discountDisplayService.canUserUseMechanism(matchingCoupon.mechanismId!).subscribe(response => {
      console.log('🔍 Step 1: Mechanism usage check response:', response)

      if (!response.canUse) {
        console.log('❌ Step 1.1: Cannot use mechanism. Reason:', response.status)

        if (response.status === 'EXCEEDED_TOTAL_LIMIT') {
          this.couponMessage = 'This coupon has reached its total usage limit.'
        } else if (response.status === 'EXCEEDED_PER_USER_LIMIT') {
          this.couponMessage = 'You have used this coupon too many times.'
        } else {
          this.couponMessage = 'This coupon is currently unavailable.'
        }

        this.couponSuccess = false
        return
      }

      console.log('✅ Step 1.2: Mechanism usage allowed.')

      // Check condition groups
      if (
        matchingCoupon.conditionGroups &&
        matchingCoupon.conditionGroups.length > 0
      ) {
        console.log('🔍 Step 2: Evaluating condition groups:', matchingCoupon.conditionGroups)

        const conditionsMet = evaluateCartConditions(
          matchingCoupon.conditionGroups,
          this.cart,
          this.shipping,
        )

        console.log('✅ Step 2.1: Conditions met:', conditionsMet)

        if (!conditionsMet) {
          this.couponMessage = "This coupon cannot be applied to your current cart."
          this.couponSuccess = false
          return
        }
      } else {
        console.log('ℹ️ Step 2: No condition groups to evaluate.')
      }

      // Optionally check target items
      if (matchingCoupon.offeredProductIds && matchingCoupon.offeredProductIds.length > 0) {
        console.log('🔍 Step 3: Checking target items in cart. Required:', matchingCoupon.offeredProductIds)

        const cartHasTargetItem = this.cart.some(item =>
          matchingCoupon.offeredProductIds!.includes(item.productId)
        )

        console.log('✅ Step 3.1: Cart has required target item:', cartHasTargetItem)

        if (!cartHasTargetItem) {
          this.couponMessage = "This coupon can only be applied to specific items in your cart."
          this.couponSuccess = false
          return
        }
      } else {
        console.log('ℹ️ Step 3: No target item restriction.')
      }

      // All checks passed
      console.log('🎉 Step 4: All checks passed. Applying coupon now.')
      this.applyCouponDiscount(matchingCoupon)
      this.couponMessage = "Coupon applied successfully!"
      this.couponSuccess = true
    })


    // this.discountDisplayService.canUserUseMechanism(matchingCoupon.mechanismId!).subscribe(response => {
    //   if (!response.canUse) {
    //     if (response.status === 'EXCEEDED_TOTAL_LIMIT') {
    //       this.couponMessage = 'This coupon has reached its total usage limit.'
    //     } else if (response.status === 'EXCEEDED_PER_USER_LIMIT') {
    //       this.couponMessage = 'You have used this coupon too many times.'
    //     } else {
    //       this.couponMessage = 'This coupon is currently unavailable.'
    //     } 
    //     this.couponSuccess = false
    //     return
    //   }

    //   // Usage is allowed, now check conditions
    //   if (
    //     matchingCoupon.conditionGroups &&
    //     matchingCoupon.conditionGroups.length > 0
    //   ) {
    //     const conditionsMet = evaluateCartConditions(
    //       matchingCoupon.conditionGroups,
    //       this.cart,
    //       this.shipping,
    //     )
    //     if (!conditionsMet) {
    //       this.couponMessage = "This coupon cannot be applied to your current cart."
    //       this.couponSuccess = false
    //       return
    //     }
    //   }

    //   // All checks passed, apply coupon
    //   this.applyCouponDiscount(matchingCoupon)
    //   this.couponMessage = "Coupon applied successfully!"
    //   this.couponSuccess = true
    // })
  }

  private applyCouponDiscount(coupon: DiscountDisplayDTO): void {
    const applied = this.calculateAppliedCoupon(coupon, true); // true = use originalPrice

    if (!applied) {
      this.couponMessage = "This coupon cannot be applied to your current cart.";
      this.couponSuccess = false;
      return;
    }

    this.appliedCoupon = applied;
    this.couponMessage = `${coupon.name} has been applied to eligible items in your order.`;
    this.couponSuccess = true;
  }

  private calculateCouponAmount(coupon: DiscountDisplayDTO, subtotal: number): number {
    if (!coupon.value) return 0

    const value = Number.parseFloat(coupon.value)

    if (coupon.discountType === "PERCENTAGE") {
      let discountAmount = subtotal * (value / 100)

      if (coupon.maxDiscountAmount) {
        const maxCap = Number.parseFloat(coupon.maxDiscountAmount)
        discountAmount = Math.min(discountAmount, maxCap)
      }

      return discountAmount
    } else if (coupon.discountType === "FIXED") {
      return Math.min(value, subtotal)
    }

    return 0
  }

  private recalculateCouponDiscount(): void {
    if (!this.appliedCoupon) return;

    const updated = this.calculateAppliedCoupon(this.appliedCoupon.discount, true); // Keep consistent

    if (!updated) {
      this.appliedCoupon = null;
      return;
    }

    this.appliedCoupon = updated;
  }

  removeCoupon(): void {
    this.appliedCoupon = null
    this.couponCode = ""
    this.couponMessage = "Coupon has been removed from your order."
    this.couponSuccess = true
  }

  getCouponDiscountForItem(productId: number, variantId: number): number {
    if (!this.appliedCoupon) return 0

    const itemDiscount = this.appliedCoupon.appliedToItems.find(
      (item) => item.productId === productId && item.variantId === variantId,
    )

    return itemDiscount?.discountAmount || 0
  }

  getCouponPercentageDiscountForItem(productId: number, variantId: number): number {
    if (!this.appliedCoupon) return 0

    // Skip if coupon is FIXED (only apply if it's PERCENTAGE)
    if (this.appliedCoupon.discount.discountType !== 'PERCENTAGE') return 0

    const itemDiscount = this.appliedCoupon.appliedToItems.find(
      (item) => item.productId === productId && item.variantId === variantId
    )

    return itemDiscount?.discountAmount || 0
  }

  private calculateAppliedCoupon(
    coupon: DiscountDisplayDTO,
    useOriginalPrice: boolean
  ): AppliedCoupon | null {
    const offeredProductIds = coupon.offeredProductIds ?? [];

    const eligibleItems = this.cartWithDiscounts.filter(item =>
      offeredProductIds.includes(item.productId)
    );

    if (eligibleItems.length === 0) return null;

    const subtotal = eligibleItems.reduce(
      (acc, item) =>
        acc + (useOriginalPrice ? item.originalPrice : item.discountedPrice) * item.quantity,
      0
    );

    if (subtotal === 0) return null;

    const couponAmount = this.calculateCouponAmount(coupon, subtotal);

    const appliedToItems = eligibleItems.map((item) => {
      const itemTotal = (useOriginalPrice ? item.originalPrice : item.discountedPrice) * item.quantity;
      const itemProportion = itemTotal / subtotal;
      const itemCouponAmount = couponAmount * itemProportion;

      return {
        productId: item.productId,
        variantId: item.variantId,
        discountAmount: itemCouponAmount,
      };
    });

    return {
      discount: coupon,
      appliedAmount: couponAmount,
      appliedToItems,
    };
  }

  getItemFinalTotal(item: CartItemWithDiscounts): number {
    const discountedTotal = item.discountedPrice * item.quantity
    const couponDiscount = this.getCouponDiscountForItem(item.productId, item.variantId)
    return Math.max(0, discountedTotal - couponDiscount)
  }

  getItemFinalTotalWithoutFlatCoupon(item: CartItemWithDiscounts): number {
    const discountedTotal = item.discountedPrice * item.quantity;
    const coupon = this.appliedCoupon?.discount;
    let couponAmount = this.getCouponDiscountForItem(item.productId, item.variantId);
    if (coupon?.discountType === DiscountType.FIXED) {
      couponAmount = 0;
    }
    return Math.max(0, discountedTotal - couponAmount);
  }

  getItemFinalTotalWithoutCoupon(item: CartItemWithDiscounts): number {
    return Math.max(0, item.discountedPrice * item.quantity)
  }


  getItemOriginalTotal(item: CartItemWithDiscounts): number {
    return item.originalPrice * item.quantity
  }

  hasAutoDiscounts(item: CartItemWithDiscounts): boolean {
    return item.appliedDiscounts.length > 0
  }

  getAutoDiscountLabels(item: CartItemWithDiscounts): string {
    return item.discountBreakdown.map((d) => d.label).join(", ")
  }
}
