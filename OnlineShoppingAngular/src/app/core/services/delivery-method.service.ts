import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DeliveryMethod } from '../models/delivery-method.model';

@Injectable({ providedIn: 'root' })
export class DeliveryMethodService {
  private apiUrl = 'http://localhost:8080/delivery-methods';

  constructor(private http: HttpClient) {}

  getAll(): Observable<DeliveryMethod[]> {
    return this.http.get<DeliveryMethod[]>(this.apiUrl);
  }
  publicgetAll(): Observable<DeliveryMethod[]> {
    return this.http.get<DeliveryMethod[]>(`${this.apiUrl}/public`);
  }

  getById(id: number): Observable<DeliveryMethod> {
    return this.http.get<DeliveryMethod>(`${this.apiUrl}/${id}`);
  }

  create(method: DeliveryMethod): Observable<DeliveryMethod> {
    return this.http.post<DeliveryMethod>(this.apiUrl, method);
  }

  update(method: DeliveryMethod): Observable<DeliveryMethod> {
    return this.http.put<DeliveryMethod>(`${this.apiUrl}/${method.id}`, method);
  }

  updateWithIcon(id: number, method: DeliveryMethod, iconFile: File): Observable<DeliveryMethod> {
    const formData = new FormData();
    formData.append('dto', new Blob([JSON.stringify(method)], { type: 'application/json' }));
    formData.append('icon', iconFile);
    return this.http.put<DeliveryMethod>(`${this.apiUrl}/${id}/with-icon`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Already present:
  getAvailableMethods(distance: number): Observable<DeliveryMethod[]> {
    return this.http.get<DeliveryMethod[]>(`${this.apiUrl}/available`, { params: { distance } });
  }
} 