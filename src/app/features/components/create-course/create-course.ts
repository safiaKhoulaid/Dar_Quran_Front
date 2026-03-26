import {
    ChangeDetectionStrategy,
    Component,
    ChangeDetectorRef,
    OnInit,
} from '@angular/core';
import {
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    FormArray,
    FormControl,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '@features/services/courseService/course.service';
import { LessonService } from '@features/services/lessonService/lesson.service';
import { ResourceService } from '@features/services/resourceService/resource.service';
import { StorageService } from '@features/services/storageService/storage.service';
import { CourseRequest, CourseResponse } from '@features/models/course/course.model';
import { concatMap, from, mapTo, of, toArray } from 'rxjs';

interface Resource {
    id: string;
    name: string;
    type: 'TEXT' | 'PDF' | 'VIDEO';
    url?: string;
}

interface Lesson {
    id: string;
    title: string;
    description: string;
    order: number;
    resources: Resource[];
}

interface Course {
    id: string;
    title: string;
    slug: string;
    description: string;
    miniature?: string;
    isPublic: boolean;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    lessons: Lesson[];
}

@Component({
    selector: 'app-create-course',
    imports: [ReactiveFormsModule],
    templateUrl: './create-course.html',
    styleUrls: ['./create-course.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCourseComponent implements OnInit {
    courseForm!: FormGroup;
    courses: Course[] = [];
    thumbnailPreview: string | null = null;
    successMessage = '';
    errorMessage = '';
    uploadingThumbnail = false;
    creatingCourse = false;
    uploadingResourceKeys = new Set<string>();

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private courseService: CourseService,
        private lessonService: LessonService,
        private resourceService: ResourceService,
        private storageService: StorageService,
        private cdr: ChangeDetectorRef,
    ) {
        this.initializeForm();
    }

    ngOnInit() {
        // Si on arrive depuis le dashboard, on peut demander d'aller directement à l'étape 2 (الدروس).
        const step = this.route.snapshot.queryParamMap.get('step');
        if (step === '2') {
            setTimeout(() => this.scrollToLessons(), 50);
        }
    }

    private scrollToLessons(): void {
        const el = document.getElementById('lessons-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    initializeForm() {
        this.courseForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(3)]],
            slug: ['', [Validators.required]],
            description: ['', [Validators.required, Validators.minLength(10)]],
            miniature: [''],
            isPublic: [true],
            level: ['BEGINNER', Validators.required],
            lessons: this.fb.array([]),
        });
    }

    // ─── Lessons ────────────────────────────────────────────

    get lessonsArray(): FormArray {
        return this.courseForm.get('lessons') as FormArray;
    }

    addLesson() {
        const lessonGroup = this.fb.group({
            id: [this.generateId()],
            title: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', [Validators.required, Validators.minLength(5)]],
            order: [this.lessonsArray.length + 1],
            resources: this.fb.array([]),
        });
        this.lessonsArray.push(lessonGroup);
    }

    removeLesson(index: number) {
        this.lessonsArray.removeAt(index);
    }

    getLessonControl(lessonIndex: number, controlName: string): FormControl {
        return (this.lessonsArray.at(lessonIndex) as FormGroup).get(controlName) as FormControl;
    }

    // ─── Resources ──────────────────────────────────────────

    getResourcesArray(lessonIndex: number): FormArray {
        return (this.lessonsArray.at(lessonIndex) as FormGroup).get('resources') as FormArray;
    }

    getResources(lessonIndex: number) {
        return this.getResourcesArray(lessonIndex).controls;
    }

    getResourceType(lessonIndex: number, resourceIndex: number): string {
        return this.getResourcesArray(lessonIndex).at(resourceIndex).get('type')?.value ?? 'TEXT';
    }

    getResourceControl(lessonIndex: number, resourceIndex: number, controlName: string): FormControl {
        return (this.getResourcesArray(lessonIndex).at(resourceIndex) as FormGroup).get(controlName) as FormControl;
    }

    addResource(lessonIndex: number) {
        const resourceGroup = this.fb.group({
            id: [this.generateId()],
            name: ['', [Validators.required]],
            type: ['TEXT', Validators.required],
            url: [''],
        });
        this.getResourcesArray(lessonIndex).push(resourceGroup);
    }

    removeResource(lessonIndex: number, resourceIndex: number) {
        this.getResourcesArray(lessonIndex).removeAt(resourceIndex);
        this.uploadingResourceKeys.delete(this.resourceKey(lessonIndex, resourceIndex));
    }

    onResourceFileSelect(lessonIndex: number, resourceIndex: number, event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const key = this.resourceKey(lessonIndex, resourceIndex);
        this.uploadingResourceKeys.add(key);
        this.errorMessage = '';
        this.getResourceControl(lessonIndex, resourceIndex, 'name').setValue(
            this.getResourceControl(lessonIndex, resourceIndex, 'name').value || file.name
        );
        this.storageService.upload(file, 'lesson-resources').subscribe({
            next: (res) => {
                this.getResourceControl(lessonIndex, resourceIndex, 'url').setValue(res.url);
                this.uploadingResourceKeys.delete(key);
            },
            error: (err) => {
                this.uploadingResourceKeys.delete(key);
                this.errorMessage = this.extractServerMessage(err, 'فشل رفع أحد ملفات الموارد.');
                this.cdr.markForCheck();
            }
        });
    }

    isResourceUploading(lessonIndex: number, resourceIndex: number): boolean {
        return this.uploadingResourceKeys.has(this.resourceKey(lessonIndex, resourceIndex));
    }

    // ─── Thumbnail ──────────────────────────────────────────

    onThumbnailSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.uploadingThumbnail = true;
            this.errorMessage = '';
            const reader = new FileReader();
            reader.onload = (e) => {
                this.thumbnailPreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
            this.storageService.upload(file, 'course-thumbnails').subscribe({
                next: (res) => {
                    this.courseForm.patchValue({ miniature: res.url });
                    this.uploadingThumbnail = false;
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    this.uploadingThumbnail = false;
                    this.errorMessage = this.extractServerMessage(
                        err,
                        'فشل رفع الصورة المصغرة. حاول مرة أخرى.'
                    );
                    this.thumbnailPreview = null;
                    this.courseForm.patchValue({ miniature: '' });
                    this.cdr.markForCheck();
                }
            });
        }
    }

    removeThumbnail() {
        this.thumbnailPreview = null;
        this.courseForm.patchValue({ miniature: '' });
    }

    // ─── Slug ───────────────────────────────────────────────

    generateSlug(title: string) {
        const slug = title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        this.courseForm.patchValue({ slug });
    }

    // ─── Submit ─────────────────────────────────────────────

    onSubmit() {
        if (this.courseForm.valid && this.lessonsArray.length > 0) {
            if (this.uploadingThumbnail) {
                this.errorMessage = 'يرجى انتظار اكتمال رفع الصورة المصغرة.';
                return;
            }
            if (this.uploadingResourceKeys.size > 0) {
                this.errorMessage = 'يرجى انتظار اكتمال رفع ملفات الموارد.';
                return;
            }
            const lessons = this.courseForm.value.lessons ?? [];
            const hasInvalidResource = lessons.some((lesson: any) =>
                (lesson.resources ?? []).some((resource: any) =>
                    !resource.name || !resource.type || !resource.url
                )
            );
            if (hasInvalidResource) {
                this.errorMessage = 'يرجى إدخال اسم المورد ورفع/إدخال الرابط لكل مورد قبل النشر.';
                return;
            }
            this.creatingCourse = true;
            this.errorMessage = '';
            const payload: CourseRequest = {
                title: this.courseForm.value.title,
                slug: this.courseForm.value.slug,
                description: this.courseForm.value.description,
                miniature: this.courseForm.value.miniature,
                isPublic: this.courseForm.value.isPublic,
                level: this.courseForm.value.level,
                status: 'PUBLISHED',
            };
            this.courseService.create(payload).subscribe({
                next: (created: CourseResponse) => {
                    this.persistLessonsAndResources(created.id, lessons).subscribe({
                        next: () => {
                            this.creatingCourse = false;
                            this.successMessage = 'تم إنشاء الدورة والدروس والموارد بنجاح!';
                            setTimeout(() => {
                                this.successMessage = '';
                                this.resetForm();
                            }, 2500);
                            this.cdr.markForCheck();
                        },
                        error: () => {
                            this.creatingCourse = false;
                            this.errorMessage = 'تم إنشاء الدورة لكن فشل حفظ بعض الدروس أو الموارد.';
                            this.cdr.markForCheck();
                        },
                    });
                },
                error: () => {
                    this.creatingCourse = false;
                    this.errorMessage = 'حدث خطأ أثناء إنشاء الدورة.';
                    this.cdr.markForCheck();
                }
            });
        } else {
            this.courseForm.markAllAsTouched();
        }
    }

    resetForm() {
        this.courseForm.reset({ isPublic: true, level: 'BEGINNER' });
        this.lessonsArray.clear();
        this.thumbnailPreview = null;
    }

    goToCoursesPage() {
        this.router.navigate(['/courses']);
    }

    // ─── Utils ──────────────────────────────────────────────

    generateId(): string {
        return 'id_' + Math.random().toString(36).substring(2, 11);
    }

    private resourceKey(lessonIndex: number, resourceIndex: number): string {
        return `${lessonIndex}-${resourceIndex}`;
    }

    private extractServerMessage(err: any, fallback: string): string {
        const status = err?.status ?? '';
        const body = err?.error;

        const serverMsg =
            (typeof body === 'string' ? body : null) ??
            body?.message ??
            body?.error ??
            err?.message ??
            '';

        if (serverMsg) {
            return status ? `${fallback} (${status}): ${serverMsg}` : `${fallback}: ${serverMsg}`;
        }
        return fallback;
    }

    private persistLessonsAndResources(courseId: string, lessons: any[]) {
        return from(lessons).pipe(
            concatMap((lesson: any, lessonIndex: number) =>
                this.lessonService.create({
                    title: lesson.title,
                    description: lesson.description,
                    orderIndex: Number(lesson.order) || lessonIndex + 1,
                    courseId,
                }).pipe(
                    concatMap((savedLesson) => {
                        const resources = lesson.resources ?? [];
                        if (!resources.length) {
                            return of(savedLesson).pipe(mapTo(void 0));
                        }
                        return from(resources).pipe(
                            concatMap((resource: any) =>
                                this.resourceService.create({
                                    name: resource.name,
                                    fileUrl: resource.url,
                                    type: resource.type,
                                    lessonId: savedLesson.id,
                                })
                            ),
                            toArray(),
                            mapTo(void 0)
                        );
                    })
                )
            ),
            toArray(),
            mapTo(void 0)
        );
    }
}
