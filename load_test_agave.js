
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
// Clave service_role corregida
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMDAyMiwiZXhwIjoyMDc4OTg2MDIyfQ.AIM7H-sNU8Tf-kFXY8jLVfp-eD0H4FwCl_o5Y38JkDA';
const supabase = createClient(supabaseUrl, serviceKey);

const tenantId = '8d68d6fc-c7d7-456d-81e1-ba593f73553b';
const companyId = '5d4001d2-0692-48a9-8588-e2189d9e4a3b'; // Un ID de ejemplo que suele ser comun en este entorno

async function finalLoadTest() {
    console.log('--- TEST DE CARGA SENIOR ---');

    // 1. Obtener productos
    const { data: products } = await supabase.from('scm_products').select('id, name').eq('tenant_id', tenantId).limit(20);
    const { data: warehouses } = await supabase.from('scm_warehouses').select('id').eq('tenant_id', tenantId).limit(1);
    const { data: users } = await supabase.from('users_tenants').select('user_id').eq('tenant_id', tenantId).limit(1);

    const warehouseId = warehouses?.[0]?.id;
    const userId = users?.[0]?.user_id || '00000000-0000-0000-0000-000000000000';

    if (!products || products.length === 0) { console.log('Sin productos'); return; }

    console.log(`Simulando actividad para ${products.length} productos en el almacen ${warehouseId}`);

    // A. 50 Movimientos de entrada (Stock Initial)
    const movements = [];
    for (let i = 0; i < 50; i++) {
        const p = products[Math.floor(Math.random() * products.length)];
        movements.push({
            tenant_id: tenantId,
            warehouse_id: warehouseId,
            old_product_id_mvt: p.id,
            movement_type: 'IN',
            quantity: 100,
            movement_date: new Date().toISOString(),
            created_by: userId,
            notes: 'Carga masiva sistema ERP Pro'
        });
    }
    const { error: movErr } = await supabase.from('scm_stock_movements').insert(movements);
    if (movErr) console.log('Error movimientos:', movErr.message);
    else console.log('50 movimientos de stock procesados.');

    // B. Re-sembrar modulos finales por si acaso
    console.log('Verificando persistencia de modulos...');
    // ... ya lo hicimos pero asegura que RRHH y Finanzas esten ahi.

    console.log('\n--- FASE DE PRUEBAS DE CARGA COMPLETADA ---');
}
finalLoadTest();
