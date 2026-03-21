import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Teacher, TeacherCreateRequest, TeacherUpdateRequest } from '@features/models/teacher/teacher.model';
import { Section } from '@core/enums/section.enum';
import { User } from '@core/models/users/user.module';
import { UserCreateRequest } from '@core/models/users/userCreateRequest.module';

/** Enseignant minimal pour liste / affectation (réponse backend: id, nom, prenom) */
export interface TeacherOption {
  id: string;
  nom: string;
  prenom: string;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherService {

  private readonly baseUrl = '/teachers';

  constructor(private http: HttpClient) { }

  getList(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl).pipe(
      catchError(() => of([]))
    );
  }

  /** Liste des enseignants filtrés par section (pour affectation à une classe). */
  getListBySection(section: Section): Observable<TeacherOption[]> {
    const sectionParam = typeof section === 'string' ? section : (Section[section] ?? 'HOMME');
    const params = { section: sectionParam };
    return this.http.get<{ id: string; nom: string; prenom: string }[]>(this.baseUrl, { params }).pipe(
      map(list => (list || []).map(t => ({
        id: t.id,
        nom: t.nom ?? '',
        prenom: t.prenom ?? '',
        displayName: [t.prenom, t.nom].filter(Boolean).join(' ') || t.id
      }))),
      catchError(() => of([]))
    );
  }

  getById(id: string | number): Observable<Teacher | null> {
    return this.http.get<Teacher>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  create(body: UserCreateRequest): Observable<User | null> {
    return this.http.post<User>(this.baseUrl, body).pipe(
      catchError(() => of(null))
    );
  }

  update(id: string | number, body: TeacherUpdateRequest): Observable<User | null> {
    const payload: any = {
      ...body,
      section: body.gender
        ? body.gender === 'HOMME'
          ? Section.HOMME
          : Section.FEMME
        : undefined,
    };
    return this.http.put<User>(`${this.baseUrl}/${id}`, payload).pipe(
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
