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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.fetchProductDetail();
  }

  fetchProductDetail(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.productService.getProductById(+id).subscribe({
        next: (data) => {
          this.product = data;
          this.initializeComponent();
          this.loadRelatedProducts();
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
  const categoryId = +this.product?.product?.categoryId;
  const currentProductId = +this.product?.id;

  if (!categoryId || !currentProductId) {
    console.warn('Missing categoryId or productId');
    return;
  }

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

}
