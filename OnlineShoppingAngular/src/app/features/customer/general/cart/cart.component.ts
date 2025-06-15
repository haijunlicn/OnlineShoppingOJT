import { Component, OnInit } from '@angular/core';
import { CartService } from '../../../../core/services/cart.service';
import { CartItem } from '../../../../core/models/cart.model'; // optional if you have strong typing

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: CartItem[] = [];

  constructor(private cartService: CartService) {}

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

  clearCart(): void {
    this.cartService.clearCart();
    this.loadCart();
  }
}
