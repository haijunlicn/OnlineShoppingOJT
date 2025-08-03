import { Component, OnInit } from '@angular/core';
import { ReviewService } from '@app/core/services/review.service';
import { ProductService } from '@app/core/services/product.service';
import { ProductReview } from '@app/core/models/review';
import { ProductCardItem } from '@app/core/models/product.model';

@Component({
  selector: 'app-review-list-per-user',
  standalone: false,
  templateUrl: './review-list-per-user.component.html',
  styleUrl: './review-list-per-user.component.css'
})
export class ReviewListPerUserComponent implements OnInit {
  userReviews: ProductReview[] = [];
  productMap: Map<number, ProductCardItem> = new Map();
  isLoading = true;
  error: string | null = null;

  constructor(
    private reviewService: ReviewService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadUserReviews();
  }

  loadUserReviews(): void {
    this.isLoading = true;
    this.error = null;

    this.reviewService.getUserReviews().subscribe({
      next: (reviews) => {
        this.userReviews = reviews;
        this.loadProductDetails();
      },
      error: (err) => {
        this.error = 'Failed to load your reviews. Please try again.';
        this.isLoading = false;
        console.error('Error loading user reviews:', err);
      }
    });
  }

  loadProductDetails(): void {
    if (this.userReviews.length === 0) {
      this.isLoading = false;
      return;
    }

    const uniqueProductIds = [...new Set(this.userReviews.map(review => review.productId))];
    let loadedCount = 0;

    uniqueProductIds.forEach(productId => {
      this.productService.getPublicProductById(productId).subscribe({
        next: (product) => {
          this.productMap.set(productId, product);
          loadedCount++;
          if (loadedCount === uniqueProductIds.length) {
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error(`Error loading product ${productId}:`, err);
          loadedCount++;
          if (loadedCount === uniqueProductIds.length) {
            this.isLoading = false;
          }
        }
      });
    });
  }

  getProductName(productId: number): string {
    const product = this.productMap.get(productId);
    return product?.product?.name || 'Unknown Product';
  }

  getProductImage(productId: number): string {
    const product = this.productMap.get(productId);
    if (product?.product?.productImages && product.product.productImages.length > 0) {
      return product.product.productImages[0].imgPath || '';
    }
    return '';
  }

  getStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  getStarClass(star: number, rating: number): string {
    return star <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getReviewImages(review: ProductReview): string[] {
    return review.images?.map(img => img.imageUrl) || [];
  }

  selectedImage: string = '';

  openImageModal(imageUrl: string): void {
    this.selectedImage = imageUrl;
    // You can implement modal opening logic here if needed
    // For now, we'll use Bootstrap modal
    const modal = document.getElementById('imageModal');
    if (modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  // Computed properties for template
  get verifiedReviewsCount(): number {
    return this.userReviews.filter(r => r.verifiedPurchase).length;
  }

  get averageRating(): string {
    if (this.userReviews.length === 0) return '0.0';
    const total = this.userReviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / this.userReviews.length).toFixed(1);
  }

  get reviewsWithImagesCount(): number {
    return this.userReviews.filter(r => r.images && r.images.length > 0).length;
  }
}
