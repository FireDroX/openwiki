# OpenWiki — Cahier des charges & Backlog complet

Clone de WikiJS — NestJS / TypeORM / MySQL / React / TypeScript / Tailwind / shadcn / Minio

---

## 1. Présentation du projet

**OpenWiki** est une plateforme de wiki collaboratif auto-hébergée. Les utilisateurs créent des pages organisées en arborescence, chaque édition est versionnée, les médias sont stockés sur Minio.

### Objectifs fonctionnels

- Créer, éditer, organiser des pages en arborescence (dossiers/sous-pages)
- Versionner chaque modification (historique + rollback)
- Uploader et insérer des médias (images, fichiers) dans les pages
- Rechercher du contenu (full-text)
- Gérer des utilisateurs et des permissions (admin / éditeur / lecteur)

---

## 2. Stack technique

| Couche          | Techno                                                               |
| --------------- | -------------------------------------------------------------------- |
| Backend         | NestJS (Node.js, TypeScript)                                         |
| ORM             | TypeORM                                                              |
| Base de données | MySQL 8                                                              |
| Stockage objets | Minio (S3-compatible)                                                |
| Frontend        | React + TypeScript + Vite                                            |
| UI              | TailwindCSS + shadcn/ui                                              |
| Auth            | JWT (access + refresh token)                                         |
| Recherche       | MySQL FULLTEXT (v1) → migration Meilisearch possible (v2)            |

---

## 3. Architecture globale

```
openwiki/
├── backend/           (NestJS)
│   ├── src/
│   │   ├── auth/
│   │   │   ├── services/
│   │   │   ├── persistances/   (entités TypeORM)
│   │   │   ├── dto/
│   │   │   │   ├── in/
│   │   │   │   └── out/
│   │   │   ├── mapper/
│   │   │   ├── filters/
│   │   │   ├── exceptions/
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.module.ts
│   │   ├── users/          (même structure : services/persistances/dto/mapper/filters)
│   │   ├── pages/          (idem)
│   │   ├── versions/       (idem)
│   │   ├── media/          (idem)
│   │   ├── search/         (idem)
│   │   ├── admin/          (idem)
│   │   ├── health/
│   │   ├── common/ (guards, decorators, interceptors, filters globaux)
│   │   └── main.ts
├── frontend/          (React + Vite)
│   ├── src/
│   │   ├── pages/         (routes)
│   │   ├── components/
│   │   ├── features/      (auth, pages, editor, search, admin)
│   │   ├── lib/
│   │   └── main.tsx
└── docker-compose.yml (mysql, minio, backend, frontend)
```

Chaque module vit directement sous `src/` (pas de dossier `modules/` intermédiaire). À l'intérieur d'un module :

