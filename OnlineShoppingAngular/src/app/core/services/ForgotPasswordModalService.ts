import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordModalService {

  private forgotVisible = new BehaviorSubject<boolean>(false);
  forgotVisible$ = this.forgotVisible.asObservable();

  show() {
    
    this.forgotVisible.next(true);
  }

  hide() {
    this.forgotVisible.next(false);
  }

  toggle() {
    this.forgotVisible.next(!this.forgotVisible.value);
  }
}

