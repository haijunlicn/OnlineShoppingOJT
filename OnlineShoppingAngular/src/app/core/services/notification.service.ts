import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { StorageService } from './StorageService';
import { UserNotificationDTO } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})

export class NotificationService {
  private notificationsSubject = new BehaviorSubject<UserNotificationDTO[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private wsStompClient?: Client;
  private stompSubscription?: StompSubscription;

  constructor(private http: HttpClient, private storageService: StorageService) { }

  connectWebSocket() {
    if (this.wsStompClient) return;

    const token = this.storageService.getItem('token');

    const socket = new SockJS('http://localhost:8080/ws-notifications');
    this.wsStompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str: string) => {
        console.log(str);
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      onConnect: () => {
        this.wsStompClient!.subscribe('/user/queue/notifications', (message: IMessage) => {
          if (message.body) {
            const notification: UserNotificationDTO = JSON.parse(message.body);
            this.addNotification(notification);
          }
        });
      }
    });

    this.wsStompClient.activate();
  }

  loadInAppNotificationsForUser(userId: number): void {
    this.http.get<UserNotificationDTO[]>(`http://localhost:8080/notifications/in-app/${userId}`).subscribe(
      (data) => {
        this.notificationsSubject.next(data);
      },
      (error) => {
        console.error('Failed to load in-app notifications', error);
      }
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`http://localhost:8080/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`http://localhost:8080/notifications/mark-all-read`, {});
  }


  addNotification(notification: UserNotificationDTO) {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
  }

  disconnectWebSocket() {
    if (this.stompSubscription) {
      this.stompSubscription.unsubscribe();
      this.stompSubscription = undefined;
    }
    if (this.wsStompClient) {
      this.wsStompClient.deactivate();
      this.wsStompClient = undefined;
    }
  }

}