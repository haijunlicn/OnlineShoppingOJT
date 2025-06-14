import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
<<<<<<< Updated upstream
import { CreateProductRequestDTO, ProductCardItem, ProductListItemDTO, ProductVariantDTO } from '../models/product.model';
import { catchError, Observable, throwError } from 'rxjs';
=======
import { CreateProductRequestDTO, ProductListItemDTO } from '../models/product.model';
import { catchError, Observable, throwError } from 'rxjs';
import { ProductVariantDTO } from '../models/variant.model';
>>>>>>> Stashed changes

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = 'http://localhost:8080/products';

  constructor(private http: HttpClient) { }

  createProduct(request: CreateProductRequestDTO): Observable<string> {
    return this.http.post(`${this.baseUrl}/create`, request, { responseType: 'text' });
  }

  getProductList(): Observable<ProductListItemDTO[]> {
    return this.http.get<ProductListItemDTO[]>(`${this.baseUrl}/list`);
<<<<<<< Updated upstream
  }

  getProductById(id: number): Observable<ProductCardItem> {
    return this.http.get<ProductCardItem>(`${this.baseUrl}/${id}`);
=======
>>>>>>> Stashed changes
  }

  generateSku(productName: string, variant: ProductVariantDTO): string {
    const skuBase = productName.substring(0, 3).toUpperCase();

    let skuOptions = '';
    variant.options.forEach(option => {
      const val = option.valueName || '';
      skuOptions += `-${val.substring(0, 2).toUpperCase()}`;
    });

    return `${skuBase}${skuOptions}`;
  }
<<<<<<< Updated upstream

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/bulk-upload-template`, {
      responseType: 'blob'  // important for binary file data
    });
  }

  // Upload ZIP file (Excel + images)
  uploadZip(formData: FormData): Observable<HttpEvent<any>> {
    return this.http.post<any>(`${this.baseUrl}/upload-zip`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
=======
>>>>>>> Stashed changes
}
