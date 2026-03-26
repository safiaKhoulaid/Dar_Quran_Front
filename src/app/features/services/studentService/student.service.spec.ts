import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StudentService } from './student.service';
import { Student } from '@features/models/student/student.model';

describe('StudentService', () => {
  let service: StudentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StudentService]
    });
    service = TestBed.inject(StudentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get a list of students', () => {
    const mockStudents: Student[] = [{ id: 1, prenom: 'Ahmad', nom: 'Ali', email: 'ahmad@test.com', gender: 'HOMME', createdAt: '2023-01-01' } as Student];

    service.getList().subscribe(students => {
      expect(students.length).toBe(1);
    });

    const req = httpMock.expectOne('/students');
    expect(req.request.method).toBe('GET');
    req.flush(mockStudents);
  });

  it('should create a new student', () => {
    const mockStudent: Student = { id: 2, prenom: 'Omar', nom: 'Farooq', email: 'omar@test.com', gender: 'HOMME', createdAt: '2023-01-01' } as Student;

    service.create({ prenom: 'Omar' }).subscribe(student => {
      expect(student?.id).toBe(2);
    });

    const req = httpMock.expectOne('/students');
    expect(req.request.method).toBe('POST');
    req.flush(mockStudent);
  });

  it('should handle getById', () => {
    service.getById(1).subscribe(student => {
      expect(student).toBeNull();
    });

    const req = httpMock.expectOne('/students/1');
    req.flush(null);
  });
});
