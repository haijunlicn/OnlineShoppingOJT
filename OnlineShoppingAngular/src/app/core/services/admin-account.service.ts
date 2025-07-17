import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/User';

@Injectable({ providedIn: 'root' })
export class AdminAccountService {
  constructor(private http: HttpClient) { }

  private baseUrl = 'http://localhost:8080/adminAccounts';

  createAccount(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, payload);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  getAllCustomers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/customers`);
  }

}
