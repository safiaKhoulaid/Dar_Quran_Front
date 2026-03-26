import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CourseService, PageResponse } from './course.service';
import { CourseRequest, CourseResponse } from '@features/models/course/course.model';

describe('CourseService', () => {
  let service: CourseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CourseService]
    });
    service = TestBed.inject(CourseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all courses with default pagination', () => {
    const mockPage: PageResponse<CourseResponse> = {
      content: [{ id: '1', title: 'Course 1', isPublic: true } as CourseResponse],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 100
    };

    service.getAll().subscribe(page => {
      expect(page.content.length).toBe(1);
      expect(page.totalElements).toBe(1);
    });

    const req = httpMock.expectOne('/courses?page=0&size=100');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should get course by ID', () => {
    const mockCourse: CourseResponse = { id: '2', title: 'Test Course', isPublic: false } as CourseResponse;

    service.getById('2').subscribe(course => {
      expect(course.id).toBe('2');
      expect(course.title).toBe('Test Course');
    });

    const req = httpMock.expectOne('/courses/2');
    expect(req.request.method).toBe('GET');
    req.flush(mockCourse);
  });

  it('should create a course', () => {
    const request: CourseRequest = { title: 'New Course', description: 'Desc', isPublic: true, level: 'BEGINNER' };
    const mockResponse: CourseResponse = { ...request, id: '3' } as CourseResponse;

    service.create(request).subscribe(course => {
      expect(course.id).toBe('3');
      expect(course.title).toBe('New Course');
    });

    const req = httpMock.expectOne('/courses');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should update a course', () => {
    const request: CourseRequest = { title: 'Updated Course', isPublic: false, level: 'ADVANCED' };
    const mockResponse: CourseResponse = { ...request, id: '1' } as CourseResponse;

    service.update('1', request).subscribe(course => {
      expect(course.title).toBe('Updated Course');
    });

    const req = httpMock.expectOne('/courses/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a course', () => {
    service.delete('1').subscribe(res => {
      expect(res).toBeUndefined(); // Assuming void
    });

    const req = httpMock.expectOne('/courses/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
