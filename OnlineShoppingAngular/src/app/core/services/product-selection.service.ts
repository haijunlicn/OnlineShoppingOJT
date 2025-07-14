import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  status: string;
  image: string;
  createdDate: string;
  description?: string;
  basePrice?: number;
}

export interface ProductSelectionState {
  mechanismIndex: number;
  context: 'discount_product' | 'free_gift' | 'condition_builder';
  selectedProducts: Product[];
  returnUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductSelectionService {
  private selectionStateSubject = new BehaviorSubject<ProductSelectionState | null>(null);
  public selectionState$ = this.selectionStateSubject.asObservable();

  constructor() {}

  // Set selection state when navigating to product selection
  setSelectionState(state: ProductSelectionState): void {
    this.selectionStateSubject.next(state);
    console.log('ProductSelectionService: Setting selection state:', state);
  }

  // Get current selection state
  getSelectionState(): ProductSelectionState | null {
    return this.selectionStateSubject.value;
  }

  // Update selected products
  updateSelectedProducts(products: Product[]): void {
    const currentState = this.selectionStateSubject.value;
    if (currentState) {
      const updatedState = { ...currentState, selectedProducts: products };
      this.selectionStateSubject.next(updatedState);
      console.log('ProductSelectionService: Updated selected products:', products);
    }
  }

  // Clear selection state (manual clear)
  clearSelectionState(): void {
    this.selectionStateSubject.next(null);
    console.log('ProductSelectionService: Cleared selection state');
  }

  // Check if there's pending selection state
  hasPendingSelection(): boolean {
    return this.selectionStateSubject.value !== null;
  }

  // Get return URL for navigation back
  getReturnUrl(): string {
    return this.selectionStateSubject.value?.returnUrl || '/admin/createDiscount';
  }

  // Handle browser back/forward navigation
  handleBrowserNavigation(): void {
    // Clear state when user navigates away using browser controls
    this.clearSelectionState();
    console.log('ProductSelectionService: Handled browser navigation - cleared state');
  }

  // Check if we should restore state (for browser back/forward)
  shouldRestoreState(): boolean {
    return this.hasPendingSelection();
  }
} 