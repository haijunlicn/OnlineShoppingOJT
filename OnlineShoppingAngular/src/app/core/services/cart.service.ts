import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppliedCoupon, CartItem, CartItemWithDiscounts, FullCartData } from '../models/cart.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  // We'll expose cart items with discounts to subscribers
  private cartItemsSubject = new BehaviorSubject<CartItemWithDiscounts[]>(this.getCartItemsOnly());
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor(
    private authService: AuthService
  ) {
    this.authService.user$.subscribe((user) => {
      console.log("🛒 Auth changed in CartService. User is now: ", user);

      // Refresh cart when login/logout happens
      const freshCartItems = this.getCartItemsOnly();
      this.cartItemsSubject.next(freshCartItems);
      this.emitCount();
    });

    // Initial count
    this.emitCount();
  }

  private get storageKey(): string | null {
    const userId = this.authService?.getCurrentUser?.()?.id;
    return userId ? `cart_user_${userId}` : null; // null for guests
  }

  // ---------- Full cart with discounts stored in localStorage ----------

  getFullCart(): FullCartData | null {
    if (!this.storageKey) return null;
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as FullCartData;
    } catch {
      return null;
    }
  }

  setFullCart(data: FullCartData): void {
    if (!this.storageKey) return;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.cartItemsSubject.next(data.cartItems);
    this.emitCount();
  }

  clearFullCart(): void {
    if (!this.storageKey) return;
    localStorage.removeItem(this.storageKey);
    this.cartItemsSubject.next([]);
    this.emitCount();
  }

  // Helper to get only CartItem[] (without discount info) for backward compatibility or UI uses
  getCartItemsOnly(): CartItemWithDiscounts[] {
    const fullCart = this.getFullCart();
    if (!fullCart) return [];

    return fullCart.cartItems.map(item => ({
      ...item,
      originalPrice: item.originalPrice ?? item.price,
      discountedPrice: item.discountedPrice ?? item.price,
      appliedDiscounts: item.appliedDiscounts ?? [],
      discountBreakdown: item.discountBreakdown ?? [],
    }));
  }


  // getCartItemsOnly(): CartItem[] {
  //   const fullCart = this.getFullCart();
  //   if (!fullCart) return [];
  //   return fullCart.cartItems.map(({ productId, variantId, productName, variantSku, stock, price, imgPath, quantity, brandId, categoryId }) => ({
  //     productId,
  //     variantId,
  //     productName,
  //     variantSku,
  //     stock,
  //     price,
  //     imgPath,
  //     quantity,
  //     brandId,
  //     categoryId,
  //   }));
  // }

  // ---------- Cart operations working on full cart ----------

  addToCart(product: {
    id: number;
    name: string;
    variantId: number;
    variantSku: string;
    stock: number;
    price: number;
    image?: string;
    brandId: number;
    categoryId: number;
  }): void {
    if (!this.storageKey) return; // Do nothing for guest

    let fullCart = this.getFullCart();
    if (!fullCart) {
      fullCart = {
        cartItems: [],
        cartTotal: 0,
        appliedCoupon: null,
        autoDiscountSavings: 0,
      };
    }

    const cart = fullCart.cartItems;
    const index = cart.findIndex(
      (item) => item.productId === product.id && item.variantId === product.variantId
    );

    if (index !== -1) {
      if (cart[index].quantity < product.stock) {
        cart[index].quantity += 1;
      } else {
        alert(`${product.name} (Variant ID ${product.variantId}) is out of stock`);
        return;
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
      };
      cart.push(newItem);
    }

    this.setFullCart(fullCart);
  }

  updateQuantity(productId: number, variantId: number, change: number): void {
    const fullCart = this.getFullCart();
    if (!fullCart) return;

    const cart = fullCart.cartItems;
    const index = cart.findIndex(
      (item) => item.productId === productId && item.variantId === variantId
    );

    if (index === -1) return;

    const newQty = cart[index].quantity + change;
    if (newQty < 1) {
      this.removeFromCart(productId, variantId);
      return;
    }
    if (newQty > cart[index].stock) {
      alert(`Cannot increase quantity beyond stock (${cart[index].stock})`);
      return;
    }

    cart[index].quantity = newQty;
    this.setFullCart(fullCart);
  }

  removeFromCart(productId: number, variantId: number): void {
    const fullCart = this.getFullCart();
    if (!fullCart) return;

    fullCart.cartItems = fullCart.cartItems.filter(
      (item) => !(item.productId === productId && item.variantId === variantId)
    );

    // If cart empty, clear discounts too
    if (fullCart.cartItems.length === 0) {
      fullCart.appliedCoupon = null;
      fullCart.autoDiscountSavings = 0;
      fullCart.cartTotal = 0;
    }

    this.setFullCart(fullCart);
  }

  clearCart(): void {
    this.clearFullCart();
  }

  getVariantQuantity(productId: number, variantId: number): number {
    const fullCart = this.getFullCart();
    if (!fullCart) return 0;

    const item = fullCart.cartItems.find(
      (i) => i.productId === productId && i.variantId === variantId
    );
    return item ? item.quantity : 0;
  }

  // Count total items
  private calcCount(): number {
    const fullCart = this.getFullCart();
    if (!fullCart) return 0;
    return fullCart.cartItems.reduce((sum, i) => sum + i.quantity, 0);
  }

  private emitCount(): void {
    this.cartCountSubject.next(this.calcCount());
  }

  // Helper to save cart with discounts after discount recalculation outside this service
  setCartWithDiscounts(cartItems: CartItemWithDiscounts[], cartTotal: number, appliedCoupon: AppliedCoupon | null, autoDiscountSavings: number): void {
    const fullCart: FullCartData = {
      cartItems,
      cartTotal,
      appliedCoupon,
      autoDiscountSavings,
    };
    this.setFullCart(fullCart);
  }

  getCartWithDiscounts(): FullCartData | null {
    return this.getFullCart();
  }

  getCart(): CartItem[] {
    if (!this.storageKey) return [];
    const cartRaw = localStorage.getItem(this.storageKey);
    if (!cartRaw) return [];
    try {
      const cart = JSON.parse(cartRaw);
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

}


// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';
// import { AppliedCoupon, CartItem, CartItemWithDiscounts } from '../models/cart.model';
// import { AuthService } from './auth.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class CartService {
//   private cartCountSubject = new BehaviorSubject<number>(0);
//   cartCount$ = this.cartCountSubject.asObservable();

//   private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.getCart());
//   cartItems$ = this.cartItemsSubject.asObservable();

//   constructor(
//     private authService: AuthService
//   ) {

//     this.authService.user$.subscribe((user) => {
//       console.log("🛒 Auth changed in CartService. User is now: ", user);

//       // Refresh cart when login/logout happens
//       const freshCart = this.getCart();
//       this.cartItemsSubject.next(freshCart);
//       this.emitCount();
//     });

//     // Initial count
//     this.emitCount();
//   }

//   // Dynamic localStorage key based on current user
//   private get storageKey(): string | null {
//     const userId = this.authService?.getCurrentUser?.()?.id;
//     return userId ? `cart_user_${userId}` : null; // null for guests
//   }

//   private cartWithDiscountsData: {
//     cartItems: CartItemWithDiscounts[],
//     cartTotal: number,
//     appliedCoupon: AppliedCoupon | null,
//     autoDiscountSavings: number
//   } | null = null

//   setCartWithDiscounts(cartItems: CartItemWithDiscounts[], cartTotal: number, appliedCoupon: AppliedCoupon | null, autoDiscountSavings: number): void {
//     this.cartWithDiscountsData = { cartItems, cartTotal, appliedCoupon, autoDiscountSavings }
//   }

//   getCartWithDiscounts() {
//     return this.cartWithDiscountsData
//   }

//   clearCartWithDiscounts() {
//     this.cartWithDiscountsData = null
//   }

//   /** Read full cart */
//   getCart(): CartItem[] {
//     if (!this.storageKey) return [];
//     const cart = localStorage.getItem(this.storageKey);
//     return cart ? JSON.parse(cart) : [];
//   }

//   /** Add product variant to cart */
//   addToCart(product: {
//     id: number;
//     name: string;
//     variantId: number;
//     variantSku: string;
//     stock: number;
//     price: number;
//     image?: string;
//     brandId: number;
//     categoryId: number;
//   }): void {

//     if (!this.storageKey) return; // Do nothing for guest

//     const cart = this.getCart();
//     const index = cart.findIndex(
//       (item) => item.productId === product.id && item.variantId === product.variantId
//     );

//     if (index !== -1) {
//       if (cart[index].quantity < product.stock) {
//         cart[index].quantity += 1;
//       } else {
//         alert(`${product.name} (Variant ID ${product.variantId}) is out of stock`);
//         return;
//       }
//     } else {
//       const cartItem: CartItem = {
//         productId: product.id,
//         productName: product.name,
//         variantId: product.variantId,
//         variantSku: product.variantSku,
//         stock: product.stock,
//         price: product.price,
//         imgPath: product.image || undefined,
//         quantity: 1,
//         brandId: Number(product.brandId),
//         categoryId: Number(product.categoryId),
//       };
//       cart.push(cartItem);
//     }

//     this.updateCart(cart);
//   }

//   /** Update quantity for a specific variant */
//   updateQuantity(productId: number, variantId: number, change: number): void {
//     const cart = this.getCart();
//     const index = cart.findIndex(
//       (item) => item.productId === productId && item.variantId === variantId
//     );

//     if (index !== -1) {
//       const newQty = cart[index].quantity + change;
//       if (newQty >= 1 && newQty <= cart[index].stock) {
//         cart[index].quantity = newQty;
//       } else if (newQty < 1) {
//         this.removeFromCart(productId, variantId);
//         return;
//       }
//     }

//     // localStorage.setItem(this.storageKey, JSON.stringify(cart));
//     // this.emitCount();
//     this.updateCart(cart);
//   }

//   /** Remove an item from the cart */
//   removeFromCart(productId: number, variantId: number): void {
//     if (!this.storageKey) return;
//     const updatedCart = this.getCart().filter(
//       (item) => !(item.productId === productId && item.variantId === variantId)
//     );
//     localStorage.setItem(this.storageKey, JSON.stringify(updatedCart));
//     this.emitCount();
//     this.updateCart(updatedCart);
//   }

//   /** Clear the cart completely */
//   clearCart(): void {
//     if (!this.storageKey) return;
//     localStorage.removeItem(this.storageKey);
//     this.cartItemsSubject.next([]);
//     this.emitCount();
//   }

//   /** Get quantity for a specific variant */
//   getVariantQuantity(productId: number, variantId: number): number {
//     const cart = this.getCart();
//     const item = cart.find(
//       (item) => item.productId === productId && item.variantId === variantId
//     );
//     return item ? item.quantity : 0;
//   }

//   /** Recalculate total item count in cart */
//   private calcCount(): number {
//     return this.getCart().reduce((sum, i) => sum + i.quantity, 0);
//   }

//   /** Emit new count to subscribers */
//   private emitCount(): void {
//     this.cartCountSubject.next(this.calcCount());
//   }

//   private updateCart(cart: CartItem[]) {
//     if (!this.storageKey) return;
//     localStorage.setItem(this.storageKey, JSON.stringify(cart));
//     this.cartItemsSubject.next(cart);
//     this.emitCount();
//   }

// }
