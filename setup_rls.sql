-- Enable Row Level Security (RLS) for multi-tenancy isolation
-- Execute this script in Supabase SQL Editor

-- 1. Helper function to get current user's tenants
CREATE OR REPLACE FUNCTION get_user_tenants()
RETURNS TABLE (tenant_id uuid) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid();
$$;

-- 2. Secure 'tenants' table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenants they belong to" 
ON tenants FOR SELECT 
TO authenticated 
USING (
  id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid())
);

-- users_tenants table security
ALTER TABLE users_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant memberships" 
ON users_tenants FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
);

-- 3. Secure Data Tables
-- We assume these tables have a 'tenant_id' column.

-- List of tables to secure
-- companies
-- scm_products
-- sales_opportunities
-- sales_companies
-- sales_contacts
-- hr_employees
-- scm_product_categories

-- GENERIC POLICY TEMPLATE APPLIED TO EACH TABLE

-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for companies" ON companies
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- scm_products
ALTER TABLE scm_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for scm_products" ON scm_products
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- sales_opportunities
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for sales_opportunities" ON sales_opportunities
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- sales_companies
ALTER TABLE sales_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for sales_companies" ON sales_companies
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- sales_contacts
ALTER TABLE sales_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for sales_contacts" ON sales_contacts
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- hr_employees
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for hr_employees" ON hr_employees
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- scm_product_categories
ALTER TABLE scm_product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for scm_product_categories" ON scm_product_categories
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- tenant_licenses (Where installed modules are stored)
ALTER TABLE tenant_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View tenant licenses" ON tenant_licenses
FOR SELECT TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()));

-- modules (Public read for authenticated users)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for modules" ON modules
FOR SELECT TO authenticated
USING (true);