- `services/` — logique métier, orchestre `persistances/` et `mapper/`
- `persistances/` — entités TypeORM (couche persistance)
- `dto/in/` et `dto/out/` — DTO de requête (validés via class-validator) et de réponse (jamais l'entity brute exposée)
- `mapper/` — conversion entity ↔ DTO
- `filters/` — exception filters spécifiques au module
- `exceptions/` — exceptions métier custom
- `<module>.controller.ts` — HTTP uniquement, ne manipule que des DTO
- `<module>.module.ts`

---

## 4. Modèle de données (entités TypeORM)

### User

| Champ        | Type                        | Notes             |
| ------------ | --------------------------- | ----------------- |
| id           | uuid                        | PK                |
| email        | varchar                     | unique            |
| passwordHash | varchar                     |                   |
| displayName  | varchar                     |                   |
| avatarUrl    | varchar nullable            | pointe vers Minio |
| role         | enum(admin, editor, reader) |                   |
| failedLoginAttempts | int                  | reset à 0 sur connexion réussie |
| lockedUntil  | datetime nullable           | verrouillage temporaire après échecs répétés |
| createdAt    | datetime                    |                   |
| updatedAt    | datetime                    |                   |

### Page

| Champ            | Type                  | Notes                                  |
| ---------------- | --------------------- | -------------------------------------- |
| id               | uuid                  | PK                                     |
| slug             | varchar               | unique par branche                     |
| title            | varchar               | dénormalisé depuis la version courante |
| parentId         | uuid nullable         | FK → Page (arborescence)               |
| currentVersionId | uuid nullable         | FK → PageVersion                       |
| isPublished      | boolean               |                                        |
| visibility       | enum(public, private) |                                        |
| createdById      | uuid                  | FK → User                              |
| createdAt        | datetime              |                                        |
| updatedAt        | datetime              |                                        |

### PageVersion

| Champ         | Type             | Notes                       |
| ------------- | ---------------- | --------------------------- |
| id            | uuid             | PK                          |
| pageId        | uuid             | FK → Page                   |
| content       | text (markdown)  |                             |
| title         | varchar          |                             |
| authorId      | uuid             | FK → User                   |
| changeSummary | varchar nullable | message de commit façon git |
| createdAt     | datetime         | append-only, jamais modifié |

### Attachment

| Champ        | Type          | Notes              |
| ------------ | ------------- | ------------------ |
| id           | uuid          | PK                 |
| pageId       | uuid nullable | FK → Page          |
| minioKey     | varchar       | chemin objet Minio |
| filename     | varchar       |                    |
| mimeType     | varchar       |                    |
| size         | int           | bytes              |
| uploadedById | uuid          | FK → User          |
| createdAt    | datetime      |                    |

### PagePermission

| Champ        | Type     | Notes                                                             |
| ------------ | -------- | ------------------------------------------------------------------ |
| id           | uuid     | PK                                                                  |
| pageId       | uuid     | FK → Page                                                           |
| userId       | uuid     | FK → User                                                           |
| grantedById  | uuid     | FK → User (admin ayant accordé le droit)                           |
| createdAt    | datetime |                                                                      |

Unique sur `(pageId, userId)`. Accorde des droits d'éditeur sur la page **et toute sa sous-arborescence**, sauf override explicite plus bas dans l'arbre — voir EPIC-19. Ne remplace jamais `User.role` : élève seulement un `reader` global en éditeur localement.

### AdminAuditLog

| Champ        | Type              | Notes                                                    |
| ------------ | ----------------- | --------------------------------------------------------- |
| id           | uuid              | PK                                                          |
| adminId      | uuid              | FK → User                                                   |
| action       | varchar           | ex. `user.role_changed`, `user.deleted`                     |
| targetType   | varchar           | ex. `User`                                                   |
| targetId     | uuid nullable     |                                                              |
| metadata     | json nullable     | détails de l'action (ex. ancien/nouveau rôle)               |
| createdAt    | datetime          |                                                              |

### SystemSetting

| Champ  | Type    | Notes                                          |
| ------ | ------- | ----------------------------------------------- |
| key    | varchar | PK, ex. `locale`                                |
| value  | varchar | ex. `fr` / `en`                                 |

Table clé/valeur générique pour les réglages globaux (pas par utilisateur). Le premier usage est la langue de l'UI (EPIC-21), extensible à d'autres réglages système futurs.

### Tag / PageTag

| Champ          | Type    | Notes        |
| -------------- | ------- | ------------ |
| Tag.id         | uuid    | PK           |
| Tag.name       | varchar | unique       |
| PageTag.pageId | uuid    | FK composite |
| PageTag.tagId  | uuid    | FK composite |

### McpApiKey

| Champ       | Type              | Notes                                   |
| ----------- | ----------------- | --------------------------------------- |
| id          | uuid              | PK                                      |
| name        | varchar           | libellé de la clé                       |
| keyHash     | varchar           | hash de la clé, jamais stockée en clair |
| scopes      | json              | ex. `["pages:write", "tags:read"]`      |
| createdById | uuid              | FK → User (admin)                       |
| lastUsedAt  | datetime nullable |                                         |
| revokedAt   | datetime nullable |                                         |
| createdAt   | datetime          |                                         |

### McpAuditLog

| Champ        | Type             | Notes                  |
| ------------ | ---------------- | ---------------------- |
| id           | uuid             | PK                     |
| apiKeyId     | uuid             | FK → McpApiKey         |
| toolName     | varchar          | ex. `wiki_create_page` |
| input        | json             | tronqué si volumineux  |
| output       | json             | tronqué si volumineux  |
| success      | boolean          |                        |
| errorMessage | varchar nullable |                        |
| createdAt    | datetime         |                        |

---

## 5. Découpage en Epics

1. **EPIC-01** — Setup & Infra
2. **EPIC-02** — Authentification & Utilisateurs
3. **EPIC-03** — Gestion des Pages (CRUD + arborescence)
4. **EPIC-04** — Versioning
5. **EPIC-05** — Médias / Minio
6. **EPIC-06** — Recherche
7. **EPIC-10** — Frontend : Setup & Layout
8. **EPIC-11** — Frontend : Authentification
9. **EPIC-12** — Frontend : Navigation & Arborescence
10. **EPIC-13** — Frontend : Éditeur de pages
11. **EPIC-14** — Frontend : Historique / Diff
12. **EPIC-15** — Frontend : Recherche
13. **EPIC-16** — Frontend : Administration
14. **EPIC-17** — Tests & CI/CD
15. **EPIC-18** — Intégration MCP (pilotage par IA)
16. **EPIC-19** — Permissions avancées (grants par page)
17. **EPIC-20** — Sécurité & anti-abus
18. **EPIC-21** — Internationalisation (i18n)
19. **EPIC-22** — Cache Redis (pages & recherche)

---

## 6. Tickets détaillés

### EPIC-01 — Setup & Infra

**BE-001 — Initialiser le projet NestJS**

- Description : `nest new backend`, config TypeScript strict, ESLint + Prettier, structure modulaire.
- AC : projet démarre avec `npm run start:dev`, healthcheck `GET /health` répond 200.
- Estimation : 2h

**BE-002 — Config MySQL + TypeORM**

- Description : connexion via variables d'env, `TypeOrmModule.forRootAsync`, migrations activées (pas de `synchronize: true` en prod).
- AC : migration initiale exécutable, connexion testée au démarrage.
- Estimation : 3h

**BE-003 — Config Minio (SDK S3)**

- Description : intégrer `@aws-sdk/client-s3` ou `minio` npm package, bucket auto-créé au démarrage si absent.
- AC : upload/download de test fonctionnel en local via docker-compose.
- Estimation : 3h

**BE-004 — Docker Compose global**

- Description : services `mysql`, `minio`, `backend`, `frontend`, réseau partagé, volumes persistants.
- AC : `docker-compose up` démarre toute la stack fonctionnelle.
- Estimation : 4h

---

### EPIC-02 — Authentification & Utilisateurs

**BE-010 — Entité User + migration**

- Estimation : 1h

**BE-011 — Endpoint inscription**

- `POST /auth/register`
- Body : `{ email, password, displayName }`
- Réponse : `201 { id, email, displayName }`
- Logique : hash bcrypt, rôle par défaut `reader`.
- AC : email dupliqué → `409 Conflict`.

**BE-012 — Endpoint connexion**

- `POST /auth/login`
- Body : `{ email, password }`
- Réponse : `200 { accessToken, refreshToken }`
- AC : mauvais mot de passe → `401`.

**BE-013 — Endpoint refresh token**

- `POST /auth/refresh`
- Body : `{ refreshToken }`
- Réponse : `200 { accessToken }`

**BE-014 — Guard JWT + décorateur rôles**

- Description : `JwtAuthGuard`, `RolesGuard`, décorateur `@Roles('admin')`.
- AC : route protégée renvoie `401` sans token, `403` si rôle insuffisant.

**BE-015 — Endpoint profil courant**

- `GET /users/me` → `200 { id, email, displayName, role, avatarUrl }`

**BE-016 — Endpoint mise à jour profil**

- `PATCH /users/me`
- Body : `{ displayName?, avatarUrl? }`

**BE-017 — CRUD admin utilisateurs**

- `GET /admin/users` (liste paginée, réservé admin)
- `PATCH /admin/users/:id/role` — Body : `{ role }`
- `DELETE /admin/users/:id`

---

### EPIC-03 — Gestion des Pages

**BE-020 — Entité Page + migration**

**BE-021 — Créer une page**

- `POST /pages`
- Body : `{ slug, title, content, parentId?, visibility }`
- Logique : crée `Page` + première `PageVersion`, met à jour `currentVersionId`.
- AC : slug dupliqué au même niveau d'arborescence → `409`.

**BE-022 — Lister l'arborescence**

- `GET /pages/tree`
- Réponse : arbre JSON `{ id, slug, title, children: [...] }`
- AC : ne renvoie pas les pages privées si l'utilisateur n'a pas les droits.

**BE-023 — Obtenir une page par slug**

- `GET /pages/:slug`
- Réponse : contenu de la version courante + métadonnées.
- AC : `404` si inexistante, `403` si privée et non autorisé.

**BE-024 — Éditer une page**

- `PATCH /pages/:id`
- Body : `{ title?, content?, changeSummary? }`
- Logique : **ne modifie jamais PageVersion existante** → crée une nouvelle version, met à jour le pointeur.
- AC : historique conserve toutes les versions précédentes intactes.

**BE-025 — Déplacer une page (changer de parent)**

- `PATCH /pages/:id/move`
- Body : `{ newParentId }`
- AC : empêche les boucles (page devenant son propre ancêtre).

**BE-026 — Supprimer une page**

- `DELETE /pages/:id`
- AC : soft delete recommandé (`deletedAt`), refuse si sous-pages existantes sans `?cascade=true`.

**BE-027 — Publier / dépublier**

- `PATCH /pages/:id/publish` — Body : `{ isPublished }`

---

### EPIC-04 — Versioning

**BE-030 — Entité PageVersion + migration**

**BE-031 — Lister les versions d'une page**

- `GET /pages/:id/versions`
- Réponse : liste paginée `{ id, authorId, changeSummary, createdAt }`

**BE-032 — Obtenir une version spécifique**

- `GET /pages/:id/versions/:versionId`

**BE-033 — Diff entre deux versions**

- `GET /pages/:id/versions/diff?from=:v1&to=:v2`
- Réponse : `{ additions: [...], deletions: [...] }` (calcul via lib `diff` côté backend ou renvoi brut pour diff côté front)

**BE-034 — Rollback vers une version**

- `POST /pages/:id/versions/:versionId/restore`
- Logique : crée une **nouvelle** version avec le contenu de l'ancienne (jamais de suppression d'historique).

