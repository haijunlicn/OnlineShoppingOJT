import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class UserDetailService {
  private baseUrl = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) { }

  /**
   * Get user by ID
   */
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/user/${userId}`);
  }

  /**
   * Get user role name by ID
   */
  getUserRoleById(userId: number): Observable<{ roleName: string; name: string }> {
    return this.http.get<{ roleName: string; name: string }>(`${this.baseUrl}/user-role/${userId}`);
  }
}
