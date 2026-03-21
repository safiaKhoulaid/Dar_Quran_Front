import { Gender } from '@core/models/users/admin.model';

export interface Student {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  gender: Gender;
  dateNaissance?: string;
  createdAt: string;
  status?: string;
  class_id?: number;
  class_name?: string;
}
