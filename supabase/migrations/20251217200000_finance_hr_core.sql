-- MIGRACIÓN DE CONSOLIDACIÓN ERP FINAL
-- MÓDULO: FINANZAS (FIN)
CREATE TABLE IF NOT EXISTS public.fin_account_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code character varying NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true,
    CONSTRAINT fin_account_types_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.fin_accounts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULLREFERENCES public.tenants(id),
    company_id uuid NOT NULL REFERENCES public.companies(id),
    account_type_id uuid REFERENCES public.fin_account_types(id),
    parent_account_id uuid REFERENCES public.fin_accounts(id),
    code character varying NOT NULL,
    name character varying NOT NULL,
    is_detail boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fin_accounts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.fin_journal_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    company_id uuid NOT NULL REFERENCES public.companies(id),
    entry_number character varying NOT NULL,
    entry_date date NOT NULL,
    posting_date timestamp with time zone DEFAULT now(),
    description text,
    reference character varying,
    status character varying DEFAULT 'DRAFT', -- DRAFT, POSTED, CANCELLED
    journal_type character varying DEFAULT 'GENERAL',
    total_debit numeric DEFAULT 0,
    total_credit numeric DEFAULT 0,
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT fin_journal_entries_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.fin_journal_lines (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    journal_entry_id uuid NOT NULL REFERENCES public.fin_journal_entries(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES public.fin_accounts(id),
    description text,
    debit_amount numeric DEFAULT 0,
    credit_amount numeric DEFAULT 0,
    line_number integer NOT NULL,
    CONSTRAINT fin_journal_lines_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.fin_invoices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    company_id uuid NOT NULL REFERENCES public.companies(id),
    folio character varying NOT NULL,
    client_id uuid, -- Link to sales customer if applicable
    client_name character varying,
    rfc character varying,
    date date NOT NULL DEFAULT CURRENT_DATE,
    total numeric NOT NULL DEFAULT 0,
    status character varying DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADO, CANCELADO
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fin_invoices_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.fin_expenses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    company_id uuid NOT NULL REFERENCES public.companies(id),
    date date NOT NULL DEFAULT CURRENT_DATE,
    payee character varying NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    category character varying,
    voucher_no character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fin_expenses_pkey PRIMARY KEY (id)
);

-- MÓDULO: RECURSOS HUMANOS (HR)
CREATE TABLE IF NOT EXISTS public.hr_employees (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    company_id uuid NOT NULL REFERENCES public.companies(id),
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    email character varying,
    phone character varying,
    position character varying,
    department character varying,
    hire_date date,
    contract_type character varying, -- semanal, quincenal, etc
    status character varying DEFAULT 'active',
    custom_fields jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT hr_employees_pkey PRIMARY KEY (id)
);

-- MÓDULO: MANUFACTURA (MFG)
CREATE TABLE IF NOT EXISTS public.mfg_work_orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    company_id uuid NOT NULL REFERENCES public.companies(id),
    order_number character varying NOT NULL,
    product_id uuid REFERENCES public.scm_products(id),
    bom_id uuid, -- To be linked if BOM table exists
    quantity numeric NOT NULL,
    status character varying DEFAULT 'planned', -- planned, in_progress, quality_check, completed
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT mfg_work_orders_pkey PRIMARY KEY (id)
);

-- RLS POLICIES (Simples para Desarrollo Senior)
ALTER TABLE public.fin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfg_work_orders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their own tenant data') THEN
        CREATE POLICY "Users can see their own tenant data" ON public.fin_accounts FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
        CREATE POLICY "Users can see their own tenant data" ON public.fin_journal_entries FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
        CREATE POLICY "Users can see their own tenant data" ON public.fin_invoices FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
        CREATE POLICY "Users can see their own tenant data" ON public.fin_expenses FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
        CREATE POLICY "Users can see their own tenant data" ON public.hr_employees FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
        CREATE POLICY "Users can see their own tenant data" ON public.mfg_work_orders FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
    END IF;
END $$;
