import { ChangeDetectorRef, Component, DoCheck, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-price-display-input',
  standalone: false,
  templateUrl: './price-display-input.component.html',
  styleUrl: './price-display-input.component.css'
})

export class PriceDisplayInputComponent implements OnInit, OnDestroy {

  constructor(private cdr: ChangeDetectorRef) { }

  @Input() control!: FormControl;

  displayValue = '';
  private valueSub?: Subscription;
  private lastRawValue: number | null | undefined

  ngOnInit(): void {
    if (this.control) {
      this.initializeDisplayValue();
      this.subscribeToValueChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['control'] && this.control) {
      this.initializeDisplayValue();
      this.subscribeToValueChanges();
    }
  }

  ngOnDestroy(): void {
    this.valueSub?.unsubscribe();
  }

  initializeDisplayValue(): void {
    const actualValue = this.control?.value;

    if (actualValue == null || actualValue === 0) {
      // If it's not initialized yet, wait and try again
      setTimeout(() => this.initializeDisplayValue(), 10);
      return;
    }

    // Force UI update
    this.control?.setValue(0, { emitEvent: false });

    setTimeout(() => {
      this.control?.setValue(actualValue, { emitEvent: true });
      this.updateDisplayValue(actualValue);
      this.lastRawValue = actualValue;
    }, 0);
  }

  private subscribeToValueChanges(): void {
    this.valueSub?.unsubscribe();
    this.valueSub = this.control?.valueChanges.subscribe((val) => {
      this.updateDisplayValue(val);
    });
  }

  updateDisplayValue(val: number | null | undefined): void {
    this.displayValue = this.formatPrice(val);
  }

  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.displayValue = raw;

    const numericValue = Number(raw.replace(/,/g, ''));
    if (!isNaN(numericValue)) {
      this.control?.setValue(numericValue, { emitEvent: false });
    }
  }

  formatPrice(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '';
    return value.toLocaleString('en-US');
  }
}