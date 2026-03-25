import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal,
    OnInit,
    DestroyRef,
    effect
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '@features/services/authService/auth-service';
import { StudentDashboardService } from '@features/services/student-dashboard/student-dashboard.service';
import { StudentDashboardSummary, StudentStatistics } from '@features/models/student/dashboard-summary.model';
import { StudentResponse, StudentRequest, Section } from '@features/models/student/student-response.model';
import { StudentGradeResponse } from '@features/models/student/grade.model';
import { StudentAbsenceResponse, AbsenceStatus } from '@features/models/student/absence.model';
import { EnrollmentResponse } from '@features/models/student/enrollment.model';
import { ScheduleSlotResponse, RoomResponse } from '@features/models/student/schedule.model';
import { DashboardNotificationsPanelComponent } from '@features/components/dashboard-notifications-panel/dashboard-notifications-panel';
import { UserNotificationStore } from '@features/services/user-notification/user-notification.store';

@Component({
    selector: 'app-dashboard-student',
    imports: [ReactiveFormsModule, DatePipe, CommonModule, DashboardNotificationsPanelComponent],
    templateUrl: './dashboard-student.html',
    styleUrl: './dashboard-student.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardStudentComponent implements OnInit {
    private authService = inject(AuthService);
    private dashboardService = inject(StudentDashboardService);
    private fb = inject(FormBuilder);
    private destroyRef = inject(DestroyRef);
    readonly notificationStore = inject(UserNotificationStore);

    // Signals for dashboard data
    dashboardData = signal<StudentDashboardSummary | null>(null);
    profile = computed(() => this.dashboardData()?.profile || null);
    grades = computed(() => this.dashboardData()?.grades || []);
    absences = computed(() => this.dashboardData()?.absences || []);
    enrollments = computed(() => this.dashboardData()?.enrollments || []);
    schedule = computed(() => this.dashboardData()?.schedule || []);
    rooms = computed(() => this.dashboardData()?.rooms || []);
    statistics = computed(() => this.dashboardData()?.statistics || null);

    // UI state signals
    activeTab = signal<'profile' | 'notifications' | 'absences' | 'grades' | 'enrollments' | 'schedule' | 'rooms'>('profile');
    isSidebarOpen = signal(false);
    isEditingProfile = signal(false);
    profileSaved = signal(false);
    isLoading = signal(false);
    error = signal<string | null>(null);

    // Form for profile editing
    profileForm = this.fb.nonNullable.group({
        nom: ['', Validators.required],
        prenom: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telephone: [''],
        section: [Section.HOMME as Section, Validators.required],
        dateNaissance: [''],
        photoUrl: [''],
        adresse: this.fb.nonNullable.group({
            rue: [''],
            ville: [''],
            codePostal: [''],
            pays: ['Maroc']
        })
    });

    unreadCount = computed(() => this.notificationStore.unreadCount());

    // Computed values for absences
    totalAbsences = computed(() => this.statistics()?.totalAbsences || 0);
    justifiedAbsences = computed(() => this.statistics()?.excusedAbsences || 0);
    unjustifiedAbsences = computed(() => this.statistics()?.unexcusedAbsences || 0);
    attendanceRate = computed(() => this.statistics()?.attendanceRate || 0);

    // Create effect to update form when profile data changes
    private updateFormEffect = effect(() => {
        const currentProfile = this.profile();
        if (currentProfile) {
            this.profileForm.patchValue({
                nom: currentProfile.nom,
                prenom: currentProfile.prenom,
                email: currentProfile.email,
                telephone: currentProfile.telephone || '',
                section: currentProfile.section,
                dateNaissance: currentProfile.dateNaissance || '',
                photoUrl: currentProfile.photoUrl || '',
                adresse: {
                    rue: currentProfile.adresse?.rue || '',
                    ville: currentProfile.adresse?.ville || '',
                    codePostal: currentProfile.adresse?.codePostal || '',
                    pays: currentProfile.adresse?.pays || 'Maroc'
                }
            });
        }
    });

    ngOnInit() {
        this.notificationStore.loadUnreadCount();
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.isLoading.set(true);
        this.error.set(null);

        this.dashboardService.getDashboard()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    if (data == null) {
                        this.error.set('Impossible de charger le tableau de bord (accès refusé ou erreur réseau).');
                        this.dashboardData.set(null);
                    } else {
                        this.dashboardData.set(data);
                    }
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error loading dashboard:', error);
                    this.error.set('Erreur lors du chargement des données');
                    this.isLoading.set(false);
                }
            });
    }

    // ── Profile Management ──
    startEdit() {
        this.isEditingProfile.set(true);
        this.profileSaved.set(false);
    }

    cancelEdit() {
        this.isEditingProfile.set(false);
        const currentProfile = this.profile();
        if (currentProfile) {
            this.profileForm.patchValue({
                nom: currentProfile.nom,
                prenom: currentProfile.prenom,
                email: currentProfile.email,
                telephone: currentProfile.telephone || '',
                section: currentProfile.section,
                dateNaissance: currentProfile.dateNaissance || '',
                photoUrl: currentProfile.photoUrl || '',
                adresse: {
                    rue: currentProfile.adresse?.rue || '',
                    ville: currentProfile.adresse?.ville || '',
                    codePostal: currentProfile.adresse?.codePostal || '',
                    pays: currentProfile.adresse?.pays || 'Maroc'
                }
            });
        }
    }

    saveProfile() {
        if (this.profileForm.invalid) return;

        this.isLoading.set(true);
        const formValue = this.profileForm.value;

        const profileData: StudentRequest = {
            nom: formValue.nom!,
            prenom: formValue.prenom!,
            email: formValue.email!,
            telephone: formValue.telephone || undefined,
            section: formValue.section as Section,
            dateNaissance: formValue.dateNaissance || undefined,
            photoUrl: formValue.photoUrl || undefined,
            adresse: formValue.adresse?.rue ? {
                rue: formValue.adresse.rue,
                ville: formValue.adresse.ville!,
                codePostal: formValue.adresse.codePostal!,
                pays: formValue.adresse.pays!
            } : undefined
        };

        this.dashboardService.updateProfile(profileData)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updatedProfile) => {
                    if (updatedProfile) {
                        // Update the profile in the dashboard data
                        const currentData = this.dashboardData();
                        if (currentData) {
                            this.dashboardData.set({
                                ...currentData,
                                profile: updatedProfile
                            });
                        }
                        this.isEditingProfile.set(false);
                        this.profileSaved.set(true);
                        setTimeout(() => this.profileSaved.set(false), 3000);
                    }
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error updating profile:', error);
                    this.error.set('Erreur lors de la mise à jour du profil');
                    this.isLoading.set(false);
                }
            });
    }

    // ── Grades ──
    getOverallAverage(): number {
        const stats = this.statistics();
        return stats?.averageGrade || 0;
    }

    getGradeColor(avg: number): string {
        if (avg >= 16) return 'grade-excellent';
        if (avg >= 13) return 'grade-good';
        if (avg >= 10) return 'grade-pass';
        return 'grade-fail';
    }

    // ── Schedule ──
    getDayName(dayOfWeek: number): string {
        const days = ['', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[dayOfWeek] || '';
    }

    formatTime(time: string | { hour?: number; minute?: number } | null | undefined): string {
        if (time == null) return '';
        if (typeof time === 'string') {
            return time.length >= 5 ? time.substring(0, 5) : time;
        }
        const h = time.hour ?? 0;
        const m = time.minute ?? 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // ── Helpers ──
    getInitials(): string {
        const currentProfile = this.profile();
        const first = currentProfile?.prenom?.[0] || '';
        const last = currentProfile?.nom?.[0] || '';
        return (first + last).toUpperCase() || 'ط';
    }

    selectTab(tab: 'profile' | 'notifications' | 'absences' | 'grades' | 'enrollments' | 'schedule' | 'rooms') {
        this.activeTab.set(tab);
        this.isSidebarOpen.set(false);
        if (tab === 'notifications') {
            this.notificationStore.refresh();
        }
    }

    toggleSidebar() {
        this.isSidebarOpen.update(v => !v);
    }

    getAbsenceStatusText(status: AbsenceStatus): string {
        const statusMap: { [key in AbsenceStatus]: string } = {
            [AbsenceStatus.PRESENT]: 'حاضر',
            [AbsenceStatus.ABSENT]: 'غائب',
            [AbsenceStatus.LATE]: 'متأخر',
            [AbsenceStatus.EXCUSED]: 'غياب مبرر'
        };
        return statusMap[status] || status;
    }

    getAbsenceStatusClass(status: AbsenceStatus): string {
        const classMap: { [key in AbsenceStatus]: string } = {
            [AbsenceStatus.PRESENT]: 'badge-success',
            [AbsenceStatus.ABSENT]: 'badge-danger',
            [AbsenceStatus.LATE]: 'badge-warning',
            [AbsenceStatus.EXCUSED]: 'badge-info'
        };
        return classMap[status] || '';
    }

    refreshData() {
        this.loadDashboardData();
    }
}