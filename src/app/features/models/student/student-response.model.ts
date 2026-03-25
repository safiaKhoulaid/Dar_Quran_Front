import { Adresse } from './adresse.model';

export enum Section {
  HOMME = 'HOMME',
  FEMME = 'FEMME'
}

export enum Role {
  ELEVE = 'ELEVE',
  ENSEIGNANT = 'ENSEIGNANT',
  ADMIN_SECTION = 'ADMIN_SECTION',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface StudentResponse {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  section: Section;
  dateNaissance?: string;
  photoUrl?: string;
  createdAt: string;
  role: Role;
  adresse?: Adresse;
}

export interface StudentRequest {
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  telephone?: string;
  section: Section;
  dateNaissance?: string;
  photoUrl?: string;
  adresse?: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };
}