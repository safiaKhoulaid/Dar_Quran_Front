import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Admin, AdminCreateRequest, AdminUpdateRequest } from '@core/models/users/admin.model';
import { UserResponse } from '@core/models/users/userResponse.module';
import { UserCreateRequest } from '@core/models/users/userCreateRequest.module';
import { Role } from '@core/enums/role.enum';
import { Section } from '@core/enums/section.enum';
import { UserUpdateRequest } from '@core/types/userUpdateRequest.type';

interface LaravelListResponse {
  data?: Admin[];
}

interface LaravelItemResponse {
  data?: Admin | UserResponse;
}

export interface AdminApiResult {
  success: boolean;
  data?: Admin;
  message?: string;
  errors?: Record<string, string[]>;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = '/admins';

  constructor(private http: HttpClient) { }

  private unwrapList(res: Admin[] | LaravelListResponse): Admin[] {
    if (Array.isArray(res)) return res;
    return res?.data ?? [];
  }

  /** Convertit un UserResponse (backend) en Admin (modèle dashboard) */
  private mapUserToAdmin(user: UserResponse): Admin {
    return {
      id: Number(user.id),
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone ?? undefined,
      gender: user.section === Section.FEMME ? 'FEMME' : 'HOMME',
      dateNaissance: user.dateNaissance ?? undefined,
      createdAt: user.createdAt,
      role: user.role as unknown as string,
    };
  }

  /** Accepte soit un Admin, soit un UserResponse, soit une enveloppe { data: ... } et renvoie un Admin */
  private unwrapItem(
    res: Admin | UserResponse | LaravelItemResponse | null | undefined,
  ): Admin | null {
    if (!res) return null;

    // Réponse Laravel: { data: ... }
    if ((res as LaravelItemResponse).data) {
      return this.unwrapItem((res as LaravelItemResponse).data);
    }

    const anyRes = res as any;

    // Si le backend renvoie déjà un Admin
    if ('nom' in anyRes && 'prenom' in anyRes) {
      return anyRes as Admin;
    }

    // Sinon on suppose un UserResponse
    return this.mapUserToAdmin(anyRes as UserResponse);
  }

  getList(): Observable<Admin[]> {
    return this.http.get<Admin[] | LaravelListResponse>(this.baseUrl).pipe(
      map((res) => this.unwrapList(res)),
      catchError(() => of([])),
    );
  }

  getById(id: string | number): Observable<Admin | null> {
    return this.http.get<Admin | UserResponse | LaravelItemResponse>(`${this.baseUrl}/${id}`).pipe(
      map((res) => this.unwrapItem(res)),
      catchError(() => of(null)),
    );
  }

  /*==================== CREATE ADMIN ==========================*/

  create(body: UserCreateRequest): Observable<UserResponse> {
    const payload = {
      nom: body.nom,
      prenom: body.prenom,
      email: body.email,
      telephone: body.telephone ?? undefined,
      section: body.section ?? Section.HOMME,
      role: body.role ?? Role.ADMIN_SECTION,
      dateNaissance: body.dateNaissance,
      password: body.password,
    };

    return this.http.post<UserResponse>(this.baseUrl, payload);
  }

  /*==================== CREATE ADMIN WITH USER ==========================*/

  // create(body: AdminCreateRequest): Observable<AdminApiResult> {
  //   const userRequest: UserCreateRequest = {
  //     user: {
  //       id: '',
  //       nom: body.lastname,
  //       prenom: body.firstname,
  //       email: body.email,
  //       telephone: body.phone ?? undefined,
  //       photoUrl: null as any,
  //       dateNaissance: body.birth_date ?? undefined,
  //       role: (body.role as any) ?? (null as any),
  //       section: null as any,
  //       createdAt: '',
  //     },
  //     password: body.password,
  //     passwordConfirmation: body.password_confirmation ?? body.password,
  //   };

  //   return this.createWithUser(userRequest).pipe(
  //     map((res) => ({
  //       success: true,
  //       data: this.mapUserToAdmin(res),
  //     })),
  //     catchError((err: HttpErrorResponse) => this.handleError(err)),
  //   );
  // }


  /*====================== UPDATE ADMIN START ==========================*/

  update(body: UserUpdateRequest): Observable<UserResponse> {

    const payload: Record<string, unknown> = {
      nom: body.user?.nom,
      prenom: body.user?.prenom,
      email: body.user?.email,
      telephone: body.user?.telephone ?? undefined,
      dateNaissance: body.user?.dateNaissance,
    };

    if (body.password?.trim()) {
      payload['password'] = body.password;
      payload['password_confirmation'] = body.passwordConfirmation ?? body.password;
    }

    return this.http.put<UserResponse>(`${this.baseUrl}/${body.id}`, payload);
  }
  /*====================== UPDATE ADMIN END ==========================*/

  /*==================== DELETE ADMIN ==========================*/
  delete(id: string | number): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  private handleError(err: HttpErrorResponse): Observable<AdminApiResult> {
    const body = err.error;
    if (err.status === 422 && body?.errors && typeof body.errors === 'object') {
      return of({ success: false, errors: body.errors });
    }
    const message = body?.message ?? body?.error ?? err.message ?? 'خطأ في الاتصال بالخادم';
    return of({ success: false, message });
  }
}
