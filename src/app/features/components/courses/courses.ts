import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { CourseService } from '@features/services/courseService/course.service';
import { LessonService } from '@features/services/lessonService/lesson.service';
import { AuthService } from '@features/services/authService/auth-service';
import { CourseResponse } from '@features/models/course/course.model';
import { LessonResponse } from '@features/models/course/lesson.model';
import { ResourceResponse } from '@features/models/course/resource.model';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent implements OnInit {
  private courseService = inject(CourseService);
  private lessonService = inject(LessonService);
  private authService = inject(AuthService);

  courses = signal<CourseResponse[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Map to store lessons for expanded courses
  expandedLessons = signal<Map<string, LessonResponse[]>>(new Map());
  loadingLessons = signal<Map<string, boolean>>(new Map());
  selectedLessonByCourse = signal<Map<string, string>>(new Map());

  // Derived state to filter courses
  filteredCourses = computed(() => {
    const allCourses = this.courses();
    const isAuth = !!this.authService.currentUser();
    if (isAuth) {
      return allCourses;
    }
    // Only return public courses if not authenticated
    return allCourses.filter(c => c.isPublic);
  });

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.isLoading.set(true);
    this.error.set(null);
    this.courseService.getAll(0, 100).subscribe({
      next: (response) => {
        this.courses.set(response.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('حدث خطأ أثناء تحميل الدورات.');
        this.isLoading.set(false);
      }
    });
  }

  toggleCourse(courseId: string) {
    const lessonsMap = this.expandedLessons();
    
    if (lessonsMap.has(courseId)) {
      const newMap = new Map(lessonsMap);
      newMap.delete(courseId);
      this.expandedLessons.set(newMap);
    } else {
      this.loadLessonsForCourse(courseId);
    }
  }

  loadLessonsForCourse(courseId: string) {
    const loadMap = new Map(this.loadingLessons());
    loadMap.set(courseId, true);
    this.loadingLessons.set(loadMap);

    this.lessonService.getByCourseId(courseId).subscribe({
      next: (lessons) => {
        // Sort lessons by orderIndex
        const sortedLessons = lessons.sort((a, b) => a.orderIndex - b.orderIndex);
        const newLessonsMap = new Map(this.expandedLessons());
        newLessonsMap.set(courseId, sortedLessons);
        this.expandedLessons.set(newLessonsMap);
        if (sortedLessons.length > 0) {
          const selection = new Map(this.selectedLessonByCourse());
          selection.set(courseId, sortedLessons[0].id);
          this.selectedLessonByCourse.set(selection);
        }
        
        const newLoadMap = new Map(this.loadingLessons());
        newLoadMap.set(courseId, false);
        this.loadingLessons.set(newLoadMap);
      },
      error: (err) => {
        console.error('Error loading lessons', err);
        const newLoadMap = new Map(this.loadingLessons());
        newLoadMap.set(courseId, false);
        this.loadingLessons.set(newLoadMap);
      }
    });
  }

  selectLesson(courseId: string, lessonId: string) {
    const selection = new Map(this.selectedLessonByCourse());
    selection.set(courseId, lessonId);
    this.selectedLessonByCourse.set(selection);
  }

  getSelectedLesson(courseId: string): LessonResponse | null {
    const lessons = this.expandedLessons().get(courseId) ?? [];
    const selectedId = this.selectedLessonByCourse().get(courseId);
    if (!selectedId) return lessons[0] ?? null;
    return lessons.find(l => l.id === selectedId) ?? lessons[0] ?? null;
  }

  getMainResource(lesson: LessonResponse | null): ResourceResponse | null {
    if (!lesson?.resources?.length) return null;
    const prioritized = [...lesson.resources];
    const video = prioritized.find(r => r.type === 'VIDEO');
    if (video) return video;
    const pdf = prioritized.find(r => r.type === 'PDF');
    if (pdf) return pdf;
    const text = prioritized.find(r => r.type === 'TEXT');
    return text ?? prioritized[0] ?? null;
  }

  getSecondaryResources(lesson: LessonResponse | null): ResourceResponse[] {
    if (!lesson?.resources?.length) return [];
    const main = this.getMainResource(lesson);
    return lesson.resources.filter(r => r.id !== main?.id);
  }
}
