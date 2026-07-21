-- Migration: add updated_at tracking to leads table
-- Adds a column that auto-updates on every upsert so the team can detect
-- when a lead returns and re-submits the quiz (strong re-engagement signal).
-- created_at is left untouched to preserve the original entry date.

-- 1. Add column (idempotent)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Backfill existing rows with their created_at value so history is meaningful
UPDATE leads SET updated_at = created_at WHERE updated_at = now() AND created_at IS NOT NULL;

-- 3. Function that stamps updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger (idempotent drop + create)
DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
