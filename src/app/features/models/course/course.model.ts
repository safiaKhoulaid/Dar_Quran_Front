export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CourseRequest {
    title: string;
    description?: string;
    miniature?: string;
    slug?: string;
    isPublic: boolean;
    level: CourseLevel;
    status?: CourseStatus;
}

export interface CourseResponse {
    id: string;
    title: string;
    slug: string;
    description?: string;
    miniature?: string;
    isPublic: boolean;
    status: CourseStatus;
    level: CourseLevel;
    createdAt: string;
    updatedAt: string;
    numberOfLessons: number;
}
