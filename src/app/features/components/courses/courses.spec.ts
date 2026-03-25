import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoursesComponent } from './courses';
import { CourseService } from '@features/services/courseService/course.service';
import { LessonService } from '@features/services/lessonService/lesson.service';
import { AuthService } from '@features/services/authService/auth-service';
import { of, throwError } from 'rxjs';
import { CourseResponse } from '@features/models/course/course.model';
import { LessonResponse } from '@features/models/course/lesson.model';
import { signal } from '@angular/core';

import { vi } from 'vitest';

describe('CoursesComponent', () => {
  let component: CoursesComponent;
  let fixture: ComponentFixture<CoursesComponent>;

  let mockCourseService: any;
  let mockLessonService: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockCourseService = { getAll: vi.fn() };
    mockLessonService = { getByCourseId: vi.fn() };
    mockAuthService = { currentUser: vi.fn() };

    // Mock initial currentUser to be null (unauthenticated)
    mockAuthService.currentUser.mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [CoursesComponent],
      providers: [
        { provide: CourseService, useValue: mockCourseService },
        { provide: LessonService, useValue: mockLessonService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CoursesComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load courses on init and filter out private courses if not authenticated', () => {
    const mockCourses: CourseResponse[] = [
      { id: '1', title: 'Public Course', isPublic: true } as CourseResponse,
      { id: '2', title: 'Private Course', isPublic: false } as CourseResponse
    ];
    
    mockCourseService.getAll.mockReturnValue(of({ content: mockCourses, totalElements: 2, totalPages: 1 } as any));
    
    fixture.detectChanges(); // Trigger ngOnInit

    expect(mockCourseService.getAll).toHaveBeenCalledWith(0, 100);
    expect(component.courses().length).toBe(2);
    expect(component.isLoading()).toBeFalsy ();
    
    // Check computed signal
    const visibleCourses = component.filteredCourses();
    expect(visibleCourses.length).toBe(1);
    expect(visibleCourses[0].id).toBe('1');
  });

  it('should show all courses if user is authenticated', () => {
    const mockCourses: CourseResponse[] = [
      { id: '1', title: 'Public Course', isPublic: true } as CourseResponse,
      { id: '2', title: 'Private Course', isPublic: false } as CourseResponse
    ];
    
    mockAuthService.currentUser.mockReturnValue({ id: 'user1' } as any);
    mockCourseService.getAll.mockReturnValue(of({ content: mockCourses, totalElements: 2, totalPages: 1 } as any));
    
    fixture.detectChanges();

    const visibleCourses = component.filteredCourses();
    expect(visibleCourses.length).toBe(2);
  });

  it('should handle error when loading courses fails', () => {
    mockCourseService.getAll.mockReturnValue(throwError(() => new Error('Server error')));
    
    fixture.detectChanges();

    expect(component.error()).toBe('حدث خطأ أثناء تحميل الدورات.');
    expect(component.isLoading()).toBeFalse();
  });

  it('should load lessons when a course is toggled', () => {
    const mockLessons: LessonResponse[] = [
      { id: 'l1', title: 'Lesson 1', orderIndex: 1 } as LessonResponse
    ];
    
    mockCourseService.getAll.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0 } as any));
    mockLessonService.getByCourseId.mockReturnValue(of(mockLessons));
    
    fixture.detectChanges();

    component.toggleCourse('c1');

    expect(mockLessonService.getByCourseId).toHaveBeenCalledWith('c1');
    expect(component.expandedLessons().get('c1')!.length).toBe(1);
    expect(component.expandedLessons().get('c1')![0].id).toBe('l1');
    expect(component.selectedLessonByCourse().get('c1')).toBe('l1');
  });

  it('should close lessons when a course is toggled off', () => {
    mockCourseService.getAll.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0 } as any));
    fixture.detectChanges();

    // Manually set an expanded lesson
    const lessonsMap = new Map(component.expandedLessons());
    lessonsMap.set('c1', []);
    component.expandedLessons.set(lessonsMap);

    // Toggle off
    component.toggleCourse('c1');

    expect(component.expandedLessons().has('c1')).toBe(false);
    expect(mockLessonService.getByCourseId).not.toHaveBeenCalled();
  });

  it('should correctly select the main resource of a lesson', () => {
    const lessonWithVideo = {
      resources: [
        { id: 'r1', type: 'PDF' },
        { id: 'r2', type: 'VIDEO' }
      ]
    } as LessonResponse;

    const mainResource = component.getMainResource(lessonWithVideo);
    expect(mainResource?.type).toBe('VIDEO');
  });
  
  it('should select PDF as main resource if no VIDEO is available', () => {
    const lessonWithPdf = {
      resources: [
        { id: 'r1', type: 'TEXT' },
        { id: 'r2', type: 'PDF' }
      ]
    } as LessonResponse;

    const mainResource = component.getMainResource(lessonWithPdf);
    expect(mainResource?.type).toBe('PDF');
  });

  it('should filter out the main resource from secondary resources', () => {
    const lesson = {
      resources: [
        { id: 'r1', type: 'PDF' },
        { id: 'r2', type: 'VIDEO' }
      ]
    } as LessonResponse;

    const secondary = component.getSecondaryResources(lesson);
    expect(secondary.length).toBe(1);
    expect(secondary[0].type).toBe('PDF');
  });
});
