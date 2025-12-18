
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTAwMjIsImV4cCI6MjA3ODk4NjAyMn0.mlv4A0ejY1hIJD1gj1AGT6QvHYasrZtAOUk0nxGTd_Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findProducts() {
    console.log('--- BUSCANDO PRODUCTOS (ANON) ---');
    const { data: tenants, error: tenError } = await supabase.from('tenants').select('id, name');
    if (tenError) { console.error('Error tenants:', tenError); return; }

    for (const t of tenants) {
        const { count, error } = await supabase
            .from('scm_products')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', t.id);
        if (error) {
            console.log(`Error en ${t.name}:`, error.message);
        } else if (count > 0) {
            console.log(`Tenant: ${t.name} (${t.id}) -> ${count} productos`);
        }
    }
}
findProducts();
