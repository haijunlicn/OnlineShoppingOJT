import { Injectable } from "@angular/core"
import type { CanDeactivate } from "@angular/router"
import type { Observable } from "rxjs"

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean
}

@Injectable({ providedIn: "root" })
export class NavigationBlockerService implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    return component.canDeactivate ? component.canDeactivate() : true
  }
}
