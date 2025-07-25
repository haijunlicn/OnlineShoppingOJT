import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DiscountDisplayDTO, DiscountEventDTO, DiscountMechanismDTO } from '@app/core/models/discount';
import { ProductDTO } from '@app/core/models/product.model';
import { AlertService } from '@app/core/services/alert.service';
import { CountdownService } from '@app/core/services/countdown-service.service';
import { DiscountDetailDisplayService } from '@app/core/services/discount-detail-display.service';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';

@Component({
  selector: "app-discount-detail",
  standalone: false,
  templateUrl: "./discount-detail.component.html",
  styleUrl: "./discount-detail.component.css",
})
export class DiscountDetailComponent implements OnInit {
  discount: DiscountEventDTO | null = null
  isLoading = true

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private discountDisplayService: DiscountDisplayService,
    private discountDetailDisplayService: DiscountDetailDisplayService, // Inject the new service
    private alertService: AlertService,
    private countdownService: CountdownService,
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

  get remainingDays(): number {
    return this.countdownService.getRemainingDays(this.discount?.endDate)
  }

  get remainingSeconds(): number {
    return this.countdownService.getRemainingSeconds(this.discount?.endDate)
  }

  get countdownFormat(): string {
    return this.countdownService.getCountdownFormat(this.discount?.endDate)
  }

  onCountdownEvent(event: any): void {
    if (event.action === "done") {
      console.log("Countdown finished")
    }
  }

  goBack(): void {
    window.history.back()
  }

  onShopNow(): void {
    const target = document.getElementById('mechanism-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    navigator.clipboard
      .writeText(code)
      .then(() => {
        this.alertService.toast(`Coupon code "${code}" copied to clipboard`, "success")
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
        this.alertService.toast("Failed to copy coupon code", "error")
      })
  }

  // UPDATED: Use the new service for showing discount details

  showDiscountDetail(mechanism: DiscountMechanismDTO): void {
    const discountDisplay = this.mapMechanismToDisplayDTO(this.discount!, mechanism)
    this.discountDetailDisplayService.showDiscountDetail(discountDisplay)
  }

  // You can also add methods to show discount summaries or carousels
  showDiscountSummary(discount: any): void {
    const discountDisplay = {
      ...discount,
      mechanismType: discount.type || discount.mechanismType,
    }
    this.discountDetailDisplayService.showDiscountSummary(discountDisplay)
  }

  mapMechanismToDisplayDTO(event: DiscountEventDTO, mechanism: DiscountMechanismDTO): DiscountDisplayDTO {
    return {
      id: mechanism.id,
      name: event.name,
      type: event.type,
      couponcode: mechanism.couponCode,
      value: mechanism.value?.toString() ?? null,
      discountType: mechanism.discountType,
      mechanismType: mechanism.mechanismType,
      maxDiscountAmount: mechanism.maxDiscountAmount?.toString() ?? null,
      shortLabel: undefined, // optional
      conditionSummary: undefined, // optional
      conditionGroups: mechanism.conditionGroups,
      requireFrontendChecking: false,
      startDate: event.startDate,
      endDate: event.endDate,
      usageLimit: undefined, // optional
      // offeredProductIds: mechanism.offeredProducts?.map(p => p.id) ?? [],
      usageLimitTotal: mechanism.usageLimitTotal ?? 0,
      usageLimitPerUser: mechanism.usageLimitPerUser ?? 0,
    }
  }

}
