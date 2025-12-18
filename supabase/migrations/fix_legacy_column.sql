-- ==============================================================================
-- FIX: Relax legacy constraints on scm_stock_movements
-- ==============================================================================

-- 1. 'old_product_id_mvt' appears to be a legacy column that is blocking inserts.
-- We should make it NULLABLE so new variant-based movements don't fail.
ALTER TABLE public.scm_stock_movements ALTER COLUMN old_product_id_mvt DROP NOT NULL;

-- 2. Ensure variant_id is monitored (Information only, we leave it nullable for backward assumptions)
-- But effectively, for new movements, we depend on variant_id.

-- 3. Verify company_id setup (It exists now, ensure no cleanup needed).
-- (No action needed as previous check showed it exists).
