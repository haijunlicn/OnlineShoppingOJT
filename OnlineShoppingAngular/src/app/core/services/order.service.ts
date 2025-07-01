import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OrderDTO } from '@app/features/customer/orderManagements/order-list/order-list.component';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private baseUrl = '/orders';  // Adjust your backend URL

  constructor(private http: HttpClient) {}

  getOrdersByUserId(userId: number): Observable<OrderDTO[]> {
    return this.http.get<OrderDTO[]>(`${this.baseUrl}/user/${userId}`);
  }
}
