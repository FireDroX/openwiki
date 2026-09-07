import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Page } from '../pages/entities/page.entity.js';
import { PageVersion } from '../pages/entities/page-version.entity.js';
import { PageTag } from '../tags/entities/page-tag.entity.js';
import { Tag } from '../tags/entities/tag.entity.js';
import { User } from '../users/entities/user.entity.js';

interface PageSeed {
  slug: string;
  title: string;
  content?: string;
  tags?: string[];
  children?: PageSeed[];
}

interface TagSeed {
  name: string;
  color: string;
}

const TAG_SEED: TagSeed[] = [
  { name: 'documentation', color: '#3b82f6' },
  { name: 'guide', color: '#6366f1' },
  { name: 'installation', color: '#22c55e' },
  { name: 'configuration', color: '#f59e0b' },
  { name: 'api', color: '#a855f7' },
  { name: 'changelog', color: '#14b8a6' },
  { name: 'mcp', color: '#ec4899' },
];

const PAGE_TREE_SEED: PageSeed[] = [
  {
    slug: 'documentation',
    title: 'Documentation',
    content: `# Documentation

Bienvenue dans la documentation d'OpenWiki. Utilisez l'arborescence à gauche pour naviguer entre les sections.`,
    tags: ['documentation'],
    children: [
      {
        slug: 'guide-demarrage',
        title: 'Guide de démarrage',
        tags: ['guide', 'documentation'],
        content: `# Guide de démarrage

Ce guide couvre l'installation, la configuration et le premier lancement d'OpenWiki en local, de bout en bout.

## Vue d'ensemble

OpenWiki est un monorepo pnpm avec deux packages : \`backend/\` (NestJS + TypeORM + MySQL) et \`frontend/\` (React + Vite). Les pages [Installation](/pages/documentation/guide-demarrage/installation) et [Configuration](/pages/documentation/guide-demarrage/configuration) détaillent chaque étape ; ce qui suit résume le parcours complet.

## Étapes

1. **Installation** — cloner le dépôt, installer les dépendances, démarrer MySQL et Minio via Docker. Voir [Installation](/pages/documentation/guide-demarrage/installation).
2. **Configuration** — copier et renseigner les trois fichiers \`.env\` (racine, \`backend/\`, \`frontend/\`). Voir [Configuration](/pages/documentation/guide-demarrage/configuration).
3. **Migrations** — appliquer le schéma de base de données :

\`\`\`bash
cd backend
pnpm run migration:run
\`\`\`

4. **Compte de test** (optionnel, développement uniquement) :

\`\`\`bash
pnpm run seed:dev
\`\`\`

5. **Démarrage** (deux terminaux, depuis la racine du dépôt) :

\`\`\`bash
pnpm run back:dev   # backend sur http://localhost:3000
pnpm run front:dev  # frontend sur http://localhost:5173
\`\`\`

6. Ouvrir [http://localhost:5173](http://localhost:5173) et se connecter avec le compte créé à l'étape 4, ou s'inscrire via la page d'inscription.

## Étapes suivantes

- Créez votre première page depuis le bouton "Nouvelle page" de la barre latérale.
- Consultez la page [Endpoints](/pages/documentation/endpoints) pour la référence complète de l'API.`,
        children: [
          {
            slug: 'installation',
            title: 'Installation',
            tags: ['installation'],
            content: `# Installation

## Prérequis

- Node.js 20+
- pnpm (voir le champ \`packageManager\` de \`package.json\`)
- Docker (pour MySQL et Minio)

## Étapes

1. Cloner le dépôt :

\`\`\`bash
git clone <url-du-dépôt>
cd openwiki
\`\`\`

2. Installer les dépendances :

\`\`\`bash
pnpm install
\`\`\`

3. Démarrer les services (MySQL + Minio) :

\`\`\`bash
docker compose up -d
\`\`\`

4. Appliquer les migrations de base de données :

\`\`\`bash
cd backend
pnpm run migration:run
\`\`\`

Passez ensuite à la page [Configuration](/pages/documentation/guide-demarrage/configuration) pour renseigner les fichiers \`.env\`.

![Aperçu du tableau de bord](https://placehold.co/480x240?text=Dashboard)`,
          },
          {
            slug: 'configuration',
            title: 'Configuration',
            tags: ['configuration'],
            content: `# Configuration

La configuration se fait via trois fichiers \`.env\` distincts, chacun avec un \`.env.example\` à copier :

| Fichier | Rôle |
| --- | --- |
| \`.env\` (racine) | Identifiants MySQL/Minio pour \`docker-compose.yml\` |
| \`backend/.env\` | Port, URL du frontend (CORS), connexion DB, connexion Minio |
| \`frontend/.env\` | \`VITE_API_URL\`, URL de base de l'API backend (préfixe \`/api\` inclus) |

Une fois les trois fichiers renseignés, démarrez les serveurs de développement :

\`\`\`bash
pnpm run back:dev   # backend sur http://localhost:3000
pnpm run front:dev  # frontend sur http://localhost:5173
\`\`\``,
          },
        ],
      },
      {
        slug: 'endpoints',
        title: 'Endpoints',
        tags: ['api'],
        content: `# Endpoints

La documentation ci-dessous est générée automatiquement à partir des routes réellement exposées par le backend (schéma OpenAPI de \`/api/docs-json\`).

<api-reference></api-reference>`,
      },
      {
        slug: 'mcp',
        title: 'Intégration MCP',
        tags: ['mcp'],
        content: `# Intégration MCP

OpenWiki expose un serveur [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) permettant à un assistant IA compatible (Claude Desktop, Claude Code, etc.) de piloter le wiki directement : créer et modifier des pages, gérer des tags, des utilisateurs, uploader des médias et lancer des recherches.

## 1. Créer une clé API

Seul un compte **admin** peut créer une clé, depuis [Administration → Clés API MCP](/admin/mcp/api-keys) ou via l'API :

\`\`\`bash
curl -X POST http://localhost:3000/api/admin/mcp/api-keys \\
  -H "Authorization: Bearer <votre-token-jwt-admin>" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Claude Desktop", "scopes": ["pages:read", "pages:write"] }'
\`\`\`

La clé en clair n'est affichée **qu'une seule fois**, à la création — copiez-la immédiatement, elle n'est plus jamais récupérable ensuite (seuls son nom, ses scopes et sa dernière utilisation restent visibles). Une clé peut être révoquée à tout moment depuis la même page.

## 2. Scopes disponibles

Chaque clé porte un ou plusieurs scopes, qui déterminent les tools visibles et utilisables :

| Scope | Donne accès à |
| --- | --- |
| \`pages:read\` | Lire des pages, lister l'arborescence, rechercher |
| \`pages:write\` | Créer, modifier, publier, supprimer des pages |
| \`tags:read\` | Lister les tags |
| \`tags:write\` | Créer des tags, (dé)taguer une page |
| \`users:read\` | Lister les utilisateurs |
| \`users:write\` | Créer un utilisateur, modifier son rôle |
| \`media:read\` | Obtenir l'URL présignée d'un média |
| \`media:write\` | Uploader une image |
| \`search:read\` | Rechercher (\`pages:read\` suffit aussi) |

Un tool nécessitant un scope absent de la clé n'apparaît même pas dans \`tools/list\`.

## 3. Se connecter avec un client MCP

Le serveur écoute sur \`POST/GET/DELETE /api/mcp\` (transport HTTP streamable, avec gestion de session via l'en-tête \`Mcp-Session-Id\`) et attend la clé API en en-tête \`Authorization: Bearer <clé>\`.

**Avec Claude Code** (CLI \`claude mcp add\`) :

\`\`\`bash
claude mcp add --transport http openwiki http://localhost:3000/api/mcp \\
  --header "Authorization: Bearer <votre-clé-api-mcp>"
\`\`\`

**Avec un autre client** supportant un serveur MCP distant en HTTP (Claude Desktop, etc.), via un fichier de configuration (adapter la syntaxe exacte au client utilisé) :

\`\`\`json
{
  "mcpServers": {
    "openwiki": {
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer <votre-clé-api-mcp>"
      }
    }
  }
}
\`\`\`

Une fois connecté, le client peut lister les tools disponibles (\`tools/list\`) puis les appeler (\`tools/call\`) — seuls les tools couverts par les scopes de la clé apparaissent.

## 4. Tools disponibles

**Pages** (\`pages:read\`/\`pages:write\`)

| Tool | Rôle |
| --- | --- |
| \`wiki_create_page\` | Créer une page (slug, titre, contenu, page parente, visibilité) |
| \`wiki_update_page\` | Modifier titre/contenu (crée une nouvelle version) |
| \`wiki_get_page\` | Récupérer une page par son chemin complet (ex. \`docs/guide\`) |
| \`wiki_list_pages\` | Lister l'arbre entier, ou les enfants directs d'une page |
| \`wiki_delete_page\` | Supprimer une page (\`cascade\` obligatoire si elle a des enfants) |
| \`wiki_publish_page\` | Publier ou dépublier une page |

**Tags** (\`tags:read\`/\`tags:write\`)

| Tool | Rôle |
| --- | --- |
| \`wiki_create_tag\` | Créer un tag |
| \`wiki_list_tags\` | Lister tous les tags |
| \`wiki_tag_page\` | Associer un tag existant à une page |
| \`wiki_untag_page\` | Retirer un tag d'une page |

**Utilisateurs** (\`users:read\`/\`users:write\`)

| Tool | Rôle |
| --- | --- |
| \`wiki_create_user\` | Créer un compte (mot de passe temporaire généré, jamais renvoyé) |
| \`wiki_list_users\` | Lister les utilisateurs (paginé) |
| \`wiki_update_user_role\` | Modifier le rôle d'un utilisateur |

**Médias** (\`media:read\`/\`media:write\`)

| Tool | Rôle |
| --- | --- |
| \`wiki_upload_image\` | Uploader une image (transmise en base64) sur une page |
| \`wiki_get_media_url\` | Obtenir une URL présignée pour un média existant |

**Recherche** (\`search:read\` ou \`pages:read\`)

| Tool | Rôle |
| --- | --- |
| \`wiki_search\` | Rechercher des pages existantes par mot-clé |

## 5. Journal d'audit

Chaque appel de tool (succès ou échec) est tracé — clé utilisée, tool, entrée/sortie (tronquées), statut, message d'erreur. Consultable, filtrable par clé API, depuis [Administration → Journal d'activité MCP](/admin/mcp/audit-log).`,
      },
      {
        slug: 'notes-de-version',
        title: 'Notes de version',
        tags: ['changelog'],
        content: `# Notes de version

## Version 0.17

<details>
<summary>0.17.5 — 2026-09-07</summary>

- Migrations automatiques au déploiement : \`backend/entrypoint.sh\` (\`pnpm run migration:run\` puis \`node dist/main.js\`, \`set -e\` — le conteneur ne démarre pas si une migration échoue) ; \`docker-compose.yml\` gagne les services \`backend\`/\`frontend\`.
- Déploiement continu : \`.github/workflows/deploy.yml\`, déclenché uniquement après succès de la CI sur \`main\` (\`workflow_run\`, jamais sur une PR) — connexion SSH au serveur via tunnel Cloudflare (\`cloudflared\`), \`git pull\` puis \`docker compose up -d --build\`. Premier déploiement sur un serveur vierge : échec attendu (les \`.env\` ne sont pas commités) jusqu'à leur création manuelle une fois.
- \`README.md\` §9 : guide d'installation locale et de déploiement (prérequis, secrets GitHub, configuration du tunnel Cloudflare).
- Corrigé au passage : \`minio@8.0.7\` importe \`stream-json/jsonl/Parser.js\` (casse pré-3.x) alors que le \`stream-json: 3.6.0\` imposé par le correctif de sécurité Dependabot (OPS-010) a renommé ce fichier en minuscules — silencieusement toléré sur système de fichiers insensible à la casse (Windows/macOS, donc invisible en dev), mais faisait planter tout conteneur Docker (Linux) au démarrage. Corrigé par un hook de résolution de module Node natif (\`backend/scripts/\`, chargé via \`node --import\` dans l'entrypoint) plutôt qu'un patch pnpm sur la dépendance ou une rétrogradation.

</details>

<details>
<summary>0.17.4 — 2026-09-07</summary>

- Pipeline CI (\`.github/workflows/ci.yml\`) : lint backend/frontend en parallèle, tests backend (unitaires + e2e, services \`mysql:8\` et \`bitnami/minio\` — \`minio/minio\` seul n'est pas utilisable comme service container GitHub Actions, son CMD par défaut n'affiche que l'aide) et tests frontend sur chaque PR vers \`main\` ; build Docker (\`backend/Dockerfile\`, \`frontend/Dockerfile\`, tous deux ajoutés et testés localement) uniquement sur push vers \`main\`, après succès des jobs précédents. Pas de déploiement automatique dans ce pipeline.

</details>

<details>
<summary>0.17.3 — 2026-09-07</summary>

- Tests frontend (Vitest + Testing Library + jsdom, \`frontend/src/**/*.test.tsx\`) : soumission du formulaire de connexion (appel de \`login()\`, message d'erreur affiché en cas d'échec), auto-génération du slug depuis le titre dans le formulaire de métadonnées de page, rendu et surbrillance du nœud actif dans l'arborescence sur plusieurs niveaux. Les dépendances des composants (auth, arbre de pages) sont injectées directement via leurs contextes React plutôt que par un appel API réel.

</details>

<details>
<summary>0.17.2 — 2026-09-07</summary>

- Tests e2e backend (Vitest + Supertest, \`backend/test/*.e2e-spec.ts\`) sur une base MySQL de test dédiée (\`openwiki_test\`), migrée automatiquement avant la suite : inscription → connexion → profil, page créée → éditée → restaurée (historique de versions vérifié), et les cas d'erreur (email dupliqué, mauvais mot de passe, rôle insuffisant). Chaque test repart d'une base vidée (\`TRUNCATE\`).

</details>

<details>
<summary>0.17.1 — 2026-09-07</summary>

- Tests unitaires backend sur la logique métier critique (\`pages.service.ts\`, \`media.service.ts\`, \`versions.service.ts\`, \`RolesGuard\`, \`JwtAuthGuard\`), via Vitest + \`@nestjs/testing\` avec repositories mockés — couverture ≥ 70% sur ces fichiers.

</details>

## Version 0.16

<details>
<summary>0.16.10 — 2026-09-07</summary>

- Alertes de sécurité Dependabot traitées : \`undici\`, \`tmp\`, \`decode-uri-component\`, \`qs\`, \`stream-json\` (dépendances transitives) forcés vers leurs versions corrigées via \`pnpm-workspace.yaml\` (\`overrides\`). \`.github/dependabot.yml\` ajouté (npm, une seule entrée à la racine du monorepo pnpm — \`pnpm-lock.yaml\` et \`pnpm-workspace.yaml\` y vivent, une entrée par sous-dossier casse la mise à jour du lockfile partagé — hebdomadaire, groupé sur les mises à jour de sécurité) : couvre les *version updates* pnpm (scan hebdomadaire), GitHub ne proposant pas encore de *security updates* automatiques (PR déclenchée par une alerte) pour cet écosystème.

</details>

<details>
<summary>0.16.9 — 2026-09-07</summary>

- Page journal d'audit admin (\`/admin/audit-log\`, réservée admin) : historique paginé des actions admin sensibles (date, admin, action, cible), filtrable par admin et par type d'action.

</details>

<details>
<summary>0.16.8 — 2026-09-07</summary>

- Affichage dédié du verrouillage de compte (\`423\`) sur le formulaire de connexion : message explicite avec décompte jusqu'au déverrouillage (lu depuis le header \`Retry-After\`), plutôt que l'erreur générique de mauvais mot de passe. CORS expose désormais \`Retry-After\` (\`exposedHeaders\`) pour que le frontend puisse le lire.

</details>

<details>
<summary>0.16.7 — 2026-09-07</summary>

- Widget Cloudflare Turnstile sur les formulaires de connexion et d'inscription : le formulaire ne peut pas être soumis tant que le widget n'a pas produit de token valide, transmis dans le payload de soumission. Variable \`VITE_TURNSTILE_SITE_KEY\` (\`frontend/.env\`).
- \`POST /auth/register\` délivre désormais directement les cookies d'authentification (comme \`/auth/login\`) au lieu de nécessiter un second appel à \`/auth/login\` juste après l'inscription — un token Turnstile est à usage unique, le réutiliser pour une seconde vérification aurait échoué.

</details>

<details>
<summary>0.16.6 — 2026-09-07</summary>

- Politique de mot de passe renforcée sur \`POST /auth/register\` : en plus des 8 caractères minimum, le mot de passe doit contenir une majuscule, un chiffre et un caractère spécial (\`400\` sinon). Détection de fuite via l'API haveibeenpwned (k-anonymity, seul un préfixe SHA-1 à 5 caractères est transmis) — mot de passe déjà compromis → \`400\` ; API injoignable → inscription non bloquée (fail-open), erreur loguée côté serveur.

</details>

<details>
<summary>0.16.5 — 2026-09-07</summary>

- Journal d'audit des actions admin sensibles (\`AdminAuditLog\` : admin, action, cible, métadonnées bornées) : chaque changement de rôle et suppression d'utilisateur (REST \`/admin/users\` comme MCP \`wiki_update_user_role\`) crée une entrée. \`GET /admin/audit-log\` (admin, filtrable par \`adminId\`/\`action\`, paginé).

</details>

<details>
<summary>0.16.4 — 2026-09-07</summary>

- Headers de sécurité HTTP standard sur toutes les réponses via \`helmet\` (config par défaut : \`Strict-Transport-Security\`, \`X-Content-Type-Options\`, \`X-Frame-Options\`, etc.). CORS déjà strict (origine limitée à \`FRONTEND_URL\`, pas de wildcard).

</details>

<details>
<summary>0.16.3 — 2026-09-07</summary>

- Verrouillage de compte après échecs répétés : 5 échecs de connexion consécutifs verrouillent le compte 15 minutes (\`POST /auth/login\` → \`423 Locked\` avec header \`Retry-After\`), même avec le bon mot de passe une fois verrouillé. Une connexion réussie remet le compteur d'échecs à zéro.

</details>

<details>
<summary>0.16.2 — 2026-09-07</summary>

- Vérification Cloudflare Turnstile sur \`POST /auth/login\` et \`POST /auth/register\` : le token \`turnstileToken\` transmis dans le body est validé auprès de Cloudflare avant toute vérification d'email/mot de passe. Token manquant ou invalide → \`400\`, sans fuite d'information sur l'existence d'un compte. Nouvelle variable \`TURNSTILE_SECRET_KEY\` (\`backend/.env\`) — si absente, la vérification est ignorée (utile en dev tant que la clé n'est pas configurée).

</details>

<details>
<summary>0.16.1 — 2026-09-07</summary>

- Rate limiting dédié, plus strict que la limite globale, sur \`POST /auth/register\`, \`POST /auth/login\` et \`POST /auth/refresh\` : 5 requêtes/minute/IP.

</details>

<details>
<summary>0.16.0 — 2026-09-07</summary>

- Rate limiting global sur toute l'API : 100 requêtes/minute/IP (\`@nestjs/throttler\`), résolution de l'IP réelle derrière un proxy via \`X-Forwarded-For\`. Dépassement → \`429 Too Many Requests\` avec header \`Retry-After\`.

</details>

## Version 0.15

<details>
<summary>0.15.12 — 2026-09-05</summary>

- Page "Intégration MCP" : ajout d'un exemple de connexion via le CLI Claude Code (\`claude mcp add --transport http ...\`), en complément de l'exemple de configuration JSON générique.

</details>

<details>
<summary>0.15.11 — 2026-09-05</summary>

- Page de documentation "Intégration MCP" (\`/pages/documentation/mcp\`) : création de clé API, scopes disponibles, connexion d'un client MCP, référence des tools par domaine, lien vers le journal d'audit.

</details>

<details>
<summary>0.15.10 — 2026-09-05</summary>

- Page journal d'activité MCP (\`/admin/mcp/audit-log\`, réservée admin) : historique paginé des appels d'outils, filtrable par clé API (\`?apiKeyId=\`, conservé dans l'URL), détail complet (input/output JSON, message d'erreur) au clic sur une ligne.

</details>

<details>
<summary>0.15.9 — 2026-09-05</summary>

- Page de gestion des clés API MCP (\`/admin/mcp/api-keys\`, réservée admin) : création avec sélection des scopes, révélation unique de la clé en clair (confirmation demandée si fermeture sans avoir copié), révocation confirmée par boîte de dialogue (clé grisée plutôt que supprimée de la liste).

</details>

<details>
<summary>0.15.8 — 2026-09-05</summary>

- Journal d'audit des actions MCP : chaque appel de tool (succès ou échec) est tracé (\`McpAuditLog\` : clé API, tool, input/output tronqués à 500 car., succès, message d'erreur), via un wrapper générique autour du dispatch des tools — rien à ajouter dans chaque tool. \`lastUsedAt\` de la clé API est mis à jour à chaque appel réussi. \`GET /admin/mcp/audit-log\` (admin, filtrable par clé, paginé) alimente FE-071.

</details>

<details>
<summary>0.15.7 — 2026-09-05</summary>

- Tool MCP de recherche : \`wiki_search\` (scope \`search:read\` ou \`pages:read\`, l'un des deux suffit). Une clé avec uniquement \`pages:write\` (aucun scope de lecture) ne peut pas l'appeler.

</details>

<details>
<summary>0.15.6 — 2026-09-05</summary>

- Tool MCP d'upload de médias : \`wiki_upload_image\` (fichier transmis en base64, décodé puis validé avec la même logique que l'upload REST — taille, type MIME), \`wiki_get_media_url\` (scopes \`media:read\`/\`media:write\`). Un base64 malformé ou un fichier trop volumineux sont rejetés avant tout appel à Minio.
- La limite de taille du corps JSON de l'API est relevée à 30 Mo (\`GET/POST /api/*\`) pour permettre le transport d'images en base64 par MCP ; l'upload REST multipart (\`/media/upload\`) n'est pas concerné et reste inchangé.

</details>

<details>
<summary>0.15.5 — 2026-09-05</summary>

- Tools MCP de gestion des utilisateurs : \`wiki_create_user\`, \`wiki_list_users\`, \`wiki_update_user_role\` (scopes \`users:read\`/\`users:write\`). Le mot de passe temporaire généré à la création n'est jamais renvoyé. Ces tools sont invisibles dans \`tools/list\` pour une clé sans le scope requis, pas juste refusés à l'appel.

</details>

<details>
<summary>0.15.4 — 2026-09-05</summary>

- Tools MCP de gestion des tags : \`wiki_create_tag\`, \`wiki_list_tags\`, \`wiki_tag_page\`, \`wiki_untag_page\` (scopes \`tags:read\`/\`tags:write\`). \`wiki_tag_page\` avec un \`tagId\` inexistant renvoie une erreur explicite invitant à créer le tag d'abord.
- Correctif : \`POST /pages/:id/tags\` (REST et MCP) vérifiait l'accès à la page comme un visiteur anonyme et rejetait donc le tagging de ses propres pages privées/non publiées ; l'identité de l'appelant est maintenant transmise à la vérification.

</details>

<details>
<summary>0.15.3 — 2026-09-05</summary>

- Tools MCP de gestion des pages : \`wiki_create_page\`, \`wiki_update_page\`, \`wiki_get_page\`, \`wiki_list_pages\`, \`wiki_delete_page\`, \`wiki_publish_page\` (scopes \`pages:read\`/\`pages:write\`). Une clé avec un scope pages voit les pages privées/non publiées comme un éditeur, pas comme un visiteur anonyme.

</details>

<details>
<summary>0.15.2 — 2026-09-05</summary>

- Authentification MCP par clé API à scopes : entité \`McpApiKey\`, \`POST/GET/DELETE /admin/mcp/api-keys\` (admin uniquement). La clé en clair n'est affichée qu'à la création ; une clé révoquée (ou absente) est rejetée par le guard MCP avec une erreur JSON-RPC (\`code: -32001\`) plutôt qu'un \`401\` REST classique.

</details>

<details>
<summary>0.15.1 — 2026-09-05</summary>

- Socle du serveur MCP (\`@modelcontextprotocol/sdk\`) : \`POST/GET/DELETE /mcp\`, transport HTTP streamable avec gestion de session. Aucun tool enregistré à ce stade — un client MCP peut se connecter et lister les tools via \`tools/list\` (liste vide).

</details>

<details>
<summary>0.15.0 — 2026-09-05</summary>

- Entités \`Tag\`/\`PageTag\` + endpoints CRUD : \`POST/GET /tags\`, \`DELETE /tags/:id\` (cascade sur les associations), \`POST/DELETE /pages/:id/tags\`. Chaque tag a une couleur (hex) choisie à la création.

</details>

## Version 0.14

<details>
<summary>0.14.3 — 2026-09-05</summary>

- La langue de l'interface suit désormais le réglage global (\`GET /settings\`, sans authentification) au chargement de l'application, pour tous les visiteurs — aucune préférence par utilisateur, pas de \`localStorage\`.
- Depuis le panel admin, changer la langue (FE-064) retraduit désormais réellement l'UI de l'admin immédiatement ; les autres visiteurs l'appliquent à leur prochain chargement.

</details>

<details>
<summary>0.14.2 — 2026-09-05</summary>

- Intégration \`react-i18next\` : toute la chrome applicative (menus, formulaires, messages, dates relatives) passe désormais par \`useTranslation()\`/\`t()\`, avec des dictionnaires FR/EN complets — le contenu markdown des pages reste, lui, jamais traduit automatiquement.

</details>

<details>
<summary>0.14.1 — 2026-09-05</summary>

- \`GET /settings\` (public, sans authentification) : réglages système exposés à plat (ex. \`{ "locale": "fr" }\`), nécessaire pour les visiteurs non connectés.
- \`PATCH /admin/settings/:key\` (admin) : modifie un réglage, validation dépendant de la clé (\`locale\` limité à \`fr\`/\`en\` pour l'instant) → \`400\` sinon.

</details>

<details>
<summary>0.14.0 — 2026-09-05</summary>

- Entité \`SystemSetting\` (clé/valeur) + migration : socle des réglages système globaux, seedée avec \`locale=fr\`.

</details>

## Version 0.13

<details>
<summary>0.13.1 — 2026-09-05</summary>

- Sélecteur de langue FR/EN dans les paramètres d'administration (\`/admin/settings\`), appelle \`PATCH /admin/settings/locale\`. Réglage global, pas par utilisateur.
- ⚠️ Le socle i18n et l'endpoint \`/admin/settings/:key\` restent à livrer par EPIC-21 : ce sélecteur appellera un endpoint pas encore implémenté tant qu'EPIC-21 n'est pas posé.

</details>

<details>
<summary>0.13.0 — 2026-09-05</summary>

- Page d'administration des utilisateurs (\`/admin/users\`, réservée admin) : liste, changement de rôle inline et suppression (confirmée par boîte de dialogue) — un admin ne peut ni se rétrograder ni se supprimer lui-même (action désactivée sur sa propre ligne).
- Lien "Administration" du menu utilisateur relié à cette page.

</details>

## Version 0.12

<details>
<summary>0.12.4 — 2026-09-03</summary>

- Panneau "Droits d'édition" dans l'éditeur de page (réservé admin) : liste des éditeurs grantés explicitement sur la page, ajout via une recherche d'utilisateur, révocation confirmée par boîte de dialogue.

</details>

<details>
<summary>0.12.3 — 2026-09-03</summary>

- Révocation d'un droit d'édition (\`DELETE /pages/:id/permissions/:userId\`, admin) : \`204\` si un grant explicite existait sur cette page précise, \`404\` sinon — révoquer un droit hérité d'une page ancêtre (au lieu d'un grant explicite sur la page ciblée) échoue volontairement en \`404\`, sans effet sur l'héritage.

</details>

<details>
<summary>0.12.2 — 2026-09-03</summary>

- Création et consultation des droits d'édition explicites d'une page (\`POST\`/\`GET /pages/:id/permissions\`, admin) : un doublon \`(pageId, userId)\` renvoie \`409\`, la liste ne renvoie que les grants définis directement sur cette page (jamais les grants hérités). \`PATCH /pages/:id\` accepte désormais aussi un \`reader\` disposant d'un grant sur la page (la restriction éditeur/admin ne s'appliquait jusque-là qu'aux autres routes de mutation).

</details>

<details>
<summary>0.12.1 — 2026-09-03</summary>

- Résolution du droit d'édition effectif d'une page : un \`reader\` global avec un grant explicite sur une page hérite du droit d'édition sur toute sa sous-arborescence (le grant le plus proche dans l'arbre l'emporte), \`editor\`/\`admin\` globaux ne sont jamais bloqués. Appliqué avant modification, déplacement, suppression et publication d'une page.

</details>

<details>
<summary>0.12.0 — 2026-09-03</summary>

- Entité \`PagePermission\` + migration : modélise les grants d'édition par page (\`pageId\`, \`userId\`, \`grantedById\`), unique sur \`(pageId, userId)\`.

</details>

## Version 0.11

<details>
<summary>0.11.1 — 2026-09-03</summary>

- Page de résultats de recherche complète (\`/search?q=&page=\`) : pagination synchronisée avec l'URL (bookmarkable), terme recherché surligné dans le titre et l'extrait de chaque résultat.
- La recherche utilise désormais le mode booléen MySQL avec préfixe (\`terme*\`) plutôt que le mode langage naturel, pour que taper un début de mot (ex. "note") remonte aussi les mots qui le contiennent (ex. "Notes").

</details>

<details>
<summary>0.11.0 — 2026-09-03</summary>

- Barre de recherche globale (\`Ctrl+K\`/\`Cmd+K\` depuis n'importe quelle route, ou clic sur la barre dans la Topbar) : dialog de commande avec débounce de 300 ms, titre + extrait par résultat, navigation directe vers la page au clic.

</details>

## Version 0.10

<details>
<summary>0.10.1 — 2026-09-03</summary>

- Endpoint de recherche full-text (\`GET /search?q=&page=&limit=\`) : recherche \`MATCH...AGAINST\` sur le titre et le contenu de la version courante de chaque page, résultats triés par pertinence avec un extrait généré autour du terme trouvé. Authentification optionnelle : les lecteurs anonymes ou non-éditeurs ne voient que les pages publiques et publiées, les éditeurs/admins voient tout.

</details>

<details>
<summary>0.10.0 — 2026-09-03</summary>

- Index FULLTEXT MySQL sur \`page_versions\` (\`title\`, \`content\`) pour préparer la recherche full-text.

</details>

## Version 0.9

<details>
<summary>0.9.2 — 2026-09-02</summary>

- Action "Restaurer" sur chaque version de l'historique (\`POST /pages/:id/versions/:versionId/restore\`, éditeur+), confirmation via boîte de dialogue, puis rafraîchissement de la liste : la version restaurée apparaît en haut avec le résumé auto-généré côté backend.

</details>

<details>
<summary>0.9.1 — 2026-09-02</summary>

- Vue diff entre les deux versions sélectionnées dans l'historique : diff ligne à ligne (\`POST /pages/:id/versions/diff\`), lignes ajoutées/supprimées mises en couleur, lignes identiques non colorées, en-tête affichant la date de chaque version comparée.

</details>

<details>
<summary>0.9.0 — 2026-09-02</summary>

- Historique des versions d'une page (\`/history/*\`) : liste paginée (auteur, date relative, résumé), sélection de deux versions au maximum (cocher une 3e ligne décoche automatiquement la plus ancienne sélection), aperçu du contenu d'une version.
- Bouton "Historique" sur la vue d'une page, visible selon les mêmes droits de visibilité que la page elle-même.

</details>

## Version 0.8

<details>
<summary>0.8.4 — 2026-09-02</summary>

- Nouvelle direction artistique de l'éditeur de page (création et modification), alignée sur la maquette : vue plein écran sans navigation latérale, panneau de métadonnées permanent (titre, chemin, page parente, visibilité), barre d'outils markdown (gras, italique, code, lien, image, pièce jointe) et actions "Enregistrer le brouillon" / "Publier".
- En modification, le résumé de modification est désormais un champ permanent du panneau plutôt qu'une boîte de dialogue, et le déplacement de la page (page parente) s'applique immédiatement.

</details>

<details>
<summary>0.8.3 — 2026-09-02</summary>

- Boîte de dialogue de sauvegarde avec champ "résumé de modification" (optionnel), ouverte par le bouton Sauvegarder ou \`Ctrl+S\`/\`Cmd+S\` sur l'éditeur de page ; confirmation par toast une fois la sauvegarde effectuée.

</details>

<details>
<summary>0.8.2 — 2026-09-02</summary>

- Formulaire de métadonnées de page (titre, slug auto-généré et éditable, visibilité, sélection de la page parente via une recherche dans l'arborescence) et page "Nouvelle page" (\`/new\`), reliée au bouton de la barre latérale pour les éditeurs et admins.

</details>

<details>
<summary>0.8.1 — 2026-09-02</summary>

- Upload d'images depuis l'éditeur : bouton toolbar et glisser-déposer directement sur la zone d'édition, insertion automatique du markdown à la position du curseur.
- Notifications (toasts) pour les erreurs d'upload (fichier trop volumineux, type non supporté).

</details>

<details>
<summary>0.8.0 — 2026-09-02</summary>

- Éditeur markdown avec prévisualisation live (split view, bascule mobile édition/aperçu, debounce, raccourci \`Ctrl+S\`/\`Cmd+S\`, confirmation de sortie si modifications non sauvegardées).
- Page \`/edit/*\` (éditeur+) pour modifier une page existante, accessible via un bouton "Modifier" sur la vue d'une page.

</details>

## Version 0.7

<details>
<summary>0.7.4 — 2026-09-02</summary>

- \`DELETE /media/:id\` (éditeur+) : supprime un attachment (fichier Minio puis ligne en base, dans cet ordre).

</details>

<details>
<summary>0.7.3 — 2026-09-02</summary>

- \`GET /media/:id/url\` (selon visibilité) : génère une URL présignée pour un attachment existant.

</details>

<details>
<summary>0.7.2 — 2026-09-02</summary>

- \`GET /media?pageId=\` (selon visibilité) : liste les médias rattachés à une page, avec URL présignée pour chacun.

</details>

<details>
<summary>0.7.1 — 2026-09-02</summary>

- \`POST /media/upload\` (éditeur+, multipart/form-data) : upload d'un fichier vers Minio, clé \`pages/{pageId}/{uuid}-{filename}\`, enregistrement en \`Attachment\` et retour d'une URL présignée. Limite de 20 Mo et whitelist de types MIME (images + documents courants).

</details>

<details>
<summary>0.7.0 — 2026-09-02</summary>

- Entité \`Attachment\` + migration : modélise les fichiers stockés sur Minio (\`pageId\` nullable, \`minioKey\`, \`filename\`, \`mimeType\`, \`size\`, \`uploadedById\`), index sur \`pageId\` pour \`GET /media?pageId=\`.

</details>

## Version 0.6

<details>
<summary>0.6.6 — 2026-09-02</summary>

- Documentation interactive de l'API (\`GET /api/docs\`, \`GET /api/docs-json\`) générée depuis les décorateurs \`@nestjs/swagger\`.
- Page "Endpoints" reliée à cette documentation via un composant de référence intégré au rendu markdown.

</details>

<details>
<summary>0.6.5 — 2026-09-01</summary>

- \`POST /pages/:id/versions/:versionId/restore\` : rollback vers une ancienne version (crée une nouvelle version, l'historique reste intact).

</details>

<details>
<summary>0.6.4 — 2026-09-01</summary>

- \`POST /pages/:id/versions/diff\` : diff ligne à ligne entre deux versions (\`from\`/\`to\` en body plutôt qu'en query).

</details>

<details>
<summary>0.6.3 — 2026-09-01</summary>

- \`GET /pages/:id/versions/:versionId\` : détail d'une version précise, vérifie qu'elle appartient bien à la page.

</details>

<details>
<summary>0.6.2 — 2026-09-01</summary>

- \`GET /pages/:id/versions\` : historique paginé des versions d'une page, droits alignés sur sa visibilité.

</details>

<details>
<summary>0.6.1 — 2026-09-01</summary>

- Entité \`PageVersion\` + migration : index sur \`pageId\` pour accélérer l'historique des versions d'une page.

</details>

## Version 0.5

<details>
<summary>0.5.4 — 2026-09-01</summary>

- Icônes de dossier/page dans l'arborescence, alignées façon VS Code (chevron avant l'icône).
- En-tête pleine largeur avec logo OpenWiki.
- Barre de filtre et bouton "Nouvelle page" (aperçu) dans la barre latérale.

</details>

<details>
<summary>0.5.3 — 2026-09-01</summary>

- Page de visualisation d'une page : rendu markdown, coloration syntaxique des blocs de code, images.
- Résolution par chemin complet (arborescence), pas par simple slug.
- États de chargement, page introuvable (404) et accès refusé (403).

</details>

<details>
<summary>0.5.2 — 2026-09-01</summary>

- Fournisseur de contexte de l'arborescence des pages et composant fil d'ariane (breadcrumb).

</details>

<details>
<summary>0.5.1 — 2026-09-01</summary>

- Script de seed de développement et composants d'arborescence des pages côté frontend.

</details>

## Version 0.4

<details>
<summary>0.4.8 — 2026-09-01</summary>

- Module de gestion des pages : entité, migration, création, modification, déplacement, suppression (cascade), publication et arborescence.

</details>

## Version 0.3

<details>
<summary>0.3.5 — 2026-08-30</summary>

- Initialisation du frontend (React, Vite, TypeScript) et parcours d'authentification (connexion, inscription, cookies).

</details>

## Version 0.2

<details>
<summary>0.2.8 — 2026-08-30</summary>

- Authentification et gestion des utilisateurs : inscription, connexion JWT, rafraîchissement de token, profils, pagination.

</details>

## Version 0.1

<details>
<summary>0.1.4 — 2026-08-29</summary>

- Mise en place du monorepo pnpm (backend/frontend), Docker Compose (MySQL + Minio) et intégration du stockage d'objets.

</details>`,
      },
    ],
  },
];

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  timezone: 'Z',
  synchronize: false,
  entities: [User, Page, PageVersion, Tag, PageTag],
});

