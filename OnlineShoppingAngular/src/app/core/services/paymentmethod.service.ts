import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentMethodDTO } from '../models/payment';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {

  private baseUrl = 'http://localhost:8080/payment-method';

  constructor(private http: HttpClient) {}

  // Create new payment method
  createPaymentMethod(method: PaymentMethodDTO): Observable<PaymentMethodDTO> {
    return this.http.post<PaymentMethodDTO>(`${this.baseUrl}/create`, method);
  }

  // Get all active payment methods
  getAllPaymentMethods(): Observable<PaymentMethodDTO[]> {
    return this.http.get<PaymentMethodDTO[]>(`${this.baseUrl}/list`);
  }

   getAllPublicPaymentMethods(): Observable<PaymentMethodDTO[]> {
    return this.http.get<PaymentMethodDTO[]>(`${this.baseUrl}/Public/list`);
  }

  // Get payment method by ID
  getById(id: number): Observable<PaymentMethodDTO> {
    return this.http.get<PaymentMethodDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  // Update existing payment method
  updatePaymentMethod(method: PaymentMethodDTO): Observable<PaymentMethodDTO> {
    return this.http.put<PaymentMethodDTO>(`${this.baseUrl}/update/${method.id}`, method);
  }

  // Soft delete payment method
  deletePaymentMethod(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post('http://localhost:8080/api/cloudinary/upload', formData, {
      responseType: 'text',
    });
  }

  getPaymentMethodsByType(type: string): Observable<PaymentMethodDTO[]> {
    return this.http.get<PaymentMethodDTO[]>(`${this.baseUrl}/list?type=${type}`);
  }

}
