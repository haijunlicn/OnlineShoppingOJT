import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateProductRequestDTO, ProductListItemDTO } from '../models/product.model';
import { catchError, Observable, throwError } from 'rxjs';
import { ProductVariantDTO } from '../models/variant.model';

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
}
