import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { LoginModalService } from '../../../../core/services/LoginModalService';
import { RegisterModalService } from '../../../../core/services/RegisterModalService';
import { ForgotPasswordModalService } from '../../../../core/services/ForgotPasswordModalService';

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
  userId = 4; // Replace with real auth user ID

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private cartService: CartService,
    private registerModalService: RegisterModalService,
    private loginModalService: LoginModalService
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

  onRegister(): void {
    this.registerModalService.show();
    console.log('Register clicked');
  }

  onSignIn(): void {
    this.loginModalService.show();
  }


  toggleMobileSearch(): void {
    this.isMobileSearchOpen = !this.isMobileSearchOpen;
    setTimeout(() => {
      if (this.isMobileSearchOpen) {
        const input = document.querySelector('.mobile-search-bar input') as HTMLInputElement | null;
        input?.focus();  // ✅ Optional chaining for safety
      }
    }, 100);
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