async function resolveContentAuthorId(dataSource: DataSource): Promise<string> {
  const userRepository = dataSource.getRepository(User);
  const [oldest] = await userRepository.find({
    order: { createdAt: 'ASC' },
    take: 1,
  });
  if (!oldest) {
    throw new Error(
      'No user found in database — create an admin user before running the content seed.',
    );
  }
  return oldest.id;
}

async function seedTags(dataSource: DataSource): Promise<Map<string, string>> {
  const tagRepository = dataSource.getRepository(Tag);
  const tagIdByName = new Map<string, string>();

  for (const seed of TAG_SEED) {
    let tag = await tagRepository.findOneBy({ name: seed.name });
    if (!tag) {
      tag = await tagRepository.save(
        tagRepository.create({ name: seed.name, color: seed.color }),
      );
      console.log(`Created tag "${seed.name}".`);
    } else if (tag.color !== seed.color) {
      tag.color = seed.color;
      tag = await tagRepository.save(tag);
      console.log(`Updated color of tag "${seed.name}".`);
    }
    tagIdByName.set(seed.name, tag.id);
  }

  return tagIdByName;
}

async function seedPageTags(
  dataSource: DataSource,
  pageId: string,
  tagNames: string[],
  tagIdByName: Map<string, string>,
): Promise<void> {
  const pageTagRepository = dataSource.getRepository(PageTag);

  for (const tagName of tagNames) {
    const tagId = tagIdByName.get(tagName);
    if (!tagId) {
      continue;
    }

    const existing = await pageTagRepository.findOneBy({ pageId, tagId });
    if (!existing) {
      await pageTagRepository.save(pageTagRepository.create({ pageId, tagId }));
      console.log(`Tagged page "${pageId}" with "${tagName}".`);
    }
  }
}

