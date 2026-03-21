import { Gender } from '@core/models/users/admin.model';
import { Section } from '@core/enums/section.enum';

export interface Teacher {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  gender: Gender;
  section?: Section;
  dateNaissance?: string;
  createdAt: string;
  role?: string;
}

export interface TeacherCreateRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  gender?: Gender;
  section?: Section;
  dateNaissance?: string;
  password: string;
  passwordConfirmation?: string;
}

export interface TeacherUpdateRequest extends Partial<TeacherCreateRequest> {
  password?: string;
  passwordConfirmation?: string;
}
