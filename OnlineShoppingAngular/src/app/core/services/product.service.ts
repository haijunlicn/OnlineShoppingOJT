import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateProductRequestDTO, ProductCardItem, ProductDTO, ProductListItemDTO, ProductVariantDTO } from '../models/product.model';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = 'http://localhost:8080/products';

  constructor(private http: HttpClient) { }

  createProduct(request: CreateProductRequestDTO): Observable<string> {
    return this.http.post(`${this.baseUrl}/create`, request, { responseType: 'text' });
  }

  updateProduct(request: CreateProductRequestDTO): Observable<string> {
    return this.http.put(`${this.baseUrl}/update`, request, { responseType: 'text' });
  }

  updateStock(productId: number, stockUpdates: { variantId: number; newStock: number }[]): Observable<string> {
    return this.http.put(`${this.baseUrl}/update-stock`, {
      productId,
      stockUpdates
    }, { responseType: 'text' });
  }

  getProductList(): Observable<ProductListItemDTO[]> {
    return this.http.get<ProductListItemDTO[]>(`${this.baseUrl}/list`);
  }

  getProductById(id: number): Observable<ProductCardItem> {
    return this.http.get<ProductCardItem>(`${this.baseUrl}/${id}`);
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
  getRelatedProducts(categoryId: number, productId: number) {
  return this.http.get<ProductDTO[]>(`${this.baseUrl}/related?categoryId=${categoryId}&productId=${productId}`);
}


}
