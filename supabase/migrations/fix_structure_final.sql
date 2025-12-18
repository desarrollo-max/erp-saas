-- ==============================================================================
-- FIX: Final Schema Adjustments for Inventory
-- ==============================================================================

-- 1. scm_stock_movements: Add missing company_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scm_stock_movements' AND column_name = 'company_id') THEN
        ALTER TABLE public.scm_stock_movements ADD COLUMN company_id UUID;
        
        -- Optional: Add foreign key if companies table exists (assuming public.companies or similar, but tenants/companies usually handled in app logic or separate table)
        -- For now, just adding the column is sufficient to stop the error.
    END IF;
END $$;

-- 2. scm_product_variants: Relax variant_sku constraint to avoid errors if only 'sku' is provided
-- The app logic tries to sync them, but having both as NOT NULL creates race/sync issues.
ALTER TABLE public.scm_product_variants ALTER COLUMN variant_sku DROP NOT NULL;

-- 3. Ensure RLS policies cover the new column if needed
-- Standard Tenant Isolation usually covers rows by tenant_id, which is present.
-- If you have company-level isolation, ensure policies use company_id.

-- 4. scm_stock_movements: Update RLS to be safe (ensure checks pass)
ALTER TABLE public.scm_stock_movements ENABLE ROW LEVEL SECURITY;

-- Re-apply policy just in case (Idempotent-ish)
DROP POLICY IF EXISTS "Tenant/Company isolation for scm_stock_movements" ON public.scm_stock_movements;

CREATE POLICY "Tenant/Company isolation for scm_stock_movements" ON public.scm_stock_movements
FOR ALL TO authenticated
USING (
    tenant_id IN (SELECT tenant_id FROM public.users_tenants WHERE user_id = auth.uid())
)
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.users_tenants WHERE user_id = auth.uid())
);
