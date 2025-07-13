import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RejectionReasonDTO } from '../models/refund-reason';

@Injectable({
  providedIn: 'root'
})
export class RejectionReasonService {
  private baseUrl = 'http://localhost:8080/rejection-reason';

  constructor(private http: HttpClient) {}

  createRejectionReason(reason: RejectionReasonDTO): Observable<string> {
    return this.http.post(`${this.baseUrl}/create`, reason, { responseType: 'text' });
  }

  getAllRejectionReasons(): Observable<RejectionReasonDTO[]> {
    return this.http.get<RejectionReasonDTO[]>(`${this.baseUrl}/list`);
  }

  getRejectionReasonById(id: number): Observable<RejectionReasonDTO> {
    return this.http.get<RejectionReasonDTO>(`${this.baseUrl}/${id}`);
  }

  updateRejectionReason(reason: RejectionReasonDTO): Observable<string> {
    return this.http.put(`${this.baseUrl}/update`, reason, { responseType: 'text' });
  }

  deleteRejectionReason(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }
}
