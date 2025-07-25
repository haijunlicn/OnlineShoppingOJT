import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductVariantDTO } from '../models/product.model';

export interface StockUpdateRequest {
  variantId: number;
  quantity: number;
}

export interface StockUpdateResponse {
  success: boolean;
  message: string;
  updatedStock: number;
}

@Injectable({
  providedIn: 'root'
})
export class VariantService {
  private readonly baseUrl = 'http://localhost:8080/variants';

  constructor(private http: HttpClient) { }

  updateStock(request: StockUpdateRequest): Observable<StockUpdateResponse> {
    return this.http.put<StockUpdateResponse>(`${this.baseUrl}/update-stock`, request);
  }

  getVariantById(variantId: number): Observable<ProductVariantDTO> {
    return this.http.get<ProductVariantDTO>(`${this.baseUrl}/${variantId}`);
  }

  recudeStock(orderItems: any[]): Observable<StockUpdateResponse[]> {
    const requests = orderItems.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity
    }));
    return this.http.put<StockUpdateResponse[]>(`${this.baseUrl}/reserve-stock`, requests);
  }

  rollbackStock(orderItems: any[]): Observable<StockUpdateResponse[]> {
  const requests = orderItems.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity
  }));
  return this.http.put<StockUpdateResponse[]>(`${this.baseUrl}/rollback-stock`, requests);
}


  confirmPayment(orderItems: any[]): Observable<void> {
    const requests = orderItems.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity
    }));
    return this.http.put<void>(`${this.baseUrl}/confirm-payment`, requests);
  }
}
