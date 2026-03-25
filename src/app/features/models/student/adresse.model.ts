export interface Adresse {
  rue: string;
  ville: string;
  codePostal: string;
  pays: string;
  adresseComplete: string;
}

export interface AdresseRequest {
  rue: string;
  ville: string;
  codePostal: string;
  pays: string;
}