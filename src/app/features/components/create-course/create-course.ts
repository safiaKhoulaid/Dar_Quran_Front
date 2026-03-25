import {
    ChangeDetectionStrategy,
    Component,
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
import { CourseService } from '@features/services/courseService/course.service';
import { StorageService } from '@features/services/storageService/storage.service';
import { CourseRequest, CourseResponse } from '@features/models/course/course.model';

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
        private courseService: CourseService,
        private storageService: StorageService,
    ) {
        this.initializeForm();
    }

    ngOnInit() {
        this.loadCourses();
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
            error: () => {
                this.uploadingResourceKeys.delete(key);
                this.errorMessage = 'فشل رفع أحد ملفات الموارد.';
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
                },
                error: () => {
                    this.uploadingThumbnail = false;
                    this.errorMessage = 'فشل رفع الصورة المصغرة. حاول مرة أخرى.';
                    this.thumbnailPreview = null;
                    this.courseForm.patchValue({ miniature: '' });
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
                    const course: Course = {
                        ...created,
                        description: created.description ?? '',
                        lessons: this.courseForm.value.lessons ?? [],
                    } as Course;
                    this.courses = [course, ...this.courses];
                    this.creatingCourse = false;
                    this.successMessage = 'تم إنشاء الدورة بنجاح!';
                    setTimeout(() => {
                        this.successMessage = '';
                        this.resetForm();
                    }, 2500);
                },
                error: () => {
                    this.creatingCourse = false;
                    this.errorMessage = 'حدث خطأ أثناء إنشاء الدورة.';
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

    loadCourses() {
        this.courseService.getAll(0, 100).subscribe({
            next: (page) => {
                this.courses = (page.content ?? []).map(c => ({
                    ...c,
                    description: c.description ?? '',
                    lessons: [],
                } as Course));
            },
            error: () => {
                this.courses = [];
            }
        });
    }

    deleteCourse(courseId: string) {
        this.courseService.delete(courseId).subscribe({
            next: () => {
                this.courses = this.courses.filter(c => c.id !== courseId);
            },
            error: () => {
                this.errorMessage = 'تعذر حذف الدورة.';
            }
        });
    }

    // ─── Utils ──────────────────────────────────────────────

    generateId(): string {
        return 'id_' + Math.random().toString(36).substring(2, 11);
    }

    private resourceKey(lessonIndex: number, resourceIndex: number): string {
        return `${lessonIndex}-${resourceIndex}`;
    }
}
