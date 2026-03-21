import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Student } from '@features/models/student/student.model';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly baseUrl = '/students';

  constructor(private http: HttpClient) { }

  getList(): Observable<Student[]> {
    return this.http.get<Student[]>(this.baseUrl).pipe(
      catchError(() => of([]))
    );
  }

  getById(id: string | number): Observable<Student | null> {
    return this.http.get<Student>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  create(body: Partial<Student> & { password?: string }): Observable<Student | null> {
    return this.http.post<Student>(this.baseUrl, body).pipe(
      catchError(() => of(null))
    );
  }

  update(id: string | number, body: Partial<Student>): Observable<Student | null> {
    return this.http.put<Student>(`${this.baseUrl}/${id}`, body).pipe(
      catchError(() => of(null))
    );
  }

  delete(id: string | number): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
