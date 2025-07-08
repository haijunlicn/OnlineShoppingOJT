import { Injectable } from "@angular/core"
import type { CanDeactivate } from "@angular/router"
import { PaymentAcceptComponent } from "@app/features/customer/orderManagements/payment-accept/payment-accept.component"
import type { Observable } from "rxjs"

@Injectable({ providedIn: "root" })
export class PaymentGuard implements CanDeactivate<PaymentAcceptComponent> {
  canDeactivate(component: PaymentAcceptComponent): Observable<boolean> | Promise<boolean> | boolean {
    return component.canDeactivate()
  }
}
