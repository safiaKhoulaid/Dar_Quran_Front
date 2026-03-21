import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '@features/services/authService/auth-service';
import { DashboardService } from '@features/services/dashboardService/dashboard.service';
import { LiveStreamingService } from '@features/services/liveStreamingService/live-streaming.service';
import { ScheduleService } from '@features/services/scheduleService/schedule.service';
import { ClassService } from '@features/services/classService/class.service';
import { TeacherService } from '@features/services/teacherService/teacher.service';
import { CourseService } from '@features/services/courseService/course.service';
import { TeacherManagementComponent } from '../dashboard-super-admin/components/teacher-management/teacher-management.component';
import { StudentManagementComponent } from '../dashboard-super-admin/components/student-management/student-management.component';
import { ClassManagementComponent } from '../dashboard-super-admin/components/class-management/class-management.component';
import { Section } from '../dashboard-super-admin/models/dashboard-shared.models';
import type {
    LiveSession,
    LiveSessionRequest,
    LiveSessionStatus,
} from '@features/models/live-streaming/live-session.model';
import type { LiveComment } from '@features/models/live-streaming/live-comment.model';
import type { ScheduleSlotResponse, ScheduleSlotRequest } from '@features/models/schedule/schedule.model';
import type { ClassItem } from '@features/models/class/class.model';
import type { CourseResponse, CourseRequest } from '@features/models/course/course.model';
import type { User } from '@core/models/users/user.module';

