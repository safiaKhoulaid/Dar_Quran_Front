import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ClassItem, ClassCreateRequest } from '@features/models/class/class.model';
import { Gender } from '@core/models/users/admin.model';

@Injectable({ providedIn: 'root' })
export class ClassService {
  private readonly baseUrl = '/rooms'; // Backend uses /rooms for Classes
  private http = inject(HttpClient);

  getList(): Observable<ClassItem[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(rooms => rooms.map(r => this.mapRoomToClass(r))),
      catchError(() => of([]))
    );
  }

  getById(id: string | number): Observable<ClassItem | null> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(r => this.mapRoomToClass(r)),
      catchError(() => of(null))
    );
  }

  create(body: ClassCreateRequest): Observable<ClassItem | null> {
    const payload = {
      name: body.name,
      section: body.gender,
      capacity: body.capacity || 0
    };
    return this.http.post<any>(this.baseUrl, payload).pipe(
      map(r => this.mapRoomToClass(r)),
      catchError(() => of(null))
    );
  }

  update(id: string | number, body: Partial<ClassCreateRequest>): Observable<ClassItem | null> {
    const payload: any = {};
    if (body.name !== undefined) payload.name = body.name;
    if (body.gender !== undefined) payload.section = body.gender;
    if (body.capacity !== undefined) payload.capacity = body.capacity;
    if (body.teacher_id !== undefined) payload.teacherId = body.teacher_id ?? null;

    return this.http.put<any>(`${this.baseUrl}/${id}`, payload).pipe(
      map(r => this.mapRoomToClass(r)),
      catchError(() => of(null))
    );
  }

  delete(id: string | number): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private mapRoomToClass(r: any): ClassItem {
    return {
      id: r.id,
      name: r.name,
      gender: r.section === 'HOMME' ? 'HOMME' : 'FEMME',
      teacher_id: r.teacherId,
      teacherName: r.teacherName ?? null,
      studentsCount: r.capacity ?? 0
    };
  }
}
