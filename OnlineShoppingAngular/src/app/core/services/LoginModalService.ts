import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginModalService {
    
  private loginVisible = new BehaviorSubject<boolean>(false);
  loginVisible$ = this.loginVisible.asObservable();

  show() {
    this.loginVisible.next(true);
  }

  hide() {
    this.loginVisible.next(false);
  }

  toggle() {
    this.loginVisible.next(!this.loginVisible.value);
  }
}
