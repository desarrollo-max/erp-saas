-- ==============================================================================
-- FIX ESTRUCTURAL: FALTABA COMPANY_ID
-- ==============================================================================

-- 1. Añadir la columna perdida
ALTER TABLE public.scm_stock_levels 
ADD COLUMN IF NOT EXISTS company_id uuid;

-- 2. Asegurar que haya FK (opcional, pero buena práctica)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scm_stock_levels_company_id_fkey') THEN
        ALTER TABLE public.scm_stock_levels
        ADD CONSTRAINT scm_stock_levels_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES public.companies(id);
    END IF;
END $$;
