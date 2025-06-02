import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
 isMenuOpen = false
  cartItemCount = 2

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen
  }

  onSearch() {
    console.log("Search clicked")
  }

  onWishlist() {
    console.log("Wishlist clicked")
  }

  onCart() {
    console.log("Cart clicked")
  }

  onRegister() {
    console.log("Register clicked")
  }

  onSignIn() {
    console.log("Sign In clicked")
  }
}
