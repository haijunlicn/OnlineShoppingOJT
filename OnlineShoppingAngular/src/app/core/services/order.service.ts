import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';

export interface OrderDetail {
  id: number;
  trackingNumber: string;
  paymentStatus: string;
  totalAmount: number;
  shippingFee: number;
  createdDate: string;
  updatedDate: string;
  paymentProofPath?: string;

  // Payment method information
  paymentMethod?: {
    id: number;
    methodName: string;
    description: string;
    type: string;
    logo?: string;
    qrPath?: string;
    status: number;
  };
  paymentType?: string;

  user: {
    id: number;
    name: string;
    email: string;
    // phone: string;
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
    phoneNumber?: string;
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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

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

  updatePaymentStatus(orderId: number, newStatus: 'PAID' | 'FAILED'): Observable<OrderDetail> {
    return this.http.put<OrderDetail>(`${this.apiUrl}/${orderId}/payment-status`, {
      status: newStatus
    });
  }

  rejectPaymentWithReason(
    orderId: number,
    payload: { reasonId: number; customReason?: string }
  ): Observable<OrderDetail> {
    return this.http.put<OrderDetail>(
      `${this.apiUrl}/${orderId}/reject-payment`,
      payload
    );
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

  updateOrderStatus(
    orderId: number,
    statusId: number,
    note: string,
    updatedBy: number
  ): Observable<any> {
    // Use the bulk endpoint for a single order
    return this.bulkUpdateOrderStatus([orderId], statusId, note, updatedBy);
  }

  getAllOrders(): Observable<OrderDetail[]> {
    return this.http.get<OrderDetail[]>(`${this.apiUrl}`);
  }
}
