import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { LessonRequest, LessonResponse } from '@features/models/course/lesson.model';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);
  private readonly base = '/lessons';

  getByCourseId(courseId: string) {
    return this.http.get<LessonResponse[]>(`/courses/${courseId}/lessons`);
  }

  create(request: LessonRequest) {
    return this.http.post<LessonResponse>(this.base, request);
  }

  update(id: string, request: LessonRequest) {
    return this.http.put<LessonResponse>(`${this.base}/${id}`, request);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