async function seedPage(
  dataSource: DataSource,
  seed: PageSeed,
  parentId: string | null,
  authorId: string,
  tagIdByName: Map<string, string>,
): Promise<Page> {
  const pageRepository = dataSource.getRepository(Page);
  const versionRepository = dataSource.getRepository(PageVersion);

  let page = await pageRepository.findOneBy({ slug: seed.slug });
  const content = seed.content ?? `# ${seed.title}`;

  if (!page) {
    page = await pageRepository.save(
      pageRepository.create({
        slug: seed.slug,
        title: seed.title,
        parentId,
        isPublished: true,
        visibility: 'public',
        createdById: authorId,
      }),
    );

    const version = await versionRepository.save(
      versionRepository.create({
        pageId: page.id,
        title: seed.title,
        content,
        authorId,
      }),
    );

    page.currentVersionId = version.id;
    await pageRepository.save(page);
    console.log(`Created page "${seed.slug}".`);
  } else {
    const currentVersion = page.currentVersionId
      ? await versionRepository.findOneBy({ id: page.currentVersionId })
      : null;
    const contentChanged =
      currentVersion?.content !== content || page.title !== seed.title;
    const moved = page.parentId !== parentId;

    if (contentChanged) {
      const version = await versionRepository.save(
        versionRepository.create({
          pageId: page.id,
          title: seed.title,
          content,
          authorId,
          changeSummary: 'Content seed update',
        }),
      );

      page.title = seed.title;
      page.currentVersionId = version.id;
    }

    if (moved) {
      page.parentId = parentId;
    }

    if (contentChanged || moved) {
      page = await pageRepository.save(page);
      if (contentChanged && moved) {
        console.log(`Updated and moved page "${seed.slug}".`);
      } else if (contentChanged) {
        console.log(`Updated page "${seed.slug}".`);
      } else {
        console.log(`Moved page "${seed.slug}".`);
      }
    } else {
      console.log(`Page "${seed.slug}" already up to date, skipping.`);
    }
  }

  if (seed.tags?.length) {
    await seedPageTags(dataSource, page.id, seed.tags, tagIdByName);
  }

  for (const child of seed.children ?? []) {
    await seedPage(dataSource, child, page.id, authorId, tagIdByName);
  }

  return page;
}

async function run(): Promise<void> {
  await dataSource.initialize();

  const authorId = await resolveContentAuthorId(dataSource);
  const tagIdByName = await seedTags(dataSource);
  for (const root of PAGE_TREE_SEED) {
    await seedPage(dataSource, root, null, authorId, tagIdByName);
  }

  await dataSource.destroy();
  console.log('Content seed complete.');
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
