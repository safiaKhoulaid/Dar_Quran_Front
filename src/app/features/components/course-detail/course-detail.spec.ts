import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CourseDetailComponent } from './course-detail';
import { CourseService } from '@features/services/courseService/course.service';
import { LessonService } from '@features/services/lessonService/lesson.service';
import { CourseResponse } from '@features/models/course/course.model';
import { LessonResponse } from '@features/models/course/lesson.model';

import { vi } from 'vitest';

describe('CourseDetailComponent', () => {
  let component: CourseDetailComponent;
  let fixture: ComponentFixture<CourseDetailComponent>;

  let mockCourseService: any;
  let mockLessonService: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockCourseService = { getById: vi.fn() };
    mockLessonService = { getByCourseId: vi.fn() };
    mockActivatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({ id: 'course-1' })
      }
    };

    await TestBed.configureTestingModule({
      imports: [CourseDetailComponent],
      providers: [
        provideRouter([]),
        { provide: CourseService, useValue: mockCourseService },
        { provide: LessonService, useValue: mockLessonService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load course and lessons on init', () => {
    const mockCourse: CourseResponse = {
      id: 'course-1',
      title: 'Test Course',
      isPublic: true,
      level: 'BEGINNER',
      numberOfLessons: 2
    } as CourseResponse;

    const mockLessons: LessonResponse[] = [
      { id: 'l1', title: 'Lesson 1', orderIndex: 1 } as LessonResponse,
      { id: 'l2', title: 'Lesson 2', orderIndex: 2 } as LessonResponse
    ];

    mockCourseService.getById.mockReturnValue(of(mockCourse));
    mockLessonService.getByCourseId.mockReturnValue(of(mockLessons));

    fixture.detectChanges();

    expect(mockCourseService.getById).toHaveBeenCalledWith('course-1');
    expect(component.course()).toEqual(mockCourse);
    expect(component.lessons().length).toBe(2);
    expect(component.selectedLessonId()).toBe('l1');
  });

  it('should handle error when loading course fails', () => {
    mockCourseService.getById.mockReturnValue(throwError(() => new Error('Server error')));

    fixture.detectChanges();

    expect(component.error()).toBe('حدث خطأ أثناء تحميل الدورة.');
    expect(component.isLoading()).toBeFalsy();
  });

  it('should select lesson when selectLesson is called', () => {
    const mockCourse: CourseResponse = { id: 'course-1', title: 'Test' } as CourseResponse;
    const mockLessons: LessonResponse[] = [
      { id: 'l1', title: 'Lesson 1', orderIndex: 1 } as LessonResponse,
      { id: 'l2', title: 'Lesson 2', orderIndex: 2 } as LessonResponse
    ];

    mockCourseService.getById.mockReturnValue(of(mockCourse));
    mockLessonService.getByCourseId.mockReturnValue(of(mockLessons));

    fixture.detectChanges();

    component.selectLesson('l2');
    expect(component.selectedLessonId()).toBe('l2');
    expect(component.selectedLesson()?.id).toBe('l2');
  });

  it('should return correct level labels', () => {
    expect(component.getLevelLabel('BEGINNER')).toBe('مبتدئ');
    expect(component.getLevelLabel('INTERMEDIATE')).toBe('متوسط');
    expect(component.getLevelLabel('ADVANCED')).toBe('متقدم');
  });

  it('should correctly identify main resource', () => {
    const lessonWithVideo = {
      resources: [
        { id: 'r1', type: 'PDF' },
        { id: 'r2', type: 'VIDEO' }
      ]
    } as LessonResponse;

    const mainResource = component.getMainResource(lessonWithVideo);
    expect(mainResource?.type).toBe('VIDEO');
  });

  it('should filter out main resource from secondary resources', () => {
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
