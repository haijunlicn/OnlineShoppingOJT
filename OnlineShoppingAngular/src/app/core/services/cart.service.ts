import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { AppliedCoupon, CartItem, CartItemWithDiscounts, FullCartData } from "../models/cart.model"
import { AuthService } from "./auth.service"

@Injectable({
  providedIn: "root",
})
export class CartService {
  private cartCountSubject = new BehaviorSubject<number>(0)
  cartCount$ = this.cartCountSubject.asObservable()

  // We'll expose cart items with discounts to subscribers
  private cartItemsSubject = new BehaviorSubject<CartItemWithDiscounts[]>(this.getCartItemsOnly())
  cartItems$ = this.cartItemsSubject.asObservable()

  constructor(private authService: AuthService) {
    this.authService.user$.subscribe((user) => {
      console.log("🛒 Auth changed in CartService. User is now: ", user)

      // Refresh cart when login/logout happens
      const freshCartItems = this.getCartItemsOnly()
      this.cartItemsSubject.next(freshCartItems)
      this.emitCount()
    })

    // Initial count
    this.emitCount()
  }

  private get storageKey(): string | null {
    const userId = this.authService?.getCurrentUser?.()?.id
    return userId ? `cart_user_${userId}` : null // null for guests
  }

  // ---------- Full cart with discounts stored in localStorage ----------

  private safeGetCartItemsOnly(): CartItemWithDiscounts[] {
    try {
      const fullCart = this.getFullCart();
      if (!fullCart || !Array.isArray(fullCart.cartItems)) return [];
      return fullCart.cartItems.map(item => ({
        ...item,
        originalPrice: item.originalPrice ?? item.price,
        discountedPrice: item.discountedPrice ?? item.price,
        appliedDiscounts: item.appliedDiscounts ?? [],
        discountBreakdown: item.discountBreakdown ?? [],
      }));
    } catch (e) {
      console.error("Failed to read cart items:", e);
      return [];
    }
  }
  
  getFullCart(): FullCartData | null {
    if (!this.storageKey) return null
    const raw = localStorage.getItem(this.storageKey)
    if (!raw) return null

    try {
      return JSON.parse(raw) as FullCartData
    } catch {
      return null
    }
  }  

  // getFullCart(): FullCartData | null {
  //   if (!this.storageKey) return null;
  //   const raw = localStorage.getItem(this.storageKey);
  //   if (!raw) return null;

  //   try {
  //     return JSON.parse(raw) as FullCartData;
  //   } catch {
  //     return null;
  //   }
  // }

  setFullCart(data: FullCartData): void {
    if (!this.storageKey) return
    localStorage.setItem(this.storageKey, JSON.stringify(data))
    this.cartItemsSubject.next(data.cartItems)
    this.emitCount()
  }

  clearFullCart(): void {
    if (!this.storageKey) return
    localStorage.removeItem(this.storageKey)
    this.cartItemsSubject.next([])
    this.emitCount()
  }

  // Helper to get only CartItem[] (without discount info) for backward compatibility or UI uses
  getCartItemsOnly(): CartItemWithDiscounts[] {
    const fullCart = this.getFullCart();
    if (!fullCart || !fullCart.cartItems) return [];

    return fullCart.cartItems.map((item) => ({
      ...item,
      originalPrice: item.originalPrice ?? item.price ?? 0,
      discountedPrice: item.discountedPrice ?? item.price ?? 0,
      appliedDiscounts: item.appliedDiscounts ?? [],
      discountBreakdown: item.discountBreakdown ?? [],
    }));
  }
  

  // getCartItemsOnly(): CartItemWithDiscounts[] {
  //   const fullCart = this.getFullCart();
  //   if (!fullCart) return [];

  //   return fullCart.cartItems.map(item => ({
  //     ...item,
  //     originalPrice: item.originalPrice ?? item.price,
  //     discountedPrice: item.discountedPrice ?? item.price,
  //     appliedDiscounts: item.appliedDiscounts ?? [],
  //     discountBreakdown: item.discountBreakdown ?? [],
  //   }));
  // }

  // getCartItemsOnly(): CartItemWithDiscounts[] {
  //   const fullCart = this.getFullCart()
  //   if (!fullCart) return []

  //   return fullCart.cartItems.map((item) => ({
  //     ...item,
  //     originalPrice: item.originalPrice ?? item.price,
  //     discountedPrice: item.discountedPrice ?? item.price,
  //     appliedDiscounts: item.appliedDiscounts ?? [],
  //     discountBreakdown: item.discountBreakdown ?? [],
  //   }))
  // }

  // ---------- Cart operations working on full cart ----------
  
  addToCart(product: {
    id: number
    name: string
    variantId: number
    variantSku: string
    stock: number
    price: number
    image?: string
    brandId: number
    categoryId: number
  }): void {
    if (!this.storageKey) return // Do nothing for guest

    let fullCart = this.getFullCart()
    if (!fullCart) {
      fullCart = {
        cartItems: [],
        cartTotal: 0,
        appliedCoupon: null,
        autoDiscountSavings: 0,
      }
    }

    // Ensure cartItems is always an array
    if (!fullCart.cartItems) {
      fullCart.cartItems = []
    }

    const cart = fullCart.cartItems
    const index = cart.findIndex(
      (item) => item.productId === product.id && item.variantId === product.variantId
    )

    if (index !== -1) {
      if (cart[index].quantity < product.stock) {
        cart[index].quantity += 1
      } else {
        alert(`${product.name} (Variant ID ${product.variantId}) is out of stock`)
        return
      }
    } else {
      const newItem: CartItemWithDiscounts = {
        productId: product.id,
        productName: product.name,
        variantId: product.variantId,
        variantSku: product.variantSku,
        stock: product.stock,
        price: product.price,
        imgPath: product.image || undefined,
        quantity: 1,
        brandId: Number(product.brandId),
        categoryId: Number(product.categoryId),

        // Discount fields init
        originalPrice: product.price,
        discountedPrice: product.price,
        appliedDiscounts: [],
        discountBreakdown: [],
      }
      cart.push(newItem)
    }

    this.setFullCart(fullCart)
  }

