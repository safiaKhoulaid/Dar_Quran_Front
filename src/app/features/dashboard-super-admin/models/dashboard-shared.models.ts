/** Types partagés pour les composants du dashboard (admins, teachers, students, classes) */

export type Section = 'HOMME' | 'FEMME';
export type Gender = 'HOMME' | 'FEMME';

export interface Person {
  id: string | number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  section?: Section;
  gender?: Gender;
  dateNaissance?: string;
  createdAt: string;
  role?: 'admin' | 'teacher';
}

export interface Student extends Person {
  status: string;
  className?: string;
  teacherName?: string;
}

export interface ClassItem {
  id: string | number;
  name: string;
  gender: Gender;
  teacherName: string | null;
  studentsCount: number;
}

export interface AgeGroup {
  key: string;
  label: string;
  count: number;
  percent: number;
}
