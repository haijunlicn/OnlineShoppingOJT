import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-price-display-input',
  standalone: false,
  templateUrl: './price-display-input.component.html',
  styleUrl: './price-display-input.component.css'
})

export class PriceDisplayInputComponent implements OnInit, OnDestroy {
  @Input() control!: FormControl;

  displayValue: string = 'Hello';
  private valueSub!: Subscription;

  ngOnInit(): void {
    this.updateDisplayValue(this.control.value);

    console.log("this.control.value : ", this.control.value);
    

    // Always subscribe on init
    this.valueSub = this.control.valueChanges.subscribe(val => {
      this.updateDisplayValue(val);
    });
  }

  ngOnDestroy(): void {
    this.valueSub?.unsubscribe();
  }

  updateDisplayValue(val: number | null | undefined): void {
    this.displayValue = this.formatPrice(val);
  }

  onInputChange(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.displayValue = input;

    const numericValue = Number(input.replace(/,/g, ''));
    if (!isNaN(numericValue)) {
      this.control.setValue(numericValue, { emitEvent: false });
    }
  }

  formatPrice(value: number | null | undefined): string {
    if (value == null || isNaN(value)) {
      console.log("not good..................");
      
      return '';
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 0 });
  }
}