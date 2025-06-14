import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  isWishlistDropdownVisible = false;
  isMenuOpen = false;
  cartItemCount = 0;
  userId = 4; // Replace with real auth user ID

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private cartService: CartService
  ) {}

  ngOnInit() {
    // Initialize with current count
    this.cartItemCount = this.cartService.getCart()
      .reduce((sum, item) => sum + item.quantity, 0);

    // Subscribe to live updates
    this.cartService.cartCount$.subscribe(count => {
      this.cartItemCount = count;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onSearch() {
    console.log("Search clicked");
  }

  onWishlist() {
    this.router.navigate(['/customer/general/wishlist']);
  }

  onRegister() {
    this.router.navigate(['/customer/auth/register']);
  }

  onSignIn() {
    console.log("Sign In clicked");
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isWishlistDropdownVisible = false;
    }
  }

  onCart(): void {
    this.router.navigate(['/customer/cart']);
  }
}