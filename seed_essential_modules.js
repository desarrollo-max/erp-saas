
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
// Usando service_role para bypass RLS y arreglar el sistema
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMDAyMiwiZXhwIjoyMDc4OTg2MDIyfQ.AIM7H-sNU8Tf-kFXY8jLVfp-eD0H4FwCl_o5Y38JkDA';
const supabase = createClient(supabaseUrl, supabaseKey);

const tenantId = 'c6a7901e-3ef3-485c-86f9-09c0726461c0'; // Agave Boots

const essentialModules = [
    { code: 'SCM-INV', name: 'Inventario', category: 'Logística', route_path: '/cadena-suministro/inventario', icon: 'heroCubeSolid', color: '#10b981', sort_order: 10 },
    { code: 'SAL-ORD', name: 'Ventas', category: 'Comercial', route_path: '/ventas/pedidos', icon: 'heroShoppingCartSolid', color: '#6366f1', sort_order: 20 },
    { code: 'FIN-MAIN', name: 'Finanzas', category: 'Administración', route_path: '/finanzas', icon: 'heroBanknotesSolid', color: '#f59e0b', sort_order: 30 },
    { code: 'HR-MAIN', name: 'Recursos Humanos', category: 'Administración', route_path: '/rrhh', icon: 'heroUsersSolid', color: '#ec4899', sort_order: 40 },
    { code: 'MFG-MAIN', name: 'Manufactura', category: 'Producción', route_path: '/manufactura', icon: 'heroCpuChipSolid', color: '#8b5cf6', sort_order: 50 },
    { code: 'MKT-MAIN', name: 'Marketing', category: 'Estrategia', route_path: '/marketing', icon: 'heroMegaphoneSolid', color: '#3b82f6', sort_order: 60 }
];

async function seed() {
    console.log('Restaurando modulos con SERVICE_ROLE...');

    for (const mod of essentialModules) {
        const { data: existing } = await supabase.from('modules').select('id').eq('code', mod.code).single();

        let moduleId;
        if (existing) {
            moduleId = existing.id;
            await supabase.from('modules').update(mod).eq('id', moduleId);
            console.log(`Modulo actualizado: ${mod.name}`);
        } else {
            const { data: inserted, error } = await supabase.from('modules').insert({ ...mod, is_available: true, version: '1.0.0' }).select().single();
            if (error) console.error(`Error insertando ${mod.name}:`, error);
            else {
                moduleId = inserted.id;
                console.log(`Modulo creado: ${mod.name}`);
            }
        }

        if (moduleId) {
            const { data: existingLic } = await supabase.from('tenant_licenses').select('id').eq('tenant_id', tenantId).eq('module_id', moduleId).single();
            if (!existingLic) {
                await supabase.from('tenant_licenses').insert({
                    tenant_id: tenantId,
                    module_id: moduleId,
                    is_active: true,
                    installed_at: new Date().toISOString()
                });
                console.log(`Licencia otorgada a Agave para: ${mod.name}`);
            } else {
                await supabase.from('tenant_licenses').update({ is_active: true }).eq('id', existingLic.id);
                console.log(`Licencia reactivada para: ${mod.name}`);
            }
        }
    }

    const { data: finals } = await supabase.from('modules').select('*');
    console.log(`\nSiembra completada. Total modulos: ${finals ? finals.length : 0}`);
}

seed();
