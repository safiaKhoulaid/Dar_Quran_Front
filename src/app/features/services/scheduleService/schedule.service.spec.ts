import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ScheduleService } from './schedule.service';
import { ScheduleSlotRequest } from '@features/models/schedule/schedule.model';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ScheduleService]
    });
    service = TestBed.inject(ScheduleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve all schedules with empty array fallback on error', () => {
    service.getAll().subscribe(slots => {
      expect(slots).toEqual([]);
    });

    const req = httpMock.expectOne('/schedule-slots');
    expect(req.request.method).toBe('GET');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

  it('should retrieve schedules by room ID', () => {
    const mockSlots = [{ id: '1', roomId: 'R1', courseTitle: 'Math' }];

    service.getByRoom('R1').subscribe(slots => {
      expect(slots.length).toBe(1);
      expect(slots[0].courseTitle).toBe('Math');
    });

    const req = httpMock.expectOne('/schedule-slots/room/R1');
    expect(req.request.method).toBe('GET');
    req.flush(mockSlots);
  });

  it('should create a new schedule slot', () => {
    const request: ScheduleSlotRequest = { roomId: 'R1', teacherId: 'T1', courseId: 'C1', dayOfWeek: 1, startTime: '08:00', endTime: '10:00' };
    const mockResponse = { id: 'S1', ...request };

    service.create(request).subscribe(slot => {
      expect(slot?.id).toBe('S1');
    });

    const req = httpMock.expectOne('/schedule-slots');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should delete a schedule slot and handle boolean result', () => {
    service.delete('1').subscribe(res => {
      expect(res).toBe(true);
    });

    const req = httpMock.expectOne('/schedule-slots/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
