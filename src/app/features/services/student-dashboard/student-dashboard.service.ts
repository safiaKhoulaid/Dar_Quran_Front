import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { StudentDashboardSummary } from '@features/models/student/dashboard-summary.model';
import { StudentResponse, StudentRequest } from '@features/models/student/student-response.model';
import { StudentGradeResponse } from '@features/models/student/grade.model';
import { StudentAbsenceResponse } from '@features/models/student/absence.model';
import { EnrollmentResponse } from '@features/models/student/enrollment.model';
import { ScheduleSlotResponse, RoomResponse } from '@features/models/student/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class StudentDashboardService {
  private http = inject(HttpClient);
  /** Préfixé par `environment.apiUrl` (déjà …/api) → correspond à `/api/student` côté Spring. */
  private readonly baseUrl = '/student';

  /**
   * Get complete dashboard summary with all data and statistics
   */
  getDashboard(): Observable<StudentDashboardSummary | null> {
    return this.http.get<StudentDashboardSummary>(`${this.baseUrl}/dashboard`).pipe(
      catchError((error) => {
        console.error('Error fetching dashboard:', error);
        return of(null);
      })
    );
  }

  /**
   * Get student profile information
   */
  getProfile(): Observable<StudentResponse | null> {
    return this.http.get<StudentResponse>(`${this.baseUrl}/profile`).pipe(
      catchError((error) => {
        console.error('Error fetching profile:', error);
        return of(null);
      })
    );
  }

  /**
   * Update student profile information
   */
  updateProfile(profileData: StudentRequest): Observable<StudentResponse | null> {
    return this.http.put<StudentResponse>(`${this.baseUrl}/profile`, profileData).pipe(
      catchError((error) => {
        console.error('Error updating profile:', error);
        return of(null);
      })
    );
  }

  /**
   * Get student grades
   */
  getGrades(): Observable<StudentGradeResponse[]> {
    return this.http.get<StudentGradeResponse[]>(`${this.baseUrl}/grades`).pipe(
      catchError((error) => {
        console.error('Error fetching grades:', error);
        return of([]);
      })
    );
  }

  /**
   * Get student absences
   */
  getAbsences(): Observable<StudentAbsenceResponse[]> {
    return this.http.get<StudentAbsenceResponse[]>(`${this.baseUrl}/absences`).pipe(
      catchError((error) => {
        console.error('Error fetching absences:', error);
        return of([]);
      })
    );
  }

  /**
   * Get student course enrollments
   */
  getEnrollments(): Observable<EnrollmentResponse[]> {
    return this.http.get<EnrollmentResponse[]>(`${this.baseUrl}/enrollments`).pipe(
      catchError((error) => {
        console.error('Error fetching enrollments:', error);
        return of([]);
      })
    );
  }

  /**
   * Get student schedule
   */
  getSchedule(): Observable<ScheduleSlotResponse[]> {
    return this.http.get<ScheduleSlotResponse[]>(`${this.baseUrl}/schedule`).pipe(
      catchError((error) => {
        console.error('Error fetching schedule:', error);
        return of([]);
      })
    );
  }

  /**
   * Get student rooms
   */
  getRooms(): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(`${this.baseUrl}/room`).pipe(
      catchError((error) => {
        console.error('Error fetching rooms:', error);
        return of([]);
      })
    );
  }
}