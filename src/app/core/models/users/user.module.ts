import { Role } from "@core/enums/role.enum";
import { Section } from "@core/enums/section.enum";

export interface User {

  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  photoUrl?: string;
  dateNaissance?: string; // ISO string
  role ?: Role;
  section?: Section;
  createdAt: string;
}
