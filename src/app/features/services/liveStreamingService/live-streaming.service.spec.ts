import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LiveStreamingService } from './live-streaming.service';
import { LiveSessionRequest, LiveSessionPage } from '@features/models/live-streaming/live-session.model';
import { LiveCommentRequest } from '@features/models/live-streaming/live-comment.model';

describe('LiveStreamingService', () => {
  let service: LiveStreamingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LiveStreamingService]
    });
    service = TestBed.inject(LiveStreamingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch public sessions with mapped response', () => {
    const mockApiPage = {
      content: [{ id: '1', title: 'Live Now', userId: 'T1', userName: 'Teacher O' }]
    };

    service.getPublicSessions('LIVE', 0, 20).subscribe(page => {
      expect(page.content.length).toBe(1);
      expect(page.content[0].teacherId).toBe('T1');
      expect(page.content[0].teacherName).toBe('Teacher O');
    });

    const req = httpMock.expectOne('/live/public/sessions?status=LIVE&page=0&size=20');
    expect(req.request.method).toBe('GET');
    req.flush(mockApiPage);
  });

  it('should create a new live session', () => {
    const request: LiveSessionRequest = { title: 'New Stream', streamKey: 'key1' } as LiveSessionRequest;
    const mockRes = { id: 's1', title: 'New Stream', teacherId: 't1' };

    service.create(request).subscribe(session => {
      expect(session?.id).toBe('s1');
      expect(session?.teacherId).toBe('t1');
    });

    const req = httpMock.expectOne('/live/sessions');
    expect(req.request.method).toBe('POST');
    req.flush(mockRes);
  });

  it('should delete a live session securely', () => {
    service.delete('s1').subscribe(result => {
      expect(result).toBe(true);
    });

    const req = httpMock.expectOne('/live/sessions/s1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should add a public comment', () => {
    const request: LiveCommentRequest = { content: 'Hello' };
    const mockResponse = { id: 'c1', content: 'Hello' };

    service.addPublicComment('s1', request).subscribe(comment => {
      expect(comment?.id).toBe('c1');
      expect(comment?.content).toBe('Hello');
    });

    const req = httpMock.expectOne('/live/public/sessions/s1/comments');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should map start stream properly', () => {
    const mockRes = { id: 's1', status: 'LIVE' };

    service.startStream('s1').subscribe(session => {
      expect(session?.id).toBe('s1');
      expect(session?.status).toBe('LIVE');
    });

    const req = httpMock.expectOne('/live/sessions/s1/start');
    expect(req.request.method).toBe('POST');
    req.flush(mockRes);
  });
});
