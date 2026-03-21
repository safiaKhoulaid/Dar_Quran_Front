/**
 * Aligné avec le backend (LiveCommentRequest, LiveCommentResponse).
 */

export interface LiveCommentRequest {
  content: string;
  authorDisplayName?: string;
}

export interface LiveComment {
  id: string;
  content: string;
  createdAt: string;
  liveSessionId: string;
  authorId: string | null;
  authorDisplayName: string | null;
}