---

### EPIC-05 — Médias / Minio

**BE-040 — Entité Attachment + migration**

**BE-041 — Upload de fichier**

- `POST /media/upload` (multipart/form-data)
- Body : fichier + `pageId?`
- Logique : stream vers Minio, clé = `pages/{pageId}/{uuid}-{filename}`, enregistrement en DB.
- Réponse : `201 { id, url, filename, mimeType, size }`
- AC : limite de taille configurable (ex. 20 Mo), types MIME whitelistés pour les images.

**BE-042 — Lister les médias d'une page**

- `GET /media?pageId=:id`

**BE-043 — Obtenir une URL présignée**

- `GET /media/:id/url`
- Réponse : `{ url, expiresIn }` (URL Minio temporaire, pas de fichier public par défaut)

**BE-044 — Supprimer un média**

- `DELETE /media/:id`
- Logique : suppression Minio + DB.

---

### EPIC-06 — Recherche

**BE-050 — Index FULLTEXT MySQL sur PageVersion (title, content)**

**BE-051 — Endpoint recherche**

- `GET /search?q=:query&page=1&limit=20`
- Réponse : `{ results: [{ pageId, slug, title, excerpt, score }], total }`
- AC : ne renvoie que les pages publiées et visibles par l'utilisateur.

---

