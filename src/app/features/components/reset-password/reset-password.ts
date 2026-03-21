import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '@features/services/authService/auth-service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    return password && confirmPassword && password.value !== confirmPassword.value
        ? { mismatch: true }
        : null;
};

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [ReactiveFormsModule, RouterModule],
    templateUrl: './reset-password.html',
    styleUrl: './reset-password.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    isLoading = signal(false);
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);
    email = signal<string>('');

    constructor() {
        this.route.queryParams.subscribe(params => {
            this.email.set(params['email'] || '');
        });
    }

    resetForm = this.fb.nonNullable.group({
        otp: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    get otp() { return this.resetForm.controls.otp; }
    get newPassword() { return this.resetForm.controls.newPassword; }
    get confirmPassword() { return this.resetForm.controls.confirmPassword; }

    onSubmit() {
        if (this.resetForm.invalid) return;

        this.isLoading.set(true);
        this.successMessage.set(null);
        this.errorMessage.set(null);

        const { otp, newPassword } = this.resetForm.getRawValue();
        const contact = this.email(); // même email/contact que lors de forgot-password
        const request = { contact, otp, newPassword };

        this.authService.resetPassword(request).subscribe({
            next: () => {
                this.successMessage.set('تمت إعادة تعيين كلمة المرور بنجاح!');
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 2000);
            },
            error: (err) => {
                console.error(err);
                if (err.status === 200) {
                    this.successMessage.set('تمت إعادة تعيين كلمة المرور بنجاح!');
                    setTimeout(() => {
                        this.router.navigate(['/login']);
                    }, 2000);
                    return;
                }
                let rawError = err?.error;
                let msg = "";

                // Si c'est une chaîne (possible avec responseType: 'text'), on essaie de parser le JSON
                if (typeof rawError === 'string' && rawError.includes('{')) {
                    try {
                        const parsed = JSON.parse(rawError);
                        msg = parsed.message || rawError;
                    } catch (e) {
                        msg = rawError;
                    }
                } else {
                    msg = rawError?.message || rawError || "";
                }

                // Détection robuste de l'expiration/invalidité de l'OTP
                const isOtpError = msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expir');

                if (isOtpError || err.status === 500 || err.status === 400) {
                    msg = "الرمز غير صحيح أو منتهي الصلاحية. يرجى المحاولة مرة أخرى أو طلب رمز جديد.";
                } else if (err.status === 0) {
                    msg = "فشل الاتصال بالخادم. يرجى التحقق من الإنترنت.";
                } else if (!msg || typeof msg !== 'string' || msg.includes('{')) {
                    msg = "فشل في إعادة التعيين. تحقق من رمز التحقق.";
                }

                this.errorMessage.set(msg);
                this.isLoading.set(false);
            }
        });
    }
}
