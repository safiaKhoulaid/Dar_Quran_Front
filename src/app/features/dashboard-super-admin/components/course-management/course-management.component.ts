import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService } from '@features/services/courseService/course.service';
import { LessonService } from '@features/services/lessonService/lesson.service';
import { ResourceService } from '@features/services/resourceService/resource.service';
import type { CourseResponse, CourseRequest, CourseLevel, CourseStatus } from '@features/models/course/course.model';
import type { LessonRequest, LessonResponse } from '@features/models/course/lesson.model';
import type { ResourceRequest, ResourceResponse, ResourceType } from '@features/models/course/resource.model';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-course-management',
    imports: [CommonModule, FormsModule],
    templateUrl: './course-management.component.html',
    styleUrls: ['../../dashboard-super-admin.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseManagementComponent implements OnInit {
    private courseService = inject(CourseService);
    private lessonService = inject(LessonService);
    private resourceService = inject(ResourceService);

    list = signal<CourseResponse[]>([]);
    loading = signal(false);
    loadingSubmit = signal(false);
    loadingDelete = signal<string | null>(null); // holds the id being deleted

    successMessage = signal('');
    errorMessage = signal('');

    showFormModal = signal(false);
    showDetailsModal = signal(false);
    isEditing = signal(false);
    editingId = signal<string | null>(null);
    detailsCourse = signal<CourseResponse | null>(null);

    searchQuery = signal('');
    filterStatus = signal<CourseStatus | ''>('');
    filterLevel = signal<CourseLevel | ''>('');

    formModel: CourseRequest = this.emptyForm();

    readonly levelLabels: Record<CourseLevel, string> = {
        BEGINNER: 'مبتدئ',
        INTERMEDIATE: 'متوسط',
        ADVANCED: 'متقدم',
    };

    readonly statusLabels: Record<CourseStatus, string> = {
        DRAFT: 'مسودة',
        PUBLISHED: 'منشور',
        ARCHIVED: 'أرشيف',
    };

    readonly levels: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    readonly statuses: CourseStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

    /** Cours sélectionné pour la hiérarchie دروس / موارد */
    structureCourse = signal<CourseResponse | null>(null);
    structureLessons = signal<LessonResponse[]>([]);
    loadingStructure = signal(false);
    showStructureModal = signal(false);

    showLessonModal = signal(false);
    lessonFormSaving = signal(false);
    editingLessonId = signal<string | null>(null);
    lessonForm: LessonRequest = { title: '', description: '', orderIndex: 1, courseId: '' };

    showResourceModal = signal(false);
    resourceFormSaving = signal(false);
    resourceTargetLessonId = signal<string | null>(null);
    resourceForm: ResourceRequest = { name: '', fileUrl: '', type: 'PDF', lessonId: '' };

    readonly resourceTypes: ResourceType[] = ['TEXT', 'PDF', 'VIDEO'];

    filteredList = computed(() => {
        const q = this.searchQuery().toLowerCase();
        const st = this.filterStatus();
        const lv = this.filterLevel();
        return this.list().filter(c => {
            const matchQ = !q || c.title.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q);
            const matchSt = !st || c.status === st;
            const matchLv = !lv || c.level === lv;
            return matchQ && matchSt && matchLv;
        });
    });

    ngOnInit(): void {
        this.loadList();
    }

    loadList(): void {
        this.loading.set(true);
        this.courseService.getAll(0, 500).pipe(finalize(() => this.loading.set(false))).subscribe({
            next: page => this.list.set(page?.content ?? []),
            error: () => this.setError('فشل تحميل قائمة المقررات.')
        });
    }

    private emptyForm(): CourseRequest {
        return { title: '', description: '', isPublic: false, level: 'BEGINNER', status: 'DRAFT' };
    }

    openAddModal(): void {
        this.isEditing.set(false);
        this.editingId.set(null);
        this.formModel = this.emptyForm();
        this.showFormModal.set(true);
    }

    openEditModal(course: CourseResponse): void {
        this.isEditing.set(true);
        this.editingId.set(course.id);
        this.formModel = {
            title: course.title,
            description: course.description ?? '',
            miniature: course.miniature,
            slug: course.slug,
            isPublic: course.isPublic,
            level: course.level,
            status: course.status,
        };
        this.showFormModal.set(true);
    }

    closeFormModal(): void {
        this.showFormModal.set(false);
        this.errorMessage.set('');
    }

    openDetailsModal(course: CourseResponse): void {
        this.detailsCourse.set({ ...course });
        this.showDetailsModal.set(true);
    }

    closeDetailsModal(): void {
        this.showDetailsModal.set(false);
        this.detailsCourse.set(null);
    }

    submitForm(): void {
        if (!this.formModel.title?.trim()) {
            this.errorMessage.set('عنوان المقرر مطلوب');
            return;
        }
        this.loadingSubmit.set(true);
        const id = this.editingId();

        const op = id
            ? this.courseService.update(id, this.formModel)
            : this.courseService.create(this.formModel);

        op.pipe(finalize(() => this.loadingSubmit.set(false))).subscribe({
            next: (result) => {
                if (id) {
                    this.list.update(items => items.map(c => c.id === id ? result : c));
                    this.setSuccess('تم تحديث المقرر بنجاح');
                } else {
                    this.list.update(items => [result, ...items]);
                    this.setSuccess('تمت إضافة المقرر بنجاح');
                }
                this.closeFormModal();
            },
            error: () => this.setError(id ? 'فشل في تحديث المقرر.' : 'فشل في إضافة المقرر.')
        });
    }

    confirmDelete(course: CourseResponse): void {
        if (!confirm(`هل أنت متأكد من حذف المقرر "${course.title}" بشكل نهائي؟`)) return;
        this.loadingDelete.set(course.id);
        this.courseService.delete(course.id).pipe(finalize(() => this.loadingDelete.set(null))).subscribe({
            next: () => {
                this.list.update(items => items.filter(c => c.id !== course.id));
                this.setSuccess('تم حذف المقرر بنجاح');
            },
            error: () => this.setError('فشل في حذف المقرر.')
        });
    }

    levelLabel(level: CourseLevel): string {
        return this.levelLabels[level] ?? level;
    }

    statusLabel(status?: CourseStatus): string {
        return status ? (this.statusLabels[status] ?? status) : '—';
    }

    private setSuccess(msg: string): void {
        this.successMessage.set(msg);
        this.errorMessage.set('');
        setTimeout(() => this.successMessage.set(''), 4000);
    }

    private setError(msg: string): void {
        this.errorMessage.set(msg);
        setTimeout(() => this.errorMessage.set(''), 5000);
    }

    // ─── Structure: cours → leçons → ressources ───

    openStructureModal(course: CourseResponse): void {
        this.structureCourse.set(course);
        this.showStructureModal.set(true);
        this.loadStructureLessons();
    }

    closeStructureModal(): void {
        this.showStructureModal.set(false);
        this.structureCourse.set(null);
        this.structureLessons.set([]);
        this.closeLessonModal();
        this.closeResourceModal();
    }

    loadStructureLessons(): void {
        const c = this.structureCourse();
        if (!c) return;
        this.loadingStructure.set(true);
        this.lessonService.getByCourseId(c.id).pipe(finalize(() => this.loadingStructure.set(false))).subscribe({
            next: (lessons) => {
                const sorted = [...(lessons ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
                this.structureLessons.set(sorted);
            },
            error: () => this.setError('فشل تحميل الدروس.'),
        });
    }

    lessonResources(lesson: LessonResponse): ResourceResponse[] {
        return [...(lesson.resources ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    }

    openAddLessonModal(): void {
        const c = this.structureCourse();
        if (!c) return;
        this.editingLessonId.set(null);
        const nextOrder = (this.structureLessons().reduce((m, l) => Math.max(m, l.orderIndex ?? 0), 0) || 0) + 1;
        this.lessonForm = { title: '', description: '', orderIndex: nextOrder, courseId: c.id };
        this.showLessonModal.set(true);
    }

    openEditLessonModal(lesson: LessonResponse): void {
        const c = this.structureCourse();
        if (!c) return;
        this.editingLessonId.set(lesson.id);
        this.lessonForm = {
            title: lesson.title,
            description: lesson.description ?? '',
            orderIndex: lesson.orderIndex,
            courseId: c.id,
        };
        this.showLessonModal.set(true);
    }

    closeLessonModal(): void {
        this.showLessonModal.set(false);
        this.editingLessonId.set(null);
    }

    submitLesson(): void {
        if (!this.lessonForm.title?.trim()) {
            this.setError('عنوان الدرس مطلوب');
            return;
        }
        this.lessonFormSaving.set(true);
        const id = this.editingLessonId();
        const op = id
            ? this.lessonService.update(id, this.lessonForm)
            : this.lessonService.create(this.lessonForm);
        op.pipe(finalize(() => this.lessonFormSaving.set(false))).subscribe({
            next: () => {
                this.setSuccess(id ? 'تم تحديث الدرس' : 'تم إضافة الدرس');
                this.closeLessonModal();
                this.loadStructureLessons();
                this.loadList();
            },
            error: () => this.setError(id ? 'فشل تحديث الدرس' : 'فشل إضافة الدرس'),
        });
    }

    confirmDeleteLesson(lesson: LessonResponse): void {
        if (!confirm(`حذف الدرس "${lesson.title}" وجميع الموارد المرتبطة؟`)) return;
        this.lessonService.delete(lesson.id).subscribe({
            next: () => {
                this.setSuccess('تم حذف الدرس');
                this.loadStructureLessons();
                this.loadList();
            },
            error: () => this.setError('فشل حذف الدرس'),
        });
    }

    openAddResourceModal(lessonId: string): void {
        this.resourceTargetLessonId.set(lessonId);
        this.resourceForm = { name: '', fileUrl: '', type: 'PDF', lessonId };
        this.showResourceModal.set(true);
    }

    closeResourceModal(): void {
        this.showResourceModal.set(false);
        this.resourceTargetLessonId.set(null);
    }

    submitResource(): void {
        if (!this.resourceForm.name?.trim() || !this.resourceForm.fileUrl?.trim()) {
            this.setError('اسم المورد ورابط الملف مطلوبان');
            return;
        }
        const lid = this.resourceTargetLessonId();
        if (!lid) return;
        this.resourceForm.lessonId = lid;
        const payload: ResourceRequest = {
            name: this.resourceForm.name.trim(),
            fileUrl: this.resourceForm.fileUrl.trim(),
            type: this.resourceForm.type,
            lessonId: lid,
        };
        const sz = this.resourceForm.size;
        if (sz != null && !Number.isNaN(Number(sz)) && Number(sz) > 0) {
            payload.size = Number(sz);
        }
        this.resourceFormSaving.set(true);
        this.resourceService
            .create(payload)
            .pipe(finalize(() => this.resourceFormSaving.set(false)))
            .subscribe({
                next: () => {
                    this.setSuccess('تمت إضافة المورد');
                    this.closeResourceModal();
                    this.loadStructureLessons();
                },
                error: () => this.setError('فشل إضافة المورد'),
            });
    }

    confirmDeleteResource(res: ResourceResponse): void {
        if (!confirm(`حذف المورد "${res.name}"؟`)) return;
        this.resourceService.delete(res.id).subscribe({
            next: () => {
                this.setSuccess('تم حذف المورد');
                this.loadStructureLessons();
            },
            error: () => this.setError('فشل حذف المورد'),
        });
    }

    resourceTypeLabel(t: ResourceType): string {
        const map: Record<ResourceType, string> = { TEXT: 'نص', PDF: 'PDF', VIDEO: 'فيديو' };
        return map[t] ?? t;
    }
}
