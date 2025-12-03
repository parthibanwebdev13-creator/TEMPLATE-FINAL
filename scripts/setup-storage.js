// Script to help set up Supabase storage bucket
// Run this with: node scripts/setup-storage.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envFile = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.log('No .env file found, using process.env');
    return process.env;
  }
}

const env = loadEnv();

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please create a .env file with:');
  console.log('VITE_SUPABASE_URL=your_supabase_url');
  console.log('VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    console.log('🔍 Checking if product-images bucket exists...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    const productImagesBucket = buckets.find(bucket => bucket.id === 'product-images');
    
    if (productImagesBucket) {
      console.log('✅ product-images bucket already exists');
      console.log('📋 Bucket details:', productImagesBucket);
    } else {
      console.log('❌ product-images bucket not found');
      console.log('📋 Available buckets:', buckets.map(b => b.id));
      console.log('\n🔧 To fix this:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to Storage');
      console.log('3. Click "Create a new bucket"');
      console.log('4. Name it "product-images"');
      console.log('5. Make it public');
      console.log('6. Set file size limit to 5MB');
      console.log('7. Add allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif');
    }
    
    // Test upload permissions
    console.log('\n🧪 Testing upload permissions...');
    const testFile = new Blob(['test'], { type: 'text/plain' });
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload('test.txt', testFile);
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      if (uploadError.message.includes('bucket not found')) {
        console.log('💡 The bucket needs to be created first');
      } else if (uploadError.message.includes('permission denied')) {
        console.log('💡 Check your RLS policies and admin role');
      }
    } else {
      console.log('✅ Upload test successful');
      // Clean up test file
      await supabase.storage.from('product-images').remove(['test.txt']);
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

setupStorage();
