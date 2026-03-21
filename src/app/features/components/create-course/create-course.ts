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
    level: 'beginner' | 'intermediate' | 'advanced';
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

    constructor(private fb: FormBuilder) {
        this.initializeForm();
    }

    ngOnInit() {
        this.loadCoursesFromLocalStorage();
    }

    initializeForm() {
        this.courseForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(3)]],
            slug: ['', [Validators.required]],
            description: ['', [Validators.required, Validators.minLength(10)]],
            miniature: [''],
            isPublic: [true],
            level: ['beginner', Validators.required],
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
    }

    // ─── Thumbnail ──────────────────────────────────────────

    onThumbnailSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.thumbnailPreview = e.target?.result as string;
                this.courseForm.patchValue({ miniature: this.thumbnailPreview });
            };
            reader.readAsDataURL(file);
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
            const course: Course = { id: this.generateId(), ...this.courseForm.value };
            this.courses = [...this.courses, course];
            this.saveCoursesToLocalStorage();
            this.successMessage = 'تم إنشاء الدورة بنجاح!';
            setTimeout(() => {
                this.successMessage = '';
                this.resetForm();
            }, 3000);
        } else {
            this.courseForm.markAllAsTouched();
        }
    }

    resetForm() {
        this.courseForm.reset({ isPublic: true, level: 'beginner' });
        this.lessonsArray.clear();
        this.thumbnailPreview = null;
    }

    // ─── Local storage ──────────────────────────────────────

    saveCoursesToLocalStorage() {
        localStorage.setItem('courses', JSON.stringify(this.courses));
    }

    loadCoursesFromLocalStorage() {
        const stored = localStorage.getItem('courses');
        this.courses = stored ? JSON.parse(stored) : [];
    }

    deleteCourse(courseId: string) {
        this.courses = this.courses.filter(c => c.id !== courseId);
        this.saveCoursesToLocalStorage();
    }

    // ─── Utils ──────────────────────────────────────────────

    generateId(): string {
        return 'id_' + Math.random().toString(36).substring(2, 11);
    }
}
