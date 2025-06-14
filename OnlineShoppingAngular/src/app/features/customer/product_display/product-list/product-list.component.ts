import { Component } from '@angular/core';
import { ProductCardItem, ProductDTO, ProductListItemDTO } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent {
  products: ProductCardItem[] = [];


  constructor(
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProductList().subscribe({
      next: (products) => {
        this.products = products.map(product => ({
          ...product,
          status: this.getStockStatus(product) // 👈 Add this line
        }));
      },
      error: (err) => {
        console.error('Failed to load products', err);
      }
    });
  }


  getStockStatus(product: ProductListItemDTO): string {
    return product.variants.some(v => v.stock > 0) ? 'In Stock' : 'Out of Stock';
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

  getLowestPrice(product: any): number {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map((v: any) => v.price);
      return Math.min(...prices);
    }
    return product.product.basePrice;
  }

  hasStock(product: any): boolean {
    if (product.variants && product.variants.length > 0) {
      return product.variants.some((v: any) => v.stock > 0);
    }
    return false;
  }

  isOnSale(product: any): boolean {
    if (product.variants && product.variants.length > 0) {
      return product.variants.some((v: any) => v.price < product.product.basePrice);
    }
    return false;
  }

  isNew(product: any): boolean {
    // Check if product was created within the last 14 days
    if (product.product.createdDate) {
      const createdDate = new Date(product.product.createdDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 14;
    }
    return false;
  }

  hasColorVariants(product: any): boolean {
    return this.getColorOptions(product).length > 0;
  }

  getColorOptions(product: any): any[] {
    if (!product.options) return [];

    // Find color option type
    const colorOption = product.options.find((opt: any) =>
      opt.name.toLowerCase().includes('color') ||
      opt.name.toLowerCase().includes('colour')
    );

    if (colorOption && colorOption.optionValues) {
      return colorOption.optionValues;
    }

    return [];
  }

  quickView(product: any, event: Event): void {
    event.stopPropagation();
    // Implement quick view modal logic
    console.log('Quick view', product);
  }

  addToWishlist(product: any, event: Event): void {
    event.stopPropagation();
    // Implement wishlist logic
    console.log('Add to wishlist', product);
  }

  viewProduct(product: any): void {
    // Navigate to product detail page
    // this.router.navigate(['/product', product.id]);
    console.log('View product', product);
  }

  goToDetail(product: ProductCardItem): void {
    this.router.navigate(['/customer/product', product.id]);
  }

  sortByPriceAsc() {
    this.products.sort((a, b) => this.getLowestPrice(a) - this.getLowestPrice(b));
  }

  sortByBrand() {
    this.products.sort((a, b) => a.brand.name.localeCompare(b.brand.name));
  }


}
