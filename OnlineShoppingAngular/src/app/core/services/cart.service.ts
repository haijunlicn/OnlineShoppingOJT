import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CURRENT_USER_ID } from '../models/user.constant';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private storageKey = `cart_user_${CURRENT_USER_ID}`;

  // — New: a stream of the total item count in cart —
  private cartCountSubject = new BehaviorSubject<number>(this.calcCount());
  cartCount$ = this.cartCountSubject.asObservable();

  constructor() {}

  /** Existing: read full cart */
  getCart(): any[] {
    const cart = localStorage.getItem(this.storageKey);
    return cart ? JSON.parse(cart) : [];
  }

  /** Existing: add or bump an item */
  addToCart(product: any): void {
    let cart = this.getCart();
    const index = cart.findIndex(item => item.id === product.id);

    if (index !== -1) {
      if (cart[index].quantity < product.stock) {
        cart[index].quantity += 1;
      } else {
        alert(`${product.name} out of stock`);
      }
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem(this.storageKey, JSON.stringify(cart));
    this.emitCount();              // ← New
  }

  /** Existing: adjust quantity or remove */
  updateQuantity(productId: number, change: number): void {
    let cart = this.getCart();
    const index = cart.findIndex(item => item.id === productId);

    if (index !== -1) {
      const newQty = cart[index].quantity + change;
      if (newQty >= 1 && newQty <= cart[index].stock) {
        cart[index].quantity = newQty;
      } else if (newQty < 1) {
        this.removeFromCart(productId);
        return;                     // removeFromCart will also emit
      }
    }

    localStorage.setItem(this.storageKey, JSON.stringify(cart));
    this.emitCount();              // ← New
  }

  /** Existing: remove an entry */
  removeFromCart(productId: number): void {
    const updatedCart = this.getCart().filter(item => item.id !== productId);
    localStorage.setItem(this.storageKey, JSON.stringify(updatedCart));
    this.emitCount();              // ← New
  }

  /** Existing: clear everything */
  clearCart(): void {
    localStorage.removeItem(this.storageKey);
    this.emitCount();              // ← New
  }

  // — New helpers below —

  /** Calculate the sum of all quantities in storage */
  private calcCount(): number {
    return this.getCart().reduce((sum, i) => sum + i.quantity, 0);
  }

  /** Push the latest total into the BehaviorSubject */
  private emitCount() {
    this.cartCountSubject.next(this.calcCount());
  }
}
