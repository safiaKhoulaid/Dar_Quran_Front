export interface ScheduleSlotResponse {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomId: string;
  roomName: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
}

export interface ScheduleSlotRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomId: string;
  courseId: string;
  teacherId: string;
}
