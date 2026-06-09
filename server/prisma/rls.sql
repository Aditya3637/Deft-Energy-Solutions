-- Row-Level Security: tenant isolation at the database (SPEC_V2 §4 / H.3).
-- Apply AFTER `prisma migrate`/`db push` creates the tables:
--     psql "$DATABASE_URL" -f prisma/rls.sql
--
-- The app sets the current tenant per request/transaction:
--     SELECT set_config('app.current_org', '<org-uuid>', true);   -- true = transaction-local
-- Every org-scoped query is then filtered to that org by the policies below.
-- IMPORTANT: the role Prisma connects as must NOT own the tables or have
-- BYPASSRLS — create a dedicated app role with table privileges only.

-- Helper: current tenant (NULL when unset; 'true' = missing_ok so it never errors).
CREATE OR REPLACE FUNCTION current_org() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_org', true), '')::uuid
$$;

-- The tenant root.
ALTER TABLE "Organisation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON "Organisation";
CREATE POLICY org_isolation ON "Organisation"
  USING (id = current_org());

-- All org-scoped tables: isolate by orgId.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User','Subscription','Building','ElectricityBill','Task','AlertRule',
    'AlertInstance','Document','ActivityLog','CapexRequest','GhgInventory'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS org_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY org_isolation ON %I USING ("orgId" = current_org()) WITH CHECK ("orgId" = current_org())',
      t
    );
  END LOOP;
END $$;
