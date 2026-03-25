import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClassService } from './class.service';
import { ClassItem, ClassCreateRequest } from '@features/models/class/class.model';
import { Section } from '@core/enums/section.enum';

describe('ClassService', () => {
  let service: ClassService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClassService]
    });
    service = TestBed.inject(ClassService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should map room response to ClassItem array on getList', () => {
    const mockRooms = [
      { id: 1, name: 'Room 1', section: 'HOMME', teacherId: 10, teacherName: 'Teacher A', capacity: 20 }
    ];

    service.getList().subscribe(classes => {
      expect(classes.length).toBe(1);
      expect(classes[0].gender).toBe('HOMME');
      expect(classes[0].studentsCount).toBe(20);
    });

    const req = httpMock.expectOne('/rooms');
    expect(req.request.method).toBe('GET');
    req.flush(mockRooms);
  });

  it('should retrieve a class by ID', () => {
    const mockRoom = { id: 2, name: 'Room 2', section: 'FEMME' };

    service.getById(2).subscribe(cls => {
      expect(cls?.id).toBe(2);
      expect(cls?.gender).toBe('FEMME');
    });

    const req = httpMock.expectOne('/rooms/2');
    expect(req.request.method).toBe('GET');
    req.flush(mockRoom);
  });

  it('should create a new class', () => {
    const request: ClassCreateRequest = { name: 'New Room', gender: 'HOMME', capacity: 15 };
    const mockRoom = { id: 3, name: 'New Room', section: 'HOMME', capacity: 15 };

    service.create(request).subscribe(cls => {
      expect(cls?.id).toBe(3);
      expect(cls?.name).toBe('New Room');
    });

    const req = httpMock.expectOne('/rooms');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'New Room', section: 'HOMME', capacity: 15 });
    req.flush(mockRoom);
  });

  it('should update a class', () => {
    const request: Partial<ClassCreateRequest> = { name: 'Updated Room' };
    const mockRoom = { id: 1, name: 'Updated Room', section: 'HOMME' };

    service.update(1, request).subscribe(cls => {
      expect(cls?.name).toBe('Updated Room');
    });

    const req = httpMock.expectOne('/rooms/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.name).toBe('Updated Room');
    req.flush(mockRoom);
  });

  it('should delete a class', () => {
    service.delete(1).subscribe(result => {
      expect(result).toBe(true);
    });

    const req = httpMock.expectOne('/rooms/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
