import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@features/services/authService/auth-service';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [ReactiveFormsModule, RouterModule],
    templateUrl: './signup.html',
    styleUrl: './signup.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    isLoading = signal(false);
    showPassword = signal(false);
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);

    signupForm = this.fb.nonNullable.group({
        firstname: ['', [Validators.required]],
        lastname: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
    }, {
        validators: (group) => {
            const pass = group.get('password')?.value;
            const confirm = group.get('confirmPassword')?.value;
            return pass === confirm ? null : { mismatch: true };
        }
    });

    togglePasswordVisibility() {
        this.showPassword.update(value => !value);
    }

    get f() { return this.signupForm.controls; }

    onSubmit() {
        if (this.signupForm.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        // Assuming AuthService will have a register method or we'll add one
        // For now, let's mock the call or add it to AuthService
        const payload = {
            prenom: this.signupForm.value.firstname || '',
            nom: this.signupForm.value.lastname || '',
            email: this.signupForm.value.email || '',
            password: this.signupForm.value.password || ''
        };

        // If authService doesn't have register, this will fail.
        // I'll add a minimal register to AuthService in the next tool call.
        this.authService.register(payload).subscribe({
            next: () => {
                this.successMessage.set('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
                setTimeout(() => this.router.navigate(['/login']), 2000);
            },
            error: (err: any) => {
                console.error(err);
                this.errorMessage.set('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
                this.isLoading.set(false);
            }
        });
    }
}
