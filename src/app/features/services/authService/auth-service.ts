import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginResponse } from '@features/models/auth/login/login-response';
import { LoginRequest } from '@features/models/auth/login/login-request';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<LoginResponse | null>(this.getUserFromStorage());

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>("/auth/login", credentials)
      .pipe(tap(response => {
        this.saveUserToStorage(response);
        this.currentUser.set(response);
      }));
  }

  register(userData: any): Observable<any> {
    return this.http.post("/auth/register", userData);
  }

  /*======================LOGOUT==============================*/
  logout() {
    this.http.post("/auth/logout", {}).subscribe({
      next: () => this.clearSession(),
      error: (err) => {
        console.error('Logout failed on backend', err);
        this.clearSession();
      }
    });
  }
  /*===========================================================*/

  /*======================CLEAR SESSION==============================*/
  private clearSession() {
    localStorage.removeItem('auth_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /*===========================================================*/


  get accessToken(): string | undefined {
    return this.currentUser()?.token;
  }

  get refreshTokenValue(): string | undefined {
    const user = this.currentUser();
    return user?.refreshToken ?? user?.refresh_token;
  }

  /**
   * Vérifie si le token d'accès expire dans moins de X minutes (ou est déjà expiré).
   * Permet un refresh proactif sans que l'utilisateur ne subisse de 401.
   */
  isAccessTokenExpiringSoon(thresholdMinutes: number = 2): boolean {
    const token = this.accessToken;
    if (!token) return true;
    const exp = this.getTokenExpiration(token);
    if (!exp) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return exp <= nowSec + thresholdMinutes * 60;
  }

  /**
   * Décode le JWT et retourne la date d'expiration (claim exp) en secondes, ou null.
   */
  private getTokenExpiration(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded && typeof decoded['exp'] === 'number' ? decoded['exp'] : null;
    } catch {
      return null;
    }
  }

  /**
   * Décode le JWT et retourne le payload en tant qu'objet, ou null.
   */
  private decodeToken(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = payload.length % 4;
      if (pad) payload += '='.repeat(4 - pad);
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  /**
   * Retourne le rôle de l'utilisateur depuis le token JWT.
   * Vérifie les claims 'role', 'roles', et 'authorities'.
   */
  getRoleFromToken(): string | null {
    const token = this.accessToken;
    if (!token) return null;
    const decoded = this.decodeToken(token);
    if (!decoded) return null;

    // Essaie différents champs selon le backend
    const role = decoded['role'] ?? decoded['roles'] ?? decoded['authorities'];

    if (Array.isArray(role)) {
      const first = role[0];
      if (typeof first === 'string') return first.replace(/^ROLE_/i, '').toUpperCase();
      if (typeof first === 'object' && first !== null) return String((first as Record<string, unknown>)['authority'] ?? '').replace(/^ROLE_/i, '').toUpperCase();
    }
    if (typeof role === 'string') return role.replace(/^ROLE_/i, '').toUpperCase();
    return null;
  }

  refreshToken() {
    return this.http.post<LoginResponse>('/auth/refresh-token', {}).pipe(
      tap((response) => {
        this.saveUserToStorage(response);
        this.currentUser.set(response);
      })
    );
  }

  forgotPassword(email: string): Observable<string> {
    return this.http.post('/auth/forgot-password', { contact: email }, { responseType: 'text' });
  }

  resetPassword(request: any): Observable<string> {
    return this.http.post('/auth/reset-password', request, { responseType: 'text' });
  }

  private saveUserToStorage(user: LoginResponse) {
    // Normalise pour toujours garder refreshToken (camelCase) côté front
    const normalised: LoginResponse = {
      ...user,
      refreshToken: user.refreshToken ?? user.refresh_token,
    };
    localStorage.setItem('auth_user', JSON.stringify(normalised));
  }

  private getUserFromStorage(): LoginResponse | null {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  }



}
