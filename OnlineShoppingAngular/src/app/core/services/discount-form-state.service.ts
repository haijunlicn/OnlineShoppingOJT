import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DiscountFormState {
  formData: any;
  discountProducts: { [mechanismIndex: number]: any[] };
  freeGiftProducts: { [mechanismIndex: number]: any[] };
  allConditions: any[];
  serviceDescriptions: { [mechanismIndex: number]: string };
  imageData: {
    imagePreviewUrl: string | null;
    cloudinaryImageUrl: string | null;
    selectedFileName: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DiscountFormStateService {
  private formStateSubject = new BehaviorSubject<DiscountFormState | null>(null);
  public formState$ = this.formStateSubject.asObservable();

  constructor() {}

  // Save form state before navigation
  saveFormState(state: DiscountFormState): void {
    this.formStateSubject.next(state);
    console.log('DiscountFormStateService: Saved form state:', state);
  }

  // Get current form state
  getFormState(): DiscountFormState | null {
    return this.formStateSubject.value;
  }

  // Clear form state after successful restore
  clearFormState(): void {
    this.formStateSubject.next(null);
    console.log('DiscountFormStateService: Cleared form state');
  }

  // Check if there's pending form state
  hasPendingFormState(): boolean {
    return this.formStateSubject.value !== null;
  }

  // Restore form data to form controls
  restoreFormData(formGroup: any, formData: any): void {
    if (formData) {
      formGroup.patchValue(formData);
      console.log('DiscountFormStateService: Restored form data:', formData);
    }
  }
} 