import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';
import { OrderStatus } from '@app/features/customer/orderManagements/order-detail/order-detail.component';
import { ORDER_STATUS, OrderDetail, PAYMENT_STATUS } from '../models/order.dto';

// export interface OrderDetail {
//   id: number;
//   trackingNumber: string;
//   paymentStatus: PAYMENT_STATUS;
//   currentOrderStatus: ORDER_STATUS;
//   totalAmount: number;
//   shippingFee: number;
//   createdDate: string;
//   updatedDate: string;
//   paymentProofPath?: string;

//   // Payment method information
//   paymentMethod?: {
//     id: number;
//     methodName: string;
//     description: string;
//     type: string;
//     logo?: string;
//     qrPath?: string;
//     status: number;
//   };
//   paymentType?: string;

//   user: {
//     id: number;
//     name: string;
//     email: string;
//     // phone: string;
//   };
//   shippingAddress: {
//     id: number;
//     address: string;
//     city: string;
//     township: string;
//     zipCode: string;
//     country: string;
//     lat: number;
//     lng: number;
//     phoneNumber?: string;
//   };
//   deliveryMethod: {
//     id: number;
//     name: string;
//     baseFee: number;
//     feePerKm: number;
//   };
//   items: OrderItemDetail[];
//   statusHistory: OrderStatusHistory[];
// }

// export interface OrderItemDetail {
//   id: number;
//   quantity: number;
//   price: number;
//   totalPrice: number;
//   variant: {
//     id: number;
//     sku: string;
//     price: number;
//     stock: number;
//     variantName: string;
//     imgPath: string;
//   };
//   product: {
//     id: number;
//     name: string;
//     description: string;
//     imgPath: string;
//     sku: string;
//   };
//   maxReturnQty?: number;
// }

// export interface OrderStatusHistory {
//   id: number;
//   orderId: number;
//   statusId: number;
//   statusCode: string;
//   note: string;
//   createdAt: string;
//   updatedBy: number;
// }

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
    console.log("create order : ", formData);
    
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

  updatePaymentStatus(
    orderId: number,
    status: 'PAID' | 'FAILED',
    rejectionRequest?: { reasonId?: number; customReason?: string }
  ): Observable<OrderDetail> {
    const payload: any = { status };
    if (status === 'FAILED' && rejectionRequest) {
      payload.rejectionRequest = rejectionRequest;
    }
    return this.http.put<OrderDetail>(`${this.apiUrl}/${orderId}/payment-status`, payload);
  }

  bulkUpdateOrderStatus(
    orderIds: number[],
    statusCode: ORDER_STATUS,
    note: string,
    updatedBy: number
  ): Observable<any> {
    const payload = {
      orderIds,
      statusCode,
      note,
      updatedBy
    };
    console.log('Bulk Update Payload:', payload);
    return this.http.post(`${this.apiUrl}/admin/bulk-status`, payload);
  }

  updateOrderStatus(
    orderId: number,
    statusCode: ORDER_STATUS,
    note: string,
    updatedBy: number
  ): Observable<any> {
    // Use the bulk endpoint for a single order
    return this.bulkUpdateOrderStatus([orderId], statusCode, note, updatedBy);
  }

  getAllOrders(): Observable<OrderDetail[]> {
    return this.http.get<OrderDetail[]>(`${this.apiUrl}`);
  }
}
