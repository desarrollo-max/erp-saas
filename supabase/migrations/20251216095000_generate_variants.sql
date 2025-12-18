-- Generar variantes faltantes basado en size_config
-- Este script simula la lógica del botón "Generar Variantes" en el frontend

INSERT INTO scm_product_variants (
    product_id,
    tenant_id,
    company_id,
    sku,
    variant_sku,
    attribute_name,
    attribute_value,
    is_active
)
SELECT
    p.id as product_id,
    p.tenant_id,
    p.company_id,
    -- SKU Generation: {ParentSKU}-{SizeClean}, e.g., SKU-123-255
    p.sku || '-' || replace(
        regexp_replace(to_char(s.val, 'FM999.0'), '\.0$', ''), 
        '.', ''
    ) as sku,
    -- variant_sku is typically the same as sku in this logic
    p.sku || '-' || replace(
        regexp_replace(to_char(s.val, 'FM999.0'), '\.0$', ''), 
        '.', ''
    ) as variant_sku,
    'Size' as attribute_name,
    -- Attribute Value: "25.5 MX" or "25 MX"
    regexp_replace(to_char(s.val, 'FM999.0'), '\.0$', '') || ' MX' as attribute_value,
    true as is_active
FROM scm_products p
CROSS JOIN LATERAL generate_series(
    COALESCE((p.size_config->>'min')::numeric, 0), 
    COALESCE((p.size_config->>'max')::numeric, 0), 
    COALESCE((p.size_config->>'step')::numeric, 1)
) as s(val)
WHERE p.unit_type = 'PAIR'
  AND p.size_config IS NOT NULL
  AND (p.size_config->>'min') IS NOT NULL
  AND (p.size_config->>'max') IS NOT NULL
ON CONFLICT (tenant_id, sku) DO NOTHING;

-- Notificar para refrescar caché si es necesario
NOTIFY pgrst, 'reload config';
