-- Strengthen submit_lead to reject WhatsApp numbers that are not in E.164 format.
-- E.164: starts with +, followed by 7–15 digits, first digit non-zero.
-- The frontend normalizes numbers before submission (strips spaces/dashes),
-- but this RPC-level check is a last-resort defence against direct API calls.

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
DECLARE
  v_whatsapp text;
BEGIN
  -- Basic presence check for required fields
  IF p_prenom IS NULL OR length(trim(p_prenom)) < 2 THEN
    RAISE EXCEPTION 'invalid input: prenom too short';
  END IF;

  IF p_whatsapp IS NULL THEN
    RAISE EXCEPTION 'invalid input: whatsapp is required';
  END IF;

  -- Normalize: strip spaces and dashes (mirrors frontend normalizeWhatsApp)
  v_whatsapp := regexp_replace(trim(p_whatsapp), '[\s\-\.]', '', 'g');

  -- Validate E.164 format: + followed by 7–15 digits, first digit non-zero
  IF v_whatsapp !~ '^\+[1-9][0-9]{6,14}$' THEN
    RAISE EXCEPTION 'invalid_whatsapp_format: number must be in international format (e.g. +22778098914)';
  END IF;

  INSERT INTO public.leads (
    prenom, whatsapp, email, niveau_etudes, echeance,
    destinations, domaine, budget_tranche, statut, oriente_vers
  )
  VALUES (
    trim(p_prenom), v_whatsapp, nullif(trim(coalesce(p_email, '')), ''),
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
