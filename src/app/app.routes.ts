import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/components/home/home').then((m) => m.HomeComponent),
      },
      {
        path: 'live',
        loadComponent: () =>
          import('./features/components/live-stream-watch/live-stream-watch.component').then(
            (m) => m.LiveStreamWatchComponent
          ),
      },
      {
        path: 'live/admin',
        loadComponent: () =>
          import('./features/components/live-admin/live-admin.component').then(
            (m) => m.LiveAdminComponent
          ),
        canActivate: [authGuard, roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'ADMIN_SECTION', 'ENSEIGNANT'],
        },
      },
      {
        path: 'live/broadcast/:id',
        loadComponent: () =>
          import('./features/components/live-broadcast/live-broadcast.component').then(
            (m) => m.LiveBroadcastComponent
          ),
      },
      {
        path: 'live/:id',
        loadComponent: () =>
          import('./features/components/live-stream-watch/live-stream-watch.component').then(
            (m) => m.LiveStreamWatchComponent
          ),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/components/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/components/signup/signup').then((m) => m.SignupComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/components/forgot-password/forgot-password').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/components/reset-password/reset-password').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/components/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  {
    path: 'courses',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/components/courses/courses').then((m) => m.CoursesComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/components/create-course/create-course').then(
            (m) => m.CreateCourseComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/components/course-detail/course-detail').then(
            (m) => m.CourseDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'dashboard-super-admin',
    loadComponent: () => import('./features/dashboard-super-admin/dashboard-super-admin').then(m => m.dashboardSuperAdmin),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['SUPER_ADMIN'],
    },
  },
  {
    path: 'dashboard-admin',
    loadComponent: () => import('./features/dashboard-admin/dashboard-admin.component').then(m => m.DashboardAdminComponent),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN_SECTION'],
    },
  },
  {
    path: 'dashboard-teacher',
    loadComponent: () =>
      import('./features/dashboard-teacher/dashboard-teacher').then((m) => m.DashboardTeacherComponent),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ENSEIGNANT'],
    },
  },
  {
    path: 'dashboard-student',
    loadComponent: () =>
      import('./features/dashboard-student/dashboard-student').then(
        (m) => m.DashboardStudentComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ELEVE'],
    },
  },
];
