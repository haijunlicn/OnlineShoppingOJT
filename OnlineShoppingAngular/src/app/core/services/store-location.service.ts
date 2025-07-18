import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoreLocationDto } from '../models/storeLocationDto';

@Injectable({
  providedIn: 'root'
})
export class StoreLocationService {
  private apiUrl = 'http://localhost:8080/store-branches';

  constructor(private http: HttpClient) {}

  getAll(): Observable<StoreLocationDto[]> {
    return this.http.get<StoreLocationDto[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<StoreLocationDto> {
    return this.http.get<StoreLocationDto>(`${this.apiUrl}/getId/${id}`);
  }

  create(store: StoreLocationDto): Observable<StoreLocationDto> {
    return this.http.post<StoreLocationDto>(`${this.apiUrl}/save`, store);
  }

  update(id: number, store: StoreLocationDto): Observable<StoreLocationDto> {
    return this.http.put<StoreLocationDto>(`${this.apiUrl}/edit/${id}`, store);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  setInUse(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/set-in-use/${id}`, {});
  }

  getActive(): Observable<StoreLocationDto> {
    return this.http.get<StoreLocationDto>(`${this.apiUrl}/active`);
  }
}
