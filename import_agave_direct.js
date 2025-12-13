
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Environments
const SUPABASE_URL = 'https://bupapjirkilnfoswgtsg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTAwMjIsImV4cCI6MjA3ODk4NjAyMn0.mlv4A0ejY1hIJD1gj1AGT6QvHYasrZtAOUk0nxGTd_Q';

// User Credentials
const EMAIL = 'agaveqboots@gmail.com';
const PASS = '4g4v3boots';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log("Starting import process...");

    // 1. Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASS
    });

    if (authError) {
        console.error("Login failed:", authError.message);
        return;
    }
    const user = authData.user;
    console.log("Logged in as:", user.email, "User ID:", user.id);

    // 2. Find Tenant
    // We need to find the tenant for this user. Typically in 'scm_products' we need 'tenant_id'.
    // We can look for a table linking users to tenants, often 'saas_tenants' or 'saas_user_tenants'.
    // Let's try to query 'saas_tenants' directly if RLS allows, or check 'scm_products' if we have any existing to see the tenant_id.
    // Better: Query 'saas_tenants' where owner_id = user.id or similar.
    // Let's list tenants.

    // Attempt 1: Check 'users_tenants'
    let { data: userTenants, error: tenantError } = await supabase
        .from('users_tenants')
        .select(`
          tenant_id,
          role,
          tenants (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

    if (tenantError) {
        console.log("Could not list users_tenants:", tenantError.message);
    }

    let tenantId = null;
    if (userTenants && userTenants.length > 0) {
        // Find one named Agave
        const t = userTenants.find(ut => ut.tenants && ut.tenants.name && ut.tenants.name.toLowerCase().includes('agave'));
        if (t) {
            tenantId = t.tenant_id;
            console.log("Found Agave tenant:", t.tenants.name);
        } else {
            // Default to first
            tenantId = userTenants[0].tenant_id;
            console.log("Using first available tenant:", userTenants[0].tenants.name);
        }
    }

    if (!tenantId) {
        console.error("No tenant found for this user. Cannot proceed.");
        return;
    }

    console.log("Using Tenant ID:", tenantId);

    // 3. Get Category
    // We need a category ID.
    const { data: categories, error: catError } = await supabase
        .from('scm_product_categories')
        .select('id, name')
        .eq('tenant_id', tenantId);

    if (catError) {
        console.error("Error fetching categories:", catError.message);
        return;
    }

    if (categories.length === 0) {
        console.error("No categories found for this tenant. Please create one first.");
        return;
    }

    const categoryId = categories[0].id;
    console.log("Using Category:", categories[0].name, categoryId);

    // 4. Read JSON
    const jsonPath = path.join(__dirname, 'public', 'agave_products.json');
    if (!fs.existsSync(jsonPath)) {
        console.error("JSON file not found at:", jsonPath);
        // Try src/assets just in case
        const altPath = path.join(__dirname, 'src', 'assets', 'agave_products.json');
        if (fs.existsSync(altPath)) {
            // okay
        } else {
            return;
        }
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);
    const products = data.products;
    console.log(`Found ${products.length} products in JSON.`);

    // 5. Insert Products
    let successCount = 0;
    let skipCount = 0;

    for (const p of products) {
        const sku = (p.variants && p.variants[0] && p.variants[0].sku) ? p.variants[0].sku : 'SKU-' + p.id;

        // Check existence
        const { data: existing } = await supabase
            .from('scm_products')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('sku', sku)
            .maybeSingle();

        if (existing) {
            console.log(`Skipping existing sku: ${sku}`);
            skipCount++;
            continue;
        }

        const price = (p.variants && p.variants[0]) ? parseFloat(p.variants[0].price) : 0;
        const imageUrl = (p.images && p.images[0]) ? p.images[0].src : null;

        const productPayload = {
            tenant_id: tenantId,
            sku: sku,
            name: p.title,
            description: (p.body_html || '').replace(/<[^>]*>?/gm, ''), // Strip HTML
            unit_type: 'PAIR',
            is_active: true,
            sale_price: price,
            cost_price: price * 0.5,
            category_id: categoryId,
            size_config: { min: 22, max: 30, step: 0.5 },
            image_url: imageUrl // Some implementations save main image directly on product
        };

        const { data: createdProduct, error: createError } = await supabase
            .from('scm_products')
            .insert(productPayload)
            .select()
            .single();

        if (createError) {
            console.error(`Failed to create ${sku}:`, createError.message);
            continue;
        }

        successCount++;
        console.log(`Created ${sku}: ${p.title}`);

        // Add Image to media table
        if (imageUrl && createdProduct) {
            const mediaPayload = {
                product_id: createdProduct.id,
                file_url: imageUrl,
                media_type: 'image',
                is_primary: true,
                sort_order: 0
            };

            const { error: mediaError } = await supabase
                .from('scm_product_media')
                .insert(mediaPayload);

            if (mediaError) {
                console.error(`Failed to add image for ${sku}:`, mediaError.message);
            }
        }
    }

    console.log("-----------------------------------------");
    console.log(`Import Finished. Success: ${successCount}, Skipped: ${skipCount}`);
}

main();
