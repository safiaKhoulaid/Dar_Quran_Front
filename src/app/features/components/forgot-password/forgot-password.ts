import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@features/services/authService/auth-service';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [ReactiveFormsModule, RouterModule],
    templateUrl: './forgot-password.html',
    styleUrl: './forgot-password.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    isLoading = signal(false);
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);

    forgotForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]]
    });

    get email() {
        return this.forgotForm.controls.email;
    }

    onSubmit() {
        if (this.forgotForm.invalid) return;

        this.isLoading.set(true);
        this.successMessage.set(null);
        this.errorMessage.set(null);

        const email = this.forgotForm.getRawValue().email;

        this.authService.forgotPassword(email).subscribe({
            next: () => {
                this.successMessage.set('تم إرسال الرمز! تحقق من بريدك الإلكتروني.');
                this.isLoading.set(false);
                setTimeout(() => {
                    this.router.navigate(['/reset-password'], { queryParams: { email } });
                }, 2000);
            },
            error: (err) => {
                console.error(err);
                // Si l'erreur est un parsing JSON (status 200), on traite comme succès
                if (err.status === 200) {
                    this.successMessage.set('تم إرسال الرمز! تحقق من بريدك الإلكتروني.');
                    this.isLoading.set(false);
                    setTimeout(() => {
                        this.router.navigate(['/reset-password'], { queryParams: { email } });
                    }, 2000);
                    return;
                }
                let rawError = err?.error;
                let msg = "";

                // Parsing du JSON pour extraire le message (car responseType: 'text')
                if (typeof rawError === 'string' && rawError.includes('{')) {
                    try {
                        const parsed = JSON.parse(rawError);
                        msg = parsed.message || rawError;
                    } catch (e) {
                        msg = rawError;
                    }
                } else {
                    msg = rawError?.message || rawError || "بريد إلكتروني غير موجود أو فشل في الإرسال.";
                }

                this.errorMessage.set(msg);
                this.isLoading.set(false);
            }
        });
    }
}
