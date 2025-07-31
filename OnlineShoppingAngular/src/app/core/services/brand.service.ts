import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrandDTO } from '../models/product.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BrandService {

  baseUrl = "http://localhost:8080/brand";

  constructor(private http: HttpClient) { }

  // createBrand(brand: BrandDTO): Observable<BrandDTO> {
  //   return this.http.post<BrandDTO>(`${this.baseUrl}/create`, brand, { responseType: 'text' as 'json' });
  // }

  // updateBrand(brand: BrandDTO): Observable<any> {
  //   return this.http.put(`${this.baseUrl}/update/${brand.id}`, brand, { responseType: 'text' as 'json' });
  // }

  createBrand(brand: BrandDTO): Observable<any> {
    return this.http.post<string>(`${this.baseUrl}/create`, brand, { responseType: 'text' as 'json' });
  }

  updateBrand(brand: BrandDTO): Observable<any> {
    return this.http.put<string>(`${this.baseUrl}/update/${brand.id}`, brand, { responseType: 'text' as 'json' });
  }

  getAllBrands(): Observable<BrandDTO[]> {
    return this.http.get<BrandDTO[]>(`${this.baseUrl}/list`);
  }

  getAllPublicBrands(): Observable<BrandDTO[]> {
    return this.http.get<BrandDTO[]>(`${this.baseUrl}/public/list`);
  }

  getBrandById(id: number): Observable<BrandDTO> {
    return this.http.get<BrandDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  deleteBrand(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }

  getProductCountsByBrand(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.baseUrl}/product-counts`);
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post('http://localhost:8080/api/cloudinary/upload', formData, {
      responseType: 'text',
    });
  }

}
