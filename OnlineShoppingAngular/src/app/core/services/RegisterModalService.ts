import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterModalService {

  private registerVisible = new BehaviorSubject<boolean>(false);
  registerVisible$ = this.registerVisible.asObservable();

  show() {
    this.registerVisible.next(true);
  }

  hide() {
    this.registerVisible.next(false);
  }

  toggle() {
    this.registerVisible.next(!this.registerVisible.value);
  }
}
