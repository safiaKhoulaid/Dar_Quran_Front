import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { forkJoin } from 'rxjs';
import { AuthService } from '@features/services/authService/auth-service';
import { LiveStreamingService } from '@features/services/liveStreamingService/live-streaming.service';
import { ScheduleService } from '@features/services/scheduleService/schedule.service';
import { ClassService } from '@features/services/classService/class.service';
import { TeacherService } from '@features/services/teacherService/teacher.service';
import { StudentService } from '@features/services/studentService/student.service';
import { CourseService } from '@features/services/courseService/course.service';
import { AdminService } from '@features/services/adminService/admin.service';
import { TeacherManagementComponent } from '../dashboard-super-admin/components/teacher-management/teacher-management.component';
import { StudentManagementComponent } from '../dashboard-super-admin/components/student-management/student-management.component';
import { ClassManagementComponent } from '../dashboard-super-admin/components/class-management/class-management.component';
import { CourseManagementComponent } from '../dashboard-super-admin/components/course-management/course-management.component';
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
import { UserNotificationStore } from '@features/services/user-notification/user-notification.store';
import { DashboardNotificationsPanelComponent } from '@features/components/dashboard-notifications-panel/dashboard-notifications-panel';

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
        CourseManagementComponent,
        DashboardNotificationsPanelComponent,
    ],
    templateUrl: './dashboard-admin.component.html',
    styleUrls: ['./dashboard-admin.css'],
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
    @ViewChild('studioVideo') studioVideoRef?: ElementRef<HTMLVideoElement>;

    readonly notificationStore = inject(UserNotificationStore);

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
    private studioSessionPollSub: Subscription | null = null;

    liveSessions = signal<LiveSession[]>([]);
    loadingLive = signal(false);
    liveError = signal('');
    liveSuccess = signal('');
    showLiveForm = signal(false);
    editingLiveSession = signal<LiveSession | null>(null);
    savingLive = signal(false);
    liveFilterStatus = signal<LiveSessionStatus | ''>('');
    liveFormErrors = signal<Record<string, string>>({});

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
    profileSaving = signal(false);
    profileError = signal('');
    profileSuccess = signal('');
    profileForm = {
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        dateNaissance: '',
        password: '',
        passwordConfirmation: '',
    };

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private liveStreamingService: LiveStreamingService,
        private scheduleService: ScheduleService,
        private classService: ClassService,
        private teacherService: TeacherService,
        private studentService: StudentService,
        private courseService: CourseService,
        private adminService: AdminService,
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

        this.profileForm = {
            prenom: user?.prenom ?? '',
            nom: user?.nom ?? '',
            email: user?.email ?? '',
            telephone: user?.telephone ?? '',
            dateNaissance: (user as any)?.dateNaissance ?? '',
            password: '',
            passwordConfirmation: '',
        };

        this.loadDashboardData();
        this.notificationStore.loadUnreadCount();

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
            if (tab === 'notifications') {
                this.notificationStore.refresh();
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
            this.loadScheduleSlots();
        });

        this.teacherService.getList().subscribe(teachers => {
            const mapped = (teachers || []).map(t => ({ id: t.id, prenom: t.prenom, nom: t.nom } as any));
            this.scheduleTeachers.set(mapped);
        });

        this.courseService.getAll(0, 100).subscribe(page => {
            this.scheduleCourses.set(page?.content ?? []);
        });

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
            this.scheduleService.getAll().subscribe({
                next: (res) => {
                    const allowedRoomIds = new Set(this.scheduleRooms().map(r => String(r.id)));
                    const filtered = (res || []).filter(slot => allowedRoomIds.has(String(slot.roomId)));
                    this.scheduleSlots.set(filtered);
                    this.scheduleLoading.set(false);
                },
                error: () => {
                    this.scheduleError.set('خطأ في جلب الجدول الزمني');
                    this.scheduleLoading.set(false);
                }
            });
        }
    }

    onScheduleRoomChange(roomId: string): void {
        this.selectedScheduleRoomId.set(roomId);
        this.loadScheduleSlots();
    }

    openScheduleForm(): void {
        this.scheduleError.set('');
        const firstRoomId = this.selectedScheduleRoomId() || this.scheduleRooms()[0]?.id || '';
        const firstCourseId = this.scheduleCourses()[0]?.id || '';
        const firstTeacherId = this.scheduleTeachers()[0]?.id || '';
        this.scheduleForm = {
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '09:00',
            roomId: String(firstRoomId),
            courseId: String(firstCourseId),
            teacherId: String(firstTeacherId),
        };
        this.showScheduleForm.set(true);
    }

    closeScheduleForm(): void {
        this.showScheduleForm.set(false);
    }

    saveScheduleSlot(): void {
        if (!this.scheduleForm.roomId || !this.scheduleForm.courseId || !this.scheduleForm.teacherId) {
            this.scheduleError.set('القاعة والمقرر والأستاذ حقول إلزامية.');
            return;
        }
        if (this.scheduleForm.endTime <= this.scheduleForm.startTime) {
            this.scheduleError.set('وقت النهاية يجب أن يكون بعد وقت البداية.');
            return;
        }
        this.scheduleSaving.set(true);
        this.scheduleError.set('');
        const payload: ScheduleSlotRequest = {
            ...this.scheduleForm,
            startTime: this.scheduleForm.startTime.length === 5 ? `${this.scheduleForm.startTime}:00` : this.scheduleForm.startTime,
            endTime: this.scheduleForm.endTime.length === 5 ? `${this.scheduleForm.endTime}:00` : this.scheduleForm.endTime,
        };
        this.scheduleService.create(payload).subscribe({
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
                next: (ok) => {
                    if (ok) {
                        this.loadScheduleSlots();
                    } else {
                        this.scheduleError.set('تعذر حذف الحصة.');
                    }
                },
                error: () => this.scheduleError.set('خطأ في حذف الحصة')
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
                const sessions = sessionsPage?.content || [];
                this.liveSessions.set(sessions);
                this.syncSelectedStudioSession(sessions);
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
        this.liveError.set('');
        this.liveFormErrors.set({});
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
        this.liveError.set('');
        this.liveFormErrors.set({});
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
        this.liveFormErrors.set({});
    }

    saveLiveSession(): void {
        const errors: Record<string, string> = {};
        const streamKey = this.liveForm.streamKey?.trim();
        const title = this.liveForm.title?.trim();
        if (!title || title.length < 3) {
            errors['title'] = 'العنوان مطلوب (3 أحرف على الأقل).';
        }
        if (!streamKey) {
            errors['streamKey'] = 'مفتاح البث مطلوب.';
        }
        if (/\s/.test(streamKey)) {
            errors['streamKey'] = 'مفتاح البث يجب ألا يحتوي على مسافات.';
        }
        if (!this.liveForm.scheduledStartAt) {
            errors['scheduledStartAt'] = 'تاريخ بداية البث مطلوب.';
        }
        const now = Date.now();
        const startAt = new Date(this.liveForm.scheduledStartAt).getTime();
        if (Number.isNaN(startAt) || startAt < now - 60_000) {
            errors['scheduledStartAt'] = 'تاريخ بداية البث غير صالح أو منتهي.';
        }
        if (this.liveForm.scheduledEndAt) {
            const endAt = new Date(this.liveForm.scheduledEndAt).getTime();
            if (!Number.isNaN(endAt) && !Number.isNaN(startAt) && endAt <= startAt) {
                errors['scheduledEndAt'] = 'تاريخ نهاية البث يجب أن يكون بعد تاريخ البداية.';
            }
        }

        this.liveFormErrors.set(errors);
        if (Object.keys(errors).length > 0) {
            this.liveError.set('يرجى تصحيح الحقول غير الصالحة.');
            return;
        }
        this.savingLive.set(true);
        this.liveError.set('');
        const id = this.editingLiveSession()?.id;

        const op = id
            ? this.liveStreamingService.update(String(id), { ...this.liveForm, title, streamKey })
            : this.liveStreamingService.create({ ...this.liveForm, title, streamKey });

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
        if (s.status !== 'SCHEDULED') return;
        this.liveError.set('');
        this.liveStreamingService.startStream(String(s.id)).subscribe({
            next: (updated) => {
                if (!updated) {
                    this.liveError.set('فشل بدء البث.');
                    return;
                }
                this.liveSuccess.set('تم بدء البث.');
                this.loadLiveSessions();
                if (this.selectedSessionForStudio()?.id === s.id) {
                    this.selectedSessionForStudio.set(updated);
                    this.studioSessionDetails.set(updated);
                }
            },
            error: () => this.liveError.set('فشل بدء البث.'),
        });
    }

    endLive(s: LiveSession): void {
        if (s.status !== 'LIVE') return;
        this.liveError.set('');
        this.liveStreamingService.endStream(String(s.id)).subscribe({
            next: (updated) => {
                if (!updated) {
                    this.liveError.set('فشل إيقاف البث.');
                    return;
                }
                this.liveSuccess.set('تم إيقاف البث.');
                this.loadLiveSessions();
                if (this.selectedSessionForStudio()?.id === s.id) {
                    this.selectedSessionForStudio.set(updated);
                    this.studioSessionDetails.set(updated);
                }
            },
            error: () => this.liveError.set('فشل إيقاف البث.'),
        });
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
        this.refreshStudioSessionDetails();
        this.startCommentsPolling(String(s.id));
        this.startStudioSessionPolling();
    }

    closeStudio(): void {
        this.selectedSessionForStudio.set(null);
        this.studioSessionDetails.set(null);
        this.stopStudioCamera();
        this.stopCommentsPolling();
        this.stopStudioSessionPolling();
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

    private startCommentsPolling(sessionId: string): void {
        this.stopCommentsPolling();
        this.loadComments(sessionId);
        this.commentsPollSub = interval(5000).subscribe(() => this.loadComments(sessionId));
    }

    private stopCommentsPolling(): void {
        this.commentsPollSub?.unsubscribe();
        this.commentsPollSub = null;
    }

    private loadComments(sessionId: string): void {
        this.liveStreamingService.getSessionComments(sessionId).subscribe({
            next: (comments) => this.studioComments.set(comments || [])
        });
    }

    private syncSelectedStudioSession(sessions: LiveSession[]): void {
        const current = this.selectedSessionForStudio();
        if (!current?.id) return;
        const updated = sessions.find(s => String(s.id) === String(current.id));
        if (updated) {
            this.selectedSessionForStudio.set(updated);
            this.studioSessionDetails.set(updated);
            return;
        }
        this.refreshStudioSessionDetails();
    }

    private refreshStudioSessionDetails(): void {
        const selected = this.selectedSessionForStudio();
        if (!selected?.id) return;
        this.liveStreamingService.getSessionById(String(selected.id)).subscribe({
            next: (details) => {
                if (!details) {
                    this.liveError.set('تعذر تحديث حالة جلسة البث الحالية.');
                    return;
                }
                this.selectedSessionForStudio.set(details);
                this.studioSessionDetails.set(details);
            }
        });
    }

    private startStudioSessionPolling(): void {
        this.stopStudioSessionPolling();
        this.refreshStudioSessionDetails();
        this.studioSessionPollSub = interval(7000).subscribe(() => this.refreshStudioSessionDetails());
    }

    private stopStudioSessionPolling(): void {
        this.studioSessionPollSub?.unsubscribe();
        this.studioSessionPollSub = null;
    }

    sendStudioChatMessage(): void {
        const s = this.selectedSessionForStudio();
        if (!s || !this.chatMessage.trim()) return;
        this.liveStreamingService.addSessionComment(String(s.id), { content: this.chatMessage.trim() }).subscribe({
            next: () => {
                this.chatMessage = '';
                this.loadComments(String(s.id));
            }
        });
    }

    loadDashboardData(): void {
        this.loadingStats.set(true);
        // Endpoint /dashboard/stats peut être indisponible selon le backend actuel.
        // On calcule donc les stats depuis les ressources de base pour fiabilité.
        forkJoin({
            students: this.studentService.getList(),
            teachers: this.teacherService.getList(),
            classes: this.classService.getList(),
        }).subscribe({
            next: ({ students, teachers, classes }) => {
                const normalizeGender = (value: unknown): 'HOMME' | 'FEMME' | '' => {
                    const v = String(value ?? '').toUpperCase();
                    if (v.includes('HOMME') || v === 'MALE' || v === 'M') return 'HOMME';
                    if (v.includes('FEMME') || v === 'FEMALE' || v === 'F') return 'FEMME';
                    return '';
                };

                const maleStudents = (students || []).filter((s: any) => normalizeGender(s?.gender ?? s?.section) === 'HOMME').length;
                const femaleStudents = (students || []).filter((s: any) => normalizeGender(s?.gender ?? s?.section) === 'FEMME').length;
                const maleTeachers = (teachers || []).filter((t: any) => normalizeGender(t?.gender ?? t?.section) === 'HOMME').length;
                const femaleTeachers = (teachers || []).filter((t: any) => normalizeGender(t?.gender ?? t?.section) === 'FEMME').length;
                const maleClasses = (classes || []).filter((c: any) => normalizeGender(c?.gender ?? c?.section) === 'HOMME').length;
                const femaleClasses = (classes || []).filter((c: any) => normalizeGender(c?.gender ?? c?.section) === 'FEMME').length;

                this.totalStudents.set((students || []).length);
                this.totalMaleStudents.set(maleStudents);
                this.totalFemaleStudents.set(femaleStudents);

                this.totalTeachers.set((teachers || []).length);
                this.totalMaleTeachers.set(maleTeachers);
                this.totalFemaleTeachers.set(femaleTeachers);

                this.totalClasses.set((classes || []).length);
                this.totalClassesMale.set(maleClasses);
                this.totalClassesFemale.set(femaleClasses);
                this.loadingStats.set(false);
            },
            error: () => {
                this.totalStudents.set(0);
                this.totalMaleStudents.set(0);
                this.totalFemaleStudents.set(0);
                this.totalTeachers.set(0);
                this.totalMaleTeachers.set(0);
                this.totalFemaleTeachers.set(0);
                this.totalClasses.set(0);
                this.totalClassesMale.set(0);
                this.totalClassesFemale.set(0);
                this.loadingStats.set(false);
            },
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
        if (tab === 'notifications') this.notificationStore.refresh();
    }

    goToNewCourseCreator(): void {
        this.router.navigate(['/courses/create']);
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }

    saveProfile(): void {
        const currentUser = this.authService.currentUser();
        const userId = currentUser?.id;
        if (!userId) {
            this.profileError.set('تعذر تحديد حساب المشرف الحالي.');
            return;
        }
        if (this.profileForm.password && this.profileForm.password !== this.profileForm.passwordConfirmation) {
            this.profileError.set('تأكيد كلمة المرور غير مطابق.');
            return;
        }
        this.profileSaving.set(true);
        this.profileError.set('');
        this.profileSuccess.set('');
        this.adminService.update({
            id: userId,
            user: {
                prenom: this.profileForm.prenom.trim(),
                nom: this.profileForm.nom.trim(),
                email: this.profileForm.email.trim(),
                telephone: this.profileForm.telephone.trim() || undefined,
                dateNaissance: this.profileForm.dateNaissance || undefined,
            },
            password: this.profileForm.password || undefined,
            passwordConfirmation: this.profileForm.passwordConfirmation || undefined,
        }).subscribe({
            next: (updated) => {
                this.profileSaving.set(false);
                this.profileSuccess.set('تم تحديث الملف الشخصي بنجاح.');
                const merged = {
                    ...currentUser,
                    prenom: updated?.prenom ?? this.profileForm.prenom.trim(),
                    nom: updated?.nom ?? this.profileForm.nom.trim(),
                    email: updated?.email ?? this.profileForm.email.trim(),
                    telephone: updated?.telephone ?? this.profileForm.telephone.trim(),
                    dateNaissance: updated?.dateNaissance ?? this.profileForm.dateNaissance,
                };
                localStorage.setItem('auth_user', JSON.stringify(merged));
                this.authService.currentUser.set(merged as any);
                this.currentUserName = `${merged.prenom ?? ''} ${merged.nom ?? ''}`.trim() || merged.email || this.currentUserName;
                this.profileForm.password = '';
                this.profileForm.passwordConfirmation = '';
            },
            error: () => {
                this.profileSaving.set(false);
                this.profileError.set('فشل تحديث الملف الشخصي.');
            }
        });
    }

    ngOnDestroy(): void {
        this.stopStudioCamera();
        this.stopCommentsPolling();
        this.stopStudioSessionPolling();
    }

    toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }
}
