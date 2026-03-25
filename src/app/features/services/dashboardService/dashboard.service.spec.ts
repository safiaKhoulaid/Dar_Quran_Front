import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService, DashboardStats } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService]
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get dashboard stats successfully', () => {
    const mockStats: DashboardStats = {
      total_students: 150,
      total_teachers: 20,
      total_classes: 10,
      total_male_students: 80,
      total_female_students: 70
    };

    service.getStats().subscribe(stats => {
      expect(stats).toBeTruthy();
      expect(stats?.total_students).toBe(150);
      expect(stats?.total_teachers).toBe(20);
    });

    const req = httpMock.expectOne('/dashboard/stats');
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('should return null on stats error', () => {
    service.getStats().subscribe(stats => {
      expect(stats).toBeNull();
    });

    const req = httpMock.expectOne('/dashboard/stats');
    expect(req.request.method).toBe('GET');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
