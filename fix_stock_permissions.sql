-- ==============================================================================
-- FIX DE PERMISOS: STOCK
-- Este script asegura que la tabla scm_stock_levels sea escribible por usuarios autenticados.
-- ==============================================================================

-- 1. Otorgar permisos básicos de CRUD al rol autenticado
GRANT ALL ON TABLE public.scm_stock_levels TO authenticated;
GRANT ALL ON TABLE public.scm_stock_movements TO authenticated;
GRANT ALL ON TABLE public.scm_product_variants TO authenticated;

-- 2. Asegurar secuencias (si aplica, aunque usan UUIDs normalmente)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. REVISION DE RLS (Row Level Security)
-- A veces las políticas se superponen o faltan. Vamos a recrearlas de forma limpia.

-- Deshabilitar temporalmente para limpiar
ALTER TABLE public.scm_stock_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scm_stock_movements DISABLE ROW LEVEL SECURITY;

-- Borrar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Tenant isolation for scm_stock_levels" ON public.scm_stock_levels;
DROP POLICY IF EXISTS "Tenant isolation for scm_stock_movements" ON public.scm_stock_movements;
DROP POLICY IF EXISTS "Authenticated users can insert stock levels" ON public.scm_stock_levels;
DROP POLICY IF EXISTS "Authenticated users can select stock levels" ON public.scm_stock_levels;

-- RE-HABILITAR RLS
ALTER TABLE public.scm_stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scm_stock_movements ENABLE ROW LEVEL SECURITY;

-- 4. Crear Políticas Robustas

-- POLÍTICA 1: Permitir TODO si el tenant coincide (Lectura y Escritura)
CREATE POLICY "Enable all access for tenant members" ON public.scm_stock_levels
FOR ALL TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Enable all access for tenant members" ON public.scm_stock_movements
FOR ALL TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users_tenants WHERE user_id = auth.uid()
  )
);

-- 5. Verificación de Integridad Referencial (Foreign Keys)
-- Asegurar que created_by apunte a auth.users (esto ya debería estar, pero por si acaso)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scm_stock_movements_created_by_fkey') THEN
--         ALTER TABLE public.scm_stock_movements
--         ADD CONSTRAINT scm_stock_movements_created_by_fkey
--         FOREIGN KEY (created_by) REFERENCES auth.users(id);
--     END IF;
-- END $$;