### EPIC-10 — Frontend : Setup & Layout

**FE-001 — Init projet Vite + React + TS**

- AC : `npm run dev` fonctionnel, alias `@/` configuré.

**FE-002 — Config Tailwind + shadcn/ui**

- AC : `npx shadcn init` fait, thème (couleurs, radius) appliqué.

**FE-003 — Layout global**

- Description : sidebar (arborescence) + topbar (recherche, avatar, menu) + zone de contenu.
- Composants shadcn : `Sheet` (sidebar mobile), `DropdownMenu`, `Avatar`.

**FE-004 — Client API (axios/fetch wrapper)**

- Description : instance centralisée, interception 401 → refresh token automatique.

---

### EPIC-11 — Frontend : Authentification

**FE-010 — Page login**

- Formulaire shadcn (`Form`, `Input`, `Button`), validation via `zod`.

**FE-011 — Page inscription**

**FE-012 — Gestion du contexte Auth (React Context / Zustand)**

- Stocke `user`, `accessToken`, actions `login/logout/refresh`.

**FE-013 — Routes protégées**

- Description : wrapper `<ProtectedRoute roles={['admin']}>`, redirection vers `/login` si non authentifié.

---

### EPIC-12 — Frontend : Navigation & Arborescence

**FE-020 — Composant sidebar arborescente**

- Description : `Collapsible`/`Accordion` shadcn récursif, indicateur page active.

**FE-021 — Fil d'ariane (breadcrumb)**

**FE-022 — Page de visualisation d'une page (lecture)**

- Description : rendu markdown → HTML avec coloration syntaxique (`shiki`), affichage des attachments.

---

### EPIC-13 — Frontend : Éditeur de pages

**FE-030 — Éditeur markdown avec preview live**

- Description : split view textarea + preview, ou intégration Tiptap/MDXEditor selon le niveau de richesse souhaité.

**FE-031 — Upload d'images depuis l'éditeur**

- Description : drag & drop ou bouton, appelle `POST /media/upload`, insère automatiquement le markdown `![alt](url)`.

**FE-032 — Formulaire de métadonnées de page**

