import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VlogDTO } from '../models/vlog';

@Injectable({
  providedIn: 'root'
})
export class VlogService {

  private baseUrl = 'http://localhost:8080/vlog';

  constructor(private http: HttpClient) {}

  // Create new vlog
  createVlog(vlog: VlogDTO): Observable<VlogDTO> {
    return this.http.post<VlogDTO>(`${this.baseUrl}/create`, vlog , { responseType: 'text' as 'json' });
  }

  // Get all vlogs
  getAllVlogs(): Observable<VlogDTO[]> {
    return this.http.get<VlogDTO[]>(`${this.baseUrl}/list`);
  }

  // Get vlog by id
  getById(id: number): Observable<VlogDTO> {
    return this.http.get<VlogDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  // Update vlog 
  updateVlog(vlog: VlogDTO): Observable<VlogDTO> {
    return this.http.put<VlogDTO>(`${this.baseUrl}/update`, vlog);
  }

  // Delete vlog
  deleteVlog(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }
  
}
