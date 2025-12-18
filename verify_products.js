
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTAwMjIsImV4cCI6MjA3ODk4NjAyMn0.mlv4A0ejY1hIJD1gj1AGT6QvHYasrZtAOUk0nxGTd_Q';
const supabase = createClient(supabaseUrl, supabaseKey);

const tenantId = '8d68d6fc-c7d7-456d-81e1-ba593f73553b';

async function verify() {
    const { data: products, error } = await supabase.from('scm_products').select('id, name, tenant_id').eq('tenant_id', tenantId).limit(5);
    if (error) console.error(error);
    console.log('Productos encontrados:', products);
}
verify();
