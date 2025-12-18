
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMDAyMiwiZXhwIjoyMDc4OTg2MDIyfQ.AIM7H-sNU8Tf-kFXY8jLVfp-eD0H4FwCl_o5Y38JkDA';
const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
CREATE TABLE IF NOT EXISTS public.hr_employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying,
  phone character varying,
  position character varying,
  department character varying,
  hire_date date,
  status character varying NOT NULL DEFAULT 'active'::character varying,
  manager_id uuid,
  user_id uuid,
  contract_type character varying,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hr_employees_pkey PRIMARY KEY (id),
  CONSTRAINT hr_employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT hr_employees_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

CREATE TABLE IF NOT EXISTS public.mfg_processes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  code character varying NOT NULL,
  name character varying NOT NULL,
  description text,
  standard_duration_minutes integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mfg_processes_pkey PRIMARY KEY (id),
  CONSTRAINT mfg_processes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

CREATE TABLE IF NOT EXISTS public.mfg_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  order_index integer NOT NULL,
  is_quality_control_point boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mfg_stages_pkey PRIMARY KEY (id),
  CONSTRAINT mfg_stages_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.mfg_processes(id)
);

CREATE TABLE IF NOT EXISTS public.mfg_boms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  finished_product_id uuid NOT NULL,
  name character varying NOT NULL,
  version character varying DEFAULT '1.0'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mfg_boms_pkey PRIMARY KEY (id),
  CONSTRAINT mfg_boms_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT mfg_boms_finished_product_id_fkey FOREIGN KEY (finished_product_id) REFERENCES public.scm_products(id)
);

CREATE TABLE IF NOT EXISTS public.mfg_bom_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bom_id uuid NOT NULL,
  component_product_id uuid NOT NULL,
  quantity numeric NOT NULL,
  wastage_percent numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mfg_bom_items_pkey PRIMARY KEY (id),
  CONSTRAINT mfg_bom_items_bom_id_fkey FOREIGN KEY (bom_id) REFERENCES public.mfg_boms(id),
  CONSTRAINT mfg_bom_items_component_product_id_fkey FOREIGN KEY (component_product_id) REFERENCES public.scm_products(id)
);

CREATE TABLE IF NOT EXISTS public.mfg_production_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  company_id uuid NOT NULL,
  order_number character varying NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric NOT NULL,
  process_id uuid NOT NULL,
  current_stage_id uuid,
  warehouse_id uuid,
  status character varying NOT NULL DEFAULT 'DRAFT'::character varying,
  start_date timestamp with time zone,
  due_date timestamp with time zone,
  priority character varying DEFAULT 'MEDIUM'::character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mfg_production_orders_pkey PRIMARY KEY (id),
  CONSTRAINT mfg_production_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT mfg_production_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT mfg_production_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.scm_products(id),
  CONSTRAINT mfg_production_orders_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.mfg_processes(id),
  CONSTRAINT mfg_production_orders_current_stage_id_fkey FOREIGN KEY (current_stage_id) REFERENCES public.mfg_stages(id),
  CONSTRAINT mfg_production_orders_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.scm_warehouses(id)
);
`;

async function execute() {
    // Using direct SQL execution usually requires a specialized RPC or psql
    // If exec_sql RPC is not available, we might need another approach.
    // But let's try.
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
        console.error('Error executing SQL via RPC:', error.message);
        console.log('Falling back to direct table creation if possible (unlikely for DDL via anon/service_role without RPC)');
    } else {
        console.log('SQL executed successfully');
    }
}

execute();
