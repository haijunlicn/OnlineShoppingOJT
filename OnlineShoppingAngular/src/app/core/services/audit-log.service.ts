import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '../models/audit-log';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private baseUrl = 'http://localhost:8080/audit-logs';

  constructor(private http: HttpClient) {}

  getAuditLogsByEntityType(entityType: string): Observable<AuditLog[]> {
    const params = new HttpParams().set('entityType', entityType);
    return this.http.get<AuditLog[]>(`${this.baseUrl}/list-by-entity`, { params });
  }
}
