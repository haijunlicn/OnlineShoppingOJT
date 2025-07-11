// refund-eligibility.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OrderService } from '../services/order.service';

@Injectable({
  providedIn: 'root'
})
export class RefundEligibilityGuard implements CanActivate {
  constructor(private orderService: OrderService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const orderId = +route.paramMap.get('orderId')!;

    return this.orderService.getOrderById(orderId).pipe(
      switchMap(order => {
        const isDelivered = order.currentOrderStatus === 'DELIVERED';
        const hasReturnableItem = order.items?.some(item => item.maxReturnQty! > 0);

        if (isDelivered && hasReturnableItem) {
          return of(true);
        } else {
          return of(this.router.createUrlTree([`/customer/orderDetail/${orderId}`]));
        }
      })
    );
  }

}
