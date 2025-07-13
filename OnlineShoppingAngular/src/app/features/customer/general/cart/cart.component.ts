import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { CartItem } from '../../../../core/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: CartItem[] = [];

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cart = this.cartService.getCart();
  }

  changeQty(productId: number, variantId: number, change: number): void {
    this.cartService.updateQuantity(productId, variantId, change);
    this.loadCart();
  }

  removeItem(productId: number, variantId: number): void {
    this.cartService.removeFromCart(productId, variantId);
    this.loadCart();
  }

  getTotal(): number {
    return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  // Add this new method to calculate the total number of items in cart
  getItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.loadCart();
  }

  proceedToCheckout(): void {
    if (this.cart.length === 0) {
      alert('Your cart is empty. Please add items before proceeding to checkout.');
      return;
    }
    
    this.router.navigate(['/customer/order'], {
      state: {
        cartItems: this.cart,
        cartTotal: this.getTotal()
      }
    });
  }
}