- Description : titre, slug, visibilité, parent (sélecteur d'arborescence), tags.

**FE-033 — Champ "résumé de modification" à la sauvegarde**

- Lié à `changeSummary` de PageVersion.

---

### EPIC-14 — Frontend : Historique / Diff

**FE-040 — Liste des versions d'une page**

- Composant `Table` shadcn : auteur, date, résumé.

**FE-041 — Vue diff entre deux versions**

- Lib `react-diff-viewer` ou équivalent, appel `GET /pages/:id/versions/diff`.

**FE-042 — Action "restaurer cette version"**

- Confirmation via `AlertDialog` shadcn.

---

### EPIC-15 — Frontend : Recherche

**FE-050 — Barre de recherche globale (topbar)**

- `Command` (cmdk) shadcn, debounce 300ms, résultats live.

**FE-051 — Page de résultats de recherche complète**

- Pagination, extraits surlignés.

---

### EPIC-16 — Frontend : Administration

**FE-060 — Page gestion des utilisateurs**

- `Table` + `Select` pour changer le rôle, `AlertDialog` pour suppression.

**FE-064 — Sélecteur de langue (FR/EN)**

- Description : `Select` shadcn dans le panel admin, appelle `PATCH /admin/settings/locale`. Réglage global (pas par utilisateur) — voir EPIC-21.

---

### EPIC-17 — Tests & CI/CD

**OPS-001 — Tests unitaires backend (services critiques)**

- Cibles prioritaires : logique de versioning (BE-024), permissions (guards), upload Minio.

**OPS-002 — Tests e2e backend (Supertest)**

- Parcours : register → login → create page → edit → rollback.

**OPS-003 — Tests frontend (Vitest + Testing Library)**

- Cibles : formulaires (login, création de page), rendu de l'arborescence.

**OPS-004 — Pipeline CI (GitHub Actions ou équivalent)**

- Lint + tests sur chaque PR, build docker sur merge `main`.

**OPS-005 — Migrations automatiques au déploiement**

- Description : `typeorm migration:run` exécuté au démarrage du conteneur backend.

---

### EPIC-18 — Intégration MCP (pilotage par IA)

**BE-090 — Entité Tag/PageTag + endpoints CRUD**

- Description : prérequis manquant du modèle de données initial. `POST /tags`, `GET /tags`, `POST /pages/:id/tags`, `DELETE /pages/:id/tags/:tagId`, `DELETE /tags/:id`.
- Chaque tag porte une couleur (hex, ex. `#3b82f6`) choisie par son créateur à la création (`color` optionnel dans `POST /tags`, couleur neutre par défaut sinon).
- AC : nom de tag dupliqué → 409, suppression d'un tag cascade sur `page_tag`.

**BE-091 — Setup serveur MCP (socle)**

- Description : module `mcp/`, SDK `@modelcontextprotocol/sdk`, endpoint `POST /mcp` (+ `GET /mcp` pour SSE), registry central des tools.
- AC : un client MCP peut se connecter et lister les tools via `tools/list`.

**BE-092 — Authentification MCP par clé API à scopes**

- Description : entité `McpApiKey` (name, keyHash, scopes, revokedAt), guard dédié, gestion via `POST/GET/DELETE /admin/mcp/api-keys` (admin uniquement).
- AC : la clé en clair n'est affichée qu'une seule fois à la création ; clé révoquée rejetée par le guard.

**BE-093 — Tools MCP : gestion des pages**

- Tools : `wiki_create_page`, `wiki_update_page`, `wiki_get_page`, `wiki_list_pages`, `wiki_delete_page`, `wiki_publish_page`.
- Scopes : `pages:read` / `pages:write`.

**BE-094 — Tools MCP : gestion des tags**

- Tools : `wiki_create_tag`, `wiki_list_tags`, `wiki_tag_page`, `wiki_untag_page`.
- Scopes : `tags:read` / `tags:write`.

**BE-095 — Tools MCP : gestion des utilisateurs**

- Tools : `wiki_create_user`, `wiki_list_users`, `wiki_update_user_role`.
- AC : jamais de mot de passe en clair renvoyé ; tools invisibles sans le scope `users:write`/`users:read`.

**BE-096 — Tools MCP : upload de médias**

- Tools : `wiki_upload_image` (fichier transmis en base64, décodé et validé comme BE-041), `wiki_get_media_url`.
- Scopes : `media:read` / `media:write`.

**BE-097 — Tool MCP : recherche**

- Tool : `wiki_search`. Scope : `search:read` (ou `pages:read`).

**BE-098 — Journal d'audit des actions MCP**

- Description : entité `McpAuditLog` (apiKeyId, toolName, input, output, success, errorMessage), interceptor générique autour de chaque appel de tool, `GET /admin/mcp/audit-log`.
- AC : chaque appel (succès ou échec) est loggé ; contenu tronqué pour éviter de gonfler la table.

**FE-070 — Page gestion des clés API MCP**

- Description : `Table` des clés (nom, scopes, dernière utilisation, statut), `Dialog` de création avec sélection des scopes, révélation unique de la clé en clair, révocation via `AlertDialog`.

**FE-071 — Page journal d'activité MCP**

- Description : `Table` paginée des appels (clé, tool, statut, date), filtrable par clé API, détail complet (input/output JSON) au clic sur une ligne.

---

### EPIC-19 — Permissions avancées (grants par page)

**BE-100 — Entité PagePermission + migration**

- Description : `PagePermission(id, pageId, userId, grantedById, createdAt)`, unique sur `(pageId, userId)`.

**BE-101 — Resolver de permission effective**

- Description : dans le guard des pages, résout le droit d'édition en remontant la chaîne `parentId` depuis la page ciblée jusqu'à trouver un grant explicite, sinon retombe sur `User.role` global.
- AC : un `reader` global avec un grant sur une page hérite du droit d'édition sur toute la sous-arborescence, sauf si un descendant a lui-même un grant (override) ; `editor`/`admin` globaux ne sont jamais restreints par l'absence de grant.

**BE-102 — Créer / lister un grant**

- `POST /pages/:id/permissions` (admin) — Body : `{ userId }`
- `GET /pages/:id/permissions` (admin) — grants explicites définis directement sur cette page (pas les hérités)
- AC : grant dupliqué (même `pageId`/`userId`) → `409`.

**BE-103 — Révoquer un grant**

- `DELETE /pages/:id/permissions/:userId` (admin)
- AC : `404` si aucun grant explicite n'existe sur cette page pour cet utilisateur.

**FE-080 — Panneau "Droits d'édition" (settings de page)**

- Description : liste des éditeurs grantés sur la page, recherche/ajout d'un utilisateur, révocation via `AlertDialog`. Accessible depuis les settings de page (FE-032), réservé admin.

---

### EPIC-20 — Sécurité & anti-abus

**BE-110 — Rate limiting global**

- Description : `@nestjs/throttler`, limite globale par IP (ex. 100 req/min) appliquée à toute l'API.

**BE-111 — Rate limiting strict sur l'authentification**

- Description : limites dédiées, plus strictes, sur `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh` (ex. 5/min).
- AC : dépassement → `429`.

**BE-112 — Cloudflare Turnstile sur login/register**

- Description : `turnstileToken` obligatoire dans le body de `POST /auth/login` et `POST /auth/register`, vérifié côté backend contre l'API `siteverify` de Cloudflare. Secret via `TURNSTILE_SECRET_KEY` (env).
- AC : token manquant ou invalide → `400` avant toute vérification de credentials.

**BE-113 — Verrouillage de compte après échecs répétés**

- Description : incrémente `User.failedLoginAttempts` à chaque échec de `POST /auth/login`, pose `lockedUntil` après 5 échecs consécutifs (verrouillage 15 min), reset à la connexion réussie.
- AC : compte verrouillé → `423 Locked` explicite même avec le bon mot de passe, jusqu'à expiration de `lockedUntil`.

**BE-114 — Headers de sécurité (helmet) + durcissement CORS**

- Description : middleware `helmet` (CSP, HSTS, X-Frame-Options...), CORS restreint strictement à `FRONTEND_URL`.

**BE-115 — Audit log des actions admin sensibles**

- Description : entité `AdminAuditLog`, écrit sur changement de rôle (BE-017), suppression d'utilisateur (BE-017).
- `GET /admin/audit-log` (admin, paginé)

**BE-116 — Politique de mot de passe renforcée**

- Description : au-delà de `MIN_PASSWORD_LENGTH`, exige majuscule + chiffre + caractère spécial ; check optionnel contre l'API haveibeenpwned (k-anonymity) à l'inscription.
- AC : mot de passe compromis détecté → `400` ; API haveibeenpwned injoignable → ne bloque pas l'inscription (fail-open, log d'erreur).

