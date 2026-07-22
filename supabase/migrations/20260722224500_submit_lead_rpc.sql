-- Fix quiz submission for anon users.
-- Root cause: upsert ON CONFLICT DO UPDATE reads the existing row, which requires
-- a SELECT policy for anon. Adding one would expose all lead data publicly.
-- Instead, route submissions through a SECURITY DEFINER RPC and lock down
-- direct table access for anon.

CREATE OR REPLACE FUNCTION public.submit_lead(
  p_prenom         text,
  p_whatsapp       text,
  p_email          text DEFAULT NULL,
  p_niveau_etudes  text DEFAULT NULL,
  p_echeance       text DEFAULT NULL,
  p_destinations   text DEFAULT NULL,
  p_domaine        text DEFAULT NULL,
  p_budget_tranche text DEFAULT NULL,
  p_statut         text DEFAULT NULL,
  p_oriente_vers   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_prenom IS NULL OR length(trim(p_prenom)) < 2
     OR p_whatsapp IS NULL OR length(trim(p_whatsapp)) < 6 THEN
    RAISE EXCEPTION 'invalid input';
  END IF;

  INSERT INTO public.leads (
    prenom, whatsapp, email, niveau_etudes, echeance,
    destinations, domaine, budget_tranche, statut, oriente_vers
  )
  VALUES (
    trim(p_prenom), trim(p_whatsapp), nullif(trim(coalesce(p_email, '')), ''),
    p_niveau_etudes, p_echeance, p_destinations, p_domaine,
    p_budget_tranche, p_statut, p_oriente_vers
  )
  ON CONFLICT (whatsapp) DO UPDATE SET
    prenom         = EXCLUDED.prenom,
    email          = COALESCE(EXCLUDED.email, leads.email),
    niveau_etudes  = EXCLUDED.niveau_etudes,
    echeance       = EXCLUDED.echeance,
    destinations   = EXCLUDED.destinations,
    domaine        = EXCLUDED.domaine,
    budget_tranche = EXCLUDED.budget_tranche,
    statut         = EXCLUDED.statut,
    oriente_vers   = EXCLUDED.oriente_vers;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_lead FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lead TO anon;

-- Lock down direct table access for anon: all writes now go through the RPC.
DROP POLICY IF EXISTS "Allow anon upsert update" ON public.leads;
DROP POLICY IF EXISTS "Allow anon insert" ON public.leads;
REVOKE ALL ON public.leads FROM anon;
