import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ResourceService } from './resource.service';
import { ResourceRequest } from '@features/models/course/resource.model';

describe('ResourceService', () => {
  let service: ResourceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResourceService]
    });
    service = TestBed.inject(ResourceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get resources by lesson id', () => {
    const mockResources = [
      { id: '1', name: 'Res 1', type: 'PDF' },
      { id: '2', name: 'Res 2', type: 'VIDEO' }
    ];

    service.getByLessonId('L1').subscribe(resources => {
      expect(resources.length).toBe(2);
      expect(resources[0].type).toBe('PDF');
    });

    const req = httpMock.expectOne('/resources/lesson/L1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResources);
  });

  it('should create a resource', () => {
    const request: ResourceRequest = { lessonId: 'L1', name: 'New Res', type: 'PDF', fileUrl: 'url' };
    const mockResp = { ...request, id: '3' };

    service.create(request).subscribe(res => {
      expect(res.id).toBe('3');
      expect(res.name).toBe('New Res');
    });

    const req = httpMock.expectOne('/resources');
    expect(req.request.method).toBe('POST');
    req.flush(mockResp);
  });

  it('should delete a resource', () => {
    service.delete('1').subscribe(res => {
      expect(res).toBeUndefined();
    });

    const req = httpMock.expectOne('/resources/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
