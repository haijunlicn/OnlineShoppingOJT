import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryOptionDTO } from '../models/category-dto';

@Injectable({
  providedIn: 'root'
})
export class CategoryOptionService {
  private baseUrl = "http://localhost:8080/category-option";

  constructor(private http: HttpClient) { }

  createCategoryOption(data: CategoryOptionDTO): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create`, data, { responseType: 'text' as 'json' });
  }


}