**FE-081 — Widget Cloudflare Turnstile (login/register)**

- Description : intégration du widget managé sur les formulaires FE-010/FE-011, token envoyé avec la requête.

**FE-082 — Affichage du verrouillage de compte**

- Description : message d'erreur dédié + countdown sur le formulaire de login quand `423 Locked` est renvoyé.

**FE-083 — Page journal d'audit admin**

- Description : `Table` paginée (admin, date, action, cible), filtrable par admin/action, appelle `GET /admin/audit-log`.

**OPS-010 — Traiter les alertes de sécurité Dependabot**

- Description : GitHub remonte des warnings Dependabot sur les dépendances du repo (backend + frontend). Mettre à jour/patcher les packages concernés (`pnpm audit` / bump de version), et ajouter `.github/dependabot.yml` (écosystème `npm`, un entry par workspace `backend`/`frontend`) pour que les futures failles remontent automatiquement en PR.
- AC : plus d'alerte Dependabot ouverte de sévérité high/critical sur le repo ; `.github/dependabot.yml` committé et actif.

---

### EPIC-21 — Internationalisation (i18n)

**BE-120 — Entité SystemSetting + migration**

- Description : `SystemSetting(key, value)`, seed `locale=fr`.

**BE-121 — Endpoints réglages système**

