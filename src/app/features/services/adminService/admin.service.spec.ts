import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { UserResponse } from '@core/models/users/userResponse.module';
import { Section } from '@core/enums/section.enum';
import { Role } from '@core/enums/role.enum';
import { UserCreateRequest } from '@core/models/users/userCreateRequest.module';
import { UserUpdateRequest } from '@core/types/userUpdateRequest.type';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve list of admins', () => {
    const mockAdmins: any[] = [{ id: 1, nom: 'Test', prenom: 'Admin' }];

    service.getList().subscribe(admins => {
      expect(admins.length).toBe(1);
      expect(admins).toEqual(mockAdmins);
    });

    const req = httpMock.expectOne('/admins');
    expect(req.request.method).toBe('GET');
    req.flush(mockAdmins);
  });

  it('should retrieve admin by id and map UserResponse to Admin', () => {
    const mockUserResponse: UserResponse = {
      id: "1",
      nom: 'Test',
      prenom: 'Admin',
      email: 'test@example.com',
      telephone: '123456789',
      section: Section.HOMME,
      role: Role.ADMIN_SECTION,
      createdAt: '2023-01-01',
      dateNaissance: '2000-01-01',
      photoUrl: null
    };

    service.getById(1).subscribe(admin => {
      expect(admin).toBeTruthy();
      expect(admin?.nom).toBe('Test');
      expect(admin?.gender).toBe('HOMME');
    });

    const req = httpMock.expectOne('/admins/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUserResponse);
  });

  it('should create an admin', () => {
    const newAdmin: UserCreateRequest = {
      id: '',
      nom: 'New',
      prenom: 'Admin',
      email: 'new@example.com',
      createdAt: '',
      password: 'password'
    };
    const mockResponse: UserResponse = {
       id: "2",
       nom: 'New',
       prenom: 'Admin',
       email: 'new@example.com',
       section: Section.HOMME,
       role: Role.ADMIN_SECTION,
       createdAt: '2023-01-01',
       photoUrl: null,
       telephone: null,
       dateNaissance: null
    };

    service.create(newAdmin).subscribe(response => {
      expect(response.id).toBe("2");
      expect(response.nom).toBe('New');
    });

    const req = httpMock.expectOne('/admins');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should update an admin', () => {
    const updateRequest: UserUpdateRequest = {
      id: "1",
      user: {
        nom: 'Updated',
        prenom: 'Admin',
        email: 'update@example.com',
      }
    };
    const mockResponse: UserResponse = { id: "1", nom: 'Updated', prenom: 'Admin', email: 'update@example.com', section: Section.HOMME, role: Role.ADMIN_SECTION, createdAt: '2023-01-01', photoUrl: null, telephone: null, dateNaissance: null };

    service.update(updateRequest).subscribe(response => {
      expect(response.nom).toBe('Updated');
    });

    const req = httpMock.expectOne('/admins/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete an admin', () => {
    service.delete("1").subscribe(result => {
      expect(result).toBe(true);
    });

    const req = httpMock.expectOne('/admins/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
