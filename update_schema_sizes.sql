-- ==============================================================================
-- ACTUALIZACIÓN DE ESTRUCTURA: SOPORTE PARA TALLAS Y TIPOS DE UNIDAD
-- ==============================================================================

-- 1. Añadir columna para configuración de tallas (JSONB es flexible para rangos o listas)
ALTER TABLE public.scm_products 
ADD COLUMN IF NOT EXISTS size_config JSONB DEFAULT NULL;

-- Ejemplo de estructura para size_config:
-- {
--   "min": 22,
--   "max": 30,
--   "step": 0.5, 
--   "system": "MX" 
-- }

-- 2. Asegurar que la columna unit_type soporte 'PAIR'
-- Si tienes un check constraint, habría que actualizarlo.
-- Asumiendo que es VARCHAR sin restricción estricta en BD, esto es solo informativo.
-- Si hay un constraint:
-- ALTER TABLE public.scm_products DROP CONSTRAINT IF EXISTS scm_products_unit_type_check;
-- ALTER TABLE public.scm_products ADD CONSTRAINT scm_products_unit_type_check 
-- CHECK (unit_type IN ('PIECE', 'KG', 'METER', 'LITER', 'BOX', 'PAIR', 'SET'));

COMMENT ON COLUMN public.scm_products.size_config IS 'Configuración de tallas para productos con unidad PAIR. Ej: {min: 22, max: 29.5}';
