# KPB Education — Test d'orientation (moteur de faisabilité v2)

Application mobile-first en français pour KPB Education. Les étudiants répondent à un parcours d'orientation, reçoivent un **verdict chiffré par destination** selon leur capital mobilisable, et sont orientés vers WhatsApp uniquement si au moins une destination est accessible.

## Run & Operate

- `pnpm --filter @workspace/kpb-quiz run dev` — run the quiz frontend
- `pnpm --filter @workspace/api-server run dev` — run the API server (dashboard)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (artifacts/kpb-quiz)
- Database: Supabase (project: KPB, id: hijzqsljasbobjrjotjy, region: eu-west-3)
- Fonts: Montserrat (Google Fonts)
- Animation: Framer Motion

## Where things live

- `artifacts/kpb-quiz/src/components/Quiz.tsx` — quiz flow (accueil → Q1–Q5b → contact → résultats)
- `artifacts/kpb-quiz/src/lib/faisabilite.ts` — barème `2026-08` + moteur `evaluer` / statuts / textes de refus
- `supabase/migrations/20260731120000_moteur_faisabilite_v2.sql` — colonnes leads + `destinations_couts` + RPC `submit_lead` étendu
- Supabase table `leads` : champs historiques + `capital_an1`, `mensuel_sur_place`, `nationalite`, `faisabilite` (jsonb), `bareme_version`

## Architecture decisions

- Single-component quiz (no routing): state in Quiz.tsx.
- Direct Supabase write via SECURITY DEFINER RPC `submit_lead`.
- Faisabilité calculée **côté client** avant insert (barème TS) ; `bareme_version` stocké pour traçabilité.
- Statuts lead : `PRET` · `BOURSE` · `EPARGNE` · `A_QUALIFIER` (plus HOT/WARM/COLD).
- CTA WhatsApp réservé aux profils `PRET` et `A_QUALIFIER` ; `EPARGNE` = webinaire uniquement (pas de numéro WA).

## Product (v2)

- **Q2** : Janvier-février 2027 · Septembre 2027 · Plus tard · Je ne sais pas (plus de rentrée 2026)
- **Q3** : 9 destinations chiffrées (Tunisie, Maroc, Belgique, Allemagne, France, Irlande, Canada, Québec, USA)
- **Q5a** : capital mobilisable en une fois · **Q5b** : mensuel sur place (stocké, non bloquant)
- **Contact** : prénom, email, WhatsApp + **nationalité** (pré-remplie via indicatif, confirmée)
- **Résultats** : accessibles d'abord, refus expliqués ensuite, CTA conditionnel

## Gotchas

- Appliquer la migration `20260731120000_moteur_faisabilite_v2.sql` dans le SQL Editor Supabase avant mise en prod.
- Supabase anon key = publishable ; pas de SELECT/UPDATE anon blanket sur `leads`.
- WhatsApp CTA : +33768674292 · Webinaire : https://webinairebourse.lovable.app
- Never use "garanti", "admission garantie", "visa garanti" in any copy.
- Liste PMA / montants belges à revalider (circulaire ARES 2025-001) avant de figer le barème suivant.
