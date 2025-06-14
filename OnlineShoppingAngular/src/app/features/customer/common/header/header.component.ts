import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginModalService } from '../../../../core/services/LoginModalService';
import { RegisterModalService } from '../../../../core/services/RegisterModalService';
import { ForgotPasswordModalService } from '../../../../core/services/ForgotPasswordModalService';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']  // ✅ Fixed typo
})
export class HeaderComponent {
  isMenuOpen = false;
  cartItemCount = 2;
  isMobileSearchOpen = false;

  constructor(
    private router: Router,
    private loginModalService: LoginModalService,
    private registerModalService: RegisterModalService,
    private forgotModalService: ForgotPasswordModalService
  ) {}

  // get loginVisible$() {
  //   return this.loginModalService.loginVisible$;
  // }

  // get registerVisible$() {
  //   return this.registerModalService.registerVisible$;
  // }

  // get forgotVisible$() {
  //   return this.forgotModalService.forgotVisible$;
  // }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
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

  onSearch(query: string): void {
    console.log('Searching for:', query);
    // TODO: Implement navigation or search logic here
  }

  onWishlist(): void {
    console.log('Wishlist clicked');
    // TODO: Navigate to wishlist or open modal
  }

  onCart(): void {
    console.log('Cart clicked');
    // TODO: Navigate to cart page
  }

  onRegister(): void {
    this.registerModalService.show();
    console.log('Register clicked');
  }

  onSignIn(): void {
    this.loginModalService.show();
  }
}
