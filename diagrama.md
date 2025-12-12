# Diagrama de Entidad-Relación de la Base de Datos

Este diagrama visualiza la arquitectura de la base de datos del ERP, mostrando las tablas y sus relaciones.

```mermaid
erDiagram
    %% ==================================
    %%         NÚCLEO Y ARRENDAMIENTO
    %% ==================================
    tenants {
        uuid id PK "ID Inquilino"
        varchar slug UK
        varchar name
        boolean is_active
        varchar csubscription_status
    }
    companies {
        uuid id PK "ID Empresa"
        uuid tenant_id FK
        varchar code
        varchar name
        boolean is_active
    }
    users_tenants {
        uuid id PK
        uuid user_id FK "ID Usuario Auth"
        uuid tenant_id FK
        varchar role
    }
    plans {
        uuid id PK "ID Plan"
        varchar code UK
        varchar name
    }
    modules {
        uuid id PK "ID Módulo"
        varchar code UK
        varchar name
    }
    tenant_subscriptions {
        uuid id PK
        uuid tenant_id FK
        uuid plan_id FK
        varchar status
    }
    tenant_licenses {
        uuid id PK
        uuid tenant_id FK
        uuid module_id FK
        uuid subscription_id FK
    }
    audit_logs {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar action
        varchar entity_type
    }

    %% ==================================
    %%            FINANZAS (FIN)
    %% ==================================
    fin_account_types {
        uuid id PK
        varchar code UK
        varchar name
    }
    fin_accounts {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid account_type_id FK
        uuid parent_account_id FK
        varchar code
        varchar name
    }
    fin_cost_centers {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        varchar code
        varchar name
    }
    fin_journal_entries {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        varchar entry_number
        varchar status
    }
    fin_journal_lines {
        uuid id PK
        uuid journal_entry_id FK
        uuid account_id FK
        uuid cost_center_id FK
        numeric debit_amount
        numeric credit_amount
    }

    %% ==================================
    %%     GESTIÓN DE CADENA DE SUMINISTRO (SCM)
    %% ==================================
    scm_suppliers {
        uuid id PK
        uuid tenant_id FK
        varchar name
        boolean is_active
    }
    scm_warehouses {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        varchar code
        varchar name
    }
    scm_product_categories {
        uuid id PK
        uuid tenant_id FK
        uuid parent_category_id FK
        varchar name
    }
    scm_products {
        uuid id PK
        uuid tenant_id FK
        uuid category_id FK
        varchar sku
        varchar name
    }
    scm_purchase_orders {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid supplier_id FK
        varchar po_number
        varchar status
    }
    scm_po_lines {
        uuid id PK
        uuid purchase_order_id FK
        uuid product_id FK
        numeric quantity_ordered
    }
    scm_stock_levels {
        uuid id PK
        uuid tenant_id FK
        uuid product_id FK
        uuid warehouse_id FK
        numeric quantity_on_hand
    }

    %% ==================================
    %%           VENTAS / CRM
    %% ==================================
    sales_companies {
        uuid id PK
        uuid tenant_id FK
        varchar name
        boolean is_customer
    }
    sales_contacts {
        uuid id PK
        uuid tenant_id FK
        uuid sales_company_id FK
        varchar first_name
        varchar email
    }
    sales_pipelines {
        uuid id PK
        uuid tenant_id FK
        varchar name
    }
    sales_stages {
        uuid id PK
        uuid pipeline_id FK
        varchar name
    }
    sales_opportunities {
        uuid id PK
        uuid tenant_id FK
        uuid pipeline_id FK
        uuid stage_id FK
        uuid sales_company_id FK
        varchar name
    }
    sales_orders {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid opportunity_id FK
        uuid customer_id FK
        varchar order_number
    }
    sales_order_lines {
        uuid id PK
        uuid sales_order_id FK
        uuid product_id FK
        numeric quantity
    }
    sales_activities {
        uuid id PK
        uuid tenant_id FK
        uuid opportunity_id FK
        uuid contact_id FK
        varchar activity_type
    }


    %% ==================================
    %%           PRODUCCIÓN (PROD)
    %% ==================================
    prod_processes {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar description
        numeric standard_cost
        integer estimated_time_minutes
    }
    prod_work_orders {
        uuid id PK
        uuid tenant_id FK
        uuid sales_order_id FK
        uuid product_id FK
        varchar order_number
        varchar status "planeada, en_progreso, completada, cancelada"
        timestamp start_date
        timestamp due_date
        integer quantity
    }
    prod_kanban_columns {
        uuid id PK
        uuid tenant_id FK
        varchar name
        integer position
        varchar color
    }
    prod_tracking {
        uuid id PK
        uuid work_order_id FK
        uuid process_id FK
        uuid kanban_column_id FK
        timestamp timestamp
        uuid operator_id FK
        varchar status
    }
    prod_finished_goods {
        uuid id PK
        uuid tenant_id FK
        uuid product_id FK
        uuid warehouse_id FK
        integer quantity_available
        varchar batch_number
    }

    %% ==================================
    %%           RELACIONES
    %% ==================================
    %% --- Relaciones del Núcleo ---
    tenants ||--|{ companies : "tiene"
    tenants ||--|{ users_tenants : "tiene"
    tenants ||--|{ tenant_subscriptions : "tiene"
    plans ||--|{ tenant_subscriptions : "usa"
    tenants ||--|{ tenant_licenses : "tiene"
    modules ||--|{ tenant_licenses : "para"
    tenant_subscriptions }o--o| tenant_licenses : "cubre"
    tenants ||--|{ audit_logs : "registra"

    %% --- Relaciones de Finanzas ---
    tenants ||--|{ fin_accounts : "posee"
    companies ||--|{ fin_accounts : "pertenece_a"
    fin_account_types ||--|{ fin_accounts : "clasifica"
    fin_accounts }o--o{ fin_accounts : "padre_de"
    tenants ||--|{ fin_cost_centers : "posee"
    companies ||--|{ fin_cost_centers : "pertenece_a"
    tenants ||--|{ fin_journal_entries : "posee"
    companies ||--|{ fin_journal_entries : "para"
    fin_journal_entries ||--|{ fin_journal_lines : "contiene"
    fin_accounts ||--|{ fin_journal_lines : "se_asienta_en"
    fin_cost_centers }o--o{ fin_journal_lines : "se_asigna_a"

    %% --- Relaciones SCM ---
    tenants ||--|{ scm_suppliers : "gestiona"
    tenants ||--|{ scm_warehouses : "gestiona"
    companies ||--|{ scm_warehouses : "contiene"
    tenants ||--|{ scm_product_categories : "define"
    scm_product_categories }o--o{ scm_product_categories : "padre_de"
    tenants ||--|{ scm_products : "gestiona"
    scm_product_categories }o--|| scm_products : "contiene"
    tenants ||--|{ scm_purchase_orders : "emite"
    companies ||--|{ scm_purchase_orders : "para"
    scm_suppliers ||--|{ scm_purchase_orders : "a"
    scm_purchase_orders ||--|{ scm_po_lines : "detalla"
    scm_products ||--o{ scm_po_lines : "referencia"
    tenants ||--|{ scm_stock_levels : "rastrea"
    scm_products ||--|{ scm_stock_levels : "para_producto"
    scm_warehouses ||--|{ scm_stock_levels : "en_almacen"

    %% --- Relaciones Ventas/CRM ---
    tenants ||--|{ sales_companies : "gestiona"
    sales_companies }o--|| sales_contacts : "tiene"
    tenants ||--|{ sales_pipelines : "define"
    sales_pipelines ||--|{ sales_stages : "contiene"
    tenants ||--|{ sales_opportunities : "rastrea"
    sales_pipelines ||--|{ sales_opportunities : "en"
    sales_stages ||--|{ sales_opportunities : "en"
    sales_companies ||--|{ sales_opportunities : "para"
    tenants ||--|{ sales_orders : "gestiona"
    companies ||--|{ sales_orders : "procesa"
    sales_opportunities }o--o{ sales_orders : "desde"
    sales_companies }o--o{ sales_orders : "a_cliente"
    sales_orders ||--|{ sales_order_lines : "contiene"
    scm_products }o--o{ sales_order_lines : "referencia"
    tenants ||--|{ sales_activities : "registra"
    sales_opportunities }o--o{ sales_activities : "relacionado_con"
    sales_contacts }o--o{ sales_activities : "con"

    %% --- Relaciones Producción ---
    tenants ||--|{ prod_processes : "define"
    tenants ||--|{ prod_work_orders : "gestiona"
    sales_orders ||--o{ prod_work_orders : "genera"
    scm_products ||--|{ prod_work_orders : "para_producir"
    tenants ||--|{ prod_kanban_columns : "configura"
    prod_work_orders ||--|{ prod_tracking : "rastreado_via"
    prod_processes ||--|{ prod_tracking : "paso"
    prod_kanban_columns ||--|{ prod_tracking : "en_etapa"
    tenants ||--|{ prod_finished_goods : "almacena"
    scm_products ||--|{ prod_finished_goods : "inventario_de"
```
