import { Component } from '@angular/core';
import { ProductListComponent } from '../product-list/product-list.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductCardItem, ProductImageDTO, ProductListItemDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent {
  product!: ProductCardItem
  mainImageUrl = ""
  selectedOptions: { [optionId: number]: number } = {}
  selectedVariant?: ProductVariantDTO
  form!: FormGroup
  allImages: Array<{ url: string; variantId?: string }> = []
  quantity = 1
  currentImageIndex = 0

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productService: ProductService,
  ) { }

  ngOnInit(): void {
    this.fetchProductDetail()
  }

  fetchProductDetail(): void {
    const id = this.route.snapshot.paramMap.get("id")
    if (id) {
      this.productService.getProductById(+id).subscribe({
        next: (data) => {
          this.product = data
          this.initializeComponent()
          console.log("product details : ", this.product)
        },
        error: () => {
          this.router.navigate(["/customer/productList"])
        },
      })
    } else {
      this.router.navigate(["/customer/productList"])
    }
  }

  initializeComponent(): void {
    this.initForm()
    this.setDefaultSelections()
    this.buildImagesList()
    this.setDefaultMainImage()
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

  setDefaultSelections(): void {
    // Update selected variant based on default selections
    this.updateSelectedVariant()
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

  onOptionChange(optionId: number, valueId: number): void {
    this.form.get(optionId.toString())?.setValue(valueId)
    this.selectedOptions[optionId] = valueId
    this.quantity = 1;
    this.updateSelectedVariant()
    this.autoSelectVariantImage()
  }

  updateSelectedVariant(): void {
    this.selectedVariant = this.product.variants.find((variant) => {
      return (
        Array.isArray(variant.options) &&
        variant.options.length > 0 &&
        variant.options.every(
          (variantOption) => this.selectedOptions[variantOption.optionId] === variantOption.optionValueId,
        )
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

  incrementQuantity(): void {
    if (this.selectedVariant && this.quantity < this.selectedVariant.stock) {
      this.quantity++
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--
    }
  }

  addToCart(): void {
    if (!this.selectedVariant) {
      alert("Please select all options.")
      return
    }

    if (this.selectedVariant.stock === 0) {
      alert("This variant is out of stock.")
      return
    }

    console.log("Adding to cart:", {
      productId: this.product.id,
      variant: this.selectedVariant,
      selectedOptions: this.selectedOptions,
      quantity: this.quantity,
    })

    alert("Product added to cart successfully!")
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
}
