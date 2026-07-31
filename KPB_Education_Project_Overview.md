# KPB Education — Vue d'ensemble complète du projet

> Document généré le 31 juillet 2026. À partager avec Claude pour analyse et suggestions d'amélioration.

---

## 1. Présentation générale

**Objectif :** Qualifier des étudiants nigériens souhaitant étudier à l'étranger via un quiz mobile, capturer leurs coordonnées, et les orienter vers WhatsApp (profils chauds) ou un webinaire bourse (petit budget).

**Architecture :** Monorepo pnpm avec 3 applications principales + bibliothèques partagées.

---

## 2. Structure du monorepo

```
/
├── artifacts/
│   ├── kpb-quiz/          → Quiz public (React + Vite, mobile-first)
│   ├── kpb-dashboard/     → Dashboard interne (React + Vite, protégé par mot de passe)
│   ├── api-server/        → API Express (authentification + lecture des leads)
│   └── mockup-sandbox/    → Serveur de prévisualisation design (usage interne)
├── lib/
│   ├── api-spec/          → Contrat OpenAPI (openapi.yaml)
│   ├── api-zod/           → Types/schémas Zod générés depuis l'OpenAPI
│   ├── api-client-react/  → Client React Query généré
│   └── db/                → Scaffold Drizzle (vide, non utilisé)
├── supabase/
│   ├── migrations/        → Migrations SQL versionnées
│   └── functions/
│       └── send-guide-email/  → Edge Function Supabase (envoi email via Resend)
└── scripts/               → Scripts utilitaires
```

**Stack commune :** TypeScript, React 18, Vite, Tailwind CSS, Radix UI, lucide-react, Framer Motion, TanStack React Query, Zod, pino (logs), esbuild.

---

## 3. Base de données — Table `leads` (Supabase / PostgreSQL)

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() | Identifiant unique |
| `created_at` | timestamptz | default now() | Date de création |
| `updated_at` | timestamptz | NOT NULL, auto-mis-à-jour | Date de dernière modification |
| `prenom` | text | | Prénom de l'étudiant |
| `whatsapp` | text | NOT NULL, UNIQUE | Numéro WhatsApp (clé de déduplication, format E.164 ex: +22778098914) |
| `email` | text | | Adresse email |
| `niveau_etudes` | text | | Niveau d'études |
| `echeance` | text | | Rentrée visée |
| `destinations` | text | | Pays d'intérêt (chaîne séparée par virgules) |
| `domaine` | text | | Domaine d'études |
| `budget_tranche` | text | | Tranche de budget (code) |
| `statut` | text | | Température du lead (HOT / WARM / STANDARD / COLD / A_QUALIFIER) |
| `oriente_vers` | text | | Canal de redirection (whatsapp / webinaire) |

**RLS (Row Level Security) :** activé. Les accès directs `anon` à la table sont **révoqués**. Toutes les écritures publiques passent par le RPC `submit_lead`.

---

## 4. Application Quiz (`artifacts/kpb-quiz`)

### 4.1 Parcours utilisateur

```
home → q1 → q2 → q3 → q4 → q5 → contact → results
```

Navigation : bouton retour à chaque étape, barre de progression ("Question n sur 6"), transitions animées (Framer Motion).

### 4.2 Les 6 questions

**Q1 — Niveau d'études**
- Au lycée / Bac en cours
- Bac obtenu
- En licence
- Licence obtenue
- En master ou plus

**Q2 — Rentrée visée**
- Rentrée 2026
- Rentrée 2027
- Plus tard
- Je ne sais pas encore

**Q3 — Destinations** *(multi-sélection)*
- France, Maroc, Turquie, Allemagne, Royaume-Uni, USA, Dubaï, Chine, Canada
- Je ne sais pas encore, aide-moi à choisir

**Q4 — Domaine d'études** *(liste avec recherche)*
Commerce/Management, Finance/Comptabilité/Banque, Marketing/Communication, Informatique/Dev logiciel, Data/IA, Génie civil/BTP, Génie électrique/Télécoms, Génie mécanique/Industriel, Énergie/Mines/Pétrole, Médecine/Pharmacie, Sciences infirmières/Paramédical, Droit/Sciences juridiques, Sciences politiques/RI, Économie, Sciences (Maths, Physique, Chimie, Bio), Agronomie/Agroalimentaire, Architecture/Urbanisme, Arts/Design/Audiovisuel, Tourisme/Hôtellerie, Logistique/Transport, **Autre** (champ texte libre)

