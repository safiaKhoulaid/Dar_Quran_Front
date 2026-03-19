import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@features/services/authService/auth-service';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, of } from 'rxjs';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

const REFRESH_THRESHOLD_MINUTES = 2;

function addToken(request: HttpRequest<unknown>, token: string) {
    return request.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });
}

function handleRequestWithValidToken(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    authService: AuthService
) {
    const isRefreshCall = req.url.includes('auth/refresh-token');
    const isLoginCall = req.url.includes('auth/login');

    if (isRefreshCall) {
        const token = authService.refreshTokenValue;
        return next(token ? addToken(req, token) : req);
    }
    if (isLoginCall) {
        return next(req);
    }

    const accessToken = authService.accessToken;
    if (!accessToken) {
        return next(req);
    }

    // Refresh proactif : si le token expire dans moins de 2 min, on refresh avant d'envoyer la requête
    if (authService.isAccessTokenExpiringSoon(REFRESH_THRESHOLD_MINUTES)) {
        if (isRefreshing) {
            return refreshTokenSubject.pipe(
                filter((t): t is string => t != null),
                take(1),
                switchMap((newToken) => next(addToken(req, newToken)))
            );
        }
        isRefreshing = true;
        refreshTokenSubject.next(null);
        return authService.refreshToken().pipe(
            switchMap((res) => {
                isRefreshing = false;
                refreshTokenSubject.next(res.token);
                return next(addToken(req, res.token));
            }),
            catchError((err) => {
                isRefreshing = false;
                authService.logout();
                return throwError(() => err);
            })
        );
    }

    return next(addToken(req, accessToken));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    return of(null).pipe(
        switchMap(() => handleRequestWithValidToken(req, next, authService)),
        catchError((error: HttpErrorResponse) => {
            // Fallback réactif : si on reçoit 401 (token expiré côté serveur), refresh puis retry
            if (
                error.status === 401 &&
                !req.url.includes('auth/refresh-token') &&
                !req.url.includes('auth/login')
            ) {
                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshTokenSubject.next(null);

                    return authService.refreshToken().pipe(
                        switchMap((tokenResponse) => {
                            isRefreshing = false;
                            refreshTokenSubject.next(tokenResponse.token);
                            return next(addToken(req, tokenResponse.token));
                        }),
                        catchError((err) => {
                            isRefreshing = false;
                            authService.logout();
                            return throwError(() => err);
                        })
                    );
                }
                return refreshTokenSubject.pipe(
                    filter((t): t is string => t != null),
                    take(1),
                    switchMap((jwt) => next(addToken(req, jwt)))
                );
            }
            return throwError(() => error);
        })
    );
};
