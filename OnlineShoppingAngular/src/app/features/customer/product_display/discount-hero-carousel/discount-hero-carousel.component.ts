import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output
} from '@angular/core';
import { DiscountEventDTO, DiscountMechanismDTO } from '@app/core/models/discount';
import { CountdownService } from '@app/core/services/countdown-service.service';
import { CountdownEvent } from 'ngx-countdown';

@Component({
  selector: "app-discount-hero-carousel",
  standalone: false,
  templateUrl: "./discount-hero-carousel.component.html",
  styleUrls: ["./discount-hero-carousel.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("slideInLeft", [
      transition(":enter", [
        style({ transform: "translateX(-30px)", opacity: 0 }),
        animate("0.8s cubic-bezier(0.4, 0, 0.2, 1)", style({ transform: "translateX(0)", opacity: 1 })),
      ]),
    ]),
    trigger("slideInRight", [
      transition(":enter", [
        style({ transform: "translateX(30px)", opacity: 0 }),
        animate("0.8s cubic-bezier(0.4, 0, 0.2, 1)", style({ transform: "translateX(0)", opacity: 1 })),
      ]),
    ]),
    trigger("staggerIn", [
      transition(":enter", [
        style({ transform: "translateY(15px)", opacity: 0 }),
        animate("0.5s cubic-bezier(0.4, 0, 0.2, 1)", style({ transform: "translateY(0)", opacity: 1 })),
      ]),
    ]),
    trigger("imageZoom", [
      state("in", style({ transform: "scale(1)" })),
      transition(":enter", [
        style({ transform: "scale(1.1)", opacity: 0 }),
        animate("1s cubic-bezier(0.4, 0, 0.2, 1)", style({ transform: "scale(1)", opacity: 1 })),
      ]),
    ]),
    trigger("buttonHover", [
      state("hover", style({ transform: "scale(1.05)" })),
      transition("* => hover", animate("0.2s ease-in-out")),
      transition("hover => *", animate("0.2s ease-in-out")),
    ]),
    trigger("indicatorPulse", [
      state("active", style({ transform: "scale(1.3)" })),
      state("inactive", style({ transform: "scale(1)" })),
      transition("inactive => active", [
        animate(
          "0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          keyframes([
            style({ transform: "scale(1)", offset: 0 }),
            style({ transform: "scale(1.5)", offset: 0.5 }),
            style({ transform: "scale(1.3)", offset: 1 }),
          ]),
        ),
      ]),
      transition("active => inactive", animate("0.3s cubic-bezier(0.4, 0, 0.2, 1)", style({ transform: "scale(1)" }))),
    ]),
  ],
})
export class DiscountHeroCarouselComponent implements OnInit {
  @Input() discounts: DiscountEventDTO[] = []
  @Output() viewDetails = new EventEmitter<DiscountEventDTO>()
  @Output() shopNow = new EventEmitter<void>()

  currentIndex = 0
  countdownConfig: any = {};
  countdownText = "";
  showCountdown = true;

  constructor(
    private cdr: ChangeDetectorRef,
    private countdownService: CountdownService
  ) { }

  ngOnInit(): void {
    this.updateCountdownForCurrentDiscount()
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
    console.log('Slide changed to index:', index, 'Current discount:', this.currentDiscount);

    this.showCountdown = false; // temporarily remove countdown from DOM
    this.cdr.markForCheck();

    setTimeout(() => {
      this.updateCountdownForCurrentDiscount();
      this.showCountdown = true; // re-add countdown to restart it
      this.cdr.markForCheck();
    }, 0);
  }

  goToPrevious(): void {
    this.currentIndex = this.currentIndex === 0 ? this.discounts.length - 1 : this.currentIndex - 1;
    console.log('Slide changed to previous index:', this.currentIndex, 'Current discount:', this.currentDiscount);

    this.showCountdown = false;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.updateCountdownForCurrentDiscount();
      this.showCountdown = true;
      this.cdr.markForCheck();
    }, 0);
  }

  goToNext(): void {
    this.currentIndex = (this.currentIndex + 1) % this.discounts.length;
    console.log('Slide changed to next index:', this.currentIndex, 'Current discount:', this.currentDiscount);

    this.showCountdown = false;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.updateCountdownForCurrentDiscount();
      this.showCountdown = true;
      this.cdr.markForCheck();
    }, 0);
  }

  onViewDetails(): void {
    if (this.currentDiscount) {
      this.viewDetails.emit(this.currentDiscount)
    }
  }

  onShopNow(): void {
    this.shopNow.emit()
  }

  get currentDiscount(): DiscountEventDTO | null {
    return this.discounts[this.currentIndex] || null
  }

  getMechanismIcon(type: string): string {
    switch (type) {
      case "DISCOUNT":
        return "fas fa-percent"
      case "COUPON":
        return "fas fa-tag"
      default:
        return "fas fa-percent"
    }
  }

  getMechanismText(mechanism: DiscountMechanismDTO): string {
    if (mechanism.discountType === "PERCENTAGE") {
      return `${mechanism.value}% OFF`
    } else {
      return `MMK ${mechanism.value} OFF`
    }
  }

  getVisibleMechanisms(): DiscountMechanismDTO[] {
    return this.currentDiscount?.mechanisms.slice(0, 3) || []
  }

  getHiddenMechanismsCount(): number {
    const total = this.currentDiscount?.mechanisms.length || 0
    return Math.max(0, total - 3)
  }

  // getRemainingSeconds(endTime?: string | Date): number {
  //   if (!endTime) return 0
  //   const end = new Date(endTime).getTime()
  //   const now = Date.now()
  //   const diff = Math.max(0, Math.floor((end - now) / 1000))
  //   return diff
  // }

  private updateCountdownForCurrentDiscount(): void {
    if (this.currentDiscount?.endDate) {
      const end = this.currentDiscount.endDate;
      this.countdownConfig = {
        leftTime: this.countdownService.getRemainingSeconds(end),
        format: this.countdownService.getCountdownFormat(end),
        notify: [1],
      };
    } else {
      this.countdownConfig = null;
    }
  }


  // private updateCountdownForCurrentDiscount(): void {
  //   if (this.currentDiscount?.endDate) {
  //     this.countdownConfig = {
  //       leftTime: this.getRemainingSeconds(this.currentDiscount.endDate),
  //       format: 'd:HH:mm:ss',
  //       notify: [1],
  //     };
  //   } else {
  //     this.countdownConfig = null;
  //   }
  // }

  onCountdownEvent(event: CountdownEvent): void {
    if (event.action === 'done') {
      this.countdownText = 'Expired!';
      this.cdr.markForCheck();
    }
  }

}
