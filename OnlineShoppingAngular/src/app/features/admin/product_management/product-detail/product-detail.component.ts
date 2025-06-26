import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { ProductCardItem, ProductImageDTO, ProductListItemDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';


@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product?: ProductCardItem;
  mainImageUrl: string = '/assets/img/default-product.jfif';
  showStockModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(+id).subscribe({
        next: (data) => {
          this.product = data;
          this.setMainImage();
          console.log('Admin Product Details:', this.product);
        },
        error: () => {
          this.router.navigate(['/admin/productList']);
        }
      });
    } else {
      this.router.navigate(['/admin/productList']);
    }
  }

  setMainImage(imagePath?: string): void {
    if (imagePath) {
      this.mainImageUrl = imagePath;
    } else if (this.product) {
      const images = this.product.product.productImages;
      if (images && images.length > 0) {
        const mainImg = images.find(img => img.mainImageStatus);
        this.mainImageUrl = mainImg?.imgPath || images[0].imgPath || '/assets/img/default-product.jfif';
      }
    }
  }

  // Stock Status Methods
  getOverallStockStatus(): string {
    if (!this.product) return '';
    const totalStock = this.getTotalStock();
    if (totalStock === 0) return 'Out of Stock';
    if (totalStock <= 10) return 'Low Stock';
    return 'In Stock';
  }

  getOverallStockClass(): string {
    const status = this.getOverallStockStatus();
    switch (status) {
      case 'Out of Stock': return 'text-danger';
      case 'Low Stock': return 'text-warning';
      default: return 'text-success';
    }
  }

  getStockIcon(): string {
    const status = this.getOverallStockStatus();
    switch (status) {
      case 'Out of Stock': return 'bi-x-circle-fill';
      case 'Low Stock': return 'bi-exclamation-triangle-fill';
      default: return 'bi-check-circle-fill';
    }
  }

  getTotalStock(): number {
    if (!this.product) return 0;
    return this.product.variants.reduce((total, variant) => total + variant.stock, 0);
  }

  getInStockVariants(): number {
    if (!this.product) return 0;
    return this.product.variants.filter(v => v.stock > 5).length;
  }

  getLowStockVariants(): number {
    if (!this.product) return 0;
    return this.product.variants.filter(v => v.stock > 0 && v.stock <= 5).length;
  }

  getOutOfStockVariants(): number {
    if (!this.product) return 0;
    return this.product.variants.filter(v => v.stock === 0).length;
  }

  // Variant Stock Methods
  getVariantStockStatus(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 5) return 'Low Stock';
    return 'In Stock';
  }

  getVariantStockClass(stock: number): string {
    if (stock === 0) return 'text-danger';
    if (stock <= 5) return 'text-warning';
    return 'text-success';
  }

  getVariantStockBadgeClass(stock: number): string {
    if (stock === 0) return 'bg-danger';
    if (stock <= 5) return 'bg-warning';
    return 'bg-success';
  }

  getVariantStockIcon(stock: number): string {
    if (stock === 0) return 'bi-x-circle-fill';
    if (stock <= 5) return 'bi-exclamation-triangle-fill';
    return 'bi-check-circle-fill';
  }

  // Price Methods
  getPriceRange(): string {
    if (!this.product || this.product.variants.length === 0) {
      return this.product ? `${this.product.product.basePrice.toLocaleString()} MMK` : '';
    }

    const prices = this.product.variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `${minPrice.toLocaleString()} MMK`;
    }

    return `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} MMK`;
  }

  // Option Methods
  getOptionName(optionId: number): string {
    if (!this.product) return '';
    const option = this.product.options.find(o => o.id === optionId);
    return option?.name || '';
  }

  getOptionValue(optionId: number, optionValueId: number): string {
    if (!this.product) return '';
    const option = this.product.options.find(o => o.id === optionId);
    if (!option) return '';
    const value = option.optionValues.find(v => v.id === optionValueId);
    return value?.value || '';
  }

  // Action Methods
  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/admin/product/edit', this.product.product.id]);
    }
  }

  openStockUpdateModal(): void {
    this.showStockModal = true;
  }

  onCloseStockModal(): void {
    this.showStockModal = false;
  }

  onStockUpdated(): void {
    // Do whatever you want after stock update, e.g. refresh data or UI
    console.log('Stock updated!');
  }

  // TrackBy Methods for Performance
  trackByVariantId(index: number, variant: ProductVariantDTO): number {
    return variant.id || index;
  }
}
