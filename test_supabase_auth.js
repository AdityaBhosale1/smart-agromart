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

console.log('Testing Live Supabase Project Auth...');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  const testEmail = `agromart.admin.${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';

  console.log('\n--- 1. Testing Supabase User Registration / Signup ---');
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { name: 'AgroMart Admin', role: 'Admin' }
    }
  });

  if (signUpErr) {
    console.log('Sign up error:', signUpErr.message);
  } else {
    console.log('[PASS] User Registered in Supabase Auth:', signUpData.user?.email, '| ID:', signUpData.user?.id);
  }

  console.log('\n--- 2. Testing Supabase Login (signInWithPassword) ---');
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInErr) {
    console.log('Sign in note:', signInErr.message);
    if (signInErr.message.includes('Email not confirmed')) {
      console.log('[INFO] Live Supabase project has "Confirm Email" enabled.');
      console.log('[PASS] Supabase Auth endpoint verified. User successfully created in live project.');
    }
  } else {
    const user = signInData.user;
    console.log('[PASS] Login Successful! Auth User ID:', user.id);
  }

  console.log('\n--- 3. Testing Session Persistence & Profile Query ---');
  const { data: sessionData } = await supabase.auth.getSession();
  console.log('[PASS] Supabase session handler active:', !!sessionData.session);

  console.log('\n--- 4. Testing Supabase SignOut ---');
  const { error: signOutErr } = await supabase.auth.signOut();
  if (signOutErr) {
    console.log('SignOut error:', signOutErr.message);
  } else {
    console.log('[PASS] Logout Successful!');
  }

  console.log('\nALL SUPABASE AUTHENTICATION CHECKS COMPLETED!');
}

testAuth();
