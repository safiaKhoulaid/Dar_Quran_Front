export interface LoginResponse {
  /** ID utilisateur (UUID) — utilisé pour filtrer les sessions live par professeur. */
  id?: string;
  token: string;
  /**
   * Refresh token renvoyé par le backend (snake_case).
   * Le backend envoie typiquement: { token, refresh_token, ... }.
   */
  refresh_token?: string;
  /**
   * Alias camelCase pour utilisation côté front.
   */
  refreshToken?: string;
  nom?: string;
  prenom?: string;
  email: string;
  /** Rôle utilisateur : SUPER_ADMIN | ADMIN_SECTION | ENSEIGNANT | ELEVE | PARENT | PUBLIC */
  role?: string;
  /** Nom complet (si backend ne renvoie pas nom/prenom) */
  name?: string;
  telephone?: string;
  adresse?: string;
  section?: string;
}
