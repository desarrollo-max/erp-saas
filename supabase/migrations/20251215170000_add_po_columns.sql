-- Add warehouse_id column to scm_purchase_orders
ALTER TABLE scm_purchase_orders ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES scm_warehouses(id);

-- Add expected_delivery_date column
ALTER TABLE scm_purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;

-- Index
CREATE INDEX IF NOT EXISTS idx_scm_purchase_orders_warehouse_id ON scm_purchase_orders(warehouse_id);

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
