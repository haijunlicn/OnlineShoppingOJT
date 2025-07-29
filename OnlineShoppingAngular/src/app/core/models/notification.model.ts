export interface UserNotificationDTO {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  deliveredAt: string
  userId: string
  metadata?: string;
  imageUrl?: string | null; 
  richContent?: NotificationRichContent
  showToast?: boolean;
}

export interface NotificationRichContent {
  image?: string
  content?: string // HTML content
  links?: NotificationLink[]
  actions?: NotificationAction[]
  data?: { [key: string]: any }
  titleParts?: {
    text: string
    routerLink?: string
  }[],
  messageParts?: {
    text: string
    routerLink?: string
  }[]
}

export interface NotificationLink {
  label: string
  url: string
  icon?: string
  external?: boolean
}

export interface NotificationAction {
  label: string
  type: "navigate" | "external" | "api" | "modal"
  url?: string
  icon?: string
  style?: "primary" | "success" | "warning" | "danger" | "info"
  payload?: any
}

export interface CreateNotificationPayload {
  title?: string | null;
  message: string;
  imageUrl?: string | null;
  metadata?: string | null;
  scheduledAt?: string | null;
}
export interface NotificationType {
  id: number;
  name: string;
  titleTemplate: string;
  messageTemplate?: string;
  adminOnly: boolean;
}
export interface Notification {
  id: number;
  title?: string;
  message?: string;
  imageUrl?: string;
  metadata?: string;
  scheduledAt?: string;
  createdDate?: string;
}





