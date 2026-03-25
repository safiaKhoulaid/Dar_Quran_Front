export type ResourceType = 'TEXT' | 'PDF' | 'VIDEO';

export interface ResourceRequest {
  name: string;
  fileUrl: string;
  type: ResourceType;
  size?: number | null;
  lessonId: string;
}

export interface ResourceResponse {
  id: string;
  name: string;
  fileUrl: string;
  type: ResourceType;
  size: number | null;
  createdAt: string;
  lessonId: string;
}
