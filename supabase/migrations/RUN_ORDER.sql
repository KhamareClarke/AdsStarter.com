-- AdsStarter: run migrations IN THIS ORDER in Supabase SQL Editor
-- Run each file completely before the next. If a step says "already exists", continue.

-- STEP 1 (required) — creates profiles, campaigns, ad_accounts, etc.
-- File: 001_phase0_schema.sql

-- STEP 2 — integration indexes
-- File: 002_phase1_integrations.sql

-- STEP 3 — GHL tables (use 003_fix_index.sql if index error on sent_at::date)
-- File: 003_phase3_ghl.sql

-- STEP 4 — Empire OS (requires profiles + campaigns from step 1)
-- File: 004_phase4_empire_os.sql

-- STEP 5 — Reports (settings, ad_metrics, shareable reports)
-- File: 005_phase5_reports.sql
-- If policy "already exists" error: run 005_fix_policies.sql instead (or re-run full 005)

-- Quick check after step 1:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'profiles';
