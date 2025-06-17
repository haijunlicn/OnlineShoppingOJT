import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { LoginModalService } from '../../../../core/services/LoginModalService';
import { RegisterModalService } from '../../../../core/services/RegisterModalService';
import { ForgotPasswordModalService } from '../../../../core/services/ForgotPasswordModalService';
import { User } from '../../../../core/models/User';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']  // ✅ Fixed typo
})
export class HeaderComponent implements OnInit {
  isWishlistDropdownVisible = false;
  isMenuOpen = false;
  cartItemCount = 2;
  isMobileSearchOpen = false;
  isProfileDropdownOpen = false;

  // User state
  currentUser: User | null = null;
  isLoggedIn = false;
  isCustomer = false;

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private cartService: CartService,
    private loginModalService: LoginModalService,
    private registerModalService: RegisterModalService,
    private forgotModalService: ForgotPasswordModalService,
    private authService: AuthService // Add this
  ) { }

  get loginVisible$() {
    return this.loginModalService.loginVisible$;
  }

  get registerVisible$() {
    return this.registerModalService.registerVisible$;
  }

  get forgotVisible$() {
    return this.forgotModalService.forgotVisible$;
  }

  ngOnInit(): void {
    // ✅ Initialize cart count
    this.cartItemCount = this.cartService.getCart()
      .reduce((sum, item) => sum + item.quantity, 0);

    // ✅ Listen to cart changes
    this.cartService.cartCount$.subscribe(count => {
      this.cartItemCount = count;
    });

    // ✅ Listen to auth changes (reactively tracks login/logout)
    this.authService.user$.subscribe((user: User | null) => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.isCustomer = this.authService.isCustomer();
    });

    // ✅ Initialize user from stored token if available
    this.authService.initializeUserFromToken();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  onSearch() {
    console.log("Search clicked");
  }

  onWishlist() {
    this.router.navigate(['/customer/general/wishlist']);
  }

  onRegister(): void {
    this.registerModalService.show();
    console.log('Register clicked');
  }

  onSignIn(): void {
    this.loginModalService.show();
    console.log('Login clicked');
  }

  onProfile(): void {
    this.router.navigate(['/customer/profile']);
    this.isProfileDropdownOpen = false;
  }

  onSettings(): void {
    this.router.navigate(['/customer/settings']);
    this.isProfileDropdownOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.isProfileDropdownOpen = false;
    this.router.navigate(['/']);
    console.log('User logged out');
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen = !this.isMobileSearchOpen;
    setTimeout(() => {
      if (this.isMobileSearchOpen) {
        const input = document.querySelector('.mobile-search-bar input') as HTMLInputElement | null;
        input?.focus();
      }
    }, 100);
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isWishlistDropdownVisible = false;
      this.isProfileDropdownOpen = false;
    }
  }

  onCart(): void {
    this.router.navigate(['/customer/cart']);
  }
}