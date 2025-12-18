    -- ==============================================================================
    -- FIX: Create or Update scm_product_variants table
    -- ==============================================================================

    -- 1. Create table if it does not exist
    CREATE TABLE IF NOT EXISTS public.scm_product_variants (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        product_id UUID REFERENCES public.scm_products(id) ON DELETE CASCADE,
        tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,  -- Required Context
        sku TEXT NOT NULL,
        attribute_name TEXT DEFAULT 'Size',       -- e.g. "Size", "Color"
        attribute_value TEXT NOT NULL,            -- e.g. "M", "25.0"
        price_adjustment NUMERIC DEFAULT 0,
        cost_adjustment NUMERIC DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        -- Constraint for Uniqueness per Tenant
        CONSTRAINT scm_product_variants_sku_tenant_key UNIQUE (sku, tenant_id)
    );

    -- 2. Add missing columns (SAFE MIGRATION)
    DO $$
    BEGIN
        -- is_active
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scm_product_variants' AND column_name = 'is_active') THEN
            ALTER TABLE public.scm_product_variants ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        -- price_adjustment
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scm_product_variants' AND column_name = 'price_adjustment') THEN
            ALTER TABLE public.scm_product_variants ADD COLUMN price_adjustment NUMERIC DEFAULT 0;
        END IF;
        
        -- cost_adjustment
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scm_product_variants' AND column_name = 'cost_adjustment') THEN
            ALTER TABLE public.scm_product_variants ADD COLUMN cost_adjustment NUMERIC DEFAULT 0;
        END IF;

        -- attribute_name
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scm_product_variants' AND column_name = 'attribute_name') THEN
            ALTER TABLE public.scm_product_variants ADD COLUMN attribute_name TEXT DEFAULT 'Size';
        END IF;

        -- sku (Crucial)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scm_product_variants' AND column_name = 'sku') THEN
            ALTER TABLE public.scm_product_variants ADD COLUMN sku TEXT;
        END IF;

        -- product_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scm_product_variants' AND column_name = 'product_id') THEN
            ALTER TABLE public.scm_product_variants ADD COLUMN product_id UUID REFERENCES public.scm_products(id) ON DELETE CASCADE;
        END IF;

        -- tenant_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scm_product_variants' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.scm_product_variants ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        END IF;

        -- company_id (Missing in initial script)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scm_product_variants' AND column_name = 'company_id') THEN
            -- We cannot add NOT NULL easily without default, but for new tables it works.
            ALTER TABLE public.scm_product_variants ADD COLUMN company_id UUID; 
        END IF;
    END $$;

    -- 3. Enable RLS
    ALTER TABLE public.scm_product_variants ENABLE ROW LEVEL SECURITY;

    -- 4. Create RLS Policies (Drop first to avoid errors)
    DROP POLICY IF EXISTS "Tenant isolation for scm_product_variants" ON public.scm_product_variants;

    CREATE POLICY "Tenant isolation for scm_product_variants" ON public.scm_product_variants
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM public.users_tenants WHERE user_id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users_tenants WHERE user_id = auth.uid()));

    -- 5. Grant permissions (Adjust as needed for your roles)
    GRANT ALL ON public.scm_product_variants TO authenticated;
    GRANT ALL ON public.scm_product_variants TO service_role;
