import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DiscountEA_A, DiscountEventDTO } from '@app/core/models/discount';

@Component({
  selector: 'app-discount-hero-carousel',
  standalone: false,
  templateUrl: './discount-hero-carousel.component.html',
  styleUrl: './discount-hero-carousel.component.css'
})

export class DiscountHeroCarouselComponent implements OnInit, OnDestroy {
  @Input() discounts: DiscountEventDTO[] = [];

  currentIndex = 0;
  countdowns: string[] = [];
  private countdownInterval: any;

  ngOnInit(): void {
    this.initCountdowns();
    this.startCountdownTimer();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  initCountdowns(): void {
    this.countdowns = this.discounts.map(d => this.getCountdownString(d.endDate));
  }

  startCountdownTimer(): void {
    this.countdownInterval = setInterval(() => {
      this.countdowns = this.discounts.map(d => this.getCountdownString(d.endDate));
    }, 1000);
  }

  getCountdownString(endDateStr: string | undefined): string {
    if (!endDateStr) return '';
    const endDate = new Date(endDateStr);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  setSlide(index: number): void {
    this.currentIndex = index;
  }
}