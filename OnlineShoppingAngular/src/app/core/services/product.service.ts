<<<<<<< Updated upstream
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateProductRequestDTO } from '../models/product.model';
import { Observable } from 'rxjs';
import { ProductVariantDTO } from '../models/variant.model';
=======
import { Injectable } from '@angular/core';
>>>>>>> Stashed changes

@Injectable({
  providedIn: 'root'
})
export class ProductService {
<<<<<<< Updated upstream
  private readonly baseUrl = 'http://localhost:8080/products';

  constructor(private http: HttpClient) { }

  createProduct(request: CreateProductRequestDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}`, request);
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

=======

  constructor() { }
>>>>>>> Stashed changes
}
