import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrandDTO } from '../models/product.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  
  baseUrl = "http://localhost:8080/brand";

  constructor(private http: HttpClient) {}

  createBrand(brand: BrandDTO): Observable<BrandDTO> {
    return this.http.post<BrandDTO>(`${this.baseUrl}/create`, brand, { responseType: 'text' as 'json' });
  }

  getAllBrands(): Observable<BrandDTO[]> {
    return this.http.get<BrandDTO[]>(`${this.baseUrl}/list`);
  }

  getBrandById(id: number): Observable<BrandDTO> {
    return this.http.get<BrandDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  updateBrand(brand: BrandDTO): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${brand.id}`, brand, { responseType: 'text' as 'json' });
  }

  deleteBrand(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }

}
