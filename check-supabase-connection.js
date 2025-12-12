
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMDAyMiwiZXhwIjoyMDc4OTg2MDIyfQ.AIM7H-sNU8Tf-kFXY8jLVfp-eD0H4FwCl_o5Y38JkDA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabase() {
    console.log('--- Testing Supabase Connection with Service Role Key ---');

    // 1. Check Buckets
    console.log('\n1. Listing Buckets:');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error('ERROR listing buckets:', bucketError);
    } else {
        console.log('Buckets found:', buckets.map(b => b.name));
        const hasBucket = buckets.some(b => b.name === 'erp-files');
        console.log(`Bucket 'erp-files' exists? ${hasBucket}`);
        
        if (!hasBucket) {
            console.log("ATTEMPTING TO CREATE BUCKET 'erp-files'...");
            const { data: newBucket, error: createError } = await supabase.storage.createBucket('erp-files', { public: true });
            if (createError) console.error("Error creating bucket:", createError);
            else console.log("Bucket created successfully.");
        }
    }

    // 2. Check Table permissions (insert dummy product image)
    // We need a valid product ID first, let's grab one
    console.log('\n2. Testing Database Insert (scm_product_images):');
    const { data: products } = await supabase.from('scm_products').select('id').limit(1);
    
    if (!products || products.length === 0) {
        console.log('No products found to test image insert.');
    } else {
        const pid = products[0].id;
        console.log(`Using Product ID: ${pid}`);

        const dummyImage = {
            product_id: pid,
            storage_path: 'test/dummy.jpg',
            url: 'https://dummy.url/test.jpg',
            is_primary: false,
            display_order: 999
        };

        const { data: imgData, error: imgError } = await supabase
            .from('scm_product_images')
            .insert(dummyImage)
            .select();

        if (imgError) {
            console.error('ERROR inserting image record:', imgError);
        } else {
            console.log('Image record inserted successfully:', imgData);
            // Cleanup
            await supabase.from('scm_product_images').delete().eq('id', imgData[0].id);
            console.log('Test record cleaned up.');
        }
    }
}

testSupabase();
