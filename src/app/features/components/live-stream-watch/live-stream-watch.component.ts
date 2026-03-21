import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { LiveStreamingService } from '@features/services/liveStreamingService/live-streaming.service';
import { LiveSession } from '@features/models/live-streaming/live-session.model';
import { LiveComment } from '@features/models/live-streaming/live-comment.model';
import { AuthService } from '@features/services/authService/auth-service';
import Hls from 'hls.js';

@Component({
  selector: 'app-live-stream-watch',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './live-stream-watch.component.html',
  styleUrls: ['./live-stream-watch.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveStreamWatchComponent
  implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly liveStreamingService = inject(LiveStreamingService);
  private readonly authService = inject(AuthService);

  @ViewChild('videoPlayer') videoRef!: ElementRef<HTMLVideoElement>;

  readonly session = signal<LiveSession | null>(null);
  readonly isLoadingSession = signal(true);
  readonly error = signal<string | null>(null);

  // Pour la liste globale (fallback)
  readonly sessions = signal<LiveSession[]>([]);
  readonly isLoadingList = signal(false);
  readonly listError = signal<string | null>(null);

  // commentaires
  readonly comments = signal<LiveComment[]>([]);
  readonly loadingComments = signal(false);
  readonly commentsError = signal<string | null>(null);
  readonly isSendingComment = signal(false);

  newCommentAuthor = signal('');
  newCommentContent = signal('');

  commentAuthor = ''; // Maintained for fallback or legacy if needed
  commentContent = '';

  private commentsSub: Subscription | null = null;
  private hls: Hls | null = null;

  readonly isLive = computed(() => this.session()?.status === 'LIVE');
  readonly hasHlsUrl = computed(
    () => !!this.session()?.hlsPlaybackUrl?.trim()
  );
  readonly sessionTitle = computed(() => this.session()?.title ?? '');
  readonly sessionDescription = computed(
    () => this.session()?.description ?? null
  );
  readonly teacherName = computed(() => this.session()?.teacherName ?? null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSessionById(id);
    } else {
      this.loadCurrentLiveSessions();
    }
  }

  ngAfterViewInit(): void {
    this.scheduleInitPlayer();
  }

  ngOnDestroy(): void {
    this.destroyHls();
    if (this.commentsSub) {
      this.commentsSub.unsubscribe();
      this.commentsSub = null;
    }
  }

  private loadSessionById(id: string): void {
    const isAuth = !!this.authService.currentUser();
    const req$ = isAuth
      ? this.liveStreamingService.getSessionById(id)
      : this.liveStreamingService.getPublicSessionById(id);

    req$.subscribe({
      next: (s) => {
        this.session.set(s);
        this.isLoadingSession.set(false);
        if (!s) {
          this.error.set('لم يتم العثور على البث.');
        } else {
          this.scheduleInitPlayer();
          this.startCommentsPolling(s.id);
        }
      },
      error: () => {
        this.isLoadingSession.set(false);
        this.error.set('حدث خطأ أثناء تحميل البث.');
      },
    });
  }

  private loadCurrentLiveSessions(): void {
    const isAuth = !!this.authService.currentUser();
    const req$ = isAuth
      ? this.liveStreamingService.getSessionsByStatus('LIVE', 0, 20)
      : this.liveStreamingService.getPublicSessions('LIVE', 0, 20);

    this.isLoadingList.set(true);
    req$.subscribe({
      next: (page) => {
        const first = page.content?.[0] ?? null;
        this.sessions.set(page.content ?? []);
        this.session.set(first);
        this.isLoadingSession.set(false);
        this.isLoadingList.set(false);
        if (!first && page.content?.length === 0) {
          this.error.set('لا يوجد بث مباشر في الوقت الحالي.');
        } else if (first) {
          this.scheduleInitPlayer();
          this.startCommentsPolling(first.id);
        }
      },
      error: () => {
        this.isLoadingSession.set(false);
        this.isLoadingList.set(false);
        this.listError.set('حدث خطأ أثناء تحميل البث.');
      },
    });
  }

  private scheduleInitPlayer(): void {
    setTimeout(() => this.initPlayerWhenReady(), 0);
  }

  initPlayerWhenReady(): void {
    const s = this.session();
    if (!s?.hlsPlaybackUrl) return;
    const video = this.videoRef?.nativeElement;
    if (video && !this.hls) {
      this.initHls(video, s.hlsPlaybackUrl);
    }
  }

  private initHls(video: HTMLVideoElement, url: string): void {
    this.destroyHls();
    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      this.hls.loadSource(url);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          this.error.set('فشل تشغيل البث. تحقق من الرابط أو حاول لاحقاً.');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else {
      this.error.set('المتصفح لا يدعم تشغيل هذا البث.');
    }
  }

  private destroyHls(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  private startCommentsPolling(sessionId: string): void {
    if (this.commentsSub) {
      this.commentsSub.unsubscribe();
    }
    this.loadingComments.set(true);
    this.commentsError.set(null);

    const isAuth = !!this.authService.currentUser();
    const poll$ = interval(5000);
    this.commentsSub = poll$.subscribe(() => {
      const getComments$ = isAuth
        ? this.liveStreamingService.getSessionComments(sessionId)
        : this.liveStreamingService.getPublicSessionComments(sessionId);

      getComments$.subscribe({
        next: (list) => {
          this.loadingComments.set(false);
          this.comments.set(list ?? []);
        },
        error: () => {
          this.loadingComments.set(false);
          this.commentsError.set('تعذر تحميل التعليقات حالياً.');
        },
      });
    });

    // première charge immédiate
    const initialComments$ = isAuth
      ? this.liveStreamingService.getSessionComments(sessionId)
      : this.liveStreamingService.getPublicSessionComments(sessionId);

    initialComments$.subscribe({
      next: (list) => {
        this.loadingComments.set(false);
        this.comments.set(list ?? []);
      },
      error: () => {
        this.loadingComments.set(false);
        this.commentsError.set('تعذر تحميل التعليقات حالياً.');
      },
    });
  }

  sendComment(): void {
    const s = this.session();
    const content = this.newCommentContent().trim();
    const author = this.newCommentAuthor().trim();

    if (!s || !content) {
      return;
    }

    this.isSendingComment.set(true);
    this.commentsError.set(null);

    const isAuth = !!this.authService.currentUser();
    const req = {
      content,
      authorDisplayName: author || 'مشارك',
    };

    const addComment$ = isAuth
      ? this.liveStreamingService.addSessionComment(s.id, req)
      : this.liveStreamingService.addPublicComment(s.id, req);

    addComment$.subscribe({
      next: (created) => {
        this.isSendingComment.set(false);
        if (created) {
          this.comments.update((list) => [...list, created]);
          this.newCommentContent.set('');
        }
      },
      error: () => {
        this.isSendingComment.set(false);
        this.commentsError.set('تعذر إرسال التعليق. حاول مرة أخرى.');
      },
    });
  }
}