@Component({
    selector: 'app-dashboard-admin',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TeacherManagementComponent,
        StudentManagementComponent,
        ClassManagementComponent,
    ],
    templateUrl: './dashboard-admin.component.html',
    styleUrls: ['./dashboard-admin.css'],
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
    @ViewChild('studioVideo') studioVideoRef?: ElementRef<HTMLVideoElement>;

    selectedTab: string = 'dashboard';
    currentUserName = 'مشرف نظام';
    isSidebarOpen = signal(false);
    adminSection: Section | undefined = undefined;

    // Dashboard stats (Signals)
    totalStudents = signal(1243);
    totalMaleStudents = signal(720);
    totalFemaleStudents = signal(523);
    totalTeachers = signal(48);
    totalMaleTeachers = signal(28);
    totalFemaleTeachers = signal(20);
    totalClasses = signal(32);
    totalClassesMale = signal(18);
    totalClassesFemale = signal(14);

    // Live stream state
    streamTimer = signal('00:00:00');
    chatMessage = '';

    // Studio state
    selectedSessionForStudio = signal<LiveSession | null>(null);
    studioSessionDetails = signal<LiveSession | null>(null);
    studioCameraStream = signal<MediaStream | null>(null);
    isStudioCameraOn = signal(false);
    isStudioCameraLoading = signal(false);
    studioComments = signal<LiveComment[]>([]);
    studioCommentsLoading = signal(false);
    studioCommentError = signal('');
    private commentsPollSub: Subscription | null = null;

    liveSessions = signal<LiveSession[]>([]);
    loadingLive = signal(false);
    liveError = signal('');
    liveSuccess = signal('');
    showLiveForm = signal(false);
    editingLiveSession = signal<LiveSession | null>(null);
    savingLive = signal(false);
    liveFilterStatus = signal<LiveSessionStatus | ''>('');

    liveSessionsFiltered = computed(() => {
        let sessions = this.liveSessions();
        if (this.adminSection === 'HOMME') {
            sessions = sessions.filter(s => true); // If logic is needed, add later
        } else if (this.adminSection === 'FEMME') {
            sessions = sessions.filter(s => s.accessType === 'INTERNAL' || true); // Assuming some section filtering logic here
        }
        return sessions;
    });

    liveForm: LiveSessionRequest = {
        title: '',
        description: '',
        streamKey: '',
        accessType: 'INTERNAL',
        adaptiveQualityEnabled: true,
        recordingEnabled: true,
        scheduledStartAt: '',
        scheduledEndAt: '',
    };

    // Emploi du temps (schedule)
    scheduleSlots = signal<ScheduleSlotResponse[]>([]);
    scheduleRooms = signal<ClassItem[]>([]);
    scheduleTeachers = signal<User[]>([]);
    scheduleCourses = signal<CourseResponse[]>([]);
    selectedScheduleRoomId = signal<string>('');
    scheduleLoading = signal(false);
    scheduleSaving = signal(false);
    scheduleError = signal('');
    showScheduleForm = signal(false);
    scheduleForm: ScheduleSlotRequest = {
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '09:00',
        roomId: '',
        courseId: '',
        teacherId: '',
    };
    readonly dayOfWeekLabels: Record<number, string> = {
        1: 'الإثنين',
        2: 'الثلاثاء',
        3: 'الأربعاء',
        4: 'الخميس',
        5: 'الجمعة',
        6: 'السبت',
        7: 'الأحد',
    };

    scheduleSlotsFiltered = computed(() => {
        let slots = this.scheduleSlots();
        // Filters based on classes retrieved from scheduleRooms which are pre-filtered
        return slots;
    });

    // Matières / Cours
    coursesList = signal<CourseResponse[]>([]);
    coursesLoading = signal(false);
    coursesError = signal('');
    showCourseForm = signal(false);
    editingCourse = signal<CourseResponse | null>(null);
    courseSaving = signal(false);
    courseForm: CourseRequest = {
        title: '',
        description: '',
        isPublic: false,
        level: 'BEGINNER',
        status: 'DRAFT',
    };
    readonly courseLevelLabels: Record<string, string> = {
        BEGINNER: 'مبتدئ',
        INTERMEDIATE: 'متوسط',
        ADVANCED: 'متقدم',
    };
    readonly courseStatusLabels: Record<string, string> = {
        DRAFT: 'مسودة',
        PUBLISHED: 'منشور',
        ARCHIVED: 'أرشيف',
    };

    loadingStats = signal(false);

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private dashboardService: DashboardService,
        private liveStreamingService: LiveStreamingService,
        private scheduleService: ScheduleService,
        private classService: ClassService,
        private teacherService: TeacherService,
        private courseService: CourseService,
    ) { }

    ngOnInit(): void {
        const user = this.authService.currentUser();
        this.currentUserName =
            user?.prenom && user?.nom
                ? `${user.prenom} ${user.nom}`
                : user?.name || user?.email || 'مشرف القسم';

        if (user?.section) {
            if (user.section === 'HOMME') this.adminSection = 'HOMME';
            if (user.section === 'FEMME') this.adminSection = 'FEMME';
        } else {
            this.adminSection = 'HOMME'; // Defaulting for safety
        }

        this.loadDashboardData();

        const params = this.route.snapshot.queryParamMap;
        const tab = params.get('tab');
        if (tab) {
            this.selectedTab = tab;
            if (tab === 'live-stream') {
                this.loadLiveSessions();
            }
            if (tab === 'schedule') {
                this.loadScheduleData();
            }
            if (tab === 'courses') {
                this.loadCoursesList();
            }
        }
    }

    loadCoursesList(): void {
        this.coursesLoading.set(true);
        this.coursesError.set('');
        this.courseService.getAll(0, 200).subscribe({
            next: (page) => {
                this.coursesList.set(page?.content ?? []);
                this.coursesLoading.set(false);
            },
            error: () => {
                this.coursesList.set([]);
                this.coursesError.set('فشل تحميل قائمة المقررات.');
                this.coursesLoading.set(false);
            },
        });
    }

    openCourseForm(): void {
        this.editingCourse.set(null);
        this.courseForm = {
            title: '',
            description: '',
            isPublic: false,
            level: 'BEGINNER',
            status: 'DRAFT',
        };
        this.coursesError.set('');
        this.showCourseForm.set(true);
    }

    openEditCourseForm(course: CourseResponse): void {
        this.editingCourse.set(course);
        this.courseForm = {
            title: course.title,
            description: course.description ?? '',
            miniature: course.miniature,
            slug: course.slug,
            isPublic: course.isPublic,
            level: course.level,
            status: course.status ?? 'DRAFT',
        };
        this.showCourseForm.set(true);
    }

    closeCourseForm(): void {
        this.showCourseForm.set(false);
        this.editingCourse.set(null);
    }

    saveCourse(): void {
        if (!this.courseForm.title) {
            this.coursesError.set('يرجى إدخال عنوان المقرر');
            return;
        }
        this.courseSaving.set(true);
        const ed = this.editingCourse();
        if (ed) {
            this.courseService.update(String(ed.id), this.courseForm).subscribe({
                next: () => {
                    this.courseSaving.set(false);
                    this.closeCourseForm();
                    this.loadCoursesList();
                },
                error: () => {
                    this.coursesError.set('حدث خطأ أثناء تحديث المقرر');
                    this.courseSaving.set(false);
                },
            });
        } else {
            this.courseService.create(this.courseForm).subscribe({
                next: () => {
                    this.courseSaving.set(false);
                    this.closeCourseForm();
                    this.loadCoursesList();
                },
                error: () => {
                    this.coursesError.set('حدث خطأ أثناء إنشاء المقرر');
                    this.courseSaving.set(false);
                },
            });
        }
    }

    deleteCourse(course: CourseResponse): void {
        if (confirm(`هل أنت متأكد من حذف المقرر "${course.title}"؟`)) {
            this.courseService.delete(course.id).subscribe({
                next: () => this.loadCoursesList(),
                error: () => alert('خطأ أثناء الحذف'),
            });
        }
    }

    courseLevelLabel(val: string): string {
        return this.courseLevelLabels[val] || val;
    }

    courseStatusLabel(val?: string): string {
        return this.courseStatusLabels[val ?? ''] || val || '—';
    }

    // SCHEDULE LOGIC
    loadScheduleData(): void {
        this.classService.getList().subscribe(c => {
            const expectedGender = this.adminSection === 'HOMME' ? 'HOMME' : 'FEMME';
            const filteredClasses = (c || []).filter((cls: ClassItem) => cls.gender === expectedGender);
            this.scheduleRooms.set(filteredClasses);
        });

        this.teacherService.getList().subscribe(teachers => {
            const mapped = (teachers || []).map(t => ({ id: t.id, prenom: t.prenom, nom: t.nom } as any));
            this.scheduleTeachers.set(mapped);
        });

        this.courseService.getAll(0, 100).subscribe(page => {
            this.scheduleCourses.set(page?.content ?? []);
        });

        this.loadScheduleSlots();
    }

    loadScheduleSlots(): void {
        this.scheduleLoading.set(true);
        this.scheduleError.set('');
        const roomIdStr = this.selectedScheduleRoomId();
        if (roomIdStr) {
            this.scheduleService.getByRoom(roomIdStr).subscribe({
                next: (res) => {
                    this.scheduleSlots.set(res || []);
                    this.scheduleLoading.set(false);
                },
                error: () => {
                    this.scheduleError.set('خطأ في جلب الجدول الزمني');
                    this.scheduleLoading.set(false);
                }
            });
        } else {
            this.scheduleSlots.set([]);
            this.scheduleLoading.set(false);
        }
    }

    onScheduleRoomChange(roomId: string): void {
        this.selectedScheduleRoomId.set(roomId);
        this.loadScheduleSlots();
    }

    openScheduleForm(): void {
        this.scheduleError.set('');
        this.showScheduleForm.set(true);
    }

    closeScheduleForm(): void {
        this.showScheduleForm.set(false);
    }

    saveScheduleSlot(): void {
        this.scheduleSaving.set(true);
        this.scheduleService.create(this.scheduleForm).subscribe({
            next: () => {
                this.scheduleSaving.set(false);
                this.closeScheduleForm();
                this.loadScheduleSlots();
            },
            error: () => {
                this.scheduleError.set('خطأ أثناء حفظ الحصة');
                this.scheduleSaving.set(false);
            }
        });
    }

    deleteScheduleSlot(slot: ScheduleSlotResponse): void {
        if (confirm(`حذف الحصة ${slot.courseTitle}؟`)) {
            this.scheduleService.delete(String(slot.id)).subscribe({
                next: () => this.loadScheduleSlots(),
                error: () => alert('خطأ في الحذف')
            });
        }
    }

    scheduleDayLabel(d: number): string {
        return this.dayOfWeekLabels[d] || String(d);
    }

    // LIVE STREAM LOGIC
    loadLiveSessions(): void {
        this.loadingLive.set(true);
        this.liveError.set('');
        this.liveSuccess.set('');

        const status = this.liveFilterStatus() as LiveSessionStatus | undefined;
        const obs = status ? this.liveStreamingService.getSessionsByStatus(status) : this.liveStreamingService.getSessionsForMySection('LIVE');

        obs.subscribe({
            next: (sessionsPage) => {
                this.liveSessions.set(sessionsPage?.content || []);
                this.loadingLive.set(false);
            },
            error: () => {
                this.liveError.set('فشل جلب أحدث الجلسات');
                this.loadingLive.set(false);
            }
        });
    }

    openCreateLive(): void {
        this.editingLiveSession.set(null);
        this.liveForm = {
            title: '',
            description: '',
            streamKey: `stream-${Math.floor(Math.random() * 10000)}`,
            accessType: 'INTERNAL',
            adaptiveQualityEnabled: true,
            recordingEnabled: true,
            scheduledStartAt: '',
            scheduledEndAt: '',
        };
        this.showLiveForm.set(true);
    }

    openEditLive(session: LiveSession): void {
        this.editingLiveSession.set(session);
        this.liveForm = {
            title: session.title,
            description: session.description ?? '',
            streamKey: session.streamKey,
            accessType: session.accessType,
            adaptiveQualityEnabled: session.adaptiveQualityEnabled,
            recordingEnabled: session.recordingEnabled,
            scheduledStartAt: session.scheduledStartAt ? new Date(session.scheduledStartAt).toISOString().slice(0, 16) : '',
            scheduledEndAt: session.scheduledEndAt ? new Date(session.scheduledEndAt).toISOString().slice(0, 16) : '',
        };
        this.showLiveForm.set(true);
    }

    closeLiveForm(): void {
        this.showLiveForm.set(false);
        this.editingLiveSession.set(null);
    }

    saveLiveSession(): void {
        this.savingLive.set(true);
        const id = this.editingLiveSession()?.id;

        const op = id
            ? this.liveStreamingService.update(String(id), this.liveForm)
            : this.liveStreamingService.create(this.liveForm);

        op.subscribe({
            next: () => {
                this.savingLive.set(false);
                this.closeLiveForm();
                this.loadLiveSessions();
                this.liveSuccess.set(id ? 'تم تعديل الجلسة بنجاح.' : 'تم إنشاء الجلسة بنجاح.');
                setTimeout(() => this.liveSuccess.set(''), 3000);
            },
            error: () => {
                this.savingLive.set(false);
                alert('حدث خطأ أثناء الحفظ.');
            }
        });
    }

    deleteLive(session: LiveSession): void {
        if (confirm('هل أنت متأكد من حذف هذه الجلسة؟')) {
            this.liveStreamingService.delete(String(session.id)).subscribe(() => this.loadLiveSessions());
        }
    }

    statusLabel(s: string): string {
        switch (s) {
            case 'SCHEDULED': return 'مجدولة';
            case 'LIVE': return 'مباشر';
            case 'ENDED': return 'منتهية';
            case 'ARCHIVED': return 'أرشيف';
            default: return s;
        }
    }

    startLive(s: LiveSession): void {
        if (confirm('بدء تشغيل الجلسة لتصبح مباشرة؟')) {
            this.liveStreamingService.startStream(String(s.id)).subscribe(() => this.loadLiveSessions());
        }
    }

    endLive(s: LiveSession): void {
        if (confirm('إنهاء البث وإغلاق الجلسة؟')) {
            this.liveStreamingService.endStream(String(s.id)).subscribe(() => this.loadLiveSessions());
        }
    }

    startLivestream(): void {
        this.router.navigate(['/live']);
    }

    goToWatch(s: LiveSession) {
        this.router.navigate(['/live', s.id]);
    }

    goToBroadcast(s: LiveSession) {
        this.selectedSessionForStudio.set(s);
        this.isStudioCameraOn.set(false);
        this.studioCameraStream.set(null);
        this.studioComments.set([]);

        this.liveStreamingService.getSessionById(String(s.id)).subscribe({
            next: (details) => this.studioSessionDetails.set(details)
        });

        this.startCommentsPolling(Number(s.id));
    }

    closeStudio(): void {
        this.selectedSessionForStudio.set(null);
        this.studioSessionDetails.set(null);
        this.stopStudioCamera();
        this.stopCommentsPolling();
    }

    async startStudioCamera() {
        this.isStudioCameraLoading.set(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });
            this.studioCameraStream.set(stream);
            this.isStudioCameraOn.set(true);
            setTimeout(() => {
                if (this.studioVideoRef?.nativeElement) {
                    this.studioVideoRef.nativeElement.srcObject = stream;
                }
            });
        } catch (e) {
            alert('تعذر الوصول للكاميرا والميكروفون استثنائياً.');
        } finally {
            this.isStudioCameraLoading.set(false);
        }
    }

    stopStudioCamera() {
        if (this.studioCameraStream()) {
            this.studioCameraStream()?.getTracks().forEach(t => t.stop());
            this.studioCameraStream.set(null);
        }
        this.isStudioCameraOn.set(false);
    }

    private startCommentsPolling(sessionId: number): void {
        this.loadComments(sessionId);
        this.commentsPollSub = interval(5000).subscribe(() => this.loadComments(sessionId));
    }

    private stopCommentsPolling(): void {
        this.commentsPollSub?.unsubscribe();
        this.commentsPollSub = null;
    }

    private loadComments(sessionId: number): void {
        this.liveStreamingService.getSessionComments(String(sessionId)).subscribe({
            next: (comments) => this.studioComments.set(comments || [])
        });
    }

    sendStudioChatMessage(): void {
        const s = this.selectedSessionForStudio();
        if (!s || !this.chatMessage.trim()) return;
        this.liveStreamingService.addSessionComment(String(s.id), { content: this.chatMessage.trim() }).subscribe({
            next: () => {
                this.chatMessage = '';
                this.loadComments(Number(s.id));
            }
        });
    }

    loadDashboardData(): void {
        this.loadingStats.set(true);
        this.dashboardService.getStats().subscribe({
            next: (stats) => {
                if (stats) {
                    this.totalStudents.set(stats.total_students ?? 0);
                    this.totalMaleStudents.set(stats.total_male_students ?? 0);
                    this.totalFemaleStudents.set(stats.total_female_students ?? 0);

                    this.totalTeachers.set(stats.total_teachers ?? 0);
                    this.totalMaleTeachers.set(stats.total_male_teachers ?? 0);
                    this.totalFemaleTeachers.set(stats.total_female_teachers ?? 0);

                    this.totalClasses.set(stats.total_classes ?? 0);
                    this.totalClassesMale.set(stats.total_classes_male ?? 0);
                    this.totalClassesFemale.set(stats.total_classes_female ?? 0);
                }
                this.loadingStats.set(false);
            },
            error: () => this.loadingStats.set(false),
        });
    }

    selectTab(tab: string): void {
        this.selectedTab = tab;
        this.isSidebarOpen.set(false); // Close sidebar on mobile
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab },
            queryParamsHandling: 'merge',
        });
        if (tab === 'schedule') this.loadScheduleData();
        if (tab === 'courses') this.loadCoursesList();
        if (tab === 'live-stream') this.loadLiveSessions();
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }

    ngOnDestroy(): void {
        this.stopStudioCamera();
        this.stopCommentsPolling();
    }

    toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }
}
