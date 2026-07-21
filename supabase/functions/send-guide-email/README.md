# Edge Function: send-guide-email

Automatically sends the "Guide 5 Destinations 2026" PDF to every new KPB quiz lead who provided an email address.

## How it works

1. A student completes the quiz and submits their email on the contact screen.
2. The lead is inserted into the Supabase `leads` table.
3. The Postgres trigger `on_lead_inserted_send_email` fires and POSTs the new row to this Edge Function via `pg_net`.
4. The function sends a branded HTML email via Resend with a download link to the PDF guide.

## Required Supabase secrets

Set these in your Supabase project → **Settings → Edge Functions → Secrets**:

| Secret | Required | Description |
|--------|----------|-------------|
| `RESEND_API_KEY` | ✅ Yes | API key from [resend.com](https://resend.com). Without this, emails are skipped and an error is logged. |
| `GUIDE_PDF_URL` | ⚠️ Recommended | Public URL of the PDF guide. If omitted, the email tells the lead the guide will be sent soon. |
| `FROM_EMAIL` | Optional | Sender address. Default: `KPB Education <noreply@kpbeducation.com>`. Must be a verified Resend sender domain. |

## Resend setup (first time)

1. Create a free account at [resend.com](https://resend.com).
2. Add and verify your sending domain (e.g. `kpbeducation.com`) under **Domains**.
3. Copy your API key from **API Keys**.
4. Paste it as `RESEND_API_KEY` in Supabase Edge Function secrets.

> **Note:** In Resend's free tier, you can only send to your own verified email address until your domain is verified.

## Error handling

- If `RESEND_API_KEY` is missing → logs error, returns `{ error: "email service not configured" }` with HTTP 200 (so the trigger does not fail).
- If `email` field is empty or invalid → skips silently, returns `{ skipped: "no valid email" }`.
- Any Resend API error → logs error, returns `{ error: <resend_response> }` with HTTP 200.
- All errors are non-blocking: the lead is always saved to the database regardless of email status.

## Trigger migration

See `supabase/migrations/20260721150000_lead_email_trigger.sql`.
The trigger is already applied to the production database (project `hijzqsljasbobjrjotjy`).
