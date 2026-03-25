import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LessonService } from './lesson.service';
import { LessonRequest, LessonResponse } from '@features/models/course/lesson.model';

describe('LessonService', () => {
  let service: LessonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LessonService]
    });
    service = TestBed.inject(LessonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get lessons by course ID', () => {
    const mockLessons: LessonResponse[] = [
      { id: '1', title: 'Lesson 1', courseId: 'C1', orderIndex: 1 } as LessonResponse
    ];

    service.getByCourseId('C1').subscribe(lessons => {
      expect(lessons.length).toBe(1);
      expect(lessons[0].title).toBe('Lesson 1');
    });

    const req = httpMock.expectOne('/courses/C1/lessons');
    expect(req.request.method).toBe('GET');
    req.flush(mockLessons);
  });

  it('should create a lesson', () => {
    const request: LessonRequest = { title: 'New Lesson', courseId: 'C1', orderIndex: 2 } as LessonRequest;
    const mockResponse: LessonResponse = { ...request, id: '2' } as LessonResponse;

    service.create(request).subscribe(lesson => {
      expect(lesson.id).toBe('2');
      expect(lesson.title).toBe('New Lesson');
    });

    const req = httpMock.expectOne('/lessons');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should update a lesson', () => {
    const request: LessonRequest = { title: 'Updated Lesson', courseId: 'C1', orderIndex: 2 } as LessonRequest;
    const mockResponse: LessonResponse = { ...request, id: '1' } as LessonResponse;

    service.update('1', request).subscribe(lesson => {
      expect(lesson.title).toBe('Updated Lesson');
    });

    const req = httpMock.expectOne('/lessons/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a lesson', () => {
    service.delete('1').subscribe(res => {
      expect(res).toBeUndefined();
    });

    const req = httpMock.expectOne('/lessons/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
