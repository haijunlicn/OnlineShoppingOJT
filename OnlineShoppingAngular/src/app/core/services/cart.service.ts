import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.getCart());
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor(
    private authService: AuthService
  ) {
    // Refresh cart count whenever the user logs in or logs out
    this.authService.user$.subscribe(() => {
      this.emitCount();
    });

    // Initial count
    this.emitCount();
  }

  // Dynamic localStorage key based on current user
  private get storageKey(): string {
    const userId = this.authService?.getCurrentUser?.()?.id;
    return userId ? `cart_user_${userId}` : 'cart_guest';
  }

  /** Read full cart */
  getCart(): CartItem[] {
    const cart = localStorage.getItem(this.storageKey);
    return cart ? JSON.parse(cart) : [];
  }

  /** Add product variant to cart */
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
    const cart = this.getCart();
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
      const cartItem: CartItem = {
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
      };
      cart.push(cartItem);
    }

    // localStorage.setItem(this.storageKey, JSON.stringify(cart));
    // this.emitCount();
    this.updateCart(cart);
  }

  /** Update quantity for a specific variant */
  updateQuantity(productId: number, variantId: number, change: number): void {
    const cart = this.getCart();
    const index = cart.findIndex(
      (item) => item.productId === productId && item.variantId === variantId
    );

    if (index !== -1) {
      const newQty = cart[index].quantity + change;
      if (newQty >= 1 && newQty <= cart[index].stock) {
        cart[index].quantity = newQty;
      } else if (newQty < 1) {
        this.removeFromCart(productId, variantId);
        return;
      }
    }

    // localStorage.setItem(this.storageKey, JSON.stringify(cart));
    // this.emitCount();
    this.updateCart(cart);
  }

  /** Remove an item from the cart */
  removeFromCart(productId: number, variantId: number): void {
    const updatedCart = this.getCart().filter(
      (item) => !(item.productId === productId && item.variantId === variantId)
    );
    localStorage.setItem(this.storageKey, JSON.stringify(updatedCart));
    this.emitCount();
    this.updateCart(updatedCart);
  }

  /** Clear the cart completely */
  clearCart(): void {
    localStorage.removeItem(this.storageKey);
    this.cartItemsSubject.next([]);
    this.emitCount();
  }

  /** Get quantity for a specific variant */
  getVariantQuantity(productId: number, variantId: number): number {
    const cart = this.getCart();
    const item = cart.find(
      (item) => item.productId === productId && item.variantId === variantId
    );
    return item ? item.quantity : 0;
  }

  /** Recalculate total item count in cart */
  private calcCount(): number {
    return this.getCart().reduce((sum, i) => sum + i.quantity, 0);
  }

  /** Emit new count to subscribers */
  private emitCount(): void {
    this.cartCountSubject.next(this.calcCount());
  }

  private updateCart(cart: CartItem[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(cart));
    this.cartItemsSubject.next(cart);
    this.emitCount();
  }

}
