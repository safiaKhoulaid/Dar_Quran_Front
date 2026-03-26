import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService } from '@features/services/courseService/course.service';
import { AuthService } from '@features/services/authService/auth-service';
import { CourseResponse } from '@features/models/course/course.model';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent implements OnInit {
  private courseService = inject(CourseService);
  private authService = inject(AuthService);

  courses = signal<CourseResponse[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

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

  levelLabels: Record<string, string> = {
    BEGINNER: 'مبتدئ',
    INTERMEDIATE: 'متوسط',
    ADVANCED: 'متقدم',
  };

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
      error: () => {
        this.error.set('حدث خطأ أثناء تحميل الدورات.');
        this.isLoading.set(false);
      }
    });
  }

  getLevelLabel(level: string): string {
    return this.levelLabels[level] ?? level;
  }
}
