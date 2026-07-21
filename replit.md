# KPB Education — Test d'orientation

Application mobile-first en français pour KPB Education. Les étudiants nigériens répondent à 6 questions sur leur projet d'études à l'étranger, reçoivent des pistes personnalisées, et sont orientés vers WhatsApp (profils qualifiés) ou un webinaire bourses (petits budgets).

## Run & Operate

- `pnpm --filter @workspace/kpb-quiz run dev` — run the quiz frontend
- `pnpm --filter @workspace/api-server run dev` — run the API server (not used by the quiz, shared infra)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (artifacts/kpb-quiz)
- Database: Supabase (project: KPB, id: hijzqsljasbobjrjotjy, region: eu-west-3)
- Fonts: Montserrat (Google Fonts)
- Animation: Framer Motion

## Where things live

- `artifacts/kpb-quiz/src/components/Quiz.tsx` — entire quiz flow (all 8 screens)
- `artifacts/kpb-quiz/src/lib/supabase.ts` — Supabase client
- `artifacts/kpb-quiz/src/index.css` — KPB theme (colors, fonts)
- Supabase table: `leads` (prenom, whatsapp, niveau_etudes, echeance, destinations, domaine, budget_tranche, statut, oriente_vers)

## Architecture decisions

- Single-component quiz (no routing): all state in Quiz.tsx, screens rendered conditionally — keeps the bundle tiny and transitions simple.
- Direct Supabase write from the frontend: no API server needed for this app, anon key with RLS (insert-only policy for anon role).
- Lead qualification computed client-side before Supabase insert: budget_tranche → statut (HOT/WARM/STANDARD/COLD/A_QUALIFIER) → oriente_vers (whatsapp/webinaire).
- Framer Motion for screen transitions: slide from right (forward), slide from left (back), 200ms.

## Product

- **Accueil**: headline + "Commencer le test" CTA + social proof (+1 200 étudiants)
- **6 écrans de questions**: niveau, échéance, destination (multi-select), domaine (combobox filtrable), budget (FCFA + €), capture contact (prénom + WhatsApp)
- **Résultats**: pistes personnalisées par destination, encart urgence si rentrée 2026, CTA WhatsApp ou webinaire selon budget, bouton de partage natif (Web Share API)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Supabase anon key is stored as env var (not secret) — it's a publishable key with insert-only RLS.
- `@import url(...)` for Google Fonts MUST be the first line of index.css, before `@import "tailwindcss"`.
- WhatsApp CTA number: +33768674292. Webinar link: https://webinairebourse.lovable.app
- Never use "garanti", "admission garantie", "visa garanti" in any copy.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
