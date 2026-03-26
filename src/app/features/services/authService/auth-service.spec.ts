import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth-service';
import { Router } from '@angular/router';
import { LoginResponse } from '@features/models/auth/login/login-response';
import { LoginRequest } from '@features/models/auth/login/login-request';

import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: any;

  const mockLoginResponse: LoginResponse = {
    token: 'mock-token',
    refreshToken: 'mock-refresh-token',
    email: 'test@example.com'
  };

  beforeEach(() => {
    routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    // Clear local storage before each test
    localStorage.clear();
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and save user to storage', () => {
    const loginRequest: LoginRequest = { email: 'test@example.com', password: 'password' };

    service.login(loginRequest).subscribe(response => {
      expect(response.token).toBe('mock-token');
      expect(service.currentUser()?.token).toBe('mock-token');
      expect(localStorage.getItem('auth_user')).toContain('mock-token');
    });

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockLoginResponse);
  });

  it('should register a new user', () => {
    const registerData = { email: 'test@example.com', password: 'password', nom: 'User' };
    
    service.register(registerData).subscribe(res => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne('/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should logout and clear session', () => {
    // Setup initial state
    service.currentUser.set(mockLoginResponse);
    localStorage.setItem('auth_user', JSON.stringify(mockLoginResponse));

    service.logout();

    const req = httpMock.expectOne('/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should refresh token and update store', () => {
    service.refreshToken().subscribe(response => {
      expect(response.token).toBe('mock-token');
      expect(service.currentUser()?.token).toBe('mock-token');
    });

    const req = httpMock.expectOne('/auth/refresh-token');
    expect(req.request.method).toBe('POST');
    req.flush(mockLoginResponse);
  });
});
