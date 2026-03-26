import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TeacherService } from './teacher.service';
import { Section } from '@core/enums/section.enum';
import { UserCreateRequest } from '@core/models/users/userCreateRequest.module';

describe('TeacherService', () => {
  let service: TeacherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeacherService]
    });
    service = TestBed.inject(TeacherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get a list of teachers', () => {
    service.getList().subscribe(teachers => {
      expect(teachers).toEqual([]);
    });

    const req = httpMock.expectOne('/teachers');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get teachers filtered by section', () => {
    const mockList = [{ id: '1', nom: 'Ali', prenom: 'Ahmad' }];

    service.getListBySection(Section.FEMME).subscribe(teachers => {
      expect(teachers.length).toBe(1);
      expect(teachers[0].displayName).toBe('Ahmad Ali');
    });

    const req = httpMock.expectOne('/teachers?section=FEMME');
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });

  it('should create a new teacher', () => {
    const request: UserCreateRequest = { id: '', nom: 'Ali', email: 'test@example.com', password: 'pwd', prenom: 'Ahmad', createdAt: '' };

    service.create(request).subscribe(res => {
      expect(res?.nom).toBe('Ali');
    });

    const req = httpMock.expectOne('/teachers');
    expect(req.request.method).toBe('POST');
    req.flush({ nom: 'Ali' });
  });

  it('should handle deletion of a teacher', () => {
    service.delete(1).subscribe(res => {
      expect(res).toBe(true);
    });

    const req = httpMock.expectOne('/teachers/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
