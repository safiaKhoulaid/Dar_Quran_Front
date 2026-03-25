export type UserNotificationType = 'LIVE_STARTED' | 'COURSE_PUBLISHED';

export interface UserNotification {
  id: string;
  type: UserNotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  read: boolean;
  createdAt: string;
}

export interface SpringPage<T> {
  content: T[];
  totalElements?: number;
}

export interface UnreadCountResponse {
  count: number;
}
