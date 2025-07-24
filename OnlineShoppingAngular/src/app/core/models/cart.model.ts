// export interface CartItem {
//   productId: number;
//   productName: string;
//   variantId: number;
//   variantSku: string;
//   stock: number;
//   price: number;
//   imgPath?: string;
//   quantity: number;
//   brandId: number;
//   categoryId: number;
// }

import type { DiscountDisplayDTO } from "@app/core/models/discount"

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

  // Enhanced discount information stored with each item
  originalPrice?: number
  discountedPrice?: number
  appliedDiscounts?: DiscountDisplayDTO[]
  discountBreakdown?: { label: string; amount: number }[]
  autoDiscountSavings?: number
  couponDiscountAmount?: number
}

// Applied coupon interface for cart-level storage
export interface AppliedCoupon {
  discount: DiscountDisplayDTO
  appliedAmount: number
  appliedToItems: { productId: number; variantId: number; discountAmount: number }[]
}

// Cart summary interface for localStorage
export interface CartSummary {
  originalSubtotal: number
  discountedSubtotal: number
  autoDiscountSavings: number
  couponSavings: number
  totalSavings: number
  appliedCoupon: AppliedCoupon | null
}

export interface CartItemWithDiscounts extends CartItem {
  originalPrice: number
  discountedPrice: number
  appliedDiscounts: DiscountDisplayDTO[]
  discountBreakdown: { label: string; amount: number }[]
}

export interface FullCartData {
  cartItems: CartItemWithDiscounts[];
  cartTotal: number;
  appliedCoupon: AppliedCoupon | null;
  autoDiscountSavings: number;
}
