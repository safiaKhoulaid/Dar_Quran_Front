import { Section } from './student-response.model';

export interface ScheduleSlotResponse {
  id: string;
  dayOfWeek: number; // 1=Monday, 2=Tuesday, etc.
  /** ISO string (Spring) ou objet { hour, minute } selon la config Jackson */
  startTime: string | { hour?: number; minute?: number };
  endTime: string | { hour?: number; minute?: number };
  roomId: string;
  roomName: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
}

export interface RoomResponse {
  id: string;
  name: string;
  section: Section;
  capacity: number;
  teacherId?: string;
  teacherName?: string;
}