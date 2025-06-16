import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PolicyDTO } from '../models/policyDTO';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {

  private baseUrl = 'http://localhost:8080/policy';

  constructor(private http: HttpClient) {}

  // ✅ Create new policy
  createPolicy(policy: PolicyDTO): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/create`, policy,{ responseType: 'text' as 'json' });
  }

  // ✅ Get all policies
  getAllPolicies(): Observable<PolicyDTO[]> {
    return this.http.get<PolicyDTO[]>(`${this.baseUrl}/list`);
  }

  // ✅ Get policy by ID
  getPolicyById(id: number): Observable<PolicyDTO> {
    return this.http.get<PolicyDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  // ✅ Update policy
  updatePolicy(policy: PolicyDTO): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/update/${policy.id}`, policy);
  }

  // ✅ Delete policy
  deletePolicy(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/delete/${id}`);
  }
  getPoliciesByType(type: string): Observable<PolicyDTO[]> {
  return this.http.get<PolicyDTO[]>(`${this.baseUrl}/type/${type}`);
}
}