  // addToCart(product: {
  //   id: number
  //   name: string
  //   variantId: number
  //   variantSku: string
  //   stock: number
  //   price: number
  //   image?: string
  //   brandId: number
  //   categoryId: number
  // }): void {
  //   if (!this.storageKey) return // Do nothing for guest

  //   let fullCart = this.getFullCart()
  //   if (!fullCart) {
  //     fullCart = {
  //       cartItems: [],
  //       cartTotal: 0,
  //       appliedCoupon: null,
  //       autoDiscountSavings: 0,
  //     }
  //   }

  //   const cart = fullCart.cartItems
  //   const index = cart.findIndex((item) => item.productId === product.id && item.variantId === product.variantId)

  //   if (index !== -1) {
  //     if (cart[index].quantity < product.stock) {
  //       cart[index].quantity += 1
  //     } else {
  //       alert(`${product.name} (Variant ID ${product.variantId}) is out of stock`)
  //       return
  //     }
  //   } else {
  //     const newItem: CartItemWithDiscounts = {
  //       productId: product.id,
  //       productName: product.name,
  //       variantId: product.variantId,
  //       variantSku: product.variantSku,
  //       stock: product.stock,
  //       price: product.price,
  //       imgPath: product.image || undefined,
  //       quantity: 1,
  //       brandId: Number(product.brandId),
  //       categoryId: Number(product.categoryId),

  //       // Discount fields init
  //       originalPrice: product.price,
  //       discountedPrice: product.price,
  //       appliedDiscounts: [],
  //       discountBreakdown: [],
  //     }
  //     cart.push(newItem)
  //   }

  //   this.setFullCart(fullCart)
  // }

  updateQuantity(productId: number, variantId: number, change: number): void {
    const fullCart = this.getFullCart()
    if (!fullCart) return

    const cart = fullCart.cartItems
    const index = cart.findIndex((item) => item.productId === productId && item.variantId === variantId)

    if (index === -1) return

    const newQty = cart[index].quantity + change
    if (newQty < 1) {
      this.removeFromCart(productId, variantId)
      return
    }
    if (newQty > cart[index].stock) {
      alert(`Cannot increase quantity beyond stock (${cart[index].stock})`)
      return
    }

    cart[index].quantity = newQty
    this.setFullCart(fullCart)
  }

  removeFromCart(productId: number, variantId: number): void {
    const fullCart = this.getFullCart()
    if (!fullCart) return

    fullCart.cartItems = fullCart.cartItems.filter(
      (item) => !(item.productId === productId && item.variantId === variantId),
    )

    // If cart empty, clear discounts too
    if (fullCart.cartItems.length === 0) {
      fullCart.appliedCoupon = null
      fullCart.autoDiscountSavings = 0
      fullCart.cartTotal = 0
    }

    this.setFullCart(fullCart)
  }

  clearCart(): void {
    this.clearFullCart()
  }

  getVariantQuantity(productId: number, variantId: number): number {
    const fullCart = this.getFullCart();
    if (!fullCart || !fullCart.cartItems) return 0;

    const item = fullCart.cartItems.find(
      (i) => i.productId === productId && i.variantId === variantId
    );

    return item ? (item.quantity ?? 0) : 0;
  }

  // getVariantQuantity(productId: number, variantId: number): number {
  //   const fullCart = this.getFullCart()
  //   if (!fullCart) return 0

  //   const item = fullCart.cartItems.find((i) => i.productId === productId && i.variantId === variantId)
  //   return item ? item.quantity : 0
  // }

  // Count total items
  private calcCount(): number {
    const fullCart = this.getFullCart()
    if (!fullCart || !fullCart.cartItems) return 0;
    return fullCart.cartItems.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
  }
  

  // private calcCount(): number {
  //   const fullCart = this.getFullCart();
  //   if (!fullCart) return 0;
  //   return fullCart.cartItems.reduce((sum, i) => sum + i.quantity, 0);
  // }

  // private calcCount(): number {
  //   const fullCart = this.getFullCart()
  //   if (!fullCart) return 0
  //   return fullCart.cartItems.reduce((sum, i) => sum + i.quantity, 0)
  // }

  private emitCount(): void {
    this.cartCountSubject.next(this.calcCount())
  }

  // Helper to save cart with discounts after discount recalculation outside this service
  setCartWithDiscounts(
    cartItems: CartItemWithDiscounts[],
    cartTotal: number,
    appliedCoupon: AppliedCoupon | null,
    autoDiscountSavings: number,
  ): void {
    const fullCart: FullCartData = {
      cartItems,
      cartTotal,
      appliedCoupon,
      autoDiscountSavings,
    }
    this.setFullCart(fullCart)
  }

  getCartWithDiscounts(): FullCartData | null {
    return this.getFullCart()
  }

  getCart(): CartItem[] {
    
    return this.getCartItemsOnly().map((item) => ({
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantSku: item.variantSku,
      stock: item.stock,
      price: item.price,
      imgPath: item.imgPath,
      quantity: item.quantity,
      brandId: item.brandId,
      categoryId: item.categoryId,
    }))
  }
}
