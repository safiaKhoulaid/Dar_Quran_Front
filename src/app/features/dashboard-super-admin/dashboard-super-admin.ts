import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
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
import { AdminManagementComponent } from './components/admin-management/admin-management.component';
import { TeacherManagementComponent } from './components/teacher-management/teacher-management.component';
import { StudentManagementComponent } from './components/student-management/student-management.component';
import { ClassManagementComponent } from './components/class-management/class-management.component';
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

interface AgeGroup {
  key: string;
  label: string;
  count: number;
  percent: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AdminManagementComponent,
    TeacherManagementComponent,
    StudentManagementComponent,
    ClassManagementComponent,
  ],
  templateUrl: './dashboard-super-admin.html',
  styleUrls: ['./dashboard-super-admin.css'],
})
export class dashboardSuperAdmin implements OnInit, OnDestroy {
  @ViewChild('studioVideo') studioVideoRef?: ElementRef<HTMLVideoElement>;

  selectedTab: string = 'dashboard';
  currentUserName = 'المشرف الرئيسي';
  isSidebarOpen = signal(false);

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

  maleStudentsByAge = signal<AgeGroup[]>([
    { key: '5-10', label: '5-10 سنوات', count: 180, percent: 25 },
    { key: '11-15', label: '11-15 سنة', count: 280, percent: 39 },
    { key: '16-20', label: '16-20 سنة', count: 180, percent: 25 },
    { key: '20+', label: 'أكثر من 20 سنة', count: 80, percent: 11 },
  ]);
  femaleStudentsByAge = signal<AgeGroup[]>([
    { key: '5-10', label: '5-10 سنوات', count: 150, percent: 29 },
    { key: '11-15', label: '11-15 سنة', count: 200, percent: 38 },
    { key: '16-20', label: '16-20 سنة', count: 120, percent: 23 },
    { key: '20+', label: 'أكثر من 20 سنة', count: 53, percent: 10 },
  ]);

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

  liveForm: LiveSessionRequest = {
    title: '',
    description: '',
    streamKey: '',
    accessType: 'EXTERNAL',
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

  get isSuperAdmin(): boolean {
    return this.authService.currentUser()?.role === 'SUPER_ADMIN';
  }

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
        : user?.name || user?.email || 'المشرف الرئيسي';
    this.loadDashboardData();

    // Récupérer le tab depuis les query params
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
    this.coursesError.set('');
    this.showCourseForm.set(true);
  }

  closeCourseForm(): void {
    this.showCourseForm.set(false);
    this.editingCourse.set(null);
  }

  saveCourse(): void {
    const title = this.courseForm.title?.trim();
    if (!title || title.length < 3) {
      this.coursesError.set('العنوان مطلوب (3 أحرف على الأقل).');
      return;
    }
    this.courseSaving.set(true);
    this.coursesError.set('');
    const payload: CourseRequest = { ...this.courseForm, title };
    const editing = this.editingCourse();
    if (editing) {
      this.courseService.update(editing.id, payload).subscribe({
        next: () => {
          this.courseSaving.set(false);
          this.loadCoursesList();
          this.closeCourseForm();
          this.loadScheduleData();
        },
        error: () => {
          this.courseSaving.set(false);
          this.coursesError.set('فشل تحديث المقرر.');
        },
      });
    } else {
      this.courseService.create(payload).subscribe({
        next: () => {
          this.courseSaving.set(false);
          this.loadCoursesList();
          this.closeCourseForm();
          this.loadScheduleData();
        },
        error: () => {
          this.courseSaving.set(false);
          this.coursesError.set('فشل إنشاء المقرر.');
        },
      });
    }
  }

  deleteCourse(course: CourseResponse): void {
    if (!confirm(`حذف المقرر "${course.title}"؟`)) return;
    this.coursesError.set('');
    this.courseService.delete(course.id).subscribe({
      next: () => {
        this.loadCoursesList();
        this.loadScheduleData();
      },
      error: () => this.coursesError.set('فشل حذف المقرر.'),
    });
  }

  courseLevelLabel(level: string): string {
    return this.courseLevelLabels[level] ?? level;
  }

  courseStatusLabel(status: string): string {
    return this.courseStatusLabels[status] ?? status;
  }

