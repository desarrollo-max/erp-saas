
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('src/environments/environment.ts', 'utf8');
const supabaseUrl = envContent.match(/supabaseUrl: '([^']+)'/)[1];
const supabaseKey = envContent.match(/supabaseServiceRoleKey: '([^']+)'/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFinance() {
    const tables = ['fin_accounts', 'fin_journal_entries', 'fin_journal_lines', 'fin_invoices', 'fin_expenses'];

    console.log('Verificando tablas de finanzas...');
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && (error.code === '42P01' || error.message.includes('not found'))) {
            console.log(`❌ Tabla ${table}: NO EXISTE`);
        } else if (error) {
            console.log(`⚠️ Tabla ${table}: ERROR (${error.message})`);
        } else {
            console.log(`✅ Tabla ${table}: CORRECTO`);
        }
    }
}

verifyFinance();
