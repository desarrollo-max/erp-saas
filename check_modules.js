
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTAwMjIsImV4cCI6MjA3ODk4NjAyMn0.mlv4A0ejY1hIJD1gj1AGT6QvHYasrZtAOUk0nxGTd_Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getModules() {
    const { data, error } = await supabase
        .from('modules')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

getModules();