- `GET /settings` (public, pas d'auth — nécessaire même pour les visiteurs non connectés)
- `PATCH /admin/settings/:key` (admin)
- AC : `PATCH /admin/settings/locale` avec une valeur hors `fr`/`en` → `400`.

**FE-090 — Intégration react-i18next**

- Description : fichiers de traduction FR/EN pour toute l'UI (labels, boutons, messages d'erreur). Le contenu des pages wiki n'est jamais traduit automatiquement.

**FE-091 — Chargement de la langue globale au démarrage**

- Description : fetch `GET /settings` au démarrage de l'app, configure `react-i18next` en conséquence.
- AC : réglage global appliqué à tous les visiteurs, aucune préférence par utilisateur, pas de `localStorage` pour ce setting.

---

### EPIC-22 — Cache Redis (pages & recherche)

**BE-122 — Setup Redis (docker-compose + config)**

- Description : service `redis` (image `redis:7-alpine`) ajouté à `docker-compose.yml`, avec volume persistant. Variables `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` dans `backend/.env`/`.env.example`, client Redis initialisé au démarrage du backend (`onModuleInit`, sur le modèle de `storage.service.ts` pour Minio).
- AC : `docker compose up -d` démarre un conteneur `redis` sain (`redis-cli ping` → `PONG`) ; le backend démarre normalement quand Redis est down (dégrade en cache-miss permanent plutôt que de crash au boot).

**BE-123 — Cache de lecture des pages publiées**

- Description : `GET /pages/:slug` (page publiée, selon visibilité) lit d'abord Redis (clé dérivée du path complet + visibilité de l'utilisateur), retombe sur MySQL en cas de cache-miss et repeuple le cache avec un TTL court (ex. 5 min).
- AC : deux lectures successives de la même page ne déclenchent qu'une seule requête MySQL ; une page non publiée ou privée n'est jamais écrite dans le cache.

**BE-124 — Invalidation du cache à l'écriture**

- Description : toute mutation d'une page (édition, restore de version, déplacement, suppression, changement de visibilité/publication) invalide la ou les clés cache correspondantes (page elle-même, et ses descendants si le path change suite à un déplacement).
- AC : éditer une page puis la relire immédiatement renvoie le nouveau contenu — jamais une version obsolète servie depuis le cache.

**BE-125 — Cache des résultats de recherche**

- Description : `GET /search` met en cache les résultats par clé `(query, filtres, page)` avec un TTL court (ex. 60s) ; pas d'invalidation fine à l'écriture, le contenu de recherche tolère l'expiration naturelle du TTL.
- AC : une requête identique répétée sous le TTL est servie depuis le cache (pas de requête MySQL/moteur de recherche) ; passé le TTL, une nouvelle requête est exécutée.

---

## 7. Récapitulatif complet des endpoints API

### Auth

| Méthode | Route          | Auth | Description         |
| ------- | -------------- | ---- | ------------------- |
| POST    | /auth/register | non  | Inscription — rate limit strict + Turnstile requis (EPIC-20) |
| POST    | /auth/login    | non  | Connexion — rate limit strict + Turnstile requis, verrouillage après échecs répétés (EPIC-20) |
| POST    | /auth/refresh  | non  | Rafraîchir le token |

### Users

| Méthode | Route                 | Auth  | Description              |
| ------- | --------------------- | ----- | ------------------------ |
| GET     | /users/me             | oui   | Profil courant           |
| PATCH   | /users/me             | oui   | Modifier son profil      |
| GET     | /admin/users          | admin | Liste des utilisateurs   |
| PATCH   | /admin/users/:id/role | admin | Changer un rôle          |
| DELETE  | /admin/users/:id      | admin | Supprimer un utilisateur |

### Pages

| Méthode | Route              | Auth             | Description               |
| ------- | ------------------ | ---------------- | ------------------------- |
| POST    | /pages             | éditeur+         | Créer une page            |
| GET     | /pages/tree        | selon visibilité | Arborescence complète     |
| GET     | /pages/:slug       | selon visibilité | Lire une page             |
| PATCH   | /pages/:id         | éditeur+         | Éditer (nouvelle version) |
| PATCH   | /pages/:id/move    | éditeur+         | Déplacer dans l'arbre     |
| DELETE  | /pages/:id         | éditeur+         | Supprimer                 |
| PATCH   | /pages/:id/publish | éditeur+         | Publier/dépublier         |

### Permissions

