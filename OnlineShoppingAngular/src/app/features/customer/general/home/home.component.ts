import { Component, OnInit } from '@angular/core';
import { CategoryService } from '@app/core/services/category.service';
import { CategoryDTO } from '@app/core/models/category-dto';
import { AuthService } from '@app/core/services/auth.service';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';
import { DiscountEventDTO } from '@app/core/models/discount';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductDTO, ProductListItemDTO } from '@app/core/models/product.model';

@Component({
  selector: "app-home",
  standalone: false,
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  discounts: DiscountEventDTO[] = [];
  isLoadingDiscounts = true;

  topCategories: CategoryDTO[] = [];
  topProducts: ProductListItemDTO[] = [];
  isLoadingTop = true;

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private discountDisplayService: DiscountDisplayService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDiscounts();
    this.loadTopHomeData();
  }

  loadDiscounts(): void {
    this.isLoadingDiscounts = true;
    this.discountDisplayService.getAllPublicActiveDiscounts().subscribe({
      next: (data) => {
        this.discounts = data;
        this.isLoadingDiscounts = false;
      },
      error: () => {
        this.discounts = [];
        this.isLoadingDiscounts = false;
      },
    });
  }

  loadTopHomeData(): void {
    this.isLoadingTop = true;
    this.http.get<any>('http://localhost:8080/api/analytics/top-home').subscribe({
      next: (data) => {
        this.topCategories = data.topCategories || [];
        this.topProducts = data.topProducts || [];
        this.isLoadingTop = false;
      },
      error: () => {
        this.topCategories = [];
        this.topProducts = [];
        this.isLoadingTop = false;
      }
    });
  }

  onDiscountViewDetails(discount: DiscountEventDTO): void {
    if (discount?.id != null) {
      this.router.navigate(['/customer/discount', discount.id]);
    }
  }

  onShopNow() {
    this.router.navigate(['/customer/productList']);
  }

  onAddToCart(product: ProductDTO) {
    console.log("Add to Cart:", product.name);
  }

  onWishlist(product: ProductDTO) {
    console.log("Wishlist:", product.name);
  }

  getRatingStars(rating: number) {
    const maxRating = 5;
    const filledStars = Math.round(rating);
    return Array(maxRating)
      .fill(0)
      .map((_, i) => i < filledStars);
  }

  onSearch(query: string) {
    // Implement search navigation or logic here
    console.log("Homepage search:", query);
  }

  getMainProductImage(product: any): string {
    if (product.productImages && product.productImages.length > 0) {
      const mainImage = product.productImages.find((img: any) => img.mainImageStatus);
      if (mainImage) {
        return mainImage.imgPath;
      } else if (product.productImages[0]) {
        return product.productImages[0].imgPath;
      }
    }
    return "assets/images/placeholder.jpg";
  }

  // Performance optimization methods
  trackByCategory(index: number, category: CategoryDTO): any {
    return category.id || index;
  }

  trackByProduct(index: number, product: ProductListItemDTO): any {
    return product.id || index;
  }
}