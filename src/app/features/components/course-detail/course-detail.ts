import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '@features/services/courseService/course.service';
import { LessonService } from '@features/services/lessonService/lesson.service';
import { CourseResponse } from '@features/models/course/course.model';
import { LessonResponse } from '@features/models/course/lesson.model';
import { ResourceResponse } from '@features/models/course/resource.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private lessonService = inject(LessonService);

  course = signal<CourseResponse | null>(null);
  lessons = signal<LessonResponse[]>([]);
  selectedLessonId = signal<string | null>(null);

  isLoading = signal(true);
  lessonsLoading = signal(false);
  error = signal('');

  selectedLesson = computed(() => {
    const id = this.selectedLessonId();
    if (!id) return null;
    return this.lessons().find(l => l.id === id) ?? null;
  });

  levelLabels: Record<string, string> = {
    BEGINNER: 'مبتدئ',
    INTERMEDIATE: 'متوسط',
    ADVANCED: 'متقدم',
  };

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (!courseId) {
      this.router.navigate(['/courses']);
      return;
    }
    this.loadCourse(courseId);
  }

  loadCourse(id: string): void {
    this.isLoading.set(true);
    this.error.set('');

    this.courseService.getById(id).subscribe({
      next: (course) => {
        if (!course) {
          this.error.set('الدورة غير موجودة.');
          this.isLoading.set(false);
          return;
        }
        this.course.set(course);
        this.isLoading.set(false);
        this.loadLessons(id);
      },
      error: () => {
        this.error.set('حدث خطأ أثناء تحميل الدورة.');
        this.isLoading.set(false);
      },
    });
  }

  loadLessons(courseId: string): void {
    this.lessonsLoading.set(true);
    this.lessonService.getByCourseId(courseId).subscribe({
      next: (lessons) => {
        const sorted = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
        this.lessons.set(sorted);
        if (sorted.length > 0) {
          this.selectedLessonId.set(sorted[0].id);
        }
        this.lessonsLoading.set(false);
      },
      error: () => {
        this.lessonsLoading.set(false);
      },
    });
  }

  selectLesson(lessonId: string): void {
    this.selectedLessonId.set(lessonId);
  }

  getMainResource(lesson: LessonResponse): ResourceResponse | null {
    if (!lesson.resources || lesson.resources.length === 0) return null;
    const video = lesson.resources.find(r => r.type === 'VIDEO');
    if (video) return video;
    const pdf = lesson.resources.find(r => r.type === 'PDF');
    if (pdf) return pdf;
    return lesson.resources[0];
  }

  getSecondaryResources(lesson: LessonResponse): ResourceResponse[] {
    if (!lesson.resources) return [];
    const main = this.getMainResource(lesson);
    if (!main) return lesson.resources;
    return lesson.resources.filter(r => r.id !== main.id);
  }

  getLevelLabel(level: string): string {
    return this.levelLabels[level] ?? level;
  }

  goBack(): void {
    this.router.navigate(['/courses']);
  }
}
