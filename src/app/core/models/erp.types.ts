/**
 * ======================================================
 *          ERP Data Models (Based on Database Schema)
 * ======================================================
 * This file is auto-generated or carefully crafted to match the database DDL.
 * Do not edit manually without updating the backend schema first.
 */

// ======================================================
//        Core System & Tenant Management Interfaces
// ======================================================

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  industry: string;
  logo_url: string | null;
  primary_color: string;
  is_active: boolean;
  subscription_status: string;
  trial_ends_at: string;
  max_users: number;
  max_companies: number;
  storage_gb: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  metadata: any;
}

export interface Company {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  is_active: boolean;
  fiscal_year_start: number;
  currency_code: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  is_active: boolean;
  invited_by: string | null;
  joined_at: string;
  last_access_at: string | null;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  max_users: number;
  max_companies: number;
  storage_gb: number;
  features: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  metadata: any;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  color: string | null;
  version: string;
  route_path: string | null;
  is_core: boolean;
  is_available: boolean;
  price_monthly: number;
  requires_storage_mb: number;
  sort_order: number;
  metadata: any;
  created_at: string;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  payment_method: string | null;
  payment_method_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface TenantLicense {
  id: string;
  tenant_id: string;
  module_id: string;
  subscription_id: string | null;
  is_active: boolean;
  installed_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  module_code: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}


// ======================================================
//                   Finance Module Interfaces
// ======================================================

export interface FinAccountType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  normal_balance: string;
  is_active: boolean;
  created_at: string;
}

