import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PaymentRejectionReasonDTO } from '../models/refund-reason';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class PaymentRejectionReasonService {
  private baseUrl = 'http://localhost:8080/payment-rejection-reason';

  constructor(private http: HttpClient) {}

  create(reason: PaymentRejectionReasonDTO): Observable<string> {
    return this.http.post(`${this.baseUrl}/create`, reason, { responseType: 'text' });
  }

  getAll(): Observable<PaymentRejectionReasonDTO[]> {
    return this.http.get<PaymentRejectionReasonDTO[]>(`${this.baseUrl}/list`);
  }

  getById(id: number): Observable<PaymentRejectionReasonDTO> {
    return this.http.get<PaymentRejectionReasonDTO>(`${this.baseUrl}/${id}`);
  }

  update(reason: PaymentRejectionReasonDTO): Observable<string> {
    return this.http.put(`${this.baseUrl}/update`, reason, { responseType: 'text' });
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }
}