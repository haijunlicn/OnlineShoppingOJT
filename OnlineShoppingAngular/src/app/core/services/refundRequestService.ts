import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { CategoryDTO, CategoryNode } from '../models/category-dto';
import { Order, RefundReason, ReturnRequestPayload } from '../models/refund.model';

@Injectable({
  providedIn: 'root' // <== This registers it globally
})

export class RefundRequestService {
  private apiUrl = "/api"

  constructor(private http: HttpClient) { }

  getRefundReasons(): Observable<RefundReason[]> {
    // Mock data - replace with actual API call
    return of([
      { id: 1, label: "Defective/Damaged", allowCustomText: false },
      { id: 2, label: "Wrong Size", allowCustomText: false },
      { id: 3, label: "Not as Described", allowCustomText: true },
      { id: 4, label: "Changed Mind", allowCustomText: false },
      { id: 5, label: "Other", allowCustomText: true },
    ])
  }

  getOrderDetails(orderId: number): Observable<Order> {
    // Mock data - replace with actual API call
    return of({
      id: orderId,
      orderNumber: "ORD-2024-001234",
      orderDate: new Date("2024-01-15"),
      shippingAddress: "123 Main St, City, State 12345",
      items: [
        {
          id: 1,
          productName: "Premium Cotton T-Shirt",
          sku: "TSH-001-BLK-L",
          quantity: 2,
          deliveredQty: 2,
          maxReturnQty: 2,
          price: 29.99,
        },
        {
          id: 2,
          productName: "Denim Jeans",
          sku: "JNS-002-BLU-32",
          quantity: 1,
          deliveredQty: 1,
          maxReturnQty: 1,
          price: 79.99,
        },
      ],
    })
  }

  submitReturnRequest(request: ReturnRequestPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/return-requests`, request)
  }

  uploadProofImages(refundItemId: number, files: File[]): Observable<any> {
    const formData = new FormData()
    files.forEach((file) => formData.append("proofs", file))
    return this.http.post(`${this.apiUrl}/return-requests/items/${refundItemId}/proofs`, formData)
  }
}
