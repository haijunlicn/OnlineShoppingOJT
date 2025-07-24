import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DiscountEventDTO, DiscountMechanismDTO } from '@app/core/models/discount';
import { ProductDTO } from '@app/core/models/product.model';
import { AlertService } from '@app/core/services/alert.service';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';

@Component({
  selector: 'app-discount-detail',
  standalone: false,
  templateUrl: './discount-detail.component.html',
  styleUrl: './discount-detail.component.css'
})


export class DiscountDetailComponent implements OnInit {
  discount: DiscountEventDTO | null = null
  isLoading = true

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private discountDisplayService: DiscountDisplayService,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {
    const discountId = +this.route.snapshot.paramMap.get("id")!
    this.discountDisplayService.getDiscountById(discountId).subscribe({
      next: (data) => {
        this.discount = data
        this.isLoading = false
        console.log("discount detail : ", this.discount)
      },
      error: (err) => {
        console.error("Failed to fetch discount details", err)
        this.isLoading = false
      },
    })
  }


  getMechanismTypeLabel(type: string): string {
    return type === "Coupon" ? "Coupon Code Offer" : "Auto Discount"
  }

  getDiscountText(m: DiscountMechanismDTO): string {
    return m.discountType === "PERCENTAGE" ? `${m.value}% off` : `Flat ${m.value!.toLocaleString()} MMK off`
  }

  getMainProductImage(product: ProductDTO): string {
    const mainImage = product.productImages?.find((img) => img.mainImageStatus)
    return mainImage?.imgPath || "assets/images/products/default.jpg"
  }

  hasStock(product: ProductDTO): boolean {
    // Add your stock checking logic here
    return true // Placeholder
  }

  viewProduct(product: ProductDTO): void {
    this.router.navigate(["/customer/product", product.id])
  }

  goToDetail(product: ProductDTO): void {
    this.router.navigate(["/customer/product", product.id])
  }

  getRemainingTime(): string {
    if (!this.discount?.endDate) return ""

    const now = new Date().getTime()
    const end = new Date(this.discount.endDate).getTime()
    const diff = end - now

    if (diff <= 0) return "Expired"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  goBack(): void {
    window.history.back()
  }

  shareDiscount(): void {
    if (navigator.share) {
      navigator.share({
        title: this.discount?.name,
        text: this.discount?.description,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code)
      .then(() => {
        this.alertService.toast(`Coupon code "${code}" copied to clipboard`, 'success');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        this.alertService.toast('Failed to copy coupon code', 'error');
      });
  }

}
