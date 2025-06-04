import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryDTO } from '../models/category-dto';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  baseUrl = "http://localhost:8080/category"

  constructor(private http: HttpClient) { }
  
  createCategory(category: CategoryDTO): Observable<CategoryDTO> {
    return this.http.post<CategoryDTO>(`${this.baseUrl}/create`, category, { responseType: 'text' as 'json' });
  }
  getAllCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.baseUrl}/list`);
  }
  getCategoryById(id: number): Observable<CategoryDTO> {
    return this.http.get<CategoryDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  updateCategory(category: CategoryDTO): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${category.id}`, category, { responseType: 'text' as 'json' });
  }

  deleteCategory(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }


}
