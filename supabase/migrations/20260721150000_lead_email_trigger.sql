-- Migration: lead_email_trigger
-- Fires send-guide-email Edge Function on every new lead INSERT that has an email address.
-- Uses a shared TRIGGER_SECRET for authentication (stored in Supabase Edge Function secrets
-- and in the Postgres database setting app.trigger_secret).

-- Enable pg_net for outbound HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Store the trigger secret as a DB-level setting so the trigger function can read it
-- without hardcoding it in code.
-- NOTE: Run the companion shell command to set the actual value before applying this migration:
--   ALTER DATABASE postgres SET "app.trigger_secret" = '<TRIGGER_SECRET>';
-- This migration sets a placeholder; the real value must be set separately via the
-- Supabase Management API or dashboard (Settings > Database > Configuration).

-- Trigger function: POSTs the new lead record to the Edge Function with a shared secret
CREATE OR REPLACE FUNCTION public.trigger_send_guide_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _secret   text := current_setting('app.trigger_secret', true);
  _base_url text := 'https://hijzqsljasbobjrjotjy.supabase.co';
BEGIN
  -- Only fire when the lead provided an email address
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
    PERFORM extensions.net.http_post(
      url     := _base_url || '/functions/v1/send-guide-email',
      headers := jsonb_build_object(
        'Content-Type',    'application/json',
        'X-Trigger-Secret', _secret
      ),
      body    := jsonb_build_object('record', row_to_json(NEW))
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_lead_inserted_send_email ON public.leads;
CREATE TRIGGER on_lead_inserted_send_email
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_guide_email();
