import { Gender } from '@core/models/users/admin.model';

export interface ClassItem {
  id: string;
  name: string;
  gender: Gender;
  teacher_id?: string | null;
  teacher_name?: string | null;
  teacherName?: string | null;
  students_count?: number;
  studentsCount?: number;
  status?: string;
}

export interface ClassCreateRequest {
  name: string;
  gender: Gender;
  teacher_id?: string | null;
  capacity?: number;
}
