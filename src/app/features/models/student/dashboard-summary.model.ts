import { StudentResponse } from './student-response.model';
import { StudentGradeResponse } from './grade.model';
import { StudentAbsenceResponse } from './absence.model';
import { EnrollmentResponse } from './enrollment.model';
import { ScheduleSlotResponse, RoomResponse } from './schedule.model';

export interface StudentStatistics {
  totalEnrollments: number;
  activeEnrollments: number;
  totalGrades: number;
  averageGrade: number;
  totalAbsences: number;
  presentDays: number;
  lateDays: number;
  excusedAbsences: number;
  unexcusedAbsences: number;
  attendanceRate: number;
}

export interface StudentDashboardSummary {
  profile: StudentResponse;
  grades: StudentGradeResponse[];
  absences: StudentAbsenceResponse[];
  enrollments: EnrollmentResponse[];
  schedule: ScheduleSlotResponse[];
  rooms: RoomResponse[];
  statistics: StudentStatistics;
}