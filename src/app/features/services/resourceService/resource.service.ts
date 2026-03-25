import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ResourceRequest, ResourceResponse } from '@features/models/course/resource.model';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly http = inject(HttpClient);
  private readonly base = '/resources';

  getByLessonId(lessonId: string) {
    return this.http.get<ResourceResponse[]>(`${this.base}/lesson/${lessonId}`);
  }

  create(request: ResourceRequest) {
    return this.http.post<ResourceResponse>(this.base, request);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
