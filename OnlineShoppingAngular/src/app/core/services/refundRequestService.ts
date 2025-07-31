import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { RefundRequestDTO, ReturnRequestPayload, ReturnRequestResponse } from '../models/refund.model';
import { RefundReasonDTO } from '../models/refund-reason';
import { StatusUpdateRequest } from '@app/features/admin/RefundManagement/refund-request-detail/refund-request-detail.component';
import { OrderDetail, OrderItemDetail } from '../models/order.dto';

@Injectable({
  providedIn: 'root'
})

export class RefundRequestService {
  private apiUrl = "http://localhost:8080/refund-requests" // base API path

  constructor(private http: HttpClient) { }

  getOrderDetails(orderId: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`http://localhost:8080/orders/public/${orderId}/details`).pipe(
      // map((order) => ({
      //   ...order,
      //   items: order.items.map((item : OrderItemDetail) => ({
      //     ...item,
      //     maxReturnQty: this.calculateMaxReturnQty(item),
      //   })),
      // })),
      map((order) => order),
      catchError(this.handleError),
    )
  }

  submitReturnRequest(request: ReturnRequestPayload): Observable<ReturnRequestResponse> {
    return this.http
      .post<ReturnRequestResponse>(`${this.apiUrl}/create`, request)
      .pipe(catchError(this.handleError))
  }

  getRefundRequestDetail(id: number): Observable<RefundRequestDTO> {
    return this.http.get<RefundRequestDTO>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError))
  }

  getRefundRequestList(): Observable<RefundRequestDTO[]> {
    return this.http.get<RefundRequestDTO[]>(`${this.apiUrl}/list`);
  }

  submitBatchItemDecisions(payload: {
    refundRequestId: number
    itemDecisions: {
      itemId: number
      action: string
      rejectionReasonId?: number
      comment?: string
      adminId?: number
    }[]
  }): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/review-items`, payload)
      .pipe(catchError(this.handleError))
  }

  updateItemStatus(request: StatusUpdateRequest): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/update-status`, request)
      .pipe(catchError(this.handleError))
  }

  private calculateMaxReturnQty(item: any): number {
    return item.quantity - (item.returnedQty || 0)
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = "An unknown error occurred"

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`

      // Handle specific error cases
      switch (error.status) {
        case 404:
          errorMessage = "Order not found or not eligible for return"
          break
        case 400:
          errorMessage = "Invalid request data"
          break
        case 403:
          errorMessage = "You are not authorized to return this order"
          break
        case 500:
          errorMessage = "Server error. Please try again later"
          break
      }
    }

    return throwError(() => new Error(errorMessage))
  }

}