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

  constructor(
   
    private router: Router,
    private loginModalService: LoginModalService,
   private registerModalService:RegisterModalService
   
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
    //  this.router.navigate(['/customer/auth/register']);
    this.registerModalService.show();
     console.log("register click")
  }

  onSignIn() {

     this.loginModalService.show();
  }
}