| Méthode | Route                        | Auth  | Description                          |
| ------- | ----------------------------- | ----- | ------------------------------------- |
| GET     | /pages/:id/permissions        | admin | Grants explicites sur cette page      |
| POST    | /pages/:id/permissions        | admin | Accorder un droit d'éditeur           |
| DELETE  | /pages/:id/permissions/:userId | admin | Révoquer un droit d'éditeur          |

### Versions

| Méthode | Route                                  | Auth             | Description           |
| ------- | -------------------------------------- | ---------------- | --------------------- |
| GET     | /pages/:id/versions                    | selon visibilité | Historique            |
| GET     | /pages/:id/versions/:versionId         | selon visibilité | Une version           |
| GET     | /pages/:id/versions/diff               | selon visibilité | Diff entre 2 versions |
| POST    | /pages/:id/versions/:versionId/restore | éditeur+         | Rollback              |

### Médias

| Méthode | Route          | Auth             | Description       |
| ------- | -------------- | ---------------- | ----------------- |
| POST    | /media/upload  | éditeur+         | Upload vers Minio |
| GET     | /media?pageId= | selon visibilité | Médias d'une page |
| GET     | /media/:id/url | selon visibilité | URL présignée     |
| DELETE  | /media/:id     | éditeur+         | Supprimer         |

### Tags

| Méthode | Route                  | Auth     | Description                |
| ------- | ---------------------- | -------- | -------------------------- |
| POST    | /tags                  | éditeur+ | Créer un tag               |
| GET     | /tags                  | non      | Lister les tags            |
| POST    | /pages/:id/tags        | éditeur+ | Associer un tag à une page |
| DELETE  | /pages/:id/tags/:tagId | éditeur+ | Retirer un tag d'une page  |
| DELETE  | /tags/:id              | admin    | Supprimer un tag           |

### Recherche

| Méthode | Route      | Auth             | Description         |
| ------- | ---------- | ---------------- | ------------------- |
| GET     | /search?q= | selon visibilité | Recherche full-text |

### MCP (pilotage par IA)

| Méthode   | Route                   | Auth                 | Description                                         |
| --------- | ----------------------- | -------------------- | --------------------------------------------------- |
| POST /GET | /mcp                    | clé API MCP (scopes) | Transport MCP (JSON-RPC), expose les tools `wiki_*` |
| POST      | /admin/mcp/api-keys     | admin                | Créer une clé API MCP                               |
| GET       | /admin/mcp/api-keys     | admin                | Lister les clés API MCP                             |
| DELETE    | /admin/mcp/api-keys/:id | admin                | Révoquer une clé                                    |
| GET       | /admin/mcp/audit-log    | admin                | Journal des actions effectuées par les IA           |

### Sécurité

| Méthode | Route              | Auth  | Description                        |
| ------- | ------------------- | ----- | ------------------------------------ |
| GET     | /admin/audit-log    | admin | Journal des actions admin sensibles |

### Réglages système

| Méthode | Route                  | Auth  | Description                          |
| ------- | ------------------------ | ----- | -------------------------------------- |
| GET     | /settings                | non   | Réglages publics (ex. langue de l'UI) |
| PATCH   | /admin/settings/:key     | admin | Modifier un réglage système           |

---

## 8. Suggestion d'ordre de développement

1. EPIC-01 (Setup & Infra)
2. EPIC-02 (Auth) + EPIC-10/11 (Frontend setup + auth) en parallèle
3. EPIC-03 (Pages) + EPIC-12 (Navigation)
4. EPIC-05 (Médias) + EPIC-13 (Éditeur)
5. EPIC-04 (Versioning) + EPIC-14 (Historique/Diff)
6. EPIC-06 (Recherche) + EPIC-15 (Frontend recherche)
7. EPIC-16 (Admin)
8. EPIC-18 (MCP) — une fois les modules Pages/Tags/Users/Média/Recherche stabilisés, car les tools MCP les enveloppent sans dupliquer leur logique
9. EPIC-19 (Permissions avancées) — une fois EPIC-03 (Pages) et EPIC-02 (Auth) stabilisés, car le resolver s'appuie sur l'arborescence et les rôles existants
10. EPIC-20 (Sécurité & anti-abus) — dès que EPIC-02/EPIC-11 (Auth backend + frontend) sont en place, avant une mise en prod
11. EPIC-21 (i18n) — en parallèle du reste du frontend, une fois EPIC-16 (Administration) posé pour le sélecteur de langue
12. EPIC-22 (Cache Redis) — une fois EPIC-03 (Pages) et EPIC-06 (Recherche) stabilisés, en optimisation avant une mise en prod à trafic significatif
13. EPIC-17 (Tests & CI/CD) — en continu dès le début, formalisé à la fin
