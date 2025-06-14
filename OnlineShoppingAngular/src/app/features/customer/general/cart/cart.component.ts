import { Component, OnInit } from '@angular/core';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: any[] = [];

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cart = this.cartService.getCart();
  }

  changeQty(productId: number, change: number): void {
    this.cartService.updateQuantity(productId, change);
    this.loadCart();
  }

  removeItem(productId: number): void {
    this.cartService.removeFromCart(productId);
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
