import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationType } from '../models/notification.model';

interface NotificationTypeMethod {
  notificationTypeId: number;
  notificationTypeName: string;
  method: string;
  status: number;
}


@Injectable({
  providedIn: 'root'
})
export class NotificationTypeService {

  private baseUrl = 'http://localhost:8080/notification-types';

  constructor(private http: HttpClient) {}

  // Get all notification types for admin
  getNotificationTypesForAdmin(): Observable<NotificationType[]> {
    return this.http.get<NotificationType[]>(`${this.baseUrl}/list`);
  }

  // Create a new notification type
  createNotificationType(dto: NotificationType): Observable<NotificationType> {
    return this.http.post<NotificationType>(`${this.baseUrl}/create`, dto);
  }

  // Delete a notification type by id
  deleteNotificationType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  // Get all notification type methods
  getNotificationTypeMethods(): Observable<NotificationTypeMethod[]> {
    return this.http.get<NotificationTypeMethod[]>(`${this.baseUrl}/methods`);
  }

  // Update notification method status
  updateNotificationMethodStatus(notificationTypeId: number, method: string, status: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/methods/${notificationTypeId}/${method}/status?status=${status}`, {});
  }

  // Get notification type by ID
  getNotificationTypeById(id: number): Observable<NotificationType> {
    return this.http.get<NotificationType>(`${this.baseUrl}/${id}`);
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/list`);
  }

}
