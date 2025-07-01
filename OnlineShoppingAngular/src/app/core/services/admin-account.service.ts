import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminAccountService {
  constructor(private http: HttpClient) { }

  private baseUrl = 'http://localhost:8080/adminAccounts';

  createAccount(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, payload);
  }
}
