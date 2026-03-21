# Intégration Frontend ↔ Backend (Dar Quran)

Ce document décrit les endpoints API que le frontend Angular appelle pour s’intégrer au backend (Laravel ou Spring Boot).

## Configuration

- **Environnement** : `src/environments/environments.ts`
- **URL API** : `apiUrl` (ex. `http://localhost:8000/api` pour Laravel, `http://localhost:8080/api` pour Spring Boot)
- Toutes les requêtes HTTP passent par l’intercepteur qui préfixe l’URL avec `apiUrl`.

## Authentification

| Méthode | URL (relative) | Description |
|--------|-----------------|-------------|
| POST   | `/auth/login`   | Connexion. Body: `{ email, password }`. Réponse attendue: `{ token, refreshToken?, nom?, prenom?, email, role? }` |
| POST   | `/auth/logout`  | Déconnexion (optionnel côté backend) |
| POST   | `/auth/refresh-token` | Rafraîchissement du JWT. Header: `Authorization: Bearer <refreshToken>` si nécessaire |

Les requêtes authentifiées envoient le header : `Authorization: Bearer <token>`.

## Super Admin – Dashboard

### Statistiques (optionnel)

| Méthode | URL | Description |
|--------|-----|-------------|
| GET | `/dashboard/stats` | Statistiques globales. Réponse attendue (ex.) : `{ total_students, total_male_students, total_female_students, total_teachers, total_male_teachers, total_female_teachers, total_classes, total_classes_male, total_classes_female, male_students_by_age?, female_students_by_age? }` |

Si cet endpoint n’existe pas, le frontend conserve les valeurs par défaut.

### Admins (المشرفين)

| Méthode | URL | Description |
|--------|-----|-------------|
| GET    | `/admins`      | Liste des administrateurs. Réponse : tableau d’objets avec `id, firstname, lastname, email, phone?, gender, birth_date?, created_at, role?` (ou `first_name`, `last_name`, `created_at` en snake_case) |
| GET    | `/admins/:id`  | Détail d’un admin |
| POST   | `/admins`      | Création. Body: `firstname, lastname, email, phone?, gender, birth_date?, password, password_confirmation?` |
| PUT    | `/admins/:id`  | Mise à jour. Body: champs à modifier (sans mot de passe obligatoire) |
| DELETE | `/admins/:id`  | Suppression |

### Teachers (المعلمين)

| Méthode | URL | Description |
|--------|-----|-------------|
| GET    | `/teachers`      | Liste des enseignants |
| GET    | `/teachers/:id`  | Détail |
| POST   | `/teachers`      | Création (même schéma que admin avec password) |
| PUT    | `/teachers/:id`  | Mise à jour |
| DELETE | `/teachers/:id`  | Suppression |

### Students (الطلاب)

| Méthode | URL | Description |
|--------|-----|-------------|
| GET    | `/students`      | Liste des élèves. Champs attendus: `id, firstname, lastname, email, phone?, gender, created_at, status?` |
| GET    | `/students/:id`  | Détail |
| POST   | `/students`      | Création |
| PUT    | `/students/:id`  | Mise à jour |
| DELETE | `/students/:id`  | Suppression |

### Classes (الفصول)

| Méthode | URL | Description |
|--------|-----|-------------|
| GET    | `/classes`      | Liste des classes. Champs attendus: `id, name, gender, teacher_id?, teacher_name? ou teacher { firstname, lastname }, students_count? ou studentsCount?` |
| GET    | `/classes/:id`  | Détail |
| POST   | `/classes`      | Création: `name, gender, teacher_id?, capacity?` |
| PUT    | `/classes/:id`  | Mise à jour |
| DELETE | `/classes/:id`  | Suppression |

## Live Streaming (البث المباشر)

Backend Spring Boot : `LiveController` sous `/api/live`. Le flux vidéo est en **HLS** (`hlsPlaybackUrl` = URL .m3u8). Le frontend affiche la page sur `/live` (stream en cours) ou `/live/:id`.

### Endpoints publics (non authentifiés)

| Méthode | URL (relative à apiUrl) | Description |
|--------|-------------------------|-------------|
| GET    | `/live/public/sessions` | Liste paginée. Query: `status` (LIVE \| SCHEDULED \| ENDED…), `page`, `size`. Réponse: `{ content: LiveSession[], totalElements, totalPages, size, number, first, last }`. |
| GET    | `/live/public/sessions/:id` | Détail d’une session. Réponse: `LiveSession` (id, title, description, hlsPlaybackUrl, status, teacherName, …). |
| GET    | `/live/public/sessions/:id/comments` | Commentaires de la session. |
| POST   | `/live/public/sessions/:id/comments` | Body: `{ content, authorDisplayName? }`. Ajout d’un commentaire (public). |

La vidéo est lue via **hls.js** avec `hlsPlaybackUrl` lorsque `status === 'LIVE'`.

## Conventions

- Le frontend accepte les réponses en **camelCase** ou **snake_case** (ex. `firstname` / `first_name`, `created_at`).
- En cas d’erreur HTTP (4xx/5xx), les services renvoient une valeur par défaut (tableau vide, `null`, `false`) et le dashboard affiche un message d’erreur si besoin.
- Route protégée : `/dashboard-super-admin` est protégée par `authGuard` (redirection vers `/login` si non connecté).

## Cahier des charges (référence)

- Super Admin : accès à tout ; Admin Section Femmes / Hommes : accès limité à leur section.
- Gestion : classes, élèves, enseignants, absences, emplois du temps, notes, cours (internes/externes), notifications temps réel, live streaming (optionnel).
- Stack prévu : Angular (frontend), API REST (backend), JWT/OAuth2, WebSockets pour les notifications.
