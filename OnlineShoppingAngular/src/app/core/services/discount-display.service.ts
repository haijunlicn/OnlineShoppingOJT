import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DiscountDisplayDTO } from '../models/discount';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { evaluateCartConditions } from './discountChecker';
import { CartItem } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class DiscountDisplayService {

  baseUrl = "http://localhost:8080/discountDisplay";

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getProductDiscountHints(): Observable<Record<number, DiscountDisplayDTO[]>> {
    const userId = this.authService.isLoggedIn()
      ? this.authService.getCurrentUser()?.id
      : null;

    const params = new HttpParams().set('userId', userId ?? '');

    return this.http.get<Record<number, DiscountDisplayDTO[]>>(
      `${this.baseUrl}/public/product-hints`,
      { params }
    );
  }

  evaluateEligibleDiscounts(allHints: DiscountDisplayDTO[], cart: CartItem[]): DiscountDisplayDTO[] {
    // Shipping object is needed for order conditions, fill with dummy/default values or your actual shipping info
    const dummyShipping = { city: '', cost: 0 };

    return allHints.filter(hint => {
      if (!hint.conditionGroups || hint.conditionGroups.length === 0) {
        // No conditions means discount always eligible
        return true;
      }

      // If conditionGroups exist, use your evaluateCartConditions util function
      return evaluateCartConditions(hint.conditionGroups, cart, dummyShipping);
    });
  }


  calculateDiscountedPrice(
    originalPrice: number,
    eligibleDiscounts: DiscountDisplayDTO[]
  ): {
    discountedPrice: number;
    breakdown: { label: string; amount: number }[];
  } {
    let discountedPrice = originalPrice;
    const breakdown: { label: string; amount: number }[] = [];

    for (const discount of eligibleDiscounts) {
      const label = discount.shortLabel || discount.name || 'Discount';
      const valueNum = discount.value ? Number(discount.value) : 0;
      let amount = 0;

      if (discount.discountType === 'PERCENTAGE') {
        // Use originalPrice for percentage calculation
        amount = originalPrice * (valueNum / 100);
        if (discount.maxDiscountAmount) {
          const maxCap = Number(discount.maxDiscountAmount);
          amount = Math.min(amount, maxCap);
        }
      } else if (discount.discountType === 'FIXED') {
        amount = valueNum;
      }

      amount = Math.min(amount, discountedPrice); // prevent over-discount
      discountedPrice -= amount;
      breakdown.push({ label, amount });
    }

    return {
      discountedPrice: Math.max(discountedPrice, 0),
      breakdown,
    };
  }

}
