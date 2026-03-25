export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface EnrollmentResponse {
  id: string;
  active: boolean;
  enrolledAt: string;
  courseId: string;
  courseTitle: string;
  courseLevel?: CourseLevel;
  courseStatus?: CourseStatus;
  courseDescription?: string;
}