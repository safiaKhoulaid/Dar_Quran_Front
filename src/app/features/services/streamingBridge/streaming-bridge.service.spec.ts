import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StreamingBridgeService } from './streaming-bridge.service';

describe('StreamingBridgeService', () => {
  let service: StreamingBridgeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StreamingBridgeService]
    });
    service = TestBed.inject(StreamingBridgeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit error when startStreaming is called without a streamKey', () => {
    return new Promise<void>((resolve) => {
      const mockMediaStream = new MediaStream();

      service.status$.subscribe(status => {
        expect(status).toBe('error');
        resolve();
      });

      service.startStreaming('', mockMediaStream);
    });
  });

  it('should return disconnected as initial status', () => {
    expect(service.currentStatus).toBe('disconnected');
  });

  it('should transition to disconnected when stopStreaming is called', () => {
    service.stopStreaming();
    expect(service.currentStatus).toBe('disconnected');
  });
});
