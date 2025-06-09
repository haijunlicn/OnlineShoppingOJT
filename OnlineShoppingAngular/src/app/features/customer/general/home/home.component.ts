import { Component } from '@angular/core';
import { LoginModalService } from '../../../../core/services/LoginModalService';
import { RegisterModalService } from '../../../../core/services/RegisterModalService';
import { ForgotPasswordModalService } from '../../../../core/services/ForgotPasswordModalService';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
 productRating = 4
  maxRating = 5


   constructor(private loginModalService: LoginModalService,private registerModalService:RegisterModalService,private forgotModalService: ForgotPasswordModalService) {}

  get loginVisible$() {
    return this.loginModalService.loginVisible$;
  }

  get registerVisible$() {
    return this.registerModalService.registerVisible$;
  }

  get forgotVisible$ () {
    return this.forgotModalService.forgotVisible$;
  }
  onShopNow() {
    console.log("Shop Now clicked")
  }

  onAddToCart() {
    console.log("Add to Cart clicked")
  }

  onWishlist() {
    console.log("Wishlist clicked")
  }

  getRatingStars() {
    return Array(this.maxRating)
      .fill(0)
      .map((_, i) => i < this.productRating)
  }
}
