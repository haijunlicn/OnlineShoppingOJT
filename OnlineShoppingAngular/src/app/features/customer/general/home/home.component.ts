import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
 productRating = 4
  maxRating = 5

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
