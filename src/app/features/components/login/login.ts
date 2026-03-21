import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@features/services/authService/auth-service';
import { Router, RouterModule } from '@angular/router';
import { LoginResponse } from '@features/models/auth/login/login-response';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response: LoginResponse) => {
        this.successMessage.set('Connexion réussie! Redirection...');

        setTimeout(() => {
          const role = response.role;

          if (role === 'SUPER_ADMIN') {
            this.router.navigate(['/dashboard-super-admin']);
          } else if (role === 'ADMIN_SECTION') {
            this.router.navigate(['/dashboard-admin']);
          } else if (role === 'ENSEIGNANT') {
            this.router.navigate(['/dashboard-teacher']);
          } else if (role === 'ELEVE' || role === 'STUDENT' || role === 'PARENT') {
            this.router.navigate(['/dashboard-student']);
          } else if (role === 'ADMIN') {
            this.router.navigate(['/user-home']);
          } else {
            this.router.navigate(['/']);
          }
        }, 300);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Email ou mot de passe incorrect.');
        this.isLoading.set(false);
      }
    });
  }
}