**Q5 — Budget annuel famille** *(détermine le statut et l'orientation)*

| Tranche | Code | Statut | Orientation |
|---|---|---|---|
| < 1 640 000 FCFA (< 2 500€) | `lt_2500` | COLD | webinaire bourse |
| 1 640 000 – 2 624 000 FCFA (2 500–4 000€) | `2500_4000` | STANDARD | whatsapp |
| 2 624 000 – 4 592 000 FCFA (4 000–7 000€) | `4000_7000` | WARM | whatsapp |
| > 4 592 000 FCFA (> 7 000€) | `gt_7000` | HOT | whatsapp |
| Je ne sais pas encore | `unknown` | A_QUALIFIER | whatsapp |

**Q6 (Contact) — Formulaire de coordonnées**
- Prénom (texte, min 2 caractères)
- Email (validation native HTML + longueur > 3)
- WhatsApp : sélecteur d'indicatif pays (dropdown avec 24 pays, drapeaux, recherche) + champ numéro local

### 4.3 Validation WhatsApp

- Normalisation : suppression des espaces, tirets, points → format `+22778098914`
- Validation : regex E.164 `^\+[1-9][0-9]{6,14}$`
- Indicatifs disponibles : Niger (+227), Bénin (+229), Burkina Faso (+226), Côte d'Ivoire (+225), Mali (+223), Sénégal (+221), Togo (+228), Guinée (+224), Mauritanie (+222), Cameroun (+237), Congo (+242), RD Congo (+243), Maroc (+212), Tunisie (+216), Algérie (+213), France (+33), Belgique (+32), Suisse (+41), Canada (+1), États-Unis (+1), Royaume-Uni (+44), Allemagne (+49), Espagne (+34), Portugal (+351)

### 4.4 Soumission du lead

Appel `supabase.rpc('submit_lead', { p_prenom, p_whatsapp, p_email, p_niveau_etudes, p_echeance, p_destinations, p_domaine, p_budget_tranche, p_statut, p_oriente_vers })`.

La fonction PostgreSQL `submit_lead` (SECURITY DEFINER) :
1. Valide prénom (≥ 2 chars) et WhatsApp (E.164 strict côté DB)
2. Normalise le numéro
3. `INSERT ... ON CONFLICT (whatsapp) DO UPDATE` → upsert propre
4. Préserve l'email existant si le nouveau est vide

En cas d'erreur : message générique + log console `[submit_lead] Supabase error: code message details`.

### 4.5 Webhooks n8n (déclenchés à l'affichage des résultats)

Envoi non-bloquant (fire-and-forget) en parallèle vers :
- `https://n8n.kpbeducation.cloud/webhook-test/afcd381b-f3ad-4781-a629-28c1ad23086e` *(test)*
- `https://n8n.kpbeducation.cloud/webhook/afcd381b-f3ad-4781-a629-28c1ad23086e` *(production)*

Payload : objet JSON avec tous les champs du lead.

### 4.6 Page Résultats

Affiche un profil personnalisé avec :
- Récapitulatif des destinations, domaine, statut
- Descriptions des pays sélectionnés
- CTA WhatsApp (leads chauds) **ou** CTA webinaire bourse (leads COLD)
- Option de partage et de recommencement du quiz

### 4.7 Variables d'environnement (quiz)

```
VITE_SUPABASE_URL=https://hijzqsljasbobjrjotjy.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

---

## 5. Dashboard (`artifacts/kpb-dashboard`)

### 5.1 Authentification

- Page de connexion avec mot de passe (`DASHBOARD_PASSWORD`)
- POST `/api/auth/verify` → token HMAC-SHA256 (valide 24h) stocké en localStorage
- `requireAuth` middleware Bearer sur toutes les routes `/api/leads`

### 5.2 Fonctionnalités

- **Liste des leads** avec pagination, tri (date création/modification), recherche plein texte (prénom, WhatsApp, domaine)
- **Filtres** : statut (HOT/WARM/STANDARD/COLD/A_QUALIFIER), destination (ilike)
- **Statistiques** : total leads, répartition par statut, top 10 destinations, nouveaux récents
- **Fiche détail** : tous les champs du lead, timestamps, badge statut/orientation, bouton copier WhatsApp

### 5.3 Ce qui manque (à améliorer)
- Pas d'indicateur d'envoi d'email par lead (Task #12 en attente)
- Pas d'édition du statut depuis le dashboard
- Pas de notes/historique par lead
- Pas de fallback si Supabase est indisponible (Task #8 en attente)

---

## 6. API Server (`artifacts/api-server`)

**Port :** `PORT` env var (défaut 8080)

### Routes

| Méthode | URL | Auth | Description |
|---|---|---|---|
| GET | `/api/healthz` | Non | Health check → `{status:"ok"}` |
| POST | `/api/auth/verify` | Non | Vérifie le mot de passe, retourne un token |
| GET | `/api/leads` | Bearer | Liste paginée avec filtres/recherche/tri |
| GET | `/api/leads/stats` | Bearer | Statistiques agrégées |
| GET | `/api/leads/:id` | Bearer | Détail d'un lead |

### Variables d'environnement (API)
```
VITE_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   (accès admin Supabase)
DASHBOARD_PASSWORD=...
SESSION_SECRET=...              (clé HMAC pour les tokens)
PORT=8080
NODE_ENV=development|production
```

---

## 7. Supabase — Migrations & Edge Functions

### Migrations (ordre chronologique)

| Fichier | Contenu |
|---|---|
| `20260721_leads_updated_at.sql` | Ajoute colonne `updated_at`, backfill, trigger auto-update |
| `20260721150000_lead_email_trigger.sql` | Active `pg_net`, crée trigger AFTER INSERT → Edge Function email |
| `20260722170000_leads_allow_anon_upsert.sql` | (remplacée) ancienne policy UPDATE anon |
| `20260722224500_submit_lead_rpc.sql` | Crée RPC `submit_lead` SECURITY DEFINER, révoque accès direct anon |
| `20260722235900_submit_lead_validate_whatsapp.sql` | Ajoute validation E.164 stricte dans le RPC |

### Edge Function `send-guide-email`

- Déclenchée par le trigger Postgres à chaque INSERT avec email non vide
- Authentifiée par header `X-Trigger-Secret`
- Envoie un email HTML en français via **Resend API** avec guide PDF joint
- Échappe toutes les données utilisateur (sécurité XSS)

**Secrets Supabase requis (à configurer dans le dashboard Supabase) :**
```
RESEND_API_KEY=...        (clé API Resend — NON encore configurée)
TRIGGER_SECRET=...        (secret partagé DB ↔ Edge Function)
GUIDE_PDF_URL=...         (URL publique du PDF — NON encore configurée)
FROM_EMAIL=...            (ex: noreply@kpbeducation.cloud)
```

---

## 8. Tâches en attente (backlog)

| # | Titre | État |
|---|---|---|
| #8 | Garder le tableau de bord fonctionnel si Supabase est indisponible | Proposée |
| #12 | Voir dans le tableau de bord si chaque lead a bien reçu son email | Proposée |

---

## 9. Points d'amélioration identifiés

### Fonctionnel
- L'email de guide n'est pas encore actif (`RESEND_API_KEY` et `GUIDE_PDF_URL` non configurés)
- Pas de confirmation visuelle à l'étudiant que son email a bien été envoyé
- Pas de validation email côté serveur (juste la longueur > 3 côté client)
- Les webhooks n8n sont fire-and-forget : aucun retry en cas d'échec
- La page résultats ne personnalise pas vraiment selon les 5 réponses (mêmes cards pour tous)

### Technique
- `VITE_SUPABASE_URL` est utilisé côté API serveur (variable de build Vite dans un contexte Node — fonctionne mais sémantiquement incorrect, devrait être `SUPABASE_URL`)
- `lib/db` (Drizzle) est un scaffold vide jamais utilisé
- Pas de tests automatisés (unitaires ou E2E permanents)
- Le dashboard n'a pas de pagination côté serveur (charge tous les leads)
- Pas de rate limiting sur le RPC `submit_lead` ni sur l'API auth

### UX
- Sur mobile, le menu déroulant du pays peut dépasser l'écran sur petits appareils
- Pas de message d'attente pendant la soumission autre que le bouton désactivé
- Pas de gestion offline / reconnexion réseau

---

## 10. Identifiants Supabase

- **Projet :** KPB
- **ID :** `hijzqsljasbobjrjotjy`
- **Région :** eu-west-3 (Paris)
- **URL :** `https://hijzqsljasbobjrjotjy.supabase.co`