  loadDashboardData(): void {
    this.loadingStats.set(true);
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.loadingStats.set(false);
        if (stats) {
          this.totalStudents.set(stats.total_students ?? this.totalStudents());
          this.totalMaleStudents.set(stats.total_male_students ?? this.totalMaleStudents());
          this.totalFemaleStudents.set(stats.total_female_students ?? this.totalFemaleStudents());
          this.totalTeachers.set(stats.total_teachers ?? this.totalTeachers());
          this.totalMaleTeachers.set(stats.total_male_teachers ?? this.totalMaleTeachers());
          this.totalFemaleTeachers.set(stats.total_female_teachers ?? this.totalFemaleTeachers());
          this.totalClasses.set(stats.total_classes ?? this.totalClasses());
          this.totalClassesMale.set(stats.total_classes_male ?? this.totalClassesMale());
          this.totalClassesFemale.set(stats.total_classes_female ?? this.totalClassesFemale());

          if (stats.male_students_by_age?.length)
            this.maleStudentsByAge.set(stats.male_students_by_age);
          if (stats.female_students_by_age?.length)
            this.femaleStudentsByAge.set(stats.female_students_by_age);
        }
      },
      error: () => {
        this.loadingStats.set(false);
      },
    });
  }

  selectTab(tabId: string): void {
    this.selectedTab = tabId;
    this.isSidebarOpen.set(false); // Close sidebar on mobile after selection
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge',
    });
    if (tabId === 'live-stream') {
      this.loadLiveSessions();
    }
    if (tabId === 'schedule') {
      this.loadScheduleData();
    }
    if (tabId === 'courses') {
      this.loadCoursesList();
    }
  }

  loadScheduleData(): void {
    this.classService.getList().subscribe({
      next: (rooms) => this.scheduleRooms.set(rooms || []),
    });
    this.teacherService.getList().subscribe({
      next: (teachers) => this.scheduleTeachers.set(teachers || []),
    });
    this.courseService.getAll(0, 500).subscribe({
      next: (page) => this.scheduleCourses.set(page?.content || []),
    });
    this.loadScheduleSlots();
  }

  loadScheduleSlots(): void {
    const roomId = this.selectedScheduleRoomId();
    this.scheduleLoading.set(true);
    const obs = roomId ? this.scheduleService.getByRoom(roomId) : this.scheduleService.getAll();
    obs.subscribe({
      next: (slots) => {
        this.scheduleSlots.set(slots || []);
        this.scheduleLoading.set(false);
      },
      error: () => {
        this.scheduleSlots.set([]);
        this.scheduleLoading.set(false);
      },
    });
  }

  onScheduleRoomChange(roomId: string): void {
    this.selectedScheduleRoomId.set(roomId);
    this.loadScheduleSlots();
  }

  openScheduleForm(): void {
    this.scheduleError.set('');
    this.scheduleForm = {
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:00',
      roomId: this.selectedScheduleRoomId() || (this.scheduleRooms()[0]?.id ?? ''),
      courseId: this.scheduleCourses()[0]?.id ?? '',
      teacherId: this.scheduleTeachers()[0]?.id ?? '',
    };
    this.showScheduleForm.set(true);
  }

  closeScheduleForm(): void {
    this.showScheduleForm.set(false);
  }

  saveScheduleSlot(): void {
    const f = this.scheduleForm;
    if (!f.roomId || !f.courseId || !f.teacherId) {
      this.scheduleError.set('يرجى اختيار القاعة والمادة والأستاذ.');
      return;
    }
    this.scheduleSaving.set(true);
    this.scheduleError.set('');
    this.scheduleService.create(f).subscribe({
      next: (created) => {
        this.scheduleSaving.set(false);
        if (created) {
          this.loadScheduleSlots();
          this.closeScheduleForm();
        } else {
          this.scheduleError.set('فشل إنشاء الحصة.');
        }
      },
      error: () => {
        this.scheduleSaving.set(false);
        this.scheduleError.set('فشل إنشاء الحصة.');
      },
    });
  }

  deleteScheduleSlot(slot: ScheduleSlotResponse): void {
    if (!confirm(`حذف الحصة: ${slot.courseTitle} - ${slot.teacherName}؟`)) return;
    this.scheduleService.delete(slot.id).subscribe({
      next: (ok) => {
        if (ok) this.loadScheduleSlots();
      },
    });
  }

  scheduleDayLabel(dayOfWeek: number): string {
    return this.dayOfWeekLabels[dayOfWeek] ?? String(dayOfWeek);
  }

  loadLiveSessions(): void {
    this.loadingLive.set(true);
    this.liveError.set('');
    const obs = this.liveFilterStatus()
      ? this.liveStreamingService.getSessionsByStatus(
        this.liveFilterStatus() as LiveSessionStatus,
        0,
        50,
      )
      : this.liveStreamingService.getSessions(0, 50);

    obs.subscribe({
      next: (page) => {
        this.loadingLive.set(false);
        this.liveSessions.set(page.content ?? []);
      },
      error: () => {
        this.loadingLive.set(false);
        this.liveError.set('فشل تحميل قائمة الجلسات.');
      },
    });
  }

  openCreateLive(): void {
    this.editingLiveSession.set(null);
    this.liveForm = {
      title: '',
      description: '',
      streamKey: '',
      accessType: 'EXTERNAL',
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
      scheduledStartAt: session.scheduledStartAt?.slice(0, 16) ?? '',
      scheduledEndAt: session.scheduledEndAt ? session.scheduledEndAt.slice(0, 16) : '',
    };
    this.showLiveForm.set(true);
  }

  closeLiveForm(): void {
    this.showLiveForm.set(false);
    this.editingLiveSession.set(null);
  }

  saveLiveSession(): void {
    const title = this.liveForm.title?.trim();
    const streamKey = this.liveForm.streamKey?.trim();
    if (!title || title.length < 3) {
      this.liveError.set('العنوان مطلوب (3 أحرف على الأقل).');
      return;
    }
    if (!streamKey) {
      this.liveError.set('مفتاح البث مطلوب.');
      return;
    }
    const scheduledStartAt = this.liveForm.scheduledStartAt
      ? new Date(this.liveForm.scheduledStartAt).toISOString().slice(0, 19)
      : new Date().toISOString().slice(0, 19);
    const scheduledEndAt = this.liveForm.scheduledEndAt
      ? new Date(this.liveForm.scheduledEndAt).toISOString().slice(0, 19)
      : null;
    const payload: LiveSessionRequest = {
      ...this.liveForm,
      title,
      streamKey,
      scheduledStartAt,
      scheduledEndAt: scheduledEndAt ?? undefined,
    };
    this.savingLive.set(true);
    this.liveError.set('');
    this.liveSuccess.set('');

    const editingSession = this.editingLiveSession();
    if (editingSession) {
      this.liveStreamingService.update(editingSession.id, payload).subscribe({
        next: (updated) => {
          this.savingLive.set(false);
          if (updated) {
            this.liveSuccess.set('تم تحديث الجلسة بنجاح.');
            this.loadLiveSessions();
            this.closeLiveForm();
          } else {
            this.liveError.set('فشل تحديث الجلسة.');
          }
        },
        error: () => {
          this.savingLive.set(false);
          this.liveError.set('فشل تحديث الجلسة.');
        },
      });
    } else {
      this.liveStreamingService.create(payload).subscribe({
        next: (created) => {
          this.savingLive.set(false);
          this.liveSuccess.set('تم إنشاء الجلسة بنجاح.');
          this.loadLiveSessions();
          this.closeLiveForm();
        },
        error: () => {
          this.savingLive.set(false);
          this.liveError.set('فشل إنشاء الجلسة.');
        },
      });
    }
  }

  startLive(session: LiveSession): void {
    if (session.status !== 'SCHEDULED') return;
    this.liveError.set('');
    this.liveStreamingService.startStream(session.id).subscribe({
      next: (updated) => {
        if (updated) {
          this.liveSuccess.set('تم بدء البث.');
          this.loadLiveSessions();
          if (this.selectedSessionForStudio()?.id === session.id) {
            this.selectedSessionForStudio.set(updated);
            this.studioSessionDetails.set(updated);
          }
        } else {
          this.liveError.set('فشل بدء البث.');
        }
      },
      error: () => {
        this.liveError.set('فشل بدء البث.');
      },
    });
  }

  endLive(session: LiveSession): void {
    if (session.status !== 'LIVE') return;
    this.liveError.set('');
    this.liveStreamingService.endStream(session.id).subscribe({
      next: (updated) => {
        if (updated) {
          this.liveSuccess.set('تم إيقاف البث.');
          this.loadLiveSessions();
          if (this.selectedSessionForStudio()?.id === session.id) {
            this.selectedSessionForStudio.set(updated);
            this.studioSessionDetails.set(updated);
          }
        } else {
          this.liveError.set('فشل إيقاف البث.');
        }
      },
      error: () => {
        this.liveError.set('فشل إيقاف البث.');
      },
    });
  }

  deleteLive(session: LiveSession): void {
    if (!confirm(`حذف جلسة "${session.title}"؟`)) return;
    this.liveError.set('');
    this.liveStreamingService.delete(session.id).subscribe({
      next: (ok) => {
        if (ok) {
          this.liveSuccess.set('تم حذف الجلسة.');
          this.loadLiveSessions();
        } else {
          this.liveError.set('فشل حذف الجلسة.');
        }
      },
      error: () => {
        this.liveError.set('فشل حذف الجلسة.');
      },
    });
  }

  goToWatch(session: LiveSession): void {
    this.router.navigate(['/live', session.id]);
  }

  goToBroadcast(session: LiveSession): void {
    this.router.navigate(['/live/broadcast', session.id]);
  }

  openStudio(session: LiveSession): void {
    this.closeStudio();
    this.selectedSessionForStudio.set(session);
    this.studioSessionDetails.set(null);
    this.studioComments.set([]);
    this.loadStudioSessionDetails();
    this.loadStudioComments();
    this.startCommentsPolling();
  }

  closeStudio(): void {
    this.stopStudioCamera();
    this.stopCommentsPolling();
    this.selectedSessionForStudio.set(null);
    this.studioSessionDetails.set(null);
    this.studioComments.set([]);
  }

  loadStudioSessionDetails(): void {
    const sessionForStudio = this.selectedSessionForStudio();
    if (!sessionForStudio) return;
    this.liveStreamingService.getSessionById(sessionForStudio.id).subscribe({
      next: (s) => {
        this.studioSessionDetails.set(s ?? null);
        if (s) this.selectedSessionForStudio.set(s);
      },
      error: () => {
        this.studioSessionDetails.set(null);
      },
    });
  }

  startStudioCamera(): void {
    if (this.isStudioCameraOn() || this.isStudioCameraLoading()) return;
    this.isStudioCameraLoading.set(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true })
      .then((stream) => {
        this.studioCameraStream.set(stream);
        this.isStudioCameraOn.set(true);
        this.isStudioCameraLoading.set(false);
        const video = this.studioVideoRef?.nativeElement;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => { });
        }
      })
      .catch(() => {
        this.isStudioCameraLoading.set(false);
        this.liveError.set('لم يتم السماح بالوصول إلى الكاميرا أو الميكروفون.');
      });
  }

  stopStudioCamera(): void {
    const stream = this.studioCameraStream();
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      this.studioCameraStream.set(null);
    }
    const video = this.studioVideoRef?.nativeElement;
    if (video) video.srcObject = null;
    this.isStudioCameraOn.set(false);
  }

  private loadStudioComments(): void {
    const sessionForStudio = this.selectedSessionForStudio();
    if (!sessionForStudio) return;
    this.studioCommentsLoading.set(true);
    this.liveStreamingService.getSessionComments(sessionForStudio.id).subscribe({
      next: (list) => {
        this.studioComments.set(list ?? []);
        this.studioCommentsLoading.set(false);
      },
      error: () => {
        this.studioCommentsLoading.set(false);
        this.studioCommentError.set('تعذر تحميل التعليقات.');
      },
    });
  }

  private startCommentsPolling(): void {
    this.stopCommentsPolling();
    const sessionForStudio = this.selectedSessionForStudio();
    if (!sessionForStudio) return;
    this.commentsPollSub = interval(5000).subscribe(() => {
      const current = this.selectedSessionForStudio();
      if (current)
        this.liveStreamingService.getSessionComments(current.id).subscribe({
          next: (list) => {
            this.studioComments.set(list ?? []);
          },
        });
    });
  }

  private stopCommentsPolling(): void {
    if (this.commentsPollSub) {
      this.commentsPollSub.unsubscribe();
      this.commentsPollSub = null;
    }
  }

  sendStudioChatMessage(): void {
    const content = this.chatMessage?.trim();
    const sessionForStudio = this.selectedSessionForStudio();
    if (!content || !sessionForStudio) return;
    this.studioCommentError.set('');
    this.liveStreamingService
      .addSessionComment(sessionForStudio.id, { content })
      .subscribe({
        next: (c) => {
          if (c) {
            this.studioComments.update(comments => [...comments, c]);
            this.chatMessage = '';
          } else {
            this.studioCommentError.set('تعذر إرسال التعليق.');
          }
        },
        error: () => {
          this.studioCommentError.set('تعذر إرسال التعليق.');
        },
      });
  }

  ngOnDestroy(): void {
    this.closeStudio();
  }

  statusLabel(s: LiveSessionStatus): string {
    const map: Record<LiveSessionStatus, string> = {
      SCHEDULED: 'مجدولة',
      LIVE: 'مباشر',
      ENDED: 'منتهية',
      CANCELLED: 'ملغاة',
      RECORDING: 'تسجيل',
    };
    return map[s] ?? s;
  }

  startLivestream(): void {
    this.router.navigate(['/live']);
  }

  logout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }
}
