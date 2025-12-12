-- Seed common account types for the Accounting Module
-- Execute this in Supabase SQL Editor

INSERT INTO public.fin_account_types (id, code, name, normal_balance, is_active)
VALUES
(gen_random_uuid(), '1', 'Activo', 'DEBIT', true),
(gen_random_uuid(), '2', 'Pasivo', 'CREDIT', true),
(gen_random_uuid(), '3', 'Capital', 'CREDIT', true),
(gen_random_uuid(), '4', 'Ingresos', 'CREDIT', true),
(gen_random_uuid(), '5', 'Costos', 'DEBIT', true),
(gen_random_uuid(), '6', 'Gastos', 'DEBIT', true)
ON CONFLICT (code) DO NOTHING;
