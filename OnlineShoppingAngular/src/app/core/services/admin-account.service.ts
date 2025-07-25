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

  getUserStats(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/orders/user-stats');
  }

  getUserCountsByCity(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/locations/city-user-counts');
  }

  getUserCountsByCityWithOrderFilter(orderedOnly: boolean): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/locations/city-user-counts-filtered?orderedOnly=${orderedOnly}`);
  }

  getUserCountsByTownship(city: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/locations/township-user-counts?city=${encodeURIComponent(city)}`);
  }

  getUserCountsByTownshipWithOrder(city: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/locations/township-user-counts-with-order?city=${encodeURIComponent(city)}`);
  }

}
