-- ==============================================================================
-- SCRIPT DE CORRECCIÓN DE PERMISOS (RLS)
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase.
-- ==============================================================================

-- 1. Habilitar RLS en la tabla de imágenes (por seguridad y consistencia)
ALTER TABLE public.scm_product_media ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas conflictivas si existen
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.scm_product_media;
DROP POLICY IF EXISTS "Ver imagenes si tiene acceso al producto" ON public.scm_product_media;
DROP POLICY IF EXISTS "Insertar imagenes si tiene acceso al producto" ON public.scm_product_media;

-- 3. CREAR POLÍTICA PERMISIVA PARA IMÁGENES
-- Esta política permite INSERT, SELECT, UPDATE, DELETE a cualquier usuario que haya iniciado sesión.
-- Soluciona el error "new row violates row-level security policy".
CREATE POLICY "Permitir todo a usuarios autenticados"
ON public.scm_product_media
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. CONFIGURACIÓN DEL BUCKET DE ARCHIVOS (STORAGE)
-- Asegura que el bucket 'erp-files' existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('erp-files', 'erp-files', true)
ON CONFLICT (id) DO NOTHING;

-- 5. POLÍTICAS DE STORAGE (Para solucionar errores al subir archivos)
DROP POLICY IF EXISTS "Permitir subir archivos a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir subir archivos a usuarios autenticados"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'erp-files');

DROP POLICY IF EXISTS "Permitir ver archivos a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir ver archivos a usuarios autenticados"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'erp-files');

DROP POLICY IF EXISTS "Permitir eliminar archivos a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir eliminar archivos a usuarios autenticados"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'erp-files');
