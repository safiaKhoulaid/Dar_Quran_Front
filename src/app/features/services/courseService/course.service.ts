import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CourseRequest, CourseResponse } from '@features/models/course/course.model';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
    private http = inject(HttpClient);

    create(request: CourseRequest) {
        return this.http.post<CourseResponse>('/courses', request);
    }

    getAll(page = 0, size = 100) {
        const params = new HttpParams().set('page', String(page)).set('size', String(size));
        return this.http.get<PageResponse<CourseResponse>>('/courses', { params });
    }

    getById(id: string) {
        return this.http.get<CourseResponse>(`/courses/${id}`);
    }

    update(id: string, request: CourseRequest) {
        return this.http.put<CourseResponse>(`/courses/${id}`, request);
    }

    delete(id: string) {
        return this.http.delete<void>(`/courses/${id}`);
    }
}
