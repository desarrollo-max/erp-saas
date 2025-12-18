-- Add warehouse_id column to scm_purchase_orders
ALTER TABLE scm_purchase_orders
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES scm_warehouses(id);

-- Add expected_delivery_date column just in case it is missing too
ALTER TABLE scm_purchase_orders
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_scm_purchase_orders_warehouse_id ON scm_purchase_orders(warehouse_id);

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload config';
