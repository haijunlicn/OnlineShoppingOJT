import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EmailValidationService {
  constructor(private http: HttpClient) { }

  // validateEmail(email: string) {
  //   const url = `https://open.kickbox.com/v1/disposable/${email}`;
  //   return this.http.get<any>(url);
  // }

  validateEmail(email: string) {
    return this.http.get<{ valid: boolean }>(`http://localhost:8080/auth/validateEmailWithAPI?email=${encodeURIComponent(email)}`);
  }

}
