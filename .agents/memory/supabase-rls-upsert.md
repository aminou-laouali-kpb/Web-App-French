---
name: Supabase RLS upsert pitfall
description: Why anon upserts fail under RLS and the RPC pattern used for quiz lead submission
---

# Supabase RLS upsert pitfall (leads table)

**Rule:** Public (anon) form submissions must go through the `submit_lead` SECURITY DEFINER RPC — never direct table inserts/upserts.

**Why:** `INSERT ... ON CONFLICT DO UPDATE` under RLS also requires a SELECT policy on the conflicting row (and RETURNING requires SELECT visibility). Adding an anon SELECT policy would expose all lead data publicly, so the fix was an RPC that bypasses RLS safely; anon table grants and policies on `leads` were revoked entirely.

**How to apply:** Any new public write path (quiz variants, other forms) should add/extend a SECURITY DEFINER RPC with input validation, not table policies. Test as anon with `SET LOCAL ROLE anon` — admin SQL tests hide these failures.
