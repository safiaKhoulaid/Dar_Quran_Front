/**
 * Modèle pour le live streaming.
 * Le backend peut renvoyer une URL HLS (.m3u8), une URL WebRTC, ou une URL d'embed (YouTube, etc.).
 */
export type StreamType = 'hls' | 'webrtc' | 'embed';

export interface StreamInfo {
  id: string | number;
  title: string;
  description?: string;
  /** URL du flux (HLS .m3u8, ou URL d'embed) */
  streamUrl: string;
  type: StreamType;
  /** true si un stream est actuellement en cours */
  isLive?: boolean;
  /** Pour embed : URL de la page à intégrer (iframe) */
  embedUrl?: string;
  /** Section éventuelle : HOMME | FEMME */
  section?: string;
  startedAt?: string;
  endedAt?: string;
}
