import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleDTO } from '../models/roleDTO';

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {

  private baseUrl = 'http://localhost:8080/roles';

  constructor(private http: HttpClient) { }

  getCustomerRoles(): Observable<RoleDTO[]> {
    return this.http.get<RoleDTO[]>(`${this.baseUrl}/customers`);
  }
  
}