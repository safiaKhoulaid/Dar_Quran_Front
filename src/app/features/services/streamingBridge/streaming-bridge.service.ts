import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '@env/environments';
import { io, Socket } from 'socket.io-client';

export type BridgeStatus = 'disconnected' | 'connecting' | 'ready' | 'streaming' | 'error' | 'ended';

export interface BridgeMessage {
  type: 'ready' | 'error' | 'ended';
  streamKey?: string;
  message?: string;
}

/**
 * Service pour envoyer le flux caméra/micro vers le bridge Node.js (Socket.io)
 * qui relaie vers RTMP (NGINX). Utilise MediaRecorder (WebM) et envoie les chunks via socket.io.
 */
@Injectable({ providedIn: 'root' })
export class StreamingBridgeService {
  private socket: Socket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private readonly statusSubject = new Subject<BridgeStatus>();
  private readonly messageSubject = new Subject<BridgeMessage>();

  private readonly bridgeUrl = (environment as { streamingBridgeWsUrl?: string }).streamingBridgeWsUrl ?? 'http://localhost:9090';

  status$: Observable<BridgeStatus> = this.statusSubject.asObservable();
  message$: Observable<BridgeMessage> = this.messageSubject.asObservable();

  /**
   * Démarre l'envoi du flux vers le bridge.
   * À appeler après avoir obtenu le streamKey (session démarrée) et un MediaStream (getUserMedia).
   */
  startStreaming(streamKey: string, mediaStream: MediaStream): void {
    if (this.socket?.connected) {
      this.statusSubject.next('error');
      this.messageSubject.next({ type: 'error', message: 'Déjà connecté au bridge.' });
      return;
    }
    if (!streamKey?.trim()) {
      this.statusSubject.next('error');
      this.messageSubject.next({ type: 'error', message: 'streamKey requis.' });
      return;
    }

    this.stream = mediaStream;
    this.statusSubject.next('connecting');

    // Connexion au bridge Node.js (Socket.io)
    this.socket = io(this.bridgeUrl, {
      transports: ['websocket'], // Force WebSocket pour de meilleures perfs en streaming
      reconnection: false
    });

    this.socket.on('connect', () => {
      console.log('[StreamingBridge] Socket connected, sending start-stream');
      this.socket!.emit('start-stream', streamKey.trim());
    });

    this.socket.on('bridge-ready', (msg: string) => {
      console.log('[StreamingBridge] Bridge ready:', msg);
      this.messageSubject.next({ type: 'ready', message: msg });
      this.statusSubject.next('ready');
      // FFmpeg est prêt côté serveur, on lance l'enregistrement par chunks
      this.startMediaRecorder();
    });

    this.socket.on('bridge-error', (msg: string) => {
      console.error('[StreamingBridge] Bridge error:', msg);
      this.statusSubject.next('error');
      this.messageSubject.next({ type: 'error', message: msg });
    });

    this.socket.on('bridge-ended', (msg: string) => {
      console.log('[StreamingBridge] Bridge ended:', msg);
      this.statusSubject.next('ended');
      this.messageSubject.next({ type: 'ended', message: msg });
      this.stopMediaRecorder();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[StreamingBridge] Connection error:', error);
      this.statusSubject.next('error');
      this.messageSubject.next({ type: 'error', message: 'Erreur de connexion au bridge (Node.js serveur inaccessible ?).' });
    });

    this.socket.on('disconnect', () => {
      console.log('[StreamingBridge] Socket disconnected');
      this.stopMediaRecorder();
      this.statusSubject.next('disconnected');
    });
  }

  private startMediaRecorder(): void {
    if (!this.stream || !this.socket?.connected) return;

    const mimeType = this.getSupportedMimeType();
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

    if (!MediaRecorder.isTypeSupported(mimeType || 'video/webm')) {
      this.messageSubject.next({ type: 'error', message: 'Format WebM non supporté par ce navigateur.' });
      return;
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0 && this.socket?.connected) {
          // Envoie les chunks binaires via l'événement 'binarystream'
          this.socket.emit('binarystream', e.data);
        }
      };
      this.mediaRecorder.onerror = () => {
        this.messageSubject.next({ type: 'error', message: 'Erreur MediaRecorder.' });
      };

      // Des petits chunks (e.g. 200ms) pour une latence réduite
      this.mediaRecorder.start(200);
      this.statusSubject.next('streaming');
    } catch (err) {
      console.error('[StreamingBridge] Error starting MediaRecorder:', err);
      this.statusSubject.next('error');
      this.messageSubject.next({ type: 'error', message: 'Erreur lors du démarrage de l\'enregistrement.' });
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return 'video/webm';
  }

  private stopMediaRecorder(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) { }
    }
    this.mediaRecorder = null;
  }

  /** Arrête l'envoi et ferme la connexion. */
  stopStreaming(): void {
    this.stopMediaRecorder();
    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('stop-stream');
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.stream = null;
    this.statusSubject.next('disconnected');
  }

  get currentStatus(): BridgeStatus {
    if (this.socket?.connected) {
      return this.mediaRecorder?.state === 'recording' ? 'streaming' : 'ready';
    }
    return 'disconnected';
  }
}
