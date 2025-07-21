import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ProductListComponent } from '../product-list/product-list.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductCardItem, ProductDTO, ProductImageDTO, ProductListItemDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import Swal from 'sweetalert2';
import { WishlistDialogComponent } from '../../general/wishlist-dialog/wishlist-dialog.component';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { MatDialog } from '@angular/material/dialog';
import { ReviewService } from '../../../../core/services/review.service';
import { ProductReview, ProductReviewImage } from '../../../../core/models/review';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { AuthService } from '../../../../core/services/auth.service'; // Assume you have this

// Change editReviewData type and default value
declare interface EditReviewData {
  rating: number;
  comment: string;
  images: { imageUrl: string }[];
}

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent {
  product!: ProductCardItem;
  mainImageUrl = "";
  selectedOptions: { [optionId: number]: number } = {};
  selectedVariant?: ProductVariantDTO;
  form!: FormGroup;
  allImages: Array<{ url: string; variantId?: string }> = [];
  quantity = 1;
  currentImageIndex = 0;
  wishList = new Set<number>();
  cartItems: { productId: number; variantId: number; quantity: number }[] = [];

  @Input() categoryId!: number;
  @Input() productId!: number;

  relatedProducts: ProductDTO[] = [];  // <-- related products list

   @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

// Add these methods to your component
scrollLeft(): void {
  const container = this.scrollContainer.nativeElement;
  const cardWidth = container.querySelector('.related-product-card')?.offsetWidth || 250;
  const scrollAmount = (cardWidth + 16) * 4; // 4 cards + gap
  container.scrollBy({
    left: -scrollAmount,
    behavior: 'smooth'
  });
}

scrollRight(): void {
  const container = this.scrollContainer.nativeElement;
  const cardWidth = container.querySelector('.related-product-card')?.offsetWidth || 250;
  const scrollAmount = (cardWidth + 16) * 4; // 4 cards + gap
  container.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  });
}
  // Review system state
  reviews: any[] = [];
  reviewTotal: number = 0;
  reviewAverage: number = 0;
  reviewBreakdown: { [key: number]: number } = {};
  reviewPage: number = 1;
  reviewPageSize: number = 4;
  reviewSort: string = 'date_desc';
  reviewFilterRating?: number;
  isLoadingReviews: boolean = false;
  newReview: { rating: number; comment: string } = { rating: 5, comment: '' };
  isSubmittingReview: boolean = false;
  uploadedReviewImages: {  imageUrl: string }[] = [];
  userId?: number;
  userName?:string;
  isLoggedIn: boolean = false;
  hasPurchasedProduct: boolean = false;
  hasReviewedProduct: boolean = false;

  editingReview: any = null;
  editReviewData: EditReviewData = { rating: 5, comment: '', images: [] };

  openEditReview(review: any) {
    this.editingReview = review;
    this.editReviewData = {
      rating: review.rating,
      comment: review.comment,
      images: review.images ? review.images.map((img: any) => ({ imageUrl: img.imageUrl })) : []
    };
  }

  closeEditReview() {
    this.editingReview = null;
  }

  submitEditReview() {
    if (!this.editingReview) return;
    const filteredImages = this.editReviewData.images.filter(img => img.imageUrl && img.imageUrl.trim() !== '');
    const updatedReview = {
      ...this.editingReview,
      rating: this.editReviewData.rating,
      comment: this.editReviewData.comment,
      images: filteredImages
    };
    this.reviewService.updateReview(updatedReview).subscribe({
      next: () => {
        this.closeEditReview();
        this.loadReviews();
      },
      error: () => {
        alert('Failed to update review');
      }
    });
  }

  deleteReview(review: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this review?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reviewService.deleteReview(review.id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Your review has been deleted.', 'success');
            this.loadReviews();
          },
          error: () => {
            Swal.fire('Error', 'Failed to delete review.', 'error');
          }
        });
      }
    });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private dialog: MatDialog,
     // ... existing code ...
     private reviewService: ReviewService,
     private cloudinaryService: CloudinaryService,
   private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.fetchCurrentUser().subscribe({
      next: user => {
        this.userId = user.id;
        this.userName = user.name;
        this.isLoggedIn = true;
      },
      error: () => {
        this.isLoggedIn = false;
      }
    });
    this.fetchProductDetail();
  }

  checkPurchaseStatus(): void {
    // Always load reviews for everyone (logged in or not)
    this.loadReviews();
    
    // Only check purchase status if user is logged in
    if (!this.isLoggedIn || !this.product?.product?.id) {
      this.hasPurchasedProduct = false;
      console.log('❌ Not logged in or no product ID');
      return;
    }

    console.log('🔍 Checking purchase status for product:', this.product.product.id);
    console.log('👤 User ID:', this.userId);

    // Call backend API to check if user has purchased and received this product
    this.reviewService.checkPurchaseStatus(this.product.product.id).subscribe({
      next: (response) => {
        console.log('✅ Purchase check response:', response);
        this.hasPurchasedProduct = response.canReview;
        this.hasReviewedProduct = response.hasReviewed;
        console.log('📝 Can review:', this.hasPurchasedProduct);
        console.log('📝 Has reviewed:', this.hasReviewedProduct);
      },
      error: (error) => {
        console.error('❌ Purchase check error:', error);
        this.hasPurchasedProduct = false;
        this.hasReviewedProduct = false;
      }
    });
  }

  fetchProductDetail(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.productService.getPublicProductById(+id).subscribe({
        next: (data) => {
          this.product = data;
          this.initializeComponent();
          this.loadRelatedProducts();
          this.checkPurchaseStatus(); // This will also load reviews
          console.log("product details : ", this.product);
          
        },
        error: () => {
          this.router.navigate(["/customer/productList"]);
        },
      });
    } else {
      this.router.navigate(["/customer/productList"]);
    }
  }
    // ... review sort/filter/page change methods as before ...
  ////////////////////////////////////////////////////////////
  loadReviews(): void {
    if (!this.product?.product?.id) return;
    this.isLoadingReviews = true;
  
    this.reviewService.getProductReviews(
      this.product.product.id,
      this.reviewPage,
      this.reviewPageSize,
      this.reviewSort,
      this.reviewFilterRating
    ).subscribe({
      next: (res) => {
        this.reviews = res.reviews;
        this.reviewTotal = res.total;
        this.reviewAverage = res.average;
        this.reviewBreakdown = res.breakdown;
        this.isLoadingReviews = false;
      },
      error: () => {
        this.reviews = [];
        this.reviewTotal = 0;
        this.reviewAverage = 0;
        this.reviewBreakdown = {};
        this.isLoadingReviews = false;
      }
    });
  }

  onReviewImageSelected(event: any): void {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
  
      // Validate file type and size
      const validation = this.cloudinaryService.validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        continue; // Skip this file
      }
  
      this.cloudinaryService.uploadImage(file).subscribe({
        next: (url: string) => {
          this.uploadedReviewImages.push({ imageUrl: url });
        },
        error: () => {
          alert('Image upload failed');
        }
      });
    }
  }

  removeReviewImage(i: number): void {
    this.uploadedReviewImages.splice(i, 1);
  }

  submitReview(): void {
    if (!this.product?.product?.id) return;
    this.isSubmittingReview = true;
  
    const reviewPayload: Partial<ProductReview> = {
      productId: this.product.product.id,
     
      rating: this.newReview.rating,
      comment: this.newReview.comment,
      images: this.uploadedReviewImages,
      
     
    };
    console.log('Review payload:', reviewPayload);
    this.reviewService.addReview(reviewPayload).subscribe({
      next: (review) => {
        this.isSubmittingReview = false;
        this.newReview = { rating: 5, comment: '' };
        this.uploadedReviewImages = [];
        this.loadReviews(); // Refresh review list
        Swal.fire({
          title: 'Success!',
          text: 'Your review has been submitted successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.isSubmittingReview = false;
        let errorMessage = 'Failed to submit review. Please try again.';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 403) {
          errorMessage = 'You are not allowed to give review again';
        } else if (error.message) {
          errorMessage = error.message;
        }
        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }
  ///////////////////////
  initializeComponent(): void {
    this.initForm();
    this.setDefaultSelections();
    this.buildImagesList();
    this.setDefaultMainImage();
  }

  initForm(): void {
    const group: { [key: string]: any } = {}

    this.product.options.forEach((option) => {
      if (option.optionValues.length > 0) {
        const firstValueId = option.optionValues[0].id!
        group[option.id] = [firstValueId]
        this.selectedOptions[option.id] = firstValueId
      }
    })

    this.form = this.fb.group(group)
  }
loadRelatedProducts(): void {
  if (!this.product || !this.product.product || !this.product.id || !this.product.product.categoryId) {
    console.warn('Missing product or category data');
    return;
  }

  const categoryId = +this.product.product.categoryId;
  const currentProductId = +this.product.id;

  this.productService.getRelatedProducts(categoryId, currentProductId).subscribe({
    next: (products) => {
      this.relatedProducts = products;
    },
    error: (err) => {
      console.error('Failed to load related products:', err);
    }
  });
}

getMainProductImage(product: ProductDTO): string {
    if (product.productImages && product.productImages.length > 0) {
      const mainImage = product.productImages.find((img: any) => img.mainImageStatus);

      if (mainImage) {
        return mainImage.imgPath!
      } else if (product.productImages[0]) {
        return product.productImages[0].imgPath!
      }
    }
    return 'assets/images/placeholder.jpg'; // Fallback image
  }

  setDefaultSelections(): void {
    // Update selected variant based on default selections
    this.updateSelectedVariant()
    console.log("default selections : ", this.selectedVariant);

  }

  buildImagesList(): void {
    this.allImages = []

    // Add product images first
    if (this.product.product.productImages) {
      const sortedProductImages = this.product.product.productImages.sort((a, b) => a.displayOrder - b.displayOrder)

      sortedProductImages.forEach((img) => {
        if (img.imgPath) {
          this.allImages.push({
            url: img.imgPath,
          })
        }
      })
    }

    // Add variant images if they exist and aren't already in the list
    this.product.variants.forEach((variant) => {
      if (variant.imgPath && !this.allImages.some((img) => img.url === variant.imgPath)) {
        this.allImages.push({
          url: variant.imgPath,
          variantId: variant.sku,
        })
      }
    })
  }

  setDefaultMainImage(): void {
    // First try to get main image from product images
    if (this.product.product.productImages && this.product.product.productImages.length > 0) {
      const sortedImages = this.product.product.productImages.sort((a, b) => a.displayOrder - b.displayOrder)
      const mainImage = sortedImages.find((img) => img.mainImageStatus) || sortedImages[0]
      this.mainImageUrl = mainImage.imgPath || ""

      // Set the current image index
      const mainImageIndex = this.allImages.findIndex((img) => img.url === this.mainImageUrl)
      if (mainImageIndex !== -1) {
        this.currentImageIndex = mainImageIndex
      }
    }

    // If no product images and selected variant has image, use variant image
    if (!this.mainImageUrl && this.selectedVariant?.imgPath) {
      this.mainImageUrl = this.selectedVariant.imgPath

      // Set the current image index
      const variantImageIndex = this.allImages.findIndex((img) => img.url === this.mainImageUrl)
      if (variantImageIndex !== -1) {
        this.currentImageIndex = variantImageIndex
      }
    }
  }

  // Image slider navigation
  nextImage(): void {
    if (this.currentImageIndex < this.allImages.length - 1) {
      this.currentImageIndex++
    } else {
      this.currentImageIndex = 0
    }
    this.mainImageUrl = this.allImages[this.currentImageIndex].url
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--
    } else {
      this.currentImageIndex = this.allImages.length - 1
    }
    this.mainImageUrl = this.allImages[this.currentImageIndex].url
  }

  setActiveImage(index: number): void {
    this.currentImageIndex = index
    this.mainImageUrl = this.allImages[index].url
  }

  trackByOptionId(index: number, option: any): number {
    return option.id
  }

  trackByOptionValue(index: number, value: any): number {
    return value.id
  }

  trackByImageUrl(index: number, image: any): string {
    return image.url
  }

  getValidOptionValues(optionId: number, allValues: any[]): any[] {
    const selected = { ...this.selectedOptions }
    delete selected[optionId]

    const validValueIds = new Set<number>()

    for (const variant of this.product.variants) {
      const matches = variant.options.every(vo => {
        return selected[vo.optionId] == null || selected[vo.optionId] === vo.optionValueId
      })

      if (matches) {
        const match = variant.options.find(vo => vo.optionId === optionId)
        if (match) validValueIds.add(match.optionValueId)
      }
    }

    return allValues.filter(val => validValueIds.has(val.id))
  }


  onOptionChange(optionId: number, valueId: number): void {
    this.form.get(optionId.toString())?.setValue(valueId)
    this.selectedOptions[optionId] = valueId
    this.updateSelectedVariant()
    this.autoSelectVariantImage()
    this.quantity = 1
    this.refreshCart()
  }

  updateSelectedVariant(): void {
    this.selectedVariant = this.product.variants.find((variant) => {
      const variantOptions = variant.options ?? []

      // CASE 1: No options — treat as default variant
      if (variantOptions.length === 0 && Object.keys(this.selectedOptions).length === 0) {
        return true
      }

      // CASE 2: Match all selected options
      return variantOptions.every(
        (variantOption) =>
          this.selectedOptions[variantOption.optionId] === variantOption.optionValueId
      )
    })
  }


  autoSelectVariantImage(): void {
    // If selected variant has an image, auto-select it
    if (this.selectedVariant?.imgPath) {
      this.mainImageUrl = this.selectedVariant.imgPath

      // Find the index of the variant image and update currentImageIndex
      const imageIndex = this.allImages.findIndex((img) => img.url === this.selectedVariant?.imgPath)
      if (imageIndex !== -1) {
        this.currentImageIndex = imageIndex
      }
    }
  }

  isSelected(optionId: number, valueId: number): boolean {
    return this.selectedOptions[optionId] === valueId
  }

  setMainImage(imagePath: string): void {
    this.mainImageUrl = imagePath
  }

  isImageSelected(imageUrl: string): boolean {
    return this.mainImageUrl === imageUrl
  }

  getStockStatus(): string {
    if (!this.selectedVariant) return "";
    if (this.selectedVariant.stock === 0) return "Out of Stock";
    if (this.selectedVariant.stock <= 5) return `Low Stock (Only ${this.selectedVariant.stock} left)`;
    return "In Stock";
  }

  getStockClass(): string {
    if (!this.selectedVariant) return ""
    if (this.selectedVariant.stock === 0) return "text-danger"
    if (this.selectedVariant.stock <= 5) return "text-warning"
    return "text-success"
  }

  loadWishlist() {
    const userId = 4; // replace with dynamic user ID
    this.wishlistService.getWishedProductIds(userId).subscribe({
      next: (wishedIds) => {
        this.wishList = new Set<number>(wishedIds);
        // this.productService.getProductList().subscribe({
        //   next: (products) => this.products = products,
        //   error: (err) => console.error('Error loading products:', err)
        // });
      },
      error: (err) => console.error('Failed to load wishlist:', err)
    });
  }

  toggleWish(productId: number): void {
    const userId = 4;

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

  private refreshCart(): void {
    this.cartItems = this.cartService.getCart().map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      variantSku: i.variantSku,
      quantity: i.quantity,
    }));
  }

  /** Get cart quantity for the currently selected variant */
  getCurrentVariantCartQuantity(): number {
    if (!this.selectedVariant) return 0;
    return this.cartService.getVariantQuantity(this.product.product.id!, this.selectedVariant.id!);
  }

  /** Get remaining stock for the currently selected variant */
  getCurrentVariantRemainingStock(): number {
    if (!this.selectedVariant) return 0;
    const inCart = this.getCurrentVariantCartQuantity();
    return this.selectedVariant.stock - inCart;
  }

  addToCart(item: ProductListItemDTO): void {
    if (!this.selectedVariant) {
      alert("Please select all options.");
      return;
    }

    const stock = this.selectedVariant.stock;
    const inCart = this.getCurrentVariantCartQuantity();

    if (stock === 0 || inCart >= stock) {
      Swal.fire({
        title: stock === 0 ? "❌ Out of Stock!" : "⚠️ Stock Limit Reached",
        text: `${item.product.name} (${this.selectedVariant.sku}) is ${stock === 0 ? "currently out of stock." : "out of stock."
          }`,
        icon: stock === 0 ? "error" : "warning",
        toast: true,
        position: "top",
        showConfirmButton: false,
        timer: 2500,
        background: stock === 0 ? "#ffe6e6" : "#e8d7c3",
        color: "#333",
        customClass: { popup: "custom-toast-popup" },
      });
      return;
    }

    // Add the selected quantity (not just 1)
const fallbackImage =
  this.selectedVariant.imgPath?.trim() ||
  item.product.productImages?.find(img => img.mainImageStatus)?.imgPath?.trim() ||
  "assets/images/default.jpg";

    for (let i = 0; i < this.quantity; i++) {
      this.cartService.addToCart({
        id: item.product.id!,
        name: item.product.name,
        variantId: this.selectedVariant.id!,
        variantSku: this.selectedVariant.sku,  
        stock: this.selectedVariant.stock,
        price: this.selectedVariant.price,
        image: fallbackImage,
      });
    }


    this.refreshCart();

    Swal.fire({
      title: "🛒 Added to Cart!",
      text: `${this.quantity} x ${item.product.name} (${this.selectedVariant.sku}) added successfully.`,
      icon: "success",
      toast: true,
      position: "top",
      showConfirmButton: false,
      timer: 1500,
      background: "#f0fff0",
      color: "#333",
      customClass: { popup: "custom-toast-popup" },
    });

    this.quantity = 1;
  }
      
  incrementQuantity(): void {
    const maxAllowed = this.getCurrentVariantRemainingStock();
    if (this.quantity < maxAllowed) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  getCartQuantity(productId: number): number {
    const entry = this.cartItems.find(i => i.productId === productId);
    return entry ? entry.quantity : 0;
  }

  // --- Review Methods ---
  onReviewSortChange(sort: string): void {
    this.reviewSort = sort;
    this.loadReviews();
  }

  onReviewFilterChange(rating?: number): void {
    this.reviewFilterRating = rating;
    this.loadReviews();
  }

  onReviewPageChange(page: number): void {
    this.reviewPage = page;
    this.loadReviews();
  }

  // --- For template: Math functions ---
  getRounded(value: number): number {
    return Math.round(value);
  }

  getPages(): number[] {
    return Array(Math.ceil(this.reviewTotal / this.reviewPageSize)).fill(0).map((x, i) => i + 1);
  }

  onEditReviewImageSelected(event: any, idx: number): void {
    const file: File = event.target.files[0];
    if (!file) return;
    const validation = this.cloudinaryService.validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (url: string) => {
        this.editReviewData.images[idx].imageUrl = url;
      },
      error: () => {
        alert('Image upload failed');
      }
    });
  }

  removeEditReviewImage(idx: number): void {
    this.editReviewData.images.splice(idx, 1);
  }

  addEditReviewImage(input: HTMLInputElement) {
    input.value = '';
    input.click();
  }
  onAddEditReviewImageSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    const validation = this.cloudinaryService.validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (url: string) => {
        if (url && url.startsWith('http')) {
          this.editReviewData.images.push({ imageUrl: url });
        } else {
          alert('Image upload failed: Invalid URL');
        }
      },
      error: () => {
        alert('Image upload failed');
      }
    });
  }

}
