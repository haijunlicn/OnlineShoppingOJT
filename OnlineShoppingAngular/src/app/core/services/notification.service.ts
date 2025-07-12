import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { StorageService } from './StorageService';
import { CreateNotificationPayload, UserNotificationDTO } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})

export class NotificationService {
  private notificationsSubject = new BehaviorSubject<UserNotificationDTO[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private wsStompClient?: Client;
  private stompSubscription?: StompSubscription;

  baseUrl = "http://localhost:8080/notifications";

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
    this.http.get<UserNotificationDTO[]>(`${this.baseUrl}/in-app/${userId}`).subscribe(
      (data) => {
        this.notificationsSubject.next(data);
      },
      (error) => {
        console.error('Failed to load in-app notifications', error);
      }
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/mark-all-read`, {});
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

  renderNotification(notification: UserNotificationDTO): UserNotificationDTO {
    let metadata: { [key: string]: string } = {};

    try {
      if (typeof notification.metadata === 'string') {
        metadata = JSON.parse(notification.metadata);
      }
    } catch (e) {
      metadata = {};
    }

    const render = (template: string): { text: string, routerLink?: string }[] => {
      const regex = /{{(.*?)}}/g;
      const parts: { text: string; routerLink?: string }[] = [];

      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(template)) !== null) {
        const key = match[1];
        const index = match.index;

        if (index > lastIndex) {
          parts.push({ text: template.substring(lastIndex, index) });
        }

        const value = metadata[key];
        const link = metadata[`${key}Link`];

        if (value && link) {
          parts.push({ text: value, routerLink: link });
        } else if (value) {
          parts.push({ text: value });
        } else {
          parts.push({ text: match[0] }); // fallback to raw
        }

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < template.length) {
        parts.push({ text: template.substring(lastIndex) });
      }

      return parts;
    };

    return {
      ...notification,
      richContent: {
        titleParts: render(notification.title || ''),
        messageParts: render(notification.message || '')
      }
    };
  }

  createCustomNotification(payload: CreateNotificationPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/custom`, payload);
  }

}