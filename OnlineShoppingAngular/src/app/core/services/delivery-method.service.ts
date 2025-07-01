import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DeliveryMethod } from '../models/delivery-method.model';

@Injectable({ providedIn: 'root' })
export class DeliveryMethodService {
  private apiUrl = 'http://localhost:8080/delivery-methods';

  constructor(private http: HttpClient) {}

  getAvailableMethods(distance: number): Observable<DeliveryMethod[]> {
    return this.http.get<DeliveryMethod[]>(`${this.apiUrl}/available`, { params: { distance } });
  }
} 