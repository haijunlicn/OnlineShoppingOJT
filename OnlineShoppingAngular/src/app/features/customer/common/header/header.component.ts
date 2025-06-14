import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginModalService } from '../../../../core/services/LoginModalService';
import { RegisterModalService } from '../../../../core/services/RegisterModalService';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isMenuOpen = false;
  cartItemCount = 2;
  isMobileSearchOpen = false;

  constructor(
    private router: Router,
    private loginModalService: LoginModalService,
    private registerModalService: RegisterModalService
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleMobileSearch() {
    this.isMobileSearchOpen = !this.isMobileSearchOpen;
    setTimeout(() => {
      if (this.isMobileSearchOpen) {
        const input = document.querySelector('.mobile-search-bar input') as HTMLInputElement;
        if (input) input.focus();
      }
    }, 100);
  }

  onSearch(query: string) {
    console.log('Searching for:', query);
    // Implement navigation or search logic here
  }

  onWishlist() {
    console.log('Wishlist clicked');
  }

  onCart() {
    console.log('Cart clicked');
  }

  onRegister() {
    this.registerModalService.show();
    console.log('register click');
  }

  onSignIn() {
    this.loginModalService.show();
  }
}
