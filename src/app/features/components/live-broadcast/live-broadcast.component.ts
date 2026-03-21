import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import {
  LiveSession,
  LiveAccessType,
} from '@features/models/live-streaming/live-session.model';
import { LiveComment } from '@features/models/live-streaming/live-comment.model';
import { LiveStreamingService } from '@features/services/liveStreamingService/live-streaming.service';
import { AuthService } from '@features/services/authService/auth-service';
import {
  StreamingBridgeService,
  BridgeStatus,
} from '@features/services/streamingBridge/streaming-bridge.service';

@Component({
  selector: 'app-live-broadcast',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './live-broadcast.component.html',
  styleUrls: ['./live-broadcast.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveBroadcastComponent implements OnInit, OnDestroy {
  @ViewChild('previewVideo') previewRef!: ElementRef<HTMLVideoElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly liveService = inject(LiveStreamingService);
  private readonly bridgeService = inject(StreamingBridgeService);
  private readonly authService = inject(AuthService);
  private bridgeSub?: Subscription;
  private commentsSub?: Subscription;

  isInitializing = signal(false);
  isStreaming = signal(false);
  isLoadingSession = signal(false);

  error = signal<string | null>(null);
  session = signal<LiveSession | null>(null);

  /** État du bridge No-OBS (envoi caméra → WebSocket → RTMP) */
  bridgeStatus = signal<BridgeStatus>('disconnected');
  bridgeError = signal<string | null>(null);

  /** Données du formulaire de création quand aucun id n'est fourni dans l'URL */
  title = signal('');
  description = signal('');
  streamKey = signal('');
  accessType = signal<LiveAccessType>('EXTERNAL');
  scheduledStartAt = signal('');

  /** Commentaires de la session **/
  comments = signal<LiveComment[]>([]);
  loadingComments = signal(false);
  commentsError = signal<string | null>(null);

  private stream: MediaStream | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSession(id);
    }
    this.bridgeSub = this.bridgeService.status$.subscribe((s) => this.bridgeStatus.set(s));
    this.bridgeService.message$.subscribe((m) => {
      if (m.type === 'error' && m.message) this.bridgeError.set(m.message);
    });
  }

  ngOnDestroy(): void {
    this.bridgeService.stopStreaming();
    this.bridgeSub?.unsubscribe();
    this.commentsSub?.unsubscribe();
    this.stopStream();
  }

  private loadSession(id: string): void {
    this.isLoadingSession.set(true);
    this.error.set(null);
    this.liveService.getSessionById(id).subscribe({
      next: (s) => {
        this.isLoadingSession.set(false);
        if (!s) {
          this.error.set('لم يتم العثور على جلسة البث المطلوبة.');
          return;
        }
        this.session.set(s);
        this.startCommentsPolling(s.id);
      },
      error: () => {
        this.isLoadingSession.set(false);
        this.error.set('حدث خطأ أثناء تحميل بيانات جلسة البث.');
      },
    });
  }

  async startCamera(): Promise<void> {
    if (this.isStreaming() || this.isInitializing()) {
      return;
    }

    this.error.set(null);
    this.isInitializing.set(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      this.stream = stream;
      const video = this.previewRef?.nativeElement;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      this.isStreaming.set(true);
    } catch (err: any) {
      this.error.set(
        err?.name === 'NotAllowedError'
          ? 'تم رفض الإذن للوصول إلى الكاميرا أو الميكروفون.'
          : 'حدث خطأ أثناء محاولة تشغيل الكاميرا. تحقق من الأذونات وحاول مرة أخرى.'
      );
    } finally {
      this.isInitializing.set(false);
    }
  }

  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    const video = this.previewRef?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
    this.isStreaming.set(false);
  }

  /** Création d'une nouvelle session de live côté backend pour l'enseignant/admin connecté. */
  createSession(): void {
    if (!this.title().trim() || !this.streamKey().trim() || !this.scheduledStartAt()) {
      this.error.set('الرجاء ملء عنوان البث، مفتاح البث وتاريخ البدء.');
      return;
    }

    this.error.set(null);
    this.isLoadingSession.set(true);

    // Ensure the date format is ISO with seconds (required by some backend parsers)
    let startDate = this.scheduledStartAt();
    if (startDate && startDate.length === 16) {
      startDate += ':00';
    }

    const payload = {
      title: this.title().trim(),
      description: this.description()?.trim() || null,
      streamKey: this.streamKey().trim(),
      accessType: this.accessType(),
      scheduledStartAt: startDate,
      adaptiveQualityEnabled: true,
      recordingEnabled: false,
    };

    this.liveService.create(payload).subscribe({
      next: (s) => {
        this.isLoadingSession.set(false);
        if (!s) {
          this.error.set('تعذر إنشاء جلسة البث. تأكد من البيانات وحاول مرة أخرى.');
          return;
        }
        this.session.set(s);
        this.startCommentsPolling(s.id);
      },
      error: (err) => {
        this.isLoadingSession.set(false);
        console.error('[LiveBroadcast] Create session error:', err);
        // Try to extract a specific message from our ErrorResponse or standard format
        const backendMsg = err?.error?.message || err?.message || 'خطأ غير معروف';
        this.error.set(`تعذر إنشاء جلسة البث: ${backendMsg}`);
      },
    });
  }

  /** Demande au backend de passer la session en mode LIVE (start). */
  startLiveBackend(): void {
    const currentSession = this.session();
    if (!currentSession) return;
    this.error.set(null);
    this.liveService.startStream(currentSession.id).subscribe({
      next: (s) => {
        if (!s) {
          this.error.set('تعذر بدء البث من الخادم.');
          return;
        }
        this.session.set(s);
      },
      error: () => {
        this.error.set('حدث خطأ أثناء محاولة بدء البث.');
      },
    });
  }

  /** Demande au backend d’arrêter la session LIVE (end). */
  endLiveBackend(): void {
    const currentSession = this.session();
    if (!currentSession) return;
    this.error.set(null);
    this.liveService.endStream(currentSession.id).subscribe({
      next: (s) => {
        if (!s) {
          this.error.set('تعذر إيقاف البث من الخادم.');
          return;
        }
        this.session.set(s);
      },
      error: () => {
        this.error.set('حدث خطأ أثناء محاولة إيقاف البث.');
      },
    });
  }

  showBackendInfo = computed(() => !!this.session());

  /** First calls POST /start to get streamKey and update status to LIVE, then connects WebSocket */
  startFullBroadcast(): void {
    const currentSession = this.session();
    if (!currentSession || !this.stream) {
      this.error.set('قم بتشغيل الكاميرا والتحقق من إنشاء جلسة البث أولاً.');
      return;
    }

    this.error.set(null);
    this.bridgeError.set(null);

    // Call Spring Boot API to start session
    this.liveService.startStream(currentSession.id).subscribe({
      next: (s) => {
        if (!s) {
          this.error.set('تعذر بدء البث من الخادم.');
          return;
        }
        this.session.set(s);

        // Now that the session is LIVE and we have the streamKey, connect the Socket.io Bridge
        if (s.streamKey) {
          this.bridgeService.startStreaming(s.streamKey, this.stream!);
        } else {
          this.error.set('لا يوجد مفتاح بث متاح.');
        }
      },
      error: () => {
        this.error.set('حدث خطأ أثناء محاولة بدء البث من الخادم.');
      },
    });
  }

  stopStreamingToBridge(): void {
    this.bridgeService.stopStreaming();
    this.bridgeError.set(null);
  }

  canStartFullBroadcast = computed(() => {
    const s = this.session();
    const bStatus = this.bridgeStatus();
    return !!(
      s &&
      s.status !== 'ENDED' &&
      this.isStreaming() &&
      this.stream &&
      bStatus !== 'streaming' &&
      bStatus !== 'connecting' &&
      bStatus !== 'ready'
    );
  });

  isBridgeStreaming = computed(() => {
    const bStatus = this.bridgeStatus();
    return bStatus === 'streaming' || bStatus === 'ready';
  });

  private startCommentsPolling(sessionId: string): void {
    if (this.commentsSub) {
      this.commentsSub.unsubscribe();
    }

    this.loadingComments.set(true);
    this.commentsError.set(null);

    const isAuth = !!this.authService.currentUser();

    const fetchComments = () => {
      const getComments$ = isAuth
        ? this.liveService.getSessionComments(sessionId)
        : this.liveService.getPublicSessionComments(sessionId);

      getComments$.subscribe({
        next: (list) => {
          this.loadingComments.set(false);
          this.comments.set(list ?? []);
        },
        error: () => {
          this.loadingComments.set(false);
          this.commentsError.set('تعذر تحميل التعليقات حالياً.');
        }
      });
    };

    // First load
    fetchComments();

    // Poll every 5 seconds
    this.commentsSub = interval(5000).subscribe(() => {
      fetchComments();
    });
  }
}
