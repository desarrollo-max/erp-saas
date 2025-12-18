
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMDAyMiwiZXhwIjoyMDc4OTg2MDIyfQ.AIM7H-sNU8Tf-kFXY8jLVfp-eD0H4FwCl_o5Y38JkDA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function groupProducts() {
    const { data, error } = await supabase.from('scm_products').select('tenant_id');
    if (error) { console.error(error); return; }

    if (!data || data.length === 0) {
        console.log('No hay productos en scm_products en absoluto.');
        return;
    }

    const counts = {};
    data.forEach(p => {
        counts[p.tenant_id] = (counts[p.tenant_id] || 0) + 1;
    });

    console.log('--- PRODUCTOS POR TENANT ---');
    for (const tid in counts) {
        const { data: t } = await supabase.from('tenants').select('name').eq('id', tid).single();
        console.log(`Tenant: ${t ? t.name : tid} Count: ${counts[tid]}`);
    }
}
groupProducts();
