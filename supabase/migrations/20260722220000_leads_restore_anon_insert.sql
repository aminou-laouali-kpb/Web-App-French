-- Critical fix: anon INSERT on public.leads was missing / broken.
-- Symptom (reproduced 2026-07-22, project hijzqsljasbobjrjotjy):
--   {"code":"42501","message":"new row violates row-level security policy for table \"leads\""}
--
-- Also: the previous "Allow anon upsert update" policy (USING true) lets any client
-- with the public anon key UPDATE every lead. Upsert is moved to a SECURITY DEFINER
-- RPC so anon never needs blanket SELECT/UPDATE on the table.

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Ensure columns the quiz / RPC depend on exist
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Unique whatsapp for upsert (dedupe first if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'leads_whatsapp_key'
  ) THEN
    DELETE FROM public.leads a
    USING public.leads b
    WHERE a.whatsapp IS NOT NULL
      AND a.whatsapp = b.whatsapp
      AND a.ctid < b.ctid;

    CREATE UNIQUE INDEX leads_whatsapp_key ON public.leads (whatsapp);
  END IF;
END $$;

-- Restore INSERT for anon quiz submissions (and insert fallback in the frontend)
DROP POLICY IF EXISTS "Allow anon insert" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.leads;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.leads;
CREATE POLICY "Allow anon insert"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Remove overly permissive anon UPDATE/SELECT if present
DROP POLICY IF EXISTS "Allow anon upsert update" ON public.leads;
DROP POLICY IF EXISTS "Allow anon select for upsert" ON public.leads;

-- RPC used by the quiz: upsert by whatsapp, bypasses RLS safely
CREATE OR REPLACE FUNCTION public.upsert_quiz_lead(
  p_prenom text,
  p_whatsapp text,
  p_email text,
  p_niveau_etudes text,
  p_echeance text,
  p_destinations text,
  p_domaine text,
  p_budget_tranche text,
  p_statut text,
  p_oriente_vers text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_whatsapp IS NULL OR length(trim(p_whatsapp)) < 6 THEN
    RAISE EXCEPTION 'whatsapp is required';
  END IF;
  IF p_prenom IS NULL OR length(trim(p_prenom)) < 1 THEN
    RAISE EXCEPTION 'prenom is required';
  END IF;

  INSERT INTO public.leads (
    prenom, whatsapp, email, niveau_etudes, echeance, destinations,
    domaine, budget_tranche, statut, oriente_vers
  ) VALUES (
    trim(p_prenom), trim(p_whatsapp), nullif(trim(p_email), ''),
    p_niveau_etudes, p_echeance, p_destinations, p_domaine,
    p_budget_tranche, p_statut, p_oriente_vers
  )
  ON CONFLICT (whatsapp)
  DO UPDATE SET
    prenom = EXCLUDED.prenom,
    email = EXCLUDED.email,
    niveau_etudes = EXCLUDED.niveau_etudes,
    echeance = EXCLUDED.echeance,
    destinations = EXCLUDED.destinations,
    domaine = EXCLUDED.domaine,
    budget_tranche = EXCLUDED.budget_tranche,
    statut = EXCLUDED.statut,
    oriente_vers = EXCLUDED.oriente_vers,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_quiz_lead FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_quiz_lead TO anon, authenticated;