export interface FinAccount {
  id: string;
  tenant_id: string;
  company_id: string;
  code: string;
  name: string;
  description: string | null;
  account_type_id: string;
  parent_account_id: string | null;
  is_active: boolean;
  is_detail: boolean;
  requires_cost_center: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinCostCenter {
  id: string;
  tenant_id: string;
  company_id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FinJournalEntry {
  id: string;
  tenant_id: string;
  company_id: string;
  entry_number: string;
  entry_date: string;
  posting_date: string;
  description: string | null;
  reference: string | null;
  journal_type: string;
  status: string;
  total_debit: number;
  total_credit: number;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinJournalLine {
  id: string;
  journal_entry_id: string;
  line_number: number;
  account_id: string;
  cost_center_id: string | null;
  debit_amount: number;
  credit_amount: number;
  currency_code: string;
  exchange_rate: number;
  description: string | null;
  created_at: string;
}

export interface FinClosingEntry {
  id: string;
  tenant_id: string;
  company_id: string;
  closing_date: string;
  closing_type: string;
  status: string;
  closing_journal_entry_id: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface FinCurrencyRate {
  id: string;
  tenant_id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
  created_at: string;
}

// ======================================================
//       Supply Chain Management (SCM) Interfaces
// ======================================================

export interface ScmProductCategory {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ScmProduct {
  id: string;
  tenant_id: string;
  company_id: string;
  // client_id removed
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_type: string;
  purchase_price: number | null;
  sale_price: number | null;
  cost_price: number | null;
  last_purchase_cost?: number; // Costo de la última compra
  reorder_point: number; // Stock mínimo
  reorder_quantity: number; // Cantidad a pedir por defecto
  lead_time_days: number;
  is_active: boolean;
  requires_serial_number: boolean;
  requires_batch_tracking: boolean;
  image_url?: string; // Main image
  images?: string[]; // Multiple images
  is_manufacturable?: boolean; // Identifies if this product is produced internally

  // Size Management
  size_config?: any; // NOW ANY: Stores { min, max, step } or simple string array

  created_at: string;
  updated_at: string;
}

// Product Variant Interface (Strictly used for Stock uniqueness)
export interface ScmProductVariant {
  id: string;
  product_id: string;
  tenant_id: string;
  company_id: string;
  sku: string; // SKU-SIZE (e.g., T-SHIRT-M)
  attribute_name: string; // "Size", "Color"
  attribute_value: string; // "M", "Red", "25.0 MX"
  price_adjustment?: number; // Optional override
  cost_adjustment?: number;  // Optional override
  is_active: boolean;
  created_at: string;
}

// Image Management Interface
export interface ScmProductImage {
  id: string;
  product_id: string;
  media_type: string;
  file_url: string;
  description: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ScmSupplier {
  id: string;
  tenant_id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  payment_terms: string | null;
  is_active: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface ScmWarehouse {
  id: string;
  tenant_id: string;
  company_id: string;
  // client_id removed
  code: string;
  name: string;
  address: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface ScmStockLevel {
  id: string;
  tenant_id: string;
  company_id: string;
  variant_id: string; // Migrated from product_id
  warehouse_id: string;
  quantity_on_hand: number;
  quantity_available: number;
  quantity_reserved: number;
  quantity_in_transit: number;
  last_counted_at: string | null;
  last_movement_date: string | null;
  updated_at: string;
}

export interface ScmStockMovement {
  id: string;
  tenant_id: string;
  company_id: string;
  // client_id removed
  warehouse_id: string;
  product_id?: string; // Optional (or Required depending on schema, but DB can likely handle null if variant is primary, but app code sends it)
  variant_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'PRODUCTION_CONSUMPTION' | 'PRODUCTION_OUTPUT';
  quantity: number;
  movement_date: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface ScmPurchaseOrder {
  id: string;
  tenant_id: string;
  company_id: string;
  po_number: string;
  po_date: string;
  supplier_id: string;
  expected_delivery_date: string | null;
  status: string;
  total_amount: number;
  tax_amount: number;
  freight_amount: number;
  net_amount: number;
  currency_code: string;
  notes: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScmPoLine {
  id: string;
  purchase_order_id: string;
  line_number: number;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  line_amount: number;
  tax_percent: number;
  expected_delivery_date: string | null;
  notes: string | null;
  created_at: string;
}


// ======================================================
//   Sales / Customer Relationship Management (CRM) Interfaces
// ======================================================

export interface SalesPipeline {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  currency_code: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface SalesStage {
  id: string;
  pipeline_id: string;
  code: string;
  name: string;
  description: string | null;
  probability_percent: number;
  is_closed: boolean;
  is_won: boolean;
  sort_order: number;
  created_at: string;
}

export interface SalesCompany {
  id: string;
  tenant_id: string;
  company_id: string | null;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  employee_count: number | null;
  annual_revenue: number | null;
  assigned_to: string | null;
  tags: string[];
  is_customer: boolean;
  is_prospect: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesContact {
  id: string;
  tenant_id: string;
  sales_company_id: string | null;
  title: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  position: string | null;
  department: string | null;
  assigned_to: string | null;
  tags: string[];
  is_primary_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesOpportunity {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  stage_id: string;
  name: string;
  description: string | null;
  sales_company_id: string;
  primary_contact_id: string | null;
  amount: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  probability_percent: number;
  source: string | null;
  assigned_to: string | null;
  is_closed: boolean;
  is_won: boolean;
  reason_lost: string | null;
  created_at: string;
  updated_at: string;
  sales_companies?: { name: string } | null;
  sales_contacts?: { first_name: string; last_name: string } | null;
  sales_stages?: { name: string } | null;
}

export interface SalesOrder {
  id: string;
  tenant_id: string;
  company_id: string;
  opportunity_id: string | null;
  order_number: string;
  order_date: string;
  customer_id: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  status: string;
  total_amount: number;
  discount_percent: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  net_amount: number;
  currency_code: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  sales_companies?: { name: string } | null;
}

export interface SalesOrderLine {
  id: string;
  sales_order_id: string;
  line_number: number;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_amount: number;
  tax_percent: number;
  notes: string | null;
  created_at: string;
}

export interface SalesActivity {
  id: string;
  tenant_id: string;
  opportunity_id: string | null;
  contact_id: string | null;
  activity_type: string;
  subject: string;
  description: string | null;
  activity_date: string;
  duration_minutes: number | null;
  assigned_to: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ======================================================
//             Data Import Helper Types
// ======================================================

/**
 * Representa el mapeo entre una columna del CSV y una propiedad del modelo de destino.
 */
export interface CsvColumnMapping {
  csvHeader: string;                      // La cabecera del archivo CSV (ej. "Nombre Producto")
  modelProperty: keyof ScmProduct | null; // La propiedad en ScmProduct (ej. "name") o null para ignorar la columna.
}

/**
 * Representa el estado de la previsualización de un proceso de importación.
 * @template T El tipo del modelo de datos que se está importando (ej. ScmProduct).
 */
export interface ImportPreview<T> {
  headers: string[];             // Todas las cabeceras detectadas en el CSV.
  mappings: CsvColumnMapping[];  // El mapeo actual definido por el usuario.
  previewRows: Partial<T>[];     // Algunas filas de datos ya mapeados para la vista previa.
  totalRows: number;             // El número total de filas en el archivo.
  errors: string[];              // Errores de parsing o mapeo.
}
// ======================================================
//       Human Resources (HR) Interfaces
// ======================================================

export interface HrEmployee {
  id: string;
  tenant_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  hire_date: string | null;
  status: string;
  manager_id: string | null;
  user_id: string | null;
  contract_type?: 'weekly' | 'bi-weekly' | 'piece-rate' | 'freelance';
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ======================================================
//       Manufacturing (MFG) Interfaces
// ======================================================

export interface MfgProcess {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  standard_duration_minutes?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface MfgStage {
  id: string;
  process_id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_quality_control_point: boolean; // Punto de control
  created_at: string;
}

export interface MfgBillOfMaterials {
  id: string;
  tenant_id: string;
  finished_product_id: string; // References ScmProduct
  name: string;
  version: string;
  is_active: boolean;
  created_at: string;
}

export interface MfgBomItem {
  id: string;
  bom_id: string;
  component_product_id: string; // References ScmProduct (Raw Material)
  quantity: number;
  wastage_percent: number;
  created_at: string;
}

export interface MfgProductionOrder {
  id: string;
  tenant_id: string;
  company_id: string;
  order_number: string;
  product_id: string; // Finished good to produce
  quantity: number;
  process_id: string;
  current_stage_id: string;
  warehouse_id?: string; // Warehouse to deduct materials from
  status: 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  start_date: string | null;
  due_date: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes: string | null;
  created_at: string;
  updated_at: string;
}


// ======================================================
//       Warehouse & Stock Interfaces (New Standard)
// ======================================================

export interface Warehouse {
  id: string;
  tenant_id: string;
  company_id: string;
  // client_id removed
  code: string;
  name: string;
  address: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  tenant_id: string;
  // client_id removed
  warehouse_id: string;
  product_id?: string; // Optional if variant_id is primary
  variant_id?: string; // New field
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'PRODUCTION_CONSUMPTION' | 'PRODUCTION_OUTPUT';
  quantity: number;
  movement_date: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface StockOnHand {
  warehouse_id: string;
  warehouse_name: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
}

// ======================================================
//       Purchasing (Standardized) Interfaces
// ======================================================

export interface Supplier {
  id: string;
  tenant_id: string;
  company_id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  payment_terms: string | null;
  is_active: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  company_id: string;
  warehouse_id?: string; // Target warehouse for reception
  po_number: string;
  po_date: string;
  supplier_id: string;
  expected_delivery_date: string | null;
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  total_amount: number;
  tax_amount: number;
  freight_amount: number;
  net_amount: number;
  currency_code: string;
  notes: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { name: string }; // Extended for UI
}

export interface PurchaseOrderLine {
  id: string;
  purchase_order_id: string;
  line_number: number;
  product_id: string;
  variant_id?: string; // New field for variant support
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  line_amount: number;
  tax_percent: number;
  expected_delivery_date: string | null;
  notes: string | null;
  created_at: string;
}
