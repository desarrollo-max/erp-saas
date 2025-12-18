-- Add variant_id to scm_po_lines if it doesn't exist
ALTER TABLE scm_po_lines ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES scm_product_variants(id);

-- Ensure tax_amount and freight_amount have defaults or handle 0
ALTER TABLE scm_purchase_orders ALTER COLUMN tax_amount SET DEFAULT 0;
ALTER TABLE scm_purchase_orders ALTER COLUMN freight_amount SET DEFAULT 0;
ALTER TABLE scm_purchase_orders ALTER COLUMN net_amount SET DEFAULT 0;

-- Index for variance
CREATE INDEX IF NOT EXISTS idx_scm_po_lines_variant_id ON scm_po_lines(variant_id);

-- Force schema reload
NOTIFY pgrst, 'reload config';
