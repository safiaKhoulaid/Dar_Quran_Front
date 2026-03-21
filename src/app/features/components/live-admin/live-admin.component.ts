import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LiveSession,
  LiveSessionPage,
  LiveSessionStatus,
} from '@features/models/live-streaming/live-session.model';
import { LiveStreamingService } from '@features/services/liveStreamingService/live-streaming.service';

@Component({
  selector: 'app-live-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './live-admin.component.html',
  styleUrls: ['./live-admin.component.css'],
})
export class LiveAdminComponent implements OnInit {
  private readonly liveService = inject(LiveStreamingService);

  sessions: LiveSession[] = [];
  loading = false;
  error: string | null = null;

  selectedStatus: LiveSessionStatus | 'ALL' = 'LIVE';

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading = true;
    this.error = null;

    const loader =
      this.selectedStatus === 'ALL'
        ? this.liveService.getSessions(0, 50)
        : this.liveService.getSessionsByStatus(this.selectedStatus, 0, 50);

    loader.subscribe({
      next: (page: LiveSessionPage) => {
        this.loading = false;
        this.sessions = page.content ?? [];
      },
      error: () => {
        this.loading = false;
        this.error = 'تعذر تحميل جلسات البث.';
      },
    });
  }

  changeStatusFilter(value: string): void {
    this.selectedStatus = value === 'ALL' ? 'ALL' : (value as LiveSessionStatus);
    this.loadSessions();
  }

  start(session: LiveSession): void {
    this.error = null;
    this.liveService.startStream(session.id).subscribe({
      next: (s) => {
        if (!s) {
          this.error = 'تعذر بدء هذا البث.';
          return;
        }
        this.loadSessions();
      },
      error: () => {
        this.error = 'حدث خطأ أثناء محاولة بدء البث.';
      },
    });
  }

  end(session: LiveSession): void {
    this.error = null;
    this.liveService.endStream(session.id).subscribe({
      next: (s) => {
        if (!s) {
          this.error = 'تعذر إيقاف هذا البث.';
          return;
        }
        this.loadSessions();
      },
      error: () => {
        this.error = 'حدث خطأ أثناء محاولة إيقاف البث.';
      },
    });
  }

  trackById(_index: number, item: LiveSession): string {
    return item.id;
  }
}

