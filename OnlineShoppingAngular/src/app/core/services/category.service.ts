import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CategoryDTO, CategoryNode } from '../models/category-dto';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  baseUrl = "http://localhost:8080/category"

  constructor(private http: HttpClient) { }

  createCategory(category: CategoryDTO): Observable<CategoryDTO> {
    return this.http.post<CategoryDTO>(`${this.baseUrl}/create`, category);
  }

  getAllCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.baseUrl}/list`);
  }

  getAllCategoriesWithOptions(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.baseUrl}/list-with-options`);
  }

  getCategoryById(id: number): Observable<CategoryDTO> {
    return this.http.get<CategoryDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  updateCategory(category: CategoryDTO): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${category.id}`, category);
  }

  deleteCategory(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }

  getCategoryTree(): Observable<CategoryNode[]> {
    return this.getAllCategoriesWithOptions().pipe(
      map(res => {
        const map = new Map<number, CategoryNode>();

        // Build map
        res.forEach(cat => {
          map.set(cat.id!, { ...cat, children: [] });
        });

        // Assign children to parents
        const roots: CategoryNode[] = [];
        map.forEach(cat => {
          if (cat.parentCategoryId) {
            const parent = map.get(cat.parentCategoryId);
            if (parent) {
              parent.children?.push(cat);
            }
          } else {
            roots.push(cat);
          }
        });

        return roots;
      })
    );
  }

  flattenCategoriesRecursive(categories: CategoryDTO[], flatList: CategoryDTO[] = [], level: number = 0): void {
    categories.forEach(category => {
      (category as any).level = level;
      flatList.push(category);
      if (category.children?.length) {
        this.flattenCategoriesRecursive(category.children, flatList, level + 1);
      }
    });
  }

}
