export type Gender = 'HOMME' | 'FEMME';

export interface Admin {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  gender: Gender;
  dateNaissance?: string;
  createdAt: string;
  role?: string;
}

export interface AdminCreateRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  gender: Gender;
  dateNaissance?: string;
  password: string;
  password_confirmation?: string;
  role?: string;
}

export interface AdminUpdateRequest extends Partial<AdminCreateRequest> {
  password?: string;
  password_confirmation?: string;
}
