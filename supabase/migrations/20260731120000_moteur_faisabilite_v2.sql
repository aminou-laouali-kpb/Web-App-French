-- Moteur de faisabilité KPB Quiz v2 — barème 2026-08
-- New lead fields + destinations_couts tables + extended submit_lead RPC

-- 1. Lead columns
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS capital_an1 text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS mensuel_sur_place text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS nationalite text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS faisabilite jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS bareme_version text;

-- 2. Externalized cost grid (editable without redeploy)
CREATE TABLE IF NOT EXISTS public.destinations_couts (
  code              text primary key,
  nom               text not null,
  devise            text not null,
  scolarite_min     numeric,
  scolarite_max     numeric,
  fonds_exiges      numeric,
  fonds_nature      text not null,
  prepaiement       numeric default 0,
  ticket_min_eur    numeric not null,
  ticket_max_eur    numeric not null,
  delai_visa_sem    int,
  exemption_regle   text,
  actif             boolean default true,
  verifie_le        date not null,
  source_url        text
);

CREATE TABLE IF NOT EXISTS public.destinations_exemptions (
  destination_code  text references public.destinations_couts(code),
  pays_iso          text not null,
  effet             text not null,
  valeur            numeric,
  primary key (destination_code, pays_iso, effet)
);

-- Seed barème 2026-08
INSERT INTO public.destinations_couts (
  code, nom, devise, scolarite_min, scolarite_max, fonds_exiges, fonds_nature,
  prepaiement, ticket_min_eur, ticket_max_eur, delai_visa_sem, exemption_regle, verifie_le, source_url
) VALUES
  ('tunisie', 'Tunisie', 'EUR', 880, 4400, 3500, 'estime_kpb', 0, 4400, 7900, 4, null, '2026-07-31', null),
  ('maroc', 'Maroc', 'EUR', 1900, 6600, 4500, 'estime_kpb', 0, 6400, 11100, 4, null, '2026-07-31', null),
  ('belgique', 'Belgique', 'EUR', 835, 1194, 12744, 'legal', 0, 13600, 13900, 6, 'PMA_ARES', '2026-07-31', null),
  ('allemagne', 'Allemagne', 'EUR', 300, 800, 11904, 'legal', 0, 12200, 12700, 6, null, '2026-07-31', null),
  ('france', 'France', 'EUR', 283, 3875, 10530, 'legal', 0, 10800, 14400, 5, null, '2026-07-31', 'https://france-visas.gouv.fr'),
  ('irlande', 'Irlande', 'EUR', 11325, 16000, 10000, 'legal', 6000, 21300, 26000, 8, null, '2026-07-31', null),
  ('canada', 'Canada', 'CAD', 15000, 40000, 22895, 'legal', 0, 24700, 41000, 12, null, '2026-07-31', null),
  ('quebec', 'Québec', 'CAD', 15000, 40000, 24617, 'legal', 0, 25700, 42000, 12, null, '2026-07-31', null),
  ('usa', 'USA', 'USD', null, null, null, 'fixe_par_ecole', 0, 27000, 50000, 8, null, '2026-07-31', null)
ON CONFLICT (code) DO UPDATE SET
  ticket_min_eur = EXCLUDED.ticket_min_eur,
  ticket_max_eur = EXCLUDED.ticket_max_eur,
  fonds_exiges = EXCLUDED.fonds_exiges,
  verifie_le = EXCLUDED.verifie_le;

-- PMA exemptions for Belgium (scolarité réduite)
INSERT INTO public.destinations_exemptions (destination_code, pays_iso, effet, valeur) VALUES
  ('belgique', 'NE', 'scolarite_reduite', 1194),
  ('belgique', 'ML', 'scolarite_reduite', 1194),
  ('belgique', 'BF', 'scolarite_reduite', 1194),
  ('belgique', 'TD', 'scolarite_reduite', 1194),
  ('belgique', 'GN', 'scolarite_reduite', 1194),
  ('belgique', 'SN', 'scolarite_reduite', 1194),
  ('belgique', 'TG', 'scolarite_reduite', 1194),
  ('belgique', 'BJ', 'scolarite_reduite', 1194),
  ('belgique', 'CD', 'scolarite_reduite', 1194),
  ('belgique', 'CF', 'scolarite_reduite', 1194),
  ('belgique', 'MR', 'scolarite_reduite', 1194)
ON CONFLICT DO NOTHING;

-- 3. Extended submit_lead RPC
CREATE OR REPLACE FUNCTION public.submit_lead(
  p_prenom              text,
  p_whatsapp            text,
  p_email               text DEFAULT NULL,
  p_niveau_etudes       text DEFAULT NULL,
  p_echeance            text DEFAULT NULL,
  p_destinations        text DEFAULT NULL,
  p_domaine             text DEFAULT NULL,
  p_budget_tranche      text DEFAULT NULL,
  p_statut              text DEFAULT NULL,
  p_oriente_vers        text DEFAULT NULL,
  p_capital_an1         text DEFAULT NULL,
  p_mensuel_sur_place   text DEFAULT NULL,
  p_nationalite         text DEFAULT NULL,
  p_faisabilite         jsonb DEFAULT NULL,
  p_bareme_version      text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_whatsapp text;
  v_capital  text;
BEGIN
  IF p_prenom IS NULL OR length(trim(p_prenom)) < 2 THEN
    RAISE EXCEPTION 'invalid input: prenom too short';
  END IF;

  IF p_whatsapp IS NULL THEN
    RAISE EXCEPTION 'invalid input: whatsapp is required';
  END IF;

  v_whatsapp := regexp_replace(trim(p_whatsapp), '[\s\-\.]', '', 'g');

  IF v_whatsapp !~ '^\+[1-9][0-9]{6,14}$' THEN
    RAISE EXCEPTION 'invalid_whatsapp_format: number must be in international format (e.g. +22778098914)';
  END IF;

  -- capital_an1 takes precedence; keep budget_tranche in sync for legacy dashboards
  v_capital := coalesce(nullif(trim(coalesce(p_capital_an1, '')), ''), p_budget_tranche);

  INSERT INTO public.leads (
    prenom, whatsapp, email, niveau_etudes, echeance,
    destinations, domaine, budget_tranche, statut, oriente_vers,
    capital_an1, mensuel_sur_place, nationalite, faisabilite, bareme_version
  )
  VALUES (
    trim(p_prenom), v_whatsapp, nullif(trim(coalesce(p_email, '')), ''),
    p_niveau_etudes, p_echeance, p_destinations, p_domaine,
    v_capital, p_statut, p_oriente_vers,
    v_capital, p_mensuel_sur_place, p_nationalite, p_faisabilite, p_bareme_version
  )
  ON CONFLICT (whatsapp) DO UPDATE SET
    prenom              = EXCLUDED.prenom,
    email               = COALESCE(EXCLUDED.email, leads.email),
    niveau_etudes       = EXCLUDED.niveau_etudes,
    echeance            = EXCLUDED.echeance,
    destinations        = EXCLUDED.destinations,
    domaine             = EXCLUDED.domaine,
    budget_tranche      = EXCLUDED.budget_tranche,
    statut              = EXCLUDED.statut,
    oriente_vers        = EXCLUDED.oriente_vers,
    capital_an1         = EXCLUDED.capital_an1,
    mensuel_sur_place   = EXCLUDED.mensuel_sur_place,
    nationalite         = EXCLUDED.nationalite,
    faisabilite         = EXCLUDED.faisabilite,
    bareme_version      = EXCLUDED.bareme_version;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_lead FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lead TO anon;
