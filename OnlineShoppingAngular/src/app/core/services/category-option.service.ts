import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryOptionDTO } from '../models/category-dto';
import { OptionTypeDTO } from '../models/option.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryOptionService {
  private baseUrl = "http://localhost:8080/category-option";

  constructor(private http: HttpClient) { }

  createCategoryOption(data: CategoryOptionDTO): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create`, data, { responseType: 'text' as 'json' });
  }

  // GET assigned options by category ID
  getOptionsByCategoryId(categoryId: number): Observable<OptionTypeDTO[]> {
    return this.http.get<OptionTypeDTO[]>(`${this.baseUrl}/category/${categoryId}`);
  }

  // POST full list of selected options to category
  saveCategoryOptions(categoryId: number, data: CategoryOptionDTO[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/category/${categoryId}/assign`, data, {
      responseType: 'text' as 'json'
    });
  }


}
