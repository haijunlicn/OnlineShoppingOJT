import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RefundReasonDTO } from '../models/refund-reason';

@Injectable({
  providedIn: 'root'
})
export class RefundReasonService {
  private baseUrl = 'http://localhost:8080/refund-reason';

  constructor(private http: HttpClient) { }

  create(reason: RefundReasonDTO): Observable<string> {
    return this.http.post(`${this.baseUrl}/create`, reason, { responseType: 'text' });
  }

  getAll(): Observable<RefundReasonDTO[]> {
    return this.http.get<RefundReasonDTO[]>(`${this.baseUrl}/list`);
  }

  getAllPublicRefundReasons(): Observable<RefundReasonDTO[]> {
    return this.http.get<RefundReasonDTO[]>(`${this.baseUrl}/public/list`);
  }

  getById(id: number): Observable<RefundReasonDTO> {
    return this.http.get<RefundReasonDTO>(`${this.baseUrl}/${id}`);
  }

  update(reason: RefundReasonDTO): Observable<string> {
    return this.http.put(`${this.baseUrl}/update`, reason, { responseType: 'text' });
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }
}
