
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTAwMjIsImV4cCI6MjA3ODk4NjAyMn0.mlv4A0ejY1hIJD1gj1AGT6QvHYasrZtAOUk0nxGTd_Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- BUSCANDO AGAVE ---');
    const { data: tenants } = await supabase.from('tenants').select('*');
    if (!tenants) { console.log('No hay tenants'); return; }

    tenants.forEach(t => console.log(`Tenant: ${t.name} ID: ${t.id}`));

    const agave = tenants.find(t => t.name.toLowerCase().includes('agave'));
    if (!agave) {
        console.log('No se encontro Agave Boots. Creando tenant para pruebas...');
        // skip creating for now, just diagnostic
        return;
    }

    console.log(`\nAgave ID: ${agave.id}`);

    const { data: modules } = await supabase.from('modules').select('*');
    console.log(`\nModulos totales: ${modules?.length || 0}`);

    // Si no hay modulos, es el problema
    if (!modules || modules.length === 0) {
        console.log('ADVERTENCIA: No hay modulos en la tabla "modules".');
    } else {
        modules.forEach(m => console.log(`- [${m.code}] ${m.name} (Path: ${m.route_path})`));
    }

    const { data: licenses } = await supabase.from('tenant_licenses').select('*').eq('tenant_id', agave.id);
    console.log(`\nLicencias instaladas para Agave: ${licenses?.length || 0}`);
    if (licenses) {
        licenses.forEach(l => {
            const m = modules?.find(mod => mod.id === l.module_id);
            console.log(`  - ${m ? m.name : l.module_id}`);
        });
    }
}
run();
