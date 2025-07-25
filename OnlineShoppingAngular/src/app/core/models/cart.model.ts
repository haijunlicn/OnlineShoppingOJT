import type { DiscountDisplayDTO } from "@app/core/models/discount"

// Simplify CartItem interface by making discount fields required when present
export interface CartItem {
  productId: number
  productName: string
  variantId: number
  variantSku: string
  stock: number
  price: number
  imgPath?: string
  quantity: number
  brandId: number
  categoryId: number
}

export interface CartItemWithDiscounts extends CartItem {
  originalPrice: number
  discountedPrice: number
  appliedDiscounts: DiscountDisplayDTO[]
  discountBreakdown: { label: string; amount: number }[]
}

// Simplified applied coupon
export interface AppliedCoupon {
  discount: DiscountDisplayDTO
  appliedAmount: number
  appliedToItems: { productId: number; variantId: number; discountAmount: number }[]
}

// Simplified cart data
export interface FullCartData {
  cartItems: CartItemWithDiscounts[]
  cartTotal: number
  appliedCoupon: AppliedCoupon | null
  autoDiscountSavings: number
}
