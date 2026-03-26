import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TeacherDashboardService } from './teacher-dashboard.service';
import { StudentAbsenceRequest, StudentGradeRequest, AbsenceStatus } from '@features/models/teacher-dashboard/teacher-dashboard.model';

describe('TeacherDashboardService', () => {
  let service: TeacherDashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeacherDashboardService]
    });
    service = TestBed.inject(TeacherDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get teacher classes', () => {
    service.getMyClasses().subscribe(classes => {
      expect(classes).toEqual([]);
    });

    const req = httpMock.expectOne('/teacher/classes');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should mark absence', () => {
    const request: StudentAbsenceRequest = { studentId: 'S1', scheduleSlotId: 'SS1', date: '2023-01-01', status: AbsenceStatus.ABSENT };
    const mockResponse = { id: 'A1', ...request };

    service.markAbsence(request).subscribe(absence => {
      expect(absence?.id).toBe('A1');
    });

    const req = httpMock.expectOne('/teacher/absences');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should add a grade', () => {
    const request: StudentGradeRequest = { studentId: 'S1', courseId: 'C1', value: 18, gradeDate: '2023-01-01', comment: 'Excellent' };
    const mockResponse = { id: 'G1', ...request };

    service.addGrade(request).subscribe(grade => {
      expect(grade?.id).toBe('G1');
      expect(grade?.value).toBe(18);
    });

    const req = httpMock.expectOne('/teacher/grades');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
