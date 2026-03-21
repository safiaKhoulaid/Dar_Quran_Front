import { Component, OnInit, signal, inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '@features/services/authService/auth-service';
import { TeacherDashboardService } from '@features/services/teacherDashboardService/teacher-dashboard.service';
import { LiveStreamingService } from '@features/services/liveStreamingService/live-streaming.service';
import type { LiveSession, LiveSessionRequest, LiveSessionStatus } from '@features/models/live-streaming/live-session.model';
import type { LiveComment } from '@features/models/live-streaming/live-comment.model';
import type { CourseResponse } from '@features/models/course/course.model';
import type {
  TeacherRoomResponse,
  TeacherStudentResponse,
  StudentAbsenceResponse,
  StudentGradeResponse,
  StudentAbsenceRequest,
  StudentGradeRequest,
} from '@features/models/teacher-dashboard/teacher-dashboard.model';
import type { ScheduleSlotResponse } from '@features/models/schedule/schedule.model';

@Component({
  selector: 'app-dashboard-teacher',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard-teacher.html',
  styleUrls: ['./dashboard-teacher.css'],
})
export class DashboardTeacherComponent implements OnInit, OnDestroy {
  @ViewChild('studioVideo') studioVideoRef?: ElementRef<HTMLVideoElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private teacherDashboard = inject(TeacherDashboardService);
  private liveStreaming = inject(LiveStreamingService);

  selectedTab = 'overview';
  currentUserName = '';
  isSidebarOpen = signal(false);

  // Overview
  myClasses = signal<TeacherRoomResponse[]>([]);
  myCourses = signal<CourseResponse[]>([]);

  // Courses (read-only)
  coursesLoading = signal(false);

  // Live
  myLiveSessions = signal<LiveSession[]>([]);
  liveLoading = signal(false);
  liveError = signal('');
  liveSuccess = signal('');
  showLiveForm = signal(false);
  savingLive = signal(false);
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

  // Studio Mode (Sync from SuperAdmin)
  selectedSessionForStudio = signal<LiveSession | null>(null);
  studioSessionDetails = signal<LiveSession | null>(null);
  studioCameraStream = signal<MediaStream | null>(null);
  isStudioCameraOn = signal(false);
  isStudioCameraLoading = signal(false);
  studioComments = signal<LiveComment[]>([]);
  studioCommentsLoading = signal(false);
  studioCommentError = signal('');
  chatMessage = signal('');
  private commentsPollSub: Subscription | null = null;

  // Absences
  classesForAbsence = signal<TeacherRoomResponse[]>([]);
  studentsForAbsence = signal<TeacherStudentResponse[]>([]);
  scheduleSlotsForAbsence = signal<ScheduleSlotResponse[]>([]);
  selectedAbsenceRoomId = signal('');
  absencesList = signal<StudentAbsenceResponse[]>([]);
  absenceLoading = signal(false);
  showAbsenceForm = signal(false);
  savingAbsence = signal(false);
  absenceError = signal('');
  absenceForm: Partial<StudentAbsenceRequest> = {
    studentId: '',
    scheduleSlotId: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'UNJUSTIFIED',
  };

  // Grades
  coursesForGrade = signal<CourseResponse[]>([]);
  studentsForGrade = signal<TeacherStudentResponse[]>([]);
  selectedGradeRoomId = signal('');
  selectedGradeCourseId = signal('');
  gradesList = signal<StudentGradeResponse[]>([]);
  gradeLoading = signal(false);
  showGradeForm = signal(false);
  savingGrade = signal(false);
  gradeError = signal('');
  gradeForm: Partial<StudentGradeRequest> = {
    studentId: '',
    courseId: '',
    value: 0,
    gradeDate: new Date().toISOString().slice(0, 10),
  };

  statusLabels: Record<string, string> = {
    SCHEDULED: 'مجدولة',
    LIVE: 'مباشر',
    ENDED: 'منتهية',
    CANCELLED: 'ملغاة',
  };

  absenceStatusLabels: Record<string, string> = {
    JUSTIFIED: 'مبررة',
    UNJUSTIFIED: 'غير مبررة',
    PENDING: 'قيد المراجعة',
  };

  dayLabels: Record<number, string> = {
    1: 'الإثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت',
    7: 'الأحد',
  };

  currentUserSection = signal('');

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.currentUserSection.set(user?.section || '');

    this.currentUserName = user?.prenom && user?.nom
      ? `${user.prenom} ${user.nom}`
      : user?.name || user?.email || 'المعلم';

    this.loadOverview();
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab) {
      this.selectedTab = tab;
      this.loadTabData(tab);
    }
  }

  selectTab(tabId: string): void {
    this.selectedTab = tabId;
    this.isSidebarOpen.set(false); // Close sidebar on mobile
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: tabId }, queryParamsHandling: 'merge' });
    this.loadTabData(tabId);
  }

  loadTabData(tabId: string): void {
    if (tabId === 'courses') this.loadMyCourses();
    if (tabId === 'live') this.loadMyLiveSessions();
    if (tabId === 'absences') this.loadAbsencesData();
    if (tabId === 'grades') this.loadGradesData();
  }

  loadOverview(): void {
    this.teacherDashboard.getMyClasses().subscribe((list) => this.myClasses.set(list));
    this.teacherDashboard.getMyCourses().subscribe((list) => this.myCourses.set(list));
  }

  loadMyCourses(): void {
    this.coursesLoading.set(true);
    this.teacherDashboard.getMyCourses().subscribe({
      next: (list) => {
        this.myCourses.set(list);
        this.coursesLoading.set(false);
      },
      error: () => this.coursesLoading.set(false),
    });
  }

  loadMyLiveSessions(): void {
    this.liveLoading.set(true);
    this.liveError.set('');
    const currentUser = this.authService.currentUser();
    const myId = currentUser?.id ?? currentUser?.email;
    this.liveStreaming.getSessions(0, 100).subscribe({
      next: (page) => {
        const list = (page?.content ?? []).filter((s) => s.teacherId === myId);
        this.myLiveSessions.set(list);
        this.liveLoading.set(false);
      },
      error: () => {
        this.myLiveSessions.set([]);
        this.liveError.set('فشل تحميل الجلسات.');
        this.liveLoading.set(false);
      },
    });
  }

  /** Génère un stream key valide (lettres, chiffres, tirets, underscores uniquement — requis par le backend). */
  private sanitizeStreamKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'stream';
  }

  openCreateLive(): void {
    const user = this.authService.currentUser();
    const isFemale = user?.section?.toLowerCase().includes('femme');
    const raw = 'teacher-' + (user?.nom ?? '') + '-' + Date.now();
    const streamKey = this.sanitizeStreamKey(raw);

    this.liveForm = {
      title: '',
      description: '',
      streamKey,
      accessType: isFemale ? 'INTERNAL' : 'INTERNAL', // Always default to Internal as requested
      adaptiveQualityEnabled: true,
      recordingEnabled: true,
      scheduledStartAt: new Date().toISOString().slice(0, 16),
      scheduledEndAt: '',
    };
    this.liveError.set('');
    this.showLiveForm.set(true);
  }

  closeLiveForm(): void {
    this.showLiveForm.set(false);
  }

  createLive(): void {
    if (!this.liveForm.title?.trim()) {
      this.liveError.set('العنوان مطلوب.');
      return;
    }
    this.savingLive.set(true);
    this.liveError.set('');

    const isFemale = this.currentUserSection().toLowerCase().includes('femme');
    const currentUser = this.authService.currentUser();
    const scheduledStart = this.liveForm.scheduledStartAt
      ? (this.liveForm.scheduledStartAt.length <= 16
        ? this.liveForm.scheduledStartAt + ':00'
        : this.liveForm.scheduledStartAt.replace(/\.\d{3}Z?$/, ''))
      : new Date().toISOString().slice(0, 19);
    const scheduledEnd = this.liveForm.scheduledEndAt?.trim()
      ? (this.liveForm.scheduledEndAt.length <= 16
        ? this.liveForm.scheduledEndAt + ':00'
        : this.liveForm.scheduledEndAt.replace(/\.\d{3}Z?$/, ''))
      : undefined;

    const payload: LiveSessionRequest = {
      ...this.liveForm,
      streamKey: this.sanitizeStreamKey(this.liveForm.streamKey || ''),
      teacherId: currentUser?.id || currentUser?.email || undefined,
      scheduledStartAt: scheduledStart,
      scheduledEndAt: scheduledEnd ?? null,
    };

    this.liveStreaming.create(payload).subscribe({
      next: () => {
        this.savingLive.set(false);
        this.closeLiveForm();
        this.loadMyLiveSessions();

        const msg = isFemale
          ? 'تم إنشاء الجلسة. نظراً لخصوصية قسم النساء، سيتم إخطار الطالبات فقط ولن يسمح بدخول الرجال.'
          : 'تم إنشاء الجلسة. الإشعارات سترسل لمستخدمي نفس القسم فقط.';
        this.liveSuccess.set(msg);
      },
      error: () => {
        this.savingLive.set(false);
        this.liveError.set('فشل إنشاء الجلسة.');
      },
    });
  }

  startLive(s: LiveSession): void {
    this.liveStreaming.startStream(s.id).subscribe({
      next: () => {
        this.loadMyLiveSessions();
        this.liveSuccess.set('تم بدء البث. تم إرسال إشعار للمستخدمين من نفس القسم فقط.');
      },
      error: () => this.liveError.set('فشل بدء البث.'),
    });
  }

  endLive(s: LiveSession): void {
    this.liveStreaming.endStream(s.id).subscribe({
      next: () => this.loadMyLiveSessions(),
      error: () => this.liveError.set('فشل إيقاف البث.'),
    });
  }

  goToWatch(s: LiveSession): void {
    this.router.navigate(['/live', s.id]);
  }

  goToBroadcast(s: LiveSession): void {
    // Porting Studio functionality: instead of redirect, we can open studio
    this.openStudio(s);
  }

  // ──── Studio Mode Logic (Sync from SuperAdmin) ────

  openStudio(session: LiveSession): void {
    this.closeStudio();
    this.selectedSessionForStudio.set(session);
    this.studioSessionDetails.set(null);
    this.studioComments.set([]);
    this.loadStudioSessionDetails();
    this.loadStudioComments();
    this.startCommentsPolling();
    // Auto-scroll to studio section might be needed or just show it
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeStudio(): void {
    this.stopStudioCamera();
    this.stopCommentsPolling();
    this.selectedSessionForStudio.set(null);
    this.studioSessionDetails.set(null);
    this.studioComments.set([]);
  }

  loadStudioSessionDetails(): void {
    const session = this.selectedSessionForStudio();
    if (!session) return;
    this.liveStreaming.getSessionById(session.id).subscribe({
      next: (s) => {
        this.studioSessionDetails.set(s ?? null);
        if (s) this.selectedSessionForStudio.set(s);
      },
      error: () => this.studioSessionDetails.set(null),
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
        setTimeout(() => {
          const video = this.studioVideoRef?.nativeElement;
          if (video) {
            video.srcObject = stream;
            video.play().catch(() => { });
          }
        }, 100);
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
    const session = this.selectedSessionForStudio();
    if (!session) return;
    this.studioCommentsLoading.set(true);
    this.liveStreaming.getSessionComments(session.id).subscribe({
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
    const session = this.selectedSessionForStudio();
    if (!session) return;
    this.commentsPollSub = interval(5000).subscribe(() => {
      const current = this.selectedSessionForStudio();
      if (current) {
        this.liveStreaming.getSessionComments(current.id).subscribe({
          next: (list) => this.studioComments.set(list ?? []),
        });
      }
    });
  }

  private stopCommentsPolling(): void {
    if (this.commentsPollSub) {
      this.commentsPollSub.unsubscribe();
      this.commentsPollSub = null;
    }
  }

  sendStudioChatMessage(): void {
    const content = this.chatMessage()?.trim();
    const session = this.selectedSessionForStudio();
    if (!content || !session) return;
    this.studioCommentError.set('');
    this.liveStreaming.addSessionComment(session.id, { content }).subscribe({
      next: (c) => {
        if (c) {
          this.studioComments.update(comments => [...comments, c]);
          this.chatMessage.set('');
        } else {
          this.studioCommentError.set('تعذر إرسال التعليق.');
        }
      },
      error: () => this.studioCommentError.set('تعذر إرسال التعليق.'),
    });
  }

  ngOnDestroy(): void {
    this.closeStudio();
  }

  loadAbsencesData(): void {
    this.teacherDashboard.getMyClasses().subscribe((list) => this.classesForAbsence.set(list));
    this.teacherDashboard.getMyScheduleSlots().subscribe((list) => this.scheduleSlotsForAbsence.set(list));
    const roomId = this.selectedAbsenceRoomId();
    if (roomId) this.loadAbsencesForRoom(roomId);
  }

  onAbsenceRoomChange(roomId: string): void {
    this.selectedAbsenceRoomId.set(roomId);
    if (roomId) {
      this.teacherDashboard.getStudentsByClass(roomId).subscribe((list) => this.studentsForAbsence.set(list));
      this.teacherDashboard.getAbsencesByClass(roomId).subscribe((list) => this.absencesList.set(list));
    } else {
      this.studentsForAbsence.set([]);
      this.absencesList.set([]);
    }
  }

  loadAbsencesForRoom(roomId: string): void {
    this.absenceLoading.set(true);
    this.teacherDashboard.getAbsencesByClass(roomId).subscribe({
      next: (list) => {
        this.absencesList.set(list);
        this.absenceLoading.set(false);
      },
      error: () => this.absenceLoading.set(false),
    });
  }

  openAbsenceForm(): void {
    this.absenceForm = {
      studentId: '',
      scheduleSlotId: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'UNJUSTIFIED',
    };
    this.absenceError.set('');
    this.showAbsenceForm.set(true);
  }

  closeAbsenceForm(): void {
    this.showAbsenceForm.set(false);
  }

  saveAbsence(): void {
    const req = this.absenceForm as StudentAbsenceRequest;
    if (!req.studentId || !req.scheduleSlotId || !req.date) {
      this.absenceError.set('الطالب، الحصة والتاريخ مطلوبون.');
      return;
    }
    this.savingAbsence.set(true);
    this.absenceError.set('');
    this.teacherDashboard.markAbsence(req).subscribe({
      next: () => {
        this.savingAbsence.set(false);
        this.closeAbsenceForm();
        const roomId = this.selectedAbsenceRoomId();
        if (roomId) this.teacherDashboard.getAbsencesByClass(roomId).subscribe((list) => this.absencesList.set(list));
      },
      error: (e) => {
        this.savingAbsence.set(false);
        this.absenceError.set(e?.error?.message || 'فشل تسجيل الغياب.');
      },
    });
  }

  loadGradesData(): void {
    this.teacherDashboard.getMyCourses().subscribe((list) => this.coursesForGrade.set(list));
    this.teacherDashboard.getMyClasses().subscribe(() => { });
    const roomId = this.selectedGradeRoomId();
    const courseId = this.selectedGradeCourseId();
    if (roomId) this.teacherDashboard.getStudentsByClass(roomId).subscribe((list) => this.studentsForGrade.set(list));
    if (courseId) this.teacherDashboard.getGradesByCourse(courseId).subscribe((list) => this.gradesList.set(list));
  }

  onGradeRoomChange(roomId: string): void {
    this.selectedGradeRoomId.set(roomId);
    if (roomId) {
      this.teacherDashboard.getStudentsByClass(roomId).subscribe((list) => this.studentsForGrade.set(list));
    } else {
      this.studentsForGrade.set([]);
    }
  }

  onGradeCourseChange(courseId: string): void {
    this.selectedGradeCourseId.set(courseId);
    if (courseId) {
      this.teacherDashboard.getGradesByCourse(courseId).subscribe((list) => this.gradesList.set(list));
    } else {
      this.gradesList.set([]);
    }
  }

  openGradeForm(): void {
    this.gradeForm = {
      studentId: '',
      courseId: this.selectedGradeCourseId() || '',
      value: 0,
      gradeDate: new Date().toISOString().slice(0, 10),
    };
    this.gradeError.set('');
    this.showGradeForm.set(true);
  }

  closeGradeForm(): void {
    this.showGradeForm.set(false);
  }

  saveGrade(): void {
    const req = this.gradeForm as StudentGradeRequest;
    if (!req.studentId || !req.courseId || req.value == null) {
      this.gradeError.set('الطالب، المقرر والنقطة مطلوبون.');
      return;
    }
    this.savingGrade.set(true);
    this.gradeError.set('');
    this.teacherDashboard.addGrade(req).subscribe({
      next: () => {
        this.savingGrade.set(false);
        this.closeGradeForm();
        const courseId = this.selectedGradeCourseId();
        if (courseId) this.teacherDashboard.getGradesByCourse(courseId).subscribe((list) => this.gradesList.set(list));
      },
      error: (e) => {
        this.savingGrade.set(false);
        this.gradeError.set(e?.error?.message || 'فشل إضافة النقطة.');
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  statusLabel(s: LiveSessionStatus): string {
    return this.statusLabels[s] ?? s;
  }

  slotDayLabel(day: number | undefined): string {
    if (day === undefined) return '';
    return this.dayLabels[day] ?? '';
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }
}
