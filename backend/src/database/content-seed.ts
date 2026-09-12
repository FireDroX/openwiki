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

Ce guide couvre l'installation locale, la configuration, et le déploiement en production d'OpenWiki, de bout en bout.

## Vue d'ensemble

OpenWiki est un monorepo pnpm avec deux packages : \`backend/\` (NestJS + TypeORM + MySQL) et \`frontend/\` (React + Vite). Les pages [Installation](/pages/documentation/guide-demarrage/installation), [Configuration](/pages/documentation/guide-demarrage/configuration) et [Déploiement](/pages/documentation/guide-demarrage/deploiement) détaillent chaque étape ; ce qui suit résume le parcours local complet.

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
- Consultez la page [Endpoints](/pages/documentation/endpoints) pour la référence complète de l'API.
- Pour mettre OpenWiki en production, voir [Déploiement](/pages/documentation/guide-demarrage/deploiement).`,
        children: [
          {
            slug: 'installation',
            title: 'Installation',
            tags: ['installation'],
            content: `# Installation

## Prérequis

- Node.js 22+, [pnpm](https://pnpm.io/) (version pinnée dans le champ \`packageManager\` de \`package.json\`)
- Docker + Docker Compose (pour MySQL et Minio)

## Installation locale (développement)

\`\`\`bash
git clone <url-du-dépôt>
cd wiki

# MySQL + Minio
docker compose up -d

# Copier les 3 fichiers .env.example -> .env et renseigner les valeurs
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

pnpm install

cd backend
pnpm run migration:run    # crée le schéma
pnpm run seed:dev         # utilisateur admin de dev
pnpm run seed:content     # arborescence de doc/notes de version/FAQ
cd ..

pnpm run back:dev   # terminal 1 — backend sur :3000
pnpm run front:dev  # terminal 2 — frontend sur :5173
\`\`\`

Passez à la page [Configuration](/pages/documentation/guide-demarrage/configuration) pour le détail des trois fichiers \`.env\`, ou à [Déploiement](/pages/documentation/guide-demarrage/deploiement) pour la mise en production.

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
          {
            slug: 'deploiement',
            title: 'Déploiement',
            tags: ['installation', 'configuration'],
            content: `# Déploiement

## Docker Compose en production

Deux versions du \`docker-compose\` sont disponibles :

- **\`docker-compose.yml\`** — version complète (\`mysql\`, \`minio\`, \`backend\`, \`frontend\`), pour un serveur vierge qui n'a encore ni base de données ni stockage objet. Usage manuel uniquement (\`docker compose up -d --build\`), non branché sur le déploiement continu.
- **\`docker-compose.external.yml\`** — version allégée (\`backend\`, \`frontend\` seulement), pour réutiliser un MariaDB/MySQL et un Minio déjà existants sur le serveur (ex. mutualisés avec d'autres apps) plutôt que d'en relancer une paire dédiée. Rejoint le réseau Docker **externe** \`mariadb-network\` où vivent déjà ces conteneurs, au lieu d'en créer un nouveau — adaptez le nom du réseau dans le fichier si le vôtre s'appelle différemment. **C'est celle-ci qu'utilise \`.github/workflows/deploy.yml\`** (\`docker compose -f docker-compose.external.yml up -d --build\`) — le déploiement continu part donc du principe que le mariadb/minio cible existe déjà sur le serveur ; adapter le workflow si un déploiement doit un jour repartir de la version complète.

\`backend\`/\`frontend\` se construisent depuis \`backend/Dockerfile\`/\`frontend/Dockerfile\` (contexte = racine du dépôt, pour le workspace pnpm) dans les deux cas. \`backend/Dockerfile\` exécute \`backend/entrypoint.sh\` au démarrage du conteneur : \`pnpm run migration:run\` puis \`pnpm run seed:content\` puis \`node dist/main.js\` — si une migration échoue, le conteneur ne démarre pas (\`set -e\`), plutôt que de tourner sur un schéma incohérent. Le seed de contenu, lui, échoue sans bloquer le démarrage (\`|| echo ...\`, pas de \`set -e\` dessus) — utile sur le tout premier déploiement, où aucun utilisateur n'existe encore pour lui servir d'auteur ; il repasse au déploiement suivant, une fois le premier admin créé. Les deux sont idempotents : redémarrer sans changement ne fait rien.

**Images/médias affichés dans les pages** : \`MINIO_ENDPOINT\` sert au backend pour parler à Minio en interne (ex. le nom du service Docker, injoignable depuis un navigateur) — si les images n'apparaissent pas côté client, c'est qu'il manque \`MINIO_PUBLIC_ENDPOINT\` (+ \`MINIO_PUBLIC_PORT\`/\`MINIO_PUBLIC_USE_SSL\`) dans \`backend/.env\`, pointant vers un hôte Minio joignable publiquement (ex. tunnel Cloudflare dédié) : c'est cette valeur, et seulement elle, qui sert à signer les URLs présignées données au navigateur. Sans elle, \`getPresignedUrl\` retombe sur \`MINIO_ENDPOINT\`, ce qui casse toute image en prod si celui-ci n'est pas un hôte public.

**Sur le serveur, une seule fois (version complète) :**

\`\`\`bash
git clone <url-du-dépôt> /chemin/vers/openwiki
cd /chemin/vers/openwiki
cp .env.example .env               # MYSQL_*, MINIO_*, VITE_*
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# éditer les 3 .env — en particulier backend/.env : DB_HOST=mysql et
# MINIO_ENDPOINT=minio (les noms des services docker-compose, pas
# localhost comme en dev local)
docker compose up -d --build
\`\`\`

**Version allégée (mariadb/minio déjà existants) :**

\`\`\`bash
git clone <url-du-dépôt> /chemin/vers/openwiki
cd /chemin/vers/openwiki
cp .env.example .env               # seul VITE_* est lu par cette version
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# backend/.env : DB_HOST/MINIO_ENDPOINT doivent pointer vers les noms de
# conteneur réels de vos mariadb/minio existants (pas mysql/minio, ni
# localhost) ; DB_USERNAME/DB_PASSWORD/DB_DATABASE et MINIO_ACCESS_KEY/
# MINIO_SECRET_KEY/MINIO_BUCKET doivent correspondre à des identifiants
# déjà valides sur ces instances (ce fichier n'y crée rien pour vous)
docker compose -f docker-compose.external.yml up -d --build
\`\`\`

Si Minio n'existe pas encore et que vous voulez le lancer à part (sans compose), une seule fois sur le serveur :

\`\`\`bash
docker run -d --name minio --network mariadb-network --restart unless-stopped \\
  -e MINIO_ROOT_USER=<clé-accès> -e MINIO_ROOT_PASSWORD=<clé-secrète> \\
  -p 9000:9000 -p 9001:9001 -v minio-data:/data \\
  minio/minio server /data --console-address ":9001"
\`\`\`

Ces trois fichiers \`.env\` ne sont **jamais commités** (\`.gitignore\`) : sur un premier \`git clone\` sans eux, \`docker compose up\` échoue (variables manquantes) — c'est attendu, pas un bug. Une fois créés à la main comme ci-dessus, tous les déploiements suivants (manuels ou automatiques via CI/CD) fonctionnent.

## CI/CD

- \`.github/workflows/ci.yml\` — lint + tests (backend + frontend) sur chaque PR vers \`main\` ; build Docker des deux images en plus sur chaque push vers \`main\`. Voir la page [Notes de version](/pages/documentation/notes-de-version) pour le détail des jobs.
- \`.github/workflows/deploy.yml\` — se déclenche uniquement quand \`ci.yml\` vient de réussir sur \`main\` (\`workflow_run\`, jamais sur une PR) : se connecte en SSH au serveur via un tunnel Cloudflare, puis \`git pull && docker compose up -d --build\`.

Le déploiement passe par un tunnel Cloudflare (\`cloudflared\`) plutôt que d'exposer SSH publiquement — sans application Access devant (pas de service token à gérer). À configurer une fois, côté [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) :

1. **Tunnel** — créer un tunnel \`cloudflared\` sur le serveur, avec une route publique (Public Hostname) vers \`ssh://localhost:22\`.
2. **Clé SSH** — générer une paire de clés dédiée au déploiement (\`ssh-keygen -t ed25519 -C "openwiki-deploy"\`, sans passphrase) et ajouter la clé **publique** à \`~/.ssh/authorized_keys\` de l'utilisateur de déploiement sur le serveur.

Puis, secrets du dépôt GitHub (Settings → Secrets and variables → Actions) :

| Secret | Contenu |
| --- | --- |
| \`DEPLOY_SSH_PRIVATE_KEY\` | Clé **privée** générée à l'étape 2 |
| \`DEPLOY_SSH_HOSTNAME\` | Hostname public du tunnel (étape 1) |
| \`DEPLOY_SSH_USER\` | Utilisateur SSH sur le serveur |
| \`DEPLOY_PATH\` | Chemin absolu du clone git sur le serveur (ex. \`/opt/openwiki\`) |

Si une application Access protège un jour ce hostname (service token), \`deploy.yml\` sait déjà où l'ajouter : \`TUNNEL_SERVICE_TOKEN_ID\`/\`TUNNEL_SERVICE_TOKEN_SECRET\` en env du job \`deploy\`, lus automatiquement par \`cloudflared access ssh\`.

\`deploy.yml\` ne configure ni ne modifie la protection de branche \`main\` (statut check requis pour bloquer un merge sur test cassé) — c'est un réglage du dépôt GitHub (Settings → Branches), pas quelque chose qu'un fichier de workflow puisse exprimer.`,
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

## Version 0.21

<details>
<summary>0.21.8 — 2026-09-12</summary>

- Modération des commentaires côté admin : nouveau bouton "Messages" sur chaque ligne de `/admin/users`, ouvrant un panneau listant les commentaires de l'utilisateur (page d'origine, contenu, date), paginé, avec sélection multiple et purge (sélection ou totale), chacune avec sa propre confirmation.

</details>

<details>
<summary>0.21.7 — 2026-09-12</summary>

- Fil de commentaires sur la vue de lecture d'une page : lire, écrire, répondre (1 niveau), éditer et supprimer son propre commentaire, avec suppression modérée pour les éditeurs/admins.

</details>

<details>
<summary>0.21.6 — 2026-09-12</summary>

- Correctif : \`GET\`/\`POST /pages/:id/comments\` étaient masqués par la route générique \`GET /pages/*path\` (lecture d'une page par chemin) et retournaient toujours "Page not found". Les deux routes vivent maintenant directement sur \`PagesController\`, comme les autres sous-ressources de page (versions, permissions), déclarées avant la route générique.

</details>

<details>
<summary>0.21.5 — 2026-09-12</summary>

- Modération admin des commentaires : \`GET /admin/users/:id/comments\` liste tous les commentaires d'un utilisateur (paginé, avec la page d'origine), \`DELETE /admin/users/:id/comments\` purge tout ou une sélection (\`commentIds\`), cascade sur les réponses, tracé dans le journal d'audit.

</details>

<details>
<summary>0.21.4 — 2026-09-12</summary>

- Nouvel endpoint \`PATCH /comments/:id\` : l'auteur peut éditer son propre commentaire, ce qui pose \`editedAt\` (affiché "(modifié)" côté UI).

</details>

<details>
<summary>0.21.3 — 2026-09-12</summary>

- Nouvel endpoint \`DELETE /comments/:id\` : l'auteur peut retirer son propre commentaire (suppression douce, affiché "[commentaire supprimé]") ; un éditeur ou un admin peut le supprimer définitivement, avec cascade sur ses réponses. Une suppression par un admin est tracée dans le journal d'audit.

</details>

<details>
<summary>0.21.2 — 2026-09-12</summary>

- Nouvel endpoint \`POST /pages/:id/comments\` : créer un commentaire, ou une réponse via \`parentId\` (1 seul niveau de nesting). Ouvert à tout utilisateur authentifié ayant accès à la page, avec limitation de fréquence sur la création.

</details>

<details>
<summary>0.21.1 — 2026-09-12</summary>

- Nouvel endpoint \`GET /pages/:id/comments\` : liste les commentaires d'une page (arbre à un niveau, réponses incluses), en respectant la visibilité de la page.

</details>

<details>
<summary>0.21.0 — 2026-09-12</summary>

- Nouvelle entité \`Comment\` (page, auteur, réponse à 1 niveau, édition et suppression douce) et sa migration — première brique du système de commentaires sur les pages (EPIC-07).

</details>

## Version 0.20

<details>
<summary>0.20.5 — 2026-09-12</summary>

- Remplacement de Minio par [RustFS](https://rustfs.com) pour le stockage objet (S3-compatible) : l'édition Community de Minio (serveur) a été archivée en 2026 et n'est plus distribuée nulle part (Docker Hub, binaires officiels). RustFS est un remplacement direct, activement maintenu et open-source (Apache 2.0) — aucun changement de configuration côté \`backend/.env\` (les variables \`MINIO_*\` restent inchangées). Sur un serveur déjà en place, une seule commande \`chown\` du volume existant est nécessaire avant la mise à jour (voir le README).

</details>

<details>
<summary>0.20.4 — 2026-09-12</summary>

- \`GET /media\` devient \`POST /media\` : les filtres (\`pageId\`, \`search\`, \`type\`, \`page\`, \`limit\`) passent désormais dans le corps de la requête plutôt qu'en query string, pour un typage plus simple côté backend et frontend.

</details>

<details>
<summary>0.20.3 — 2026-09-12</summary>

- Le picker de médiathèque permet désormais de supprimer un média directement (avec confirmation) ; la suppression est refusée avec un message explicite si le média est encore utilisé sur une autre page.

</details>

<details>
<summary>0.20.2 — 2026-09-12</summary>

- Nouveau bouton "Médiathèque" dans l'éditeur de pages : parcourir/rechercher les médias déjà uploadés (avec filtre image/fichier) et en insérer un directement, ou en uploader un nouveau depuis la même fenêtre.

</details>

<details>
<summary>0.20.1 — 2026-09-12</summary>

- La suppression d'un média (\`DELETE /media/:id\`) est désormais refusée (409) s'il est encore référencé dans le contenu d'une autre page.

</details>

<details>
<summary>0.20.0 — 2026-09-12</summary>

- Nouvel endpoint \`GET /media\` sans \`pageId\` : médiathèque globale filtrable (recherche par nom, type image/fichier) et paginée, respectant la visibilité des pages.

</details>

## Version 0.19

<details>
<summary>0.19.5 — 2026-09-11</summary>

- Correctif de sécurité : \`multer\` (upload de fichiers, dépendance transitive de \`@nestjs/platform-express\`) était épinglé en 2.2.0, vulnérable à 3 failles de déni de service et 1 contournement de limite de taille de fichier. Forcé en 2.3.0 via un override pnpm (\`pnpm-workspace.yaml\`), le correctif amont n'étant pas encore répercuté dans \`@nestjs/platform-express\`.

</details>

<details>
<summary>0.19.4 — 2026-09-11</summary>

- Un éditeur ou un administrateur peut désormais changer la visibilité (publique/privée) d'une page depuis son édition, pas seulement à la création. Le changement est appliqué en cascade à toutes les pages descendantes.

</details>

<details>
<summary>0.19.3 — 2026-09-11</summary>

- Correctif de la barre latérale : deux pages partageant le même slug final mais sous des parents différents (ex. \`esgi/s1/reseau\` et \`esgi/s2/reseau\`) faisaient déplier la mauvaise branche et surligner le mauvais élément comme actif. La détection de la page courante comparait uniquement le dernier segment de l'URL (\`slug\`) au lieu du chemin complet ; elle résout désormais le nœud actif en suivant l'arbre niveau par niveau selon le chemin entier.

</details>

<details>
<summary>0.19.2 — 2026-09-11</summary>

- SEO / partage social : og-image, meta tags Open Graph et Twitter Card, \`robots.txt\`, et titres d'onglet dynamiques sur les pages et la recherche.

</details>

<details>
<summary>0.19.1 — 2026-09-11</summary>

- Ajout d'un bouton clair/sombre dans la barre du haut, à droite de la recherche. Le thème s'ouvre en sombre par défaut ; un choix explicite de l'utilisateur (clic sur le bouton) est ensuite mémorisé dans le navigateur (\`localStorage\`).

</details>

<details>
<summary>0.19.0 — 2026-09-08</summary>

- Image Docker \`backend\` : ~1,2 Go → ~450 Mo. La cause : le stage final lançait un \`pnpm install --frozen-lockfile\` non filtré et non \`--prod\` directement dans le stage runtime, embarquant toutes les devDependencies (backend **et** frontend — React, Vite, Tailwind, shiki...) plus le store pnpm entier. Un nouveau stage \`prod-deps\` (\`--prod --filter backend...\`) isole cette installation ; le stage \`runtime\` ne fait plus que \`COPY --from=\` son \`node_modules\`, donc le store pnpm ne touche jamais les layers de l'image finale. \`tsx\`/\`dotenv\` passent en dependencies (nécessaires en prod pour les migrations/seed via \`entrypoint.sh\`) ; le stage \`base\` pré-télécharge la version de pnpm épinglée pour éviter tout accès réseau au démarrage du conteneur.
- Image \`frontend\` (nginx + statique, ~118 Mo) : déjà correcte, seul le stage de build est désormais filtré (\`--filter frontend...\`) pour ne pas installer les dépendances du backend inutilement.

</details>

## Version 0.18

<details>
<summary>0.18.5 — 2026-09-08</summary>

- Correctif : les champs de recherche des journaux d'audit (activité utilisateur, admin, MCP) ne se vidaient jamais complètement — effacer le dernier caractère laissait la dernière lettre affichée. \`updateParams\` distinguait mal "ce filtre n'a pas changé" de "ce filtre a été vidé" (les deux se traduisaient par \`undefined\`) ; il teste désormais la présence de la clé (\`key in next\`) plutôt que sa valeur.
- Correctif CI : \`pages.service.spec.ts\` ne fournissait plus \`UserActivityLogService\` à \`PagesService\` depuis l'ajout du journal d'activité (0.18.0), faisant échouer les 22 tests en résolution de dépendances.

</details>

<details>
<summary>0.18.4 — 2026-09-08</summary>

- Pages \`/admin/audit-log\` et \`/admin/mcp/audit-log\` : ajout des filtres plage de dates et recherche texte, reflétés dans l'URL comme les autres filtres.

</details>

<details>
<summary>0.18.3 — 2026-09-08</summary>

- Nouvelle page admin \`/admin/activity-log\` (onglet "Activité") affichant le journal d'activité utilisateur, avec filtres par utilisateur, action, plage de dates et recherche texte.

</details>

<details>
<summary>0.18.2 — 2026-09-08</summary>

- \`GET /admin/mcp/audit-log\` accepte désormais \`dateFrom\`/\`dateTo\` et \`search\` (nom du tool, nom de la clé API).

</details>

<details>
<summary>0.18.1 — 2026-09-08</summary>

- \`GET /admin/audit-log\` accepte désormais \`dateFrom\`/\`dateTo\` (plage inclusive sur la date, \`YYYY-MM-DD\`) et \`search\` (action, cible, nom/email de l'admin).

</details>

<details>
<summary>0.18.0 — 2026-09-08</summary>

- Nouveau journal d'audit \`UserActivityLog\` (\`GET /admin/activity-log\`, admin uniquement, filtrable par utilisateur, action, plage de dates et recherche texte libre) — distinct de \`AdminAuditLog\` qui reste dédié aux actions admin sensibles. \`UserActivityLogService.record()\` est appelé (fire-and-forget, un échec de log ne bloque jamais l'action) depuis \`AuthService.login()\`, \`PagesService\` (création/édition/déplacement/suppression/restauration de page) et \`MediaService\` (upload/suppression de média).

</details>

## Version 0.17

<details>
<summary>0.17.13 — 2026-09-07</summary>

- \`storage/\` passe au pattern port/adapter déjà utilisé pour les repositories (\`StorageService\` devient une interface, \`MinioStorageService\` son implémentation, injectée via le token \`'StorageService'\`). Les deux clients Minio (interne / présigné public) et la liste des buckets à initialiser au démarrage sont désormais fournis par \`storage.module.ts\` via des providers \`useFactory\`, plutôt que construits dans le constructeur du service. Ajout de \`download\`/\`exists\` à l'interface (non utilisés pour l'instant, mais posés pour un futur besoin). Chaque bucket est maintenant un paramètre explicite des méthodes (\`upload\`/\`download\`/\`getPresignedUrl\`/\`delete\`/\`exists\`) plutôt qu'un champ privé du service — \`MediaService\` reçoit son bucket via un nouveau token \`'MediaBucket'\`. Suppression de \`media.service.spec.ts\` (déjà obsolète vis-à-vis de ce changement de signature, et les fichiers de test ne sont pas d'usage dans ce projet).

</details>

<details>
<summary>0.17.12 — 2026-09-07</summary>

- Correctif \`SignatureDoesNotMatch\` sur l'upload d'images via le MCP (\`wiki_upload_image\`) : \`ConfigService.get<number>('MINIO_PUBLIC_PORT')\` ne caste jamais réellement la valeur (\`process.env\` reste une string, le générique TypeScript est purement cosmétique). Le SDK \`minio-js\` compare le port à \`443\`/\`80\` avec \`!==\` strict pour décider d'ajouter le port au \`Host\` signé — une string \`"443"\` déclenchait donc un \`Host: <hôte>:443\` signé à tort, que Cloudflare Tunnel normalise sans le port en le forwardant à l'origine, d'où la signature invalide côté Minio. \`storage.service.ts\` caste désormais explicitement \`MINIO_PORT\`/\`MINIO_PUBLIC_PORT\` en nombre. L'upload lui-même (\`putObject\`) n'était jamais affecté (port 9000, jamais "par défaut" donc jamais concerné par ce bug) — seule la génération de l'URL présignée juste après l'upload cassait.

</details>

<details>
<summary>0.17.11 — 2026-09-07</summary>

- \`MEDIA_PRESIGNED_URL_EXPIRY_SECONDS\` passe de 1h à 7 jours (le maximum autorisé par une signature SigV4, imposé pareil par Minio) — les URLs présignées embarquées dans le markdown d'une page n'ont pas de mécanisme de rafraîchissement à l'affichage, donc 1h les rendait presque inutilisables pour du contenu durable. Reste une limite dure : au-delà de 7 jours sans ré-upload, l'image casse quand même.

</details>

<details>
<summary>0.17.10 — 2026-09-07</summary>

- \`storage.service.ts\` sépare désormais l'hôte Minio interne (\`MINIO_ENDPOINT\`, utilisé pour toutes les opérations backend→Minio) de l'hôte utilisé pour signer les URLs présignées données au navigateur (\`MINIO_PUBLIC_ENDPOINT\`, optionnel — retombe sur \`MINIO_ENDPOINT\` si absent). En prod, \`MINIO_ENDPOINT\` est typiquement un nom de service Docker interne (injoignable depuis un navigateur), donc sans \`MINIO_PUBLIC_ENDPOINT\` pointant vers un hôte Minio public (ex. tunnel Cloudflare dédié), aucune image uploadée n'était affichable côté client — bug découvert en migrant du contenu externe via le MCP. Doc mise à jour (README §6 + page wiki Déploiement + \`.env.example\`).

</details>

<details>
<summary>0.17.9 — 2026-09-07</summary>

- \`backend/entrypoint.sh\` lance désormais \`pnpm run seed:content\` à chaque démarrage de conteneur (donc à chaque déploiement), entre les migrations et le démarrage de l'app — la doc et les notes de version restent à jour automatiquement, y compris les modifications apportées au contenu de \`content-seed.ts\` lui-même (nouvelle \`PageVersion\` créée si le contenu ou le titre a changé, jamais de skip silencieux). Contrairement aux migrations, un échec du seed ne bloque pas le démarrage (\`|| echo ...\`) : sur le tout premier déploiement, aucun utilisateur n'existe encore pour servir d'auteur, le seed échoue silencieusement et repasse au déploiement suivant, une fois le premier admin créé à la main.

</details>

<details>
<summary>0.17.8 — 2026-09-07</summary>

- Déploiement continu : \`.github/workflows/deploy.yml\` bascule sur \`docker compose -f docker-compose.external.yml\` (au lieu de la version complète) — le serveur cible de la CD réutilise déjà un mariadb/minio existants, plus besoin d'en relancer une paire dédiée à chaque déploiement. Corrige au passage un bug de quoting : \`DEPLOY_PATH\` était entre guillemets simples dans la commande SSH distante, empêchant l'expansion de \`~\` (échec \`cd: no such file or directory\` même avec un chemin valide) — désormais non quoté côté distant.

</details>

<details>
<summary>0.17.7 — 2026-09-07</summary>

- Déploiement : nouveau \`docker-compose.external.yml\`, une version allégée (\`backend\`/\`frontend\` seulement) pour réutiliser un MariaDB/MySQL et un Minio déjà existants sur le serveur au lieu d'en relancer une paire dédiée — rejoint le réseau Docker externe \`mariadb-network\` plutôt que d'en créer un nouveau. \`docker-compose.yml\` reste la version complète (mysql + minio + backend + frontend) utilisée par le déploiement continu. Doc mise à jour (README §6 + page wiki Déploiement) avec la commande \`docker run\` pour lancer Minio en autonome sur ce même réseau.

</details>

<details>
<summary>0.17.6 — 2026-09-07</summary>

- Corrections CI post-merge : le service \`minio\` (\`bitnami/minio:latest\`) n'existe plus sur Docker Hub (catalogue Bitnami retiré) — remplacé par un démarrage manuel de \`minio/minio\` (\`docker run\` + attente sur \`/minio/health/live\`) dans le job \`test-backend\`. Le correctif \`stream-json\`/minio de la 0.17.5 (module resolve hook) ne s'appliquait qu'à l'entrypoint de production, pas aux tests Vitest eux-mêmes (qui n'y passent jamais) — les deux \`vitest.config.ts\` injectent maintenant le même hook via \`NODE_OPTIONS\` (\`backend/vitest.node-options.ts\`), vérifié sur Linux (conteneur) et Windows.
- Documentation : la page de wiki [Guide de démarrage](/pages/documentation/guide-demarrage) gagne une page [Déploiement](/pages/documentation/guide-demarrage/deploiement) (production, CI/CD, tunnel Cloudflare — même contenu que \`README.md\` §6) ; le \`README.md\` perd son ancien backlog de tickets (EPIC-01 à EPIC-22, ordre de développement suggéré) devenu obsolète une fois l'essentiel implémenté, ne garde que la référence technique (stack, architecture, modèle de données, endpoints, installation).

</details>

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
