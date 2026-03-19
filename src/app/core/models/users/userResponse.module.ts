import { Role } from "@core/enums/role.enum";
import { Section } from "@core/enums/section.enum";


export interface UserResponse {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  section: Section | null;
  dateNaissance: string | null;
  photoUrl: string | null;
  createdAt: string;
  role: Role;

}
