
-- Enable RLS for Supply Chain Warehouse tables

-- 1. scm_warehouses
ALTER TABLE scm_warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for scm_warehouses" ON scm_warehouses
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- 2. scm_stock_movements
ALTER TABLE scm_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for scm_stock_movements" ON scm_stock_movements
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- 3. scm_stock_levels
ALTER TABLE scm_stock_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for scm_stock_levels" ON scm_stock_levels
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));
