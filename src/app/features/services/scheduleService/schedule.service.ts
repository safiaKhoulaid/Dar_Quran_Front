import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { ScheduleSlotResponse, ScheduleSlotRequest } from '@features/models/schedule/schedule.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly baseUrl = '/schedule-slots';
  private http = inject(HttpClient);

  getAll(): Observable<ScheduleSlotResponse[]> {
    return this.http.get<ScheduleSlotResponse[]>(this.baseUrl).pipe(
      catchError(() => of([]))
    );
  }

  getByRoom(roomId: string): Observable<ScheduleSlotResponse[]> {
    return this.http.get<ScheduleSlotResponse[]>(`${this.baseUrl}/room/${roomId}`).pipe(
      catchError(() => of([]))
    );
  }

  create(body: ScheduleSlotRequest): Observable<ScheduleSlotResponse | null> {
    return this.http.post<ScheduleSlotResponse>(this.baseUrl, body).pipe(
      catchError(() => of(null))
    );
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
