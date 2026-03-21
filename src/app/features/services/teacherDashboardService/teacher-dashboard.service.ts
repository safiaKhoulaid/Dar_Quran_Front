import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import type { CourseResponse } from '@features/models/course/course.model';
import type { ScheduleSlotResponse } from '@features/models/schedule/schedule.model';
import type {
  TeacherRoomResponse,
  TeacherStudentResponse,
  StudentAbsenceRequest,
  StudentAbsenceResponse,
  StudentGradeRequest,
  StudentGradeResponse,
} from '@features/models/teacher-dashboard/teacher-dashboard.model';

const BASE = '/teacher';

@Injectable({ providedIn: 'root' })
export class TeacherDashboardService {
  private readonly http = inject(HttpClient);

  getMyClasses(): Observable<TeacherRoomResponse[]> {
    return this.http
      .get<TeacherRoomResponse[]>(`${BASE}/classes`)
      .pipe(catchError(() => of([])));
  }

  getStudentsByClass(roomId: string): Observable<TeacherStudentResponse[]> {
    return this.http
      .get<TeacherStudentResponse[]>(`${BASE}/classes/${roomId}/students`)
      .pipe(catchError(() => of([])));
  }

  getMyCourses(): Observable<CourseResponse[]> {
    return this.http
      .get<CourseResponse[]>(`${BASE}/courses`)
      .pipe(catchError(() => of([])));
  }

  getMyScheduleSlots(): Observable<ScheduleSlotResponse[]> {
    return this.http
      .get<ScheduleSlotResponse[]>(`${BASE}/schedule-slots`)
      .pipe(catchError(() => of([])));
  }

  markAbsence(request: StudentAbsenceRequest): Observable<StudentAbsenceResponse | null> {
    return this.http
      .post<StudentAbsenceResponse>(`${BASE}/absences`, request)
      .pipe(catchError(() => of(null)));
  }

  getAbsencesByClass(roomId: string): Observable<StudentAbsenceResponse[]> {
    const params = new HttpParams().set('roomId', roomId);
    return this.http
      .get<StudentAbsenceResponse[]>(`${BASE}/absences`, { params })
      .pipe(catchError(() => of([])));
  }

  addGrade(request: StudentGradeRequest): Observable<StudentGradeResponse | null> {
    return this.http
      .post<StudentGradeResponse>(`${BASE}/grades`, request)
      .pipe(catchError(() => of(null)));
  }

  getGradesByCourse(courseId: string): Observable<StudentGradeResponse[]> {
    const params = new HttpParams().set('courseId', courseId);
    return this.http
      .get<StudentGradeResponse[]>(`${BASE}/grades`, { params })
      .pipe(catchError(() => of([])));
  }
}
