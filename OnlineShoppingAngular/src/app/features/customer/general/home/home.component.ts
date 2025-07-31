import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CategoryService } from '@app/core/services/category.service';
import { CategoryDTO } from '@app/core/models/category-dto';
import { AuthService } from '@app/core/services/auth.service';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';
import { DiscountEventDTO, DiscountDisplayDTO } from '@app/core/models/discount';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductDTO, ProductCardItem } from '@app/core/models/product.model';
import { WishlistService } from '@app/core/services/wishlist.service';
import { WishlistDialogComponent } from '../wishlist-dialog/wishlist-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ReviewService } from '@app/core/services/review.service';
import { ProductReview } from '@app/core/models/review';
import { CartService } from '@app/core/services/cart.service';
import { DiscountTextService } from '@app/core/services/discount-text.service';

@Component({
  selector: "app-home",
  standalone: false,
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;
  @ViewChild('categoryScrollContainer', { static: false }) categoryScrollContainer!: ElementRef;

  discounts: DiscountEventDTO[] = [];
  isLoadingDiscounts = true;

  topCategories: CategoryDTO[] = [];
  topProducts: ProductCardItem[] = [];
  isLoadingTop = true;
  
  // Wishlist functionality
  wishList = new Set<number>();
  
  // Review functionality
  allReviews: ProductReview[] = [];

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private discountDisplayService: DiscountDisplayService,
    private router: Router,
    private http: HttpClient,
    private wishlistService: WishlistService,
    private dialog: MatDialog,
    private reviewService: ReviewService,
    private cartService: CartService,
    private discountTextService: DiscountTextService
  ) {}

  ngOnInit(): void {
    this.loadDiscounts();
    this.loadTopHomeData();
    this.loadWishlist();
    this.loadReviews();
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
    
    // Load top categories from new API
    this.categoryService.getTopCategories().subscribe({
      next: (categories) => {
        this.topCategories = categories;
        console.log("✅ Top categories loaded:", this.topCategories.length);
      },
      error: (err) => {
        console.error("Failed to load top categories:", err);
        this.topCategories = [];
      }
    });

    // Load top products
    this.http.get<any>('http://localhost:8080/api/analytics/public/top-home').subscribe({
      next: (data) => {
        // Convert ProductListItemDTO to ProductCardItem
        this.topProducts = (data.topProducts || []).map((item: any) => ({
          ...item,
          status: this.getStockStatus(item),
          originalPrice: 0,
          discountedPrice: 0,
        }));
        this.attachRatingsToProducts();
        this.loadDiscountHints();
        this.isLoadingTop = false;
      },
      error: () => {
        this.topProducts = [];
        this.isLoadingTop = false;
      }
    });
  }

  loadDiscountHints(): void {
    this.discountDisplayService.getProductDiscountHints().subscribe({
      next: (hintMap) => {
        console.log("✅ Discount hints received from backend:", hintMap);
        this.precomputeProductPrices(hintMap);
      },
      error: (err) => {
        console.error("Failed to load discount hints", err);
        this.precomputeProductPrices({});
      },
    });
  }

  private precomputeProductPrices(hintMap: { [productId: number]: DiscountDisplayDTO[] }) {
    console.log("🚀 Precomputing product prices for performance optimization...");

    const cart = this.cartService.getCart();
    console.log("precomputing method cart : ", cart);

    for (const product of this.topProducts) {
      const allHints = hintMap[product.id] || [];
      product.discountHints = allHints;

      const eligibleHints = this.discountDisplayService.evaluateEligibleDiscounts(allHints, cart);
      product.originalPrice = this.calculateLowestVariantPrice(product);

      // 👇 Filter only the hints that actually affect this product
      const affectingHints = eligibleHints.filter(hint =>
        hint.offeredProductIds?.includes(product.id)
      );

      const result = this.discountDisplayService.calculateDiscountedPrice(
        product.originalPrice,
        affectingHints
      );

      product.discountedPrice = result.discountedPrice;
      product.discountBreakdown = result.breakdown;
    }

    console.log("✅ Price precomputation completed!");
  }

  private calculateLowestVariantPrice(product: ProductCardItem): number {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map((v: any) => v.price);
      return Math.min(...prices);
    }
    return product.product.basePrice;
  }

  loadWishlist(): void {
    const userId = 4; // Replace with actual user ID
    this.wishlistService.getWishedProductIds(userId).subscribe({
      next: (wishedIds) => {
        this.wishList = new Set<number>(wishedIds);
      },
      error: (err) => console.error('Failed to load wishlist:', err),
    });
  }

  loadReviews(): void {
    this.reviewService.getAllReviews().subscribe(reviews => {
      this.allReviews = reviews;
      this.attachRatingsToProducts();
    });
  }

  attachRatingsToProducts() {
    this.topProducts.forEach(product => {
      const reviews = this.allReviews.filter(r => r.productId === product.id);
      product.reviewAverage = reviews.length
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;
      product.reviewTotal = reviews.length;
    });
  }

  getRounded(value: number): number {
    return Math.round(value);
  }

  getStockStatus(product: any): string {
    if (!product.variants || product.variants.length === 0) return "Out of Stock";
    const totalStock = product.variants.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0);
    if (totalStock === 0) return "Out of Stock";
    if (totalStock <= 5) return `Low Stock (${totalStock} left)`;
    return "In Stock";
  }

  toggleWish(productId: number): void {
    const userId = 4; // Replace with actual user ID

    if (this.isWished(productId)) {
      this.wishlistService.removeProductFromWishlist(userId, productId).subscribe({
        next: () => {
          this.wishList.delete(productId);
          this.loadWishlist();
        },
        error: (err) => {
          console.error('Failed to remove from wishlist:', err);
        }
      });
    } else {
      const dialogRef = this.dialog.open(WishlistDialogComponent, {
        width: '400px',
        data: { productId }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result.added) {
          this.wishList.add(productId);
          this.loadWishlist();
        }
      });
    }
  }

  isWished(productId: number | string): boolean {
    const id = typeof productId === 'string' ? +productId : productId;
    return this.wishList.has(id);
  }

  hasStock(product: ProductCardItem): boolean {
    return !!(product.variants && product.variants.some((v) => v.stock > 0));
  }

  isOnSale(product: ProductCardItem): boolean {
    return product.discountedPrice! < product.originalPrice!;
  }

  goToDetail(product: ProductCardItem): void {
    this.router.navigate(['/customer/product', product.id]);
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

  // Discount-related methods
  hasUnappliedDiscounts(product: ProductCardItem): boolean {
    if (!product.discountHints || product.discountHints.length === 0) {
      return false;
    }

    const cart = this.cartService.getCart();
    const eligibleHints = this.discountDisplayService.evaluateEligibleDiscounts(product.discountHints, cart);

    // Has hints but none are currently eligible/applied
    return product.discountHints.length > 0;
  }

  hasAppliedDiscounts(product: ProductCardItem): boolean {
    if (!product.discountHints || product.discountHints.length === 0) {
      return false;
    }

    const cart = this.cartService.getCart();
    const eligibleHints = this.discountDisplayService.evaluateEligibleDiscounts(product.discountHints, cart);

    return eligibleHints.length > 0;
  }

  getUnconditionalDiscountHints(product: ProductCardItem): DiscountDisplayDTO[] {
    if (!product.discountHints || product.discountHints.length === 0) {
      return [];
    }

    const unconditionalHints = product.discountHints.filter(
      hint => !hint.conditionGroups || hint.conditionGroups.length === 0
    );

    const cart = this.cartService.getCart();
    return this.discountDisplayService.evaluateEligibleDiscounts(unconditionalHints, cart);
  }

  getCombinedDiscountLabel(product: ProductCardItem): string {
    const hints = product.discountHints ?? [];
    return this.discountTextService.getCombinedDiscountLabel(hints);
  }

  getDiscountPercentage(product: ProductCardItem): number {
    if (!product.originalPrice || !product.discountedPrice || product.originalPrice <= product.discountedPrice) {
      return 0;
    }
    const discountAmount = product.originalPrice - product.discountedPrice;
    const percentage = (discountAmount / product.originalPrice) * 100;
    return Math.round(percentage);
  }

  // Scroll methods for horizontal scrolling
  scrollLeft(): void {
    if (this.scrollContainer) {
      const container = this.scrollContainer.nativeElement;
      const cardWidth = container.querySelector('.product-card-container')?.offsetWidth || 280;
      const scrollAmount = (cardWidth + 20) * 2; // Scroll 2 cards at a time
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  scrollRight(): void {
    if (this.scrollContainer) {
      const container = this.scrollContainer.nativeElement;
      const cardWidth = container.querySelector('.product-card-container')?.offsetWidth || 280;
      const scrollAmount = (cardWidth + 20) * 2; // Scroll 2 cards at a time
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  // Category scroll methods
  scrollCategoriesLeft(): void {
    if (this.categoryScrollContainer) {
      const container = this.categoryScrollContainer.nativeElement;
      const cardWidth = container.querySelector('.category-card-container')?.offsetWidth || 300;
      const scrollAmount = (cardWidth + 20) * 2; // Scroll 2 cards at a time
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  scrollCategoriesRight(): void {
    if (this.categoryScrollContainer) {
      const container = this.categoryScrollContainer.nativeElement;
      const cardWidth = container.querySelector('.category-card-container')?.offsetWidth || 300;
      const scrollAmount = (cardWidth + 20) * 2; // Scroll 2 cards at a time
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  // Performance optimization methods
  trackByCategory(index: number, category: CategoryDTO): any {
    return category.id || index;
  }

  trackByProduct(index: number, product: ProductCardItem): any {
    return product.id || index;
  }
}