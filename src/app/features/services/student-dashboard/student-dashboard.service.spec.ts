import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StudentDashboardService } from './student-dashboard.service';

describe('StudentDashboardService', () => {
  let service: StudentDashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StudentDashboardService]
    });
    service = TestBed.inject(StudentDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch dashboard summary', () => {
    const mockSummary = { studentInfo: {}, statistics: {}, recentGrades: [] };

    service.getDashboard().subscribe(dashboard => {
      expect(dashboard).toBeTruthy();
    });

    const req = httpMock.expectOne('/student/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should handle errors gracefully and return null for dashboard summary', () => {
    service.getDashboard().subscribe(dashboard => {
      expect(dashboard).toBeNull();
    });

    const req = httpMock.expectOne('/student/dashboard');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

  it('should fetch grades', () => {
    service.getGrades().subscribe(grades => {
      expect(grades).toEqual([]);
    });

    const req = httpMock.expectOne('/student/grades');
    req.flush([]);
  });
});
