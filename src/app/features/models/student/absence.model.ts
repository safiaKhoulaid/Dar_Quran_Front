export enum AbsenceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export interface StudentAbsenceResponse {
  id: string;
  date: string;
  status: AbsenceStatus;
  justificationText?: string;
  justificationFileUrl?: string;
  scheduleSlotId: string;
  /** Renseigné par l’API dashboard (créneau → cours / enseignant) */
  courseTitle?: string;
  teacherName?: string;
}