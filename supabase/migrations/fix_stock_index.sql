-- ==============================================================================
-- FIX CRÍTICO: ÍNDICE ÚNICO PARA UPSERT DE STOCK
-- La tabla scm_stock_levels carece del índice único necesario para soportar
-- la operación UPSERT basada en variantes.
-- ==============================================================================

-- 1. Eliminar índices obsoletos que pueden causar confusión (opcional pero recomendado)
DROP INDEX IF EXISTS scm_stock_levels_tenant_id_product_id_warehouse_id_key;

-- 2. Crear el índice único correcto para la nueva arquitectura (Variantes)
-- NOTA: Usamos IF NOT EXISTS para evitar errores si se corre múltiples veces.
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_levels_variant_warehouse 
ON public.scm_stock_levels (tenant_id, warehouse_id, variant_id);

-- 3. Comentario explicativo
COMMENT ON INDEX uq_stock_levels_variant_warehouse IS 'Índice requerido para operaciones UPSERT atómicas de stock por variante.';
