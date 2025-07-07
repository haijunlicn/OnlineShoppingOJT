import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

   baseUrl = "http://localhost:8080/locations";

  constructor(private http: HttpClient) { }

  getProfile(email: string, roleType: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${email}/${roleType}`);
  }

  updateProfile(email: string, roleType: number, profile: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/update/${email}/${roleType}`, profile);
  }
}
