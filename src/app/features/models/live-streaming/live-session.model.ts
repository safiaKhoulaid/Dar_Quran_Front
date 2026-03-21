/**
 * Aligné avec le backend Spring Boot (LiveSessionResponse, LiveSessionStatus, LiveAccessType).
 */

export type LiveSessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | 'RECORDING';

export type LiveAccessType = 'INTERNAL' | 'EXTERNAL';

export type Section = 'HOMME' | 'FEMME';

export interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  streamKey: string;
  /** URL RTMP d'ingest pour OBS (rtmp://...) */
  rtmpIngestUrl?: string;
  /** URL HLS de lecture (.m3u8) — fournie par le backend */
  hlsPlaybackUrl: string;
  status: LiveSessionStatus;
  accessType: LiveAccessType;
  adaptiveQualityEnabled: boolean;
  recordingEnabled: boolean;
  recordingUrl: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  teacherId: string | null;
  teacherName: string | null;
  /** Section du professeur : accès réservé à la même section (HOMME/FEMME). */
  section?: Section | null;
  commentCount: number;
}

export interface LiveSessionPage {
  content: LiveSession[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/** Requête création/MAJ session — aligné backend LiveSessionRequest */
export interface LiveSessionRequest {
  teacherId?: string;
  title: string;
  description?: string | null;
  streamKey: string;
  accessType: LiveAccessType;
  adaptiveQualityEnabled?: boolean;
  recordingEnabled?: boolean;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
}
