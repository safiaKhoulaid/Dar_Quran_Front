
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@features/services/authService/auth-service';

export const roleGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const tokenRole = authService.getRoleFromToken() ?? '';

  let storageRole = '';
  try {
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      const parsed = JSON.parse(raw) as { role?: unknown };
      storageRole = typeof parsed?.role === 'string' ? parsed.role : '';
    }
  } catch {
    storageRole = '';
  }

  const normalisedStorageRole = storageRole.replace(/^ROLE_/i, '').toUpperCase();
  const userRole = (tokenRole || normalisedStorageRole).replace(/^ROLE_/i, '').toUpperCase();

  console.log('[RoleGuard] token role:', tokenRole, '| storage role:', normalisedStorageRole, '| using:', userRole);

  const expectedRoles = route.data['roles'] as string[];
  console.log('[RoleGuard] Expected:', expectedRoles);

  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  // Ila ma-3ndoch l-haq, n-siftohl-page "Unauthorized" awla "Login"
  return router.parseUrl('/unauthorized');
};
