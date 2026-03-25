export interface StudentGradeResponse {
  id: string;
  value?: number | null;
  gradeDate: string;
  comment?: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName?: string;
}