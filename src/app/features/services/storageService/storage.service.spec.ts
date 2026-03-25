import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StorageService, UploadResponse } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StorageService]
    });
    service = TestBed.inject(StorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should construct formData and upload file to correct folder', () => {
    const dummyFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
    const mockResponse: UploadResponse = {
      key: 'course-thumbnails/test.txt',
      url: 'http://test-url/test.txt',
      contentType: 'text/plain',
      size: 15
    };

    service.upload(dummyFile, 'course-thumbnails').subscribe(res => {
      expect(res.url).toBe('http://test-url/test.txt');
      expect(res.key).toBe('course-thumbnails/test.txt');
    });

    const req = httpMock.expectOne('/storage/upload?folder=course-thumbnails');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.body.has('file')).toBe(true);
    req.flush(mockResponse);
  });
});
