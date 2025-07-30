import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProductVariantDTO, VariantPriceDTO } from '@app/core/models/product.model';

@Component({
  selector: "app-price-history-modal",
  standalone: false,
  templateUrl: "./price-history-modal.component.html",
  styleUrl: "./price-history-modal.component.css",
})
export class PriceHistoryModalComponent implements OnInit {
  @Input() variant!: ProductVariantDTO
  @Input() show = false
  @Output() close = new EventEmitter<void>()

  sortedHistory: VariantPriceDTO[] = []
  totalOrders = 0
  averagePrice = 0

  ngOnInit(): void {
    if (this.variant) {
      this.initializeData()
    }
  }

  ngOnChanges(): void {
    if (this.variant) {
      this.initializeData()
    }
  }

  private initializeData(): void {
    const history = this.variant.priceHistory ?? []

    // Sort price history by date (newest first)
    this.sortedHistory = [...history].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )

    // Calculate total orders
    this.totalOrders = history.reduce((sum, h) => sum + h.orderCount!, 0)

    // Calculate average price
    this.averagePrice =
      history.length > 0
        ? history.reduce((sum, h) => sum + h.price, 0) / history.length
        : this.variant.price
  }


  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  formatCurrency(amount: number): string {
    return `MMK ${amount.toFixed(2)}`
  }

  getPriceChange(currentPrice: number, previousPrice: number): number {
    return currentPrice - previousPrice
  }

  getPriceChangeClass(change: number): string {
    if (change > 0) return "price-increase"
    if (change < 0) return "price-decrease"
    return "price-neutral"
  }

  getPriceChangeIcon(change: number): string {
    if (change > 0) return "fas fa-arrow-up"
    if (change < 0) return "fas fa-arrow-down"
    return "fas fa-minus"
  }

  isCurrentPrice(history: VariantPriceDTO, index: number): boolean {
    return !history.endDate && index === 0
  }

  closeModal(): void {
    this.close.emit()
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal()
    }
  }

  Math = Math

}
