import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CoursesComponent } from './courses';
import { CourseService } from '@features/services/courseService/course.service';
import { AuthService } from '@features/services/authService/auth-service';
import { of, throwError } from 'rxjs';
import { CourseResponse } from '@features/models/course/course.model';

import { vi } from 'vitest';

describe('CoursesComponent', () => {
  let component: CoursesComponent;
  let fixture: ComponentFixture<CoursesComponent>;

  let mockCourseService: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockCourseService = { getAll: vi.fn() };
    mockAuthService = { currentUser: vi.fn() };

    // Mock initial currentUser to be null (unauthenticated)
    mockAuthService.currentUser.mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [CoursesComponent],
      providers: [
        provideRouter([]),
        { provide: CourseService, useValue: mockCourseService },
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
    expect(component.isLoading()).toBeFalsy();

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
    expect(component.isLoading()).toBeFalsy();
  });

  it('should return correct level labels', () => {
    expect(component.getLevelLabel('BEGINNER')).toBe('مبتدئ');
    expect(component.getLevelLabel('INTERMEDIATE')).toBe('متوسط');
    expect(component.getLevelLabel('ADVANCED')).toBe('متقدم');
    expect(component.getLevelLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});
