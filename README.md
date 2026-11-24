# KPB Education — Test d'orientation

Quiz mobile en français de **KPB Education** pour les étudiants nigériens qui veulent étudier à l'étranger. L'étudiant répond à quelques questions et reçoit un **verdict chiffré par destination** selon son budget. Il est ensuite orienté vers WhatsApp si au moins une destination est accessible, ou vers le webinaire bourses sinon.

## Fonctionnalités

- **Quiz** : accueil, questions, coordonnées, puis résultats.
- **Moteur de faisabilité** : calcule le coût de chaque destination à partir du capital disponible la première année et du budget mensuel sur place.
- **Statut du lead** : `PRET`, `BOURSE`, `EPARGNE` ou `A_QUALIFIER`, avec la version du barème enregistrée pour la traçabilité.
- **Tableau de bord interne** protégé par mot de passe, pour consulter les leads.
- **E-mail automatique** avec le guide PDF (fonction Supabase + Resend).

## Stack

- Monorepo pnpm, Node.js 24, TypeScript
- Frontend : React, Vite, Tailwind CSS, Framer Motion
- API : Express, pino
- Base : Supabase (PostgreSQL), écriture via la fonction SQL `submit_lead`
- Contrat d'API OpenAPI, avec types Zod et client React Query générés

## Structure

```
artifacts/kpb-quiz/        quiz public (mobile-first)
artifacts/kpb-dashboard/   tableau de bord interne
artifacts/api-server/      API Express (connexion, lecture des leads)
lib/api-spec/              contrat OpenAPI
lib/api-zod/               schémas Zod générés
lib/api-client-react/      client React Query généré
supabase/migrations/       table leads, coûts par destination, fonction submit_lead
supabase/functions/        send-guide-email
```

## Démarrer en local

```bash
pnpm install
pnpm --filter @workspace/kpb-quiz run dev      # quiz
pnpm --filter @workspace/api-server run dev    # API du tableau de bord
pnpm run typecheck
```

Variables d'environnement :

| Variable | Rôle |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | connexion Supabase côté quiz |
| `SUPABASE_SERVICE_ROLE_KEY` | accès serveur à Supabase (API uniquement) |
| `DASHBOARD_PASSWORD`, `SESSION_SECRET` | accès au tableau de bord |
| `RESEND_API_KEY`, `FROM_EMAIL`, `GUIDE_PDF_URL` | envoi du guide par e-mail |

Plus de détails dans [`replit.md`](replit.md) et [`KPB_Education_Project_Overview.md`](KPB_Education_Project_Overview.md).

## Origine

Projet développé sur [Replit](https://replit.com) et maintenu par KPB Education.
