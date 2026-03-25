import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UploadResponse {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly http = inject(HttpClient);

  upload(file: File, folder = 'course-thumbnails') {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`/storage/upload?folder=${encodeURIComponent(folder)}`, formData);
  }
}
