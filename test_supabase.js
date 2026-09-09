import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].trim() : process.env[name];
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

console.log('Testing Supabase Connection...');
console.log('URL configured:', !!supabaseUrl && !supabaseUrl.includes('your-project'));
console.log('KEY configured:', !!supabaseAnonKey && !supabaseAnonKey.includes('your-anon-key'));

if (!supabaseUrl || supabaseUrl.includes('your-project') || !supabaseAnonKey || supabaseAnonKey.includes('your-anon-key')) {
  console.log('STATUS: PLACEHOLDER_CREDENTIALS');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLiveSupabase() {
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
      console.log('Supabase Error:', error.message);
      console.log('STATUS: CONNECTION_FAILED');
    } else {
      console.log('STATUS: CONNECTED_SUCCESSFULLY');
      console.log('Sample Data fetched:', data);
    }
  } catch (err) {
    console.log('Exception connecting to Supabase:', err.message);
    console.log('STATUS: CONNECTION_FAILED');
  }
}

testLiveSupabase();
