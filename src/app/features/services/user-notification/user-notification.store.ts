import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import type {
  SpringPage,
  UnreadCountResponse,
  UserNotification,
} from '@features/models/notification/user-notification.model';

@Injectable({ providedIn: 'root' })
export class UserNotificationStore {
  private readonly http = inject(HttpClient);

  readonly items = signal<UserNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadUnreadCount(): void {
    this.http.get<UnreadCountResponse>('/notifications/unread-count').subscribe({
      next: (r) => this.unreadCount.set(r?.count ?? 0),
      error: () => {},
    });
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      page: this.http.get<SpringPage<UserNotification>>('/notifications', {
        params: { page: 0, size: 50 },
      }),
      unread: this.http.get<UnreadCountResponse>('/notifications/unread-count'),
    }).subscribe({
      next: ({ page, unread }) => {
        this.items.set(page?.content ?? []);
        this.unreadCount.set(unread?.count ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل الإشعارات.');
        this.loading.set(false);
      },
    });
  }

  markAllRead(): void {
    this.http.post('/notifications/read-all', {}).subscribe({
      next: () => {
        this.items.update((list) => list.map((n) => ({ ...n, read: true })));
        this.unreadCount.set(0);
      },
    });
  }

  markRead(id: string): void {
    this.http.post(`/notifications/${id}/read`, {}).subscribe({
      next: () => {
        this.items.update((list) =>
          list.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        this.loadUnreadCount();
      },
    });
  }
}
