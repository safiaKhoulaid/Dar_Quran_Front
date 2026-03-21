import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@features/services/authService/auth-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  currentUser = this.authService.currentUser;
  isMenuOpen = false;

  navigateToDashboard(): void {
    // Primary: read role directly from JWT payload (most reliable)
    // Fallback: read from localStorage via currentUser signal
    const jwtRole = this.authService.getRoleFromToken();
    const storedRaw = this.currentUser()?.role ?? '';
    const storedRole = storedRaw.replace(/^ROLE_/i, '').toUpperCase();
    const role = jwtRole ?? storedRole;

    console.log('[Header] JWT role:', jwtRole, '| stored role:', storedRole, '| using:', role);

    switch (role) {
      case 'SUPER_ADMIN':
        this.router.navigate(['/dashboard-super-admin']);
        break;
      case 'ADMIN_SECTION':
        this.router.navigate(['/dashboard-admin']);
        break;
      case 'ENSEIGNANT':
        this.router.navigate(['/dashboard-teacher']);
        break;
      case 'ELEVE':
      case 'STUDENT':
      case 'PARENT':
        this.router.navigate(['/dashboard-student']);
        break;
      default:
        console.warn('[Header] Unknown role:', role, '— redirecting to home');
        this.router.navigate(['/']);
    }
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  navItems = [
    { label: 'الرئيسية', link: '/' },
    { label: 'البث المباشر', link: '/live' },
    { label: 'إدارة البث', link: '/live/admin' },
    { label: 'الدورات', link: '/courses' },
    { label: 'المعلمون', link: '/tutors' },
    { label: 'إضافة دورة', link: '/courses/create' },
    { label: 'من نحن', link: '/about' },
    { label: 'اتصل بنا', link: '/contact' }
  ];
}
