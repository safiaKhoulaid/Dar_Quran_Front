import type { ResourceResponse } from './resource.model';

export interface LessonRequest {
  title: string;
  description?: string;
  orderIndex: number;
  courseId: string;
}

export interface LessonResponse {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  resources?: ResourceResponse[] | null;
}
