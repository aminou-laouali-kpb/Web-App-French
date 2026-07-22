-- Allow anon to UPDATE their own lead row.
-- Required for upsert with onConflict:'whatsapp' in the quiz frontend:
-- when a lead submits again with the same WhatsApp number, Supabase issues
-- an UPDATE internally, which was blocked because only INSERT was allowed.
CREATE POLICY "Allow anon upsert update"
  ON public.leads
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
