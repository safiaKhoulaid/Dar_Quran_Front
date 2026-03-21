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

export type AbsenceStatus = 'JUSTIFIED' | 'UNJUSTIFIED' | 'PENDING';

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
  dayOfWeek?: number;
  startTime?: string;
}

export interface StudentAbsenceRequest {
  studentId: string;
  scheduleSlotId: string;
  date: string;
  status: AbsenceStatus;
  justificationText?: string;
  justificationFileUrl?: string;
}

export interface StudentGradeResponse {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  value: number;
  gradeDate?: string;
  comment?: string;
  teacherId: string;
  createdAt: string;
}

export interface StudentGradeRequest {
  studentId: string;
  courseId: string;
  value: number;
  gradeDate?: string;
  comment?: string;
}
