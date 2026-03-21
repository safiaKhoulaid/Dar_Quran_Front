import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import {
  LiveSession,
  LiveSessionPage,
  LiveSessionRequest,
  LiveSessionStatus,
} from '@features/models/live-streaming/live-session.model';
import {
  LiveComment,
  LiveCommentRequest,
} from '@features/models/live-streaming/live-comment.model';

const BASE_PUBLIC = '/live/public';
const BASE_SESSIONS = '/live/sessions';

/** Réponse API : backend envoie userId/userName, on les expose en teacherId/teacherName pour le front. */
function mapSessionFromApi(raw: Record<string, unknown> | null): LiveSession | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...raw,
    teacherId: (raw['teacherId'] ?? raw['userId']) as string | null ?? null,
    teacherName: (raw['teacherName'] ?? raw['userName']) as string | null ?? null,
  } as LiveSession;
}

function mapPageFromApi(page: { content?: unknown[];[k: string]: unknown } | null): LiveSessionPage {
  if (!page) return { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true };
  const content = (page.content ?? []).map((c) => mapSessionFromApi(c as Record<string, unknown>)).filter((s): s is LiveSession => s != null);
  return { ...page, content } as LiveSessionPage;
}

@Injectable({ providedIn: 'root' })
export class LiveStreamingService {
  private readonly http = inject(HttpClient);

  /**
   * Liste des sessions live publiques (accès externe, non authentifié).
   * Backend: GET /api/live/public/sessions?status=LIVE&page=0&size=20
   */
  getPublicSessions(
    status: LiveSessionStatus = 'LIVE',
    page = 0,
    size = 20
  ): Observable<LiveSessionPage> {
    const params = new HttpParams()
      .set('status', status)
      .set('page', String(page))
      .set('size', String(size));
    return this.http
      .get<LiveSessionPage>(`${BASE_PUBLIC}/sessions`, { params })
      .pipe(
        catchError(() =>
          of({
            content: [],
            totalElements: 0,
            totalPages: 0,
            size,
            number: page,
            first: true,
            last: true,
          })
        )
      );
  }

  /**
   * Session publique par id.
   * Backend: GET /api/live/public/sessions/{id}
   */
  getPublicSessionById(id: string): Observable<LiveSession | null> {
    return this.http.get<LiveSession>(`${BASE_PUBLIC}/sessions/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Commentaires d'une session publique.
   * Backend: GET /api/live/public/sessions/{id}/comments
   */
  getPublicSessionComments(id: string): Observable<LiveComment[]> {
    return this.http
      .get<LiveComment[]>(`${BASE_PUBLIC}/sessions/${id}/comments`)
      .pipe(catchError(() => of([])));
  }

  /**
   * Ajouter un commentaire (accès public, authorDisplayName requis si non connecté).
   * Backend: POST /api/live/public/sessions/{id}/comments
   */
  addPublicComment(
    sessionId: string,
    request: LiveCommentRequest
  ): Observable<LiveComment | null> {
    return this.http
      .post<LiveComment>(`${BASE_PUBLIC}/sessions/${sessionId}/comments`, request)
      .pipe(catchError(() => of(null)));
  }

  /* ========== Endpoints admin (authentifiés) ========== */

  /** POST /api/live/sessions */
  create(request: LiveSessionRequest): Observable<LiveSession | null> {
    const body = {
      ...request,
      scheduledEndAt: request.scheduledEndAt?.trim() ? request.scheduledEndAt : null,
    };
    return this.http
      .post<Record<string, unknown>>(BASE_SESSIONS, body)
      .pipe(map(mapSessionFromApi));
  }

  /** GET /api/live/sessions */
  getSessions(page = 0, size = 20): Observable<LiveSessionPage> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<{ content?: unknown[];[k: string]: unknown }>(BASE_SESSIONS, { params }).pipe(
      map(mapPageFromApi),
      catchError(() =>
        of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size,
          number: page,
          first: true,
          last: true,
        })
      )
    );
  }

  /**
   * GET /api/live/sessions/my-section — sessions de ma section (INTERNAL, pour élèves/profs même section).
   */
  getSessionsForMySection(
    status: LiveSessionStatus = 'LIVE',
    page = 0,
    size = 20
  ): Observable<LiveSessionPage> {
    const params = new HttpParams()
      .set('status', status)
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<{ content?: unknown[];[k: string]: unknown }>(`${BASE_SESSIONS}/my-section`, { params }).pipe(
      map(mapPageFromApi),
      catchError(() =>
        of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size,
          number: page,
          first: true,
          last: true,
        })
      )
    );
  }

  /** GET /api/live/sessions/status/{status} */
  getSessionsByStatus(
    status: LiveSessionStatus,
    page = 0,
    size = 20
  ): Observable<LiveSessionPage> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http
      .get<{ content?: unknown[];[k: string]: unknown }>(`${BASE_SESSIONS}/status/${status}`, { params })
      .pipe(
        map(mapPageFromApi),
        catchError(() =>
          of({
            content: [],
            totalElements: 0,
            totalPages: 0,
            size,
            number: page,
            first: true,
            last: true,
          })
        )
      );
  }

  /** GET /api/live/sessions/{id} */
  getSessionById(id: string): Observable<LiveSession | null> {
    return this.http.get<Record<string, unknown>>(`${BASE_SESSIONS}/${id}`).pipe(
      map(mapSessionFromApi),
      catchError(() => of(null))
    );
  }

  /** PUT /api/live/sessions/{id} */
  update(id: string, request: LiveSessionRequest): Observable<LiveSession | null> {
    return this.http
      .put<LiveSession>(`${BASE_SESSIONS}/${id}`, request)
      .pipe(catchError(() => of(null)));
  }

  /** DELETE /api/live/sessions/{id} */
  delete(id: string): Observable<boolean> {
    return this.http.delete(`${BASE_SESSIONS}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /** POST /api/live/sessions/{id}/start */
  startStream(id: string): Observable<LiveSession | null> {
    return this.http
      .post<LiveSession>(`${BASE_SESSIONS}/${id}/start`, {})
      .pipe(catchError(() => of(null)));
  }

  /** POST /api/live/sessions/{id}/end */
  endStream(id: string): Observable<LiveSession | null> {
    return this.http
      .post<LiveSession>(`${BASE_SESSIONS}/${id}/end`, {})
      .pipe(catchError(() => of(null)));
  }

  /** GET /api/live/sessions/{id}/comments (authentifié) */
  getSessionComments(sessionId: string): Observable<LiveComment[]> {
    return this.http
      .get<LiveComment[]>(`${BASE_SESSIONS}/${sessionId}/comments`)
      .pipe(catchError(() => of([])));
  }

  /** POST /api/live/sessions/{id}/comments (authentifié) */
  addSessionComment(
    sessionId: string,
    request: LiveCommentRequest
  ): Observable<LiveComment | null> {
    return this.http
      .post<LiveComment>(`${BASE_SESSIONS}/${sessionId}/comments`, request)
      .pipe(catchError(() => of(null)));
  }
}
