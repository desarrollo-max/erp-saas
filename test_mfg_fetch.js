
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMDAyMiwiZXhwIjoyMDc4OTg2MDIyfQ.AIM7H-sNU8Tf-kFXY8jLVfp-eD0H4FwCl_o5Y38JkDA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Testing simple fetch...');
    const { data, error } = await supabase.from('mfg_production_orders').select('*');
    if (error) {
        console.error('Simple fetch error:', error);
    } else {
        console.log('Simple fetch success, rows:', data.length);
    }

    console.log('Testing join fetch...');
    const { data: data2, error: error2 } = await supabase.from('mfg_production_orders')
        .select('*, scm_products(name), mfg_processes(name), mfg_stages(name)');
    if (error2) {
        console.error('Join fetch error:', error2);
    } else {
        console.log('Join fetch success, rows:', data2.length);
    }
}

testFetch();
