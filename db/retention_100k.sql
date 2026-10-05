-- ==============================================================================
-- Supabase Free Tier Optimization: 100k FIFO Retention Trigger for AuditLog
-- ==============================================================================
-- Description:
-- Caps the "AuditLog" table to a maximum of 100,000 rows.
-- When rows exceed 100,000, older records beyond the 100,000th newest record
-- are automatically purged using the existing B-Tree index on "createdAt".
--
-- How to apply in Supabase:
-- 1. Open your Supabase Dashboard -> SQL Editor.
-- 2. Paste and run this script.
-- ==============================================================================

-- 1. Function to prune old records beyond 100,000
CREATE OR REPLACE FUNCTION prune_audit_logs_100k()
RETURNS trigger AS $$
DECLARE
  v_cutoff_date timestamp with time zone;
BEGIN
  -- Look up the creation timestamp of the 100,000th record
  SELECT "createdAt" INTO v_cutoff_date
  FROM "AuditLog"
  ORDER BY "createdAt" DESC
  OFFSET 100000
  LIMIT 1;

  -- If the 100,001st row exists, delete everything older than or equal to that cutoff
  IF v_cutoff_date IS NOT NULL THEN
    DELETE FROM "AuditLog"
    WHERE "createdAt" <= v_cutoff_date;
  END IF;

  RETURN NULL; -- result is ignored since this is an AFTER statement trigger
END;
$$ LANGUAGE plpgsql;

-- 2. Statement-level trigger (executes once per INSERT statement, NOT per-row)
DROP TRIGGER IF EXISTS trg_prune_audit_logs_100k ON "AuditLog";
CREATE TRIGGER trg_prune_audit_logs_100k
  AFTER INSERT ON "AuditLog"
  FOR EACH STATEMENT
  EXECUTE FUNCTION prune_audit_logs_100k();

-- ==============================================================================
-- Optional Alternative: Supabase pg_cron (Daily / Hourly Purge)
-- If you prefer scheduled background pruning instead of on-insert trigger:
-- ==============================================================================
-- SELECT cron.schedule(
--   'prune-audit-logs-nightly',
--   '0 3 * * *', -- Runs every night at 3:00 AM UTC
--   $$
--     DELETE FROM "AuditLog"
--     WHERE "createdAt" <= (
--       SELECT "createdAt" FROM "AuditLog" ORDER BY "createdAt" DESC OFFSET 100000 LIMIT 1
--     );
--   $$
-- );
