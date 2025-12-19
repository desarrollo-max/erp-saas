
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMDAyMiwiZXhwIjoyMDc4OTg2MDIyfQ.AIM7H-sNU8Tf-kFXY8jLVfp-eD0H4FwCl_o5Y38JkDA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
    const tables = ['hr_employees', 'mfg_processes', 'mfg_stages', 'mfg_boms', 'mfg_bom_items', 'mfg_production_orders'];
    console.log('Verificando existencia de tablas...');

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ Tabla ${table}: ERROR - ${error.message}`);
        } else {
            console.log(`✅ Tabla ${table}: CORRECTO`);
        }
    }
}

verifyMigration();
