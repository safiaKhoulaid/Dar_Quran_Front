import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@features/services/authService/auth-service';

/**
 * Garde pour protéger les routes nécessitant une authentification.
 * Redirige vers /login si l'utilisateur n'est pas connecté.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.currentUser()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
