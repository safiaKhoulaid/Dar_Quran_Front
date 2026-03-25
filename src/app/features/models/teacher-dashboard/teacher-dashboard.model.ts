import { AbsenceStatus } from '@features/models/student/absence.model';

export { AbsenceStatus };

/** Réponse salle/classe pour le dashboard enseignant (aligné backend RoomResponse). */
export interface TeacherRoomResponse {
  id: string;
  name: string;
  section?: 'HOMME' | 'FEMME';
  capacity?: number;
  teacherId?: string;
  teacherName?: string;
}

export interface TeacherStudentResponse {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
}

/** Aligné backend StudentAbsenceResponse (GET /api/teacher/absences). */
export interface StudentAbsenceResponse {
  id: string;
  studentId: string;
  studentNom: string;
  studentPrenom: string;
  scheduleSlotId: string;
  date: string;
  status: AbsenceStatus;
  justificationText?: string;
  justificationFileUrl?: string;
  createdAt: string;
  courseTitle?: string;
  teacherName?: string;
}

/** Aligné backend StudentAbsenceRequest (POST /api/teacher/absences). */
export interface StudentAbsenceRequest {
  studentId: string;
  scheduleSlotId: string;
  date: string;
  status: AbsenceStatus;
  justificationText?: string;
  justificationFileUrl?: string;
}

/** Aligné backend StudentGradeResponse (GET/POST /api/teacher/grades). */
export interface StudentGradeResponse {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  value?: number | null;
  gradeDate?: string;
  comment?: string;
  teacherId: string;
  teacherName?: string;
  createdAt: string;
}

export interface StudentGradeRequest {
  studentId: string;
  courseId: string;
  value: number;
  gradeDate?: string;
  comment?: string;
}
