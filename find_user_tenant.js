
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMDAyMiwiZXhwIjoyMDc4OTg2MDIyfQ.AIM7H-sNU8Tf-kFXY8jLVfp-eD0H4FwCl_o5Y38JkDA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findAgaveUserTenant() {
    const EMAIL = 'agaveqboots@gmail.com';

    // 1. Get user by email (using service role to search auth.users if possible, or just checking profiles)
    // Actually, I'll just check 'users_tenants' for any ID matching the user that was logged in
    const { data: ut, error } = await supabase.from('users_tenants').select('tenant_id, user_id, tenants(name)');
    if (error) console.error(error);

    ut.forEach(row => {
        console.log(`User: ${row.user_id} Tenant: ${row.tenants?.name} (${row.tenant_id})`);
    });
}
findAgaveUserTenant();
