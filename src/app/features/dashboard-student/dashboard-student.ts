import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@features/services/authService/auth-service';
import { DatePipe } from '@angular/common';

export interface Notification {
    id: number;
    type: 'info' | 'success' | 'warning' | 'danger';
    title: string;
    message: string;
    date: Date;
    read: boolean;
}

export interface Absence {
    id: number;
    subject: string;
    date: Date;
    justified: boolean;
    reason?: string;
}

export interface Grade {
    subject: string;
    icon: string;
    coefficient: number;
    grades: { label: string; value: number; outOf: number }[];
}

@Component({
    selector: 'app-dashboard-student',
    imports: [ReactiveFormsModule, DatePipe],
    templateUrl: './dashboard-student.html',
    styleUrl: './dashboard-student.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardStudentComponent {
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);

    currentUser = this.authService.currentUser;
    activeTab = signal<'profile' | 'notifications' | 'absences' | 'grades'>('profile');
    isSidebarOpen = signal(false);
    isEditingProfile = signal(false);
    profileSaved = signal(false);

    profileForm = this.fb.nonNullable.group({
        prenom: [this.currentUser()?.prenom || '', Validators.required],
        nom: [this.currentUser()?.nom || '', Validators.required],
        email: [this.currentUser()?.email || '', [Validators.required, Validators.email]],
        telephone: [this.currentUser()?.telephone || ''],
        adresse: [this.currentUser()?.adresse || ''],
    });

    // ── Notifications ──
    notifications = signal<Notification[]>([
        {
            id: 1,
            type: 'info',
            title: 'حصة جديدة مضافة',
            message: 'تمت إضافة حصة تجويد القرآن يوم الإثنين الساعة 9:00',
            date: new Date('2026-03-17T09:00:00'),
            read: false,
        },
        {
            id: 2,
            type: 'warning',
            title: 'تذكير بالدرس',
            message: 'موعد درس التفسير غداً الساعة 14:00 — لا تتأخر!',
            date: new Date('2026-03-16T14:00:00'),
            read: false,
        },
        {
            id: 3,
            type: 'success',
            title: 'نتيجة الامتحان',
            message: 'حصلت على 18/20 في امتحان حفظ سورة البقرة. أحسنت!',
            date: new Date('2026-03-15T10:00:00'),
            read: true,
        },
        {
            id: 4,
            type: 'danger',
            title: 'غياب غير مبرر',
            message: 'سُجِّل غيابك في حصة التجويد يوم الأحد دون مبرر.',
            date: new Date('2026-03-13T08:00:00'),
            read: true,
        },
    ]);

    unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

    markAllRead() {
        this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    }

    markRead(id: number) {
        this.notifications.update((list) =>
            list.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }

    // ── Absences ──
    absences = signal<Absence[]>([
        { id: 1, subject: 'تجويد القرآن', date: new Date('2026-03-13'), justified: false },
        { id: 2, subject: 'التفسير', date: new Date('2026-03-06'), justified: true, reason: 'مرض' },
        { id: 3, subject: 'الفقه', date: new Date('2026-02-27'), justified: true, reason: 'سفر عائلي' },
        { id: 4, subject: 'السيرة النبوية', date: new Date('2026-02-20'), justified: false },
        { id: 5, subject: 'النحو والصرف', date: new Date('2026-02-13'), justified: true, reason: 'عذر شخصي' },
    ]);

    totalAbsences = computed(() => this.absences().length);
    justifiedAbsences = computed(() => this.absences().filter((a) => a.justified).length);
    unjustifiedAbsences = computed(() => this.absences().filter((a) => !a.justified).length);

    // ── Grades ──
    grades = signal<Grade[]>([
        {
            subject: 'تجويد القرآن',
            icon: '📖',
            coefficient: 4,
            grades: [
                { label: 'الاختبار الأول', value: 17, outOf: 20 },
                { label: 'الاختبار الثاني', value: 19, outOf: 20 },
                { label: 'الحضور', value: 9, outOf: 10 },
            ],
        },
        {
            subject: 'التفسير',
            icon: '✨',
            coefficient: 3,
            grades: [
                { label: 'الاختبار الأول', value: 14, outOf: 20 },
                { label: 'الاختبار الثاني', value: 16, outOf: 20 },
                { label: 'المشاركة', value: 8, outOf: 10 },
            ],
        },
        {
            subject: 'الفقه الإسلامي',
            icon: '⚖️',
            coefficient: 3,
            grades: [
                { label: 'الاختبار الأول', value: 15, outOf: 20 },
                { label: 'الاختبار الثاني', value: 18, outOf: 20 },
                { label: 'البحث', value: 9, outOf: 10 },
            ],
        },
        {
            subject: 'السيرة النبوية',
            icon: '🌙',
            coefficient: 2,
            grades: [
                { label: 'الاختبار الأول', value: 18, outOf: 20 },
                { label: 'الاختبار الثاني', value: 20, outOf: 20 },
                { label: 'الحضور', value: 10, outOf: 10 },
            ],
        },
        {
            subject: 'النحو والصرف',
            icon: '📝',
            coefficient: 2,
            grades: [
                { label: 'الاختبار الأول', value: 13, outOf: 20 },
                { label: 'الاختبار الثاني', value: 15, outOf: 20 },
                { label: 'التطبيق', value: 7, outOf: 10 },
            ],
        },
    ]);

    getSubjectAverage(grade: Grade): number {
        const total = grade.grades.reduce((s, g) => s + (g.value / g.outOf) * 20, 0);
        return Math.round((total / grade.grades.length) * 10) / 10;
    }

    getOverallAverage(): number {
        const grades = this.grades();
        const totalWeight = grades.reduce((s, g) => s + g.coefficient, 0);
        const weightedSum = grades.reduce(
            (s, g) => s + this.getSubjectAverage(g) * g.coefficient,
            0
        );
        return Math.round((weightedSum / totalWeight) * 10) / 10;
    }

    getGradeColor(avg: number): string {
        if (avg >= 16) return 'grade-excellent';
        if (avg >= 13) return 'grade-good';
        if (avg >= 10) return 'grade-pass';
        return 'grade-fail';
    }

    getProgressWidth(value: number, outOf: number): string {
        return `${(value / outOf) * 100}%`;
    }

    // ── Profile ──
    startEdit() {
        this.isEditingProfile.set(true);
        this.profileSaved.set(false);
    }

    cancelEdit() {
        this.isEditingProfile.set(false);
        this.profileForm.patchValue({
            prenom: this.currentUser()?.prenom || '',
            nom: this.currentUser()?.nom || '',
            email: this.currentUser()?.email || '',
        });
    }

    saveProfile() {
        if (this.profileForm.invalid) return;
        // In a real app, you'd call an API here
        this.isEditingProfile.set(false);
        this.profileSaved.set(true);
        setTimeout(() => this.profileSaved.set(false), 3000);
    }

    getInitials(): string {
        const first = this.currentUser()?.prenom?.[0] || '';
        const last = this.currentUser()?.nom?.[0] || '';
        return (first + last).toUpperCase() || 'ط';
    }

    selectTab(tab: 'profile' | 'notifications' | 'absences' | 'grades') {
        this.activeTab.set(tab);
        this.isSidebarOpen.set(false);
    }

    toggleSidebar() {
        this.isSidebarOpen.update(v => !v);
    }
}
