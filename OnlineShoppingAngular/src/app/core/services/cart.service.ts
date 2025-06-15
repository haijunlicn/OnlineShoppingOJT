import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CURRENT_USER_ID } from '../models/user.constant';
import { CartItem } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private storageKey = `cart_user_${CURRENT_USER_ID}`;

  // Stream of the total item count in cart
  private cartCountSubject = new BehaviorSubject<number>(this.calcCount());
  cartCount$ = this.cartCountSubject.asObservable();

  constructor() {}

  /** Read full cart */
  getCart(): CartItem[] {
    const cart = localStorage.getItem(this.storageKey);
    return cart ? JSON.parse(cart) : [];
  }

  /** Add or bump a variant (stores product and variant info) */
  addToCart(product: {
    id: number;              // productId
    name: string;            // productName
    variantId: number;
    variantSku: string;
    stock: number;
    price: number;
    image?: string;
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
        quantity: 1
      };
      cart.push(cartItem);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(cart));
    this.emitCount();
  }

  /** Update quantity for a specific variant using variantId */
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
        return; // Already emits
      }
    }

    localStorage.setItem(this.storageKey, JSON.stringify(cart));
    this.emitCount();
  }

  /** Remove a specific variant from cart using variantId */
  removeFromCart(productId: number, variantId: number): void {
    const updatedCart = this.getCart().filter(
      (item) => !(item.productId === productId && item.variantId === variantId)
    );
    localStorage.setItem(this.storageKey, JSON.stringify(updatedCart));
    this.emitCount();
  }

  /** Clear everything */
  clearCart(): void {
    localStorage.removeItem(this.storageKey);
    this.emitCount();
  }

  /** Get quantity for a specific variant using variantId */
  getVariantQuantity(productId: number, variantId: number): number {
    const cart = this.getCart();
    const item = cart.find(
      (item) => item.productId === productId && item.variantId === variantId
    );
    return item ? item.quantity : 0;
  }

  /** Calculate the sum of all quantities in storage */
  private calcCount(): number {
    return this.getCart().reduce((sum, i) => sum + i.quantity, 0);
  }

  /** Push the latest total into the BehaviorSubject */
  private emitCount(): void {
    this.cartCountSubject.next(this.calcCount());
  }
}
