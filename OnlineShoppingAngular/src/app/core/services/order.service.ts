import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderDetail {
  id: number;
  trackingNumber: string;
  paymentStatus: string;
  totalAmount: number;
  shippingFee: number;
  createdDate: string;
  updatedDate: string;
  paymentProofPath?: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    id: number;
    address: string;
    city: string;
    township: string;
    zipCode: string;
    country: string;
    lat: number;
    lng: number;
  };
  deliveryMethod: {
    id: number;
    name: string;
    baseFee: number;
    feePerKm: number;
  };
  items: OrderItemDetail[];
  statusHistory: OrderStatusHistory[];
}

export interface OrderItemDetail {
  id: number;
  quantity: number;
  price: number;
  totalPrice: number;
  variant: {
    id: number;
    sku: string;
    price: number;
    stock: number;
    variantName: string;
    imgPath: string;
  };
  product: {
    id: number;
    name: string;
    description: string;
    imgPath: string;
    sku: string;
  };
  maxReturnQty?: number;
}

export interface OrderStatusHistory {
  id: number;
  orderId: number;
  statusId: number;
  note: string;
  createdAt: string;
  updatedBy: number;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'http://localhost:8080/orders';

  constructor(private http: HttpClient) { }

  createOrderWithImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, formData);
  }

  getOrdersByUserId(userId: number): Observable<OrderDetail[]> {
    return this.http.get<OrderDetail[]>(`${this.apiUrl}/user/${userId}`);
  }

  getOrderById(orderId: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.apiUrl}/${orderId}`);
  }

  getOrderDetails(orderId: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.apiUrl}/${orderId}/details`);
  }

  bulkUpdateOrderStatus(
    orderIds: number[],
    statusId: number,
    note: string,
    updatedBy: number
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/bulk-status`, {
      orderIds,
      statusId,
      note,
      updatedBy
    });
  }

  getAllOrders(): Observable<OrderDetail[]> {
    return this.http.get<OrderDetail[]>(`${this.apiUrl}`);
  }
}
