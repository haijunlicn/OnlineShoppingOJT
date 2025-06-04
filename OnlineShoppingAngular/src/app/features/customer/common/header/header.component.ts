import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  constructor(
   
    private router: Router,
   
  ) {}
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
     this.router.navigate(['/customer/auth/register']);
     console.log("register click")
  }

  onSignIn() {
    console.log("Sign In clicked")
  }
}
