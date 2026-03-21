import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface DashboardStats {
  total_students?: number;
  total_male_students?: number;
  total_female_students?: number;
  total_teachers?: number;
  total_male_teachers?: number;
  total_female_teachers?: number;
  total_classes?: number;
  total_classes_male?: number;
  total_classes_female?: number;
  male_students_by_age?: { key: string; label: string; count: number; percent: number }[];
  female_students_by_age?: { key: string; label: string; count: number; percent: number }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = '/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats | null> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`).pipe(
      catchError(() => of(null))
    );
  }
}
