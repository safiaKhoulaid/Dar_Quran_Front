import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { UserNotificationStore } from '@features/services/user-notification/user-notification.store';
import type { UserNotification } from '@features/models/notification/user-notification.model';

@Component({
  selector: 'app-dashboard-notifications-panel',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard-notifications-panel.html',
  styleUrl: './dashboard-notifications-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardNotificationsPanelComponent implements OnInit {
  private readonly store = inject(UserNotificationStore);
  private readonly router = inject(Router);

  readonly storeRef = this.store;

  ngOnInit(): void {
    this.store.refresh();
  }

  markAllRead(): void {
    if (this.store.unreadCount() === 0) return;
    this.store.markAllRead();
  }

  typeLabel(type: string): string {
    if (type === 'LIVE_STARTED') return 'بث مباشر';
    if (type === 'COURSE_PUBLISHED') return 'مقرر';
    return type;
  }

  onItemClick(n: UserNotification): void {
    if (!n.read) {
      this.store.markRead(n.id);
    }
    this.openLink(n.linkUrl);
  }

  private openLink(linkUrl: string | null | undefined): void {
    if (!linkUrl) return;
    if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
      window.location.href = linkUrl;
      return;
    }
    const path = linkUrl.startsWith('/') ? linkUrl : `/${linkUrl}`;
    void this.router.navigateByUrl(path);
  }
}
