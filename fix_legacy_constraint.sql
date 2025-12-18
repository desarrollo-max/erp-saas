-- ==============================================================================
-- FIX ESTRUCTURAL FINAL: LEGACY COLUMNS
-- El campo old_product_id estaba como NOT NULL, bloqueando insertos nuevos de variantes.
-- ==============================================================================

-- 1. Hacer NULLABLE la columna legacy
ALTER TABLE public.scm_stock_levels 
ALTER COLUMN old_product_id DROP NOT NULL;

-- 2. Asegurar que last_movement_date tenga default (opcional)
ALTER TABLE public.scm_stock_levels 
ALTER COLUMN last_movement_date SET DEFAULT now();

-- 3. Comentario
COMMENT ON COLUMN public.scm_stock_levels.old_product_id IS 'Campo Legacy. Puede ser NULL para nuevos registros basados en variantes.';
