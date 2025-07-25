// src/app/core/services/countdown-service.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CountdownService {
  constructor() {}

  // Full days remaining
  getRemainingDays(endTime?: string | Date): number {
    if (!endTime) return 0;

    const diff = new Date(endTime).getTime() - new Date().getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  // Seconds remaining, adjusted if 1+ days
  getRemainingSeconds(endTime?: string | Date): number {
    if (!endTime) return 0;

    const endDate = new Date(endTime);
    const nowDate = new Date();

    const diff = endDate.getTime() - nowDate.getTime();
    const diffSeconds = Math.floor(diff / 1000);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Subtract 1 day only if at least 1 full day remains
    return Math.max(0, days >= 1 ? diffSeconds - 86400 : diffSeconds);
  }

  // Format string for countdown
  getCountdownFormat(endTime?: string | Date): string {
    if (!endTime) return 'HH:mm:ss';

    const endDate = new Date(endTime);
    const nowDate = new Date();

    const diff = endDate.getTime() - nowDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return days >= 1 ? 'dd:HH:mm:ss' : 'HH:mm:ss';
  }
}
