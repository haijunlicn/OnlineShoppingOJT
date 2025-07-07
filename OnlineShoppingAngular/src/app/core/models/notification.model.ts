export interface UserNotificationDTO {
  id: number;
  title: string;
  message: string;
  metadata?: string;
  read: boolean;
  deliveredAt: string;  // ISO string
  readAt?: string;
  method: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
}

export interface TestNotificationRequest {
  type: string;
  title: string;
  message: string;
  metadata?: string;
  targetUserIds?: number[];
}
