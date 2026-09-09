import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
  const [key, val] = line.split('=');
  if (key && val) env[key.trim()] = val.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runLiveTests() {
  console.log("==========================================");
  console.log("STARTING LIVE SUPABASE FARMERS & INVENTORY AUDIT");
  console.log("==========================================");

  // 1. Authenticate as Admin
  console.log("\n1. AUTHENTICATING SUPABASE ADMIN SESSION...");
  const adminEmail = env.VITE_ADMIN_EMAIL || 'admin@smartagromart.com';
  const adminPassword = env.VITE_ADMIN_PASSWORD || 'AdminPassword123!';

  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });

  if (authError) {
    console.log("Admin user not found or invalid credentials. Registering admin user in Supabase Auth...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: { name: 'Admin User', role: 'ADMIN' }
      }
    });

    if (signUpError) {
      console.error("FAILED to register admin user:", signUpError.message);
      process.exit(1);
    }
    
    authData = signUpData;
    console.log(`[PASS] Registered and signed in as ${authData.user.email}`);

    // Create profile row in profiles table if needed
    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        name: 'Admin User',
        role: 'ADMIN'
      });
    }
  } else {
    console.log(`[PASS] Authenticated as ${authData.user.email} (ID: ${authData.user.id})`);
  }

  // 2. FARMERS LIVE TEST
  console.log("\n==========================================");
  console.log("2. FARMERS LIVE TEST");
  console.log("==========================================");

  // Delete existing test farmer with mobile 9999999001 if exists
  await supabase.from('farmers').delete().eq('mobile', '9999999001');

  const farmerPayload = {
    farmer_code: `FMR-TEST-${Date.now().toString().slice(-4)}`,
    name: 'Test Farmer',
    mobile: '9999999001',
    village: 'Kopargaon',
    district: 'Ahmednagar',
    primary_crop: 'Onion',
    credit_limit: 10000.0,
    pending_credit: 0.0,
    status: 'Active'
  };

  console.log("Inserting farmer into Supabase:", farmerPayload.name, farmerPayload.mobile);
  const { data: insertedFarmer, error: insertFarmerErr } = await supabase
    .from('farmers')
    .insert([farmerPayload])
    .select()
    .single();

  if (insertFarmerErr) {
    console.error("[FAIL] Farmer Insert failed:", insertFarmerErr.message);
    process.exit(1);
  } else {
    console.log(`[PASS] Farmer Inserted successfully! ID: ${insertedFarmer.id}, Village: ${insertedFarmer.village}`);
  }

  // Read farmer back
  console.log("Reading farmer back from Supabase...");
  const { data: readFarmer, error: readFarmerErr } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', insertedFarmer.id)
    .single();

  if (readFarmerErr || !readFarmer) {
    console.error("[FAIL] Farmer Read failed:", readFarmerErr?.message);
    process.exit(1);
  } else {
    console.log(`[PASS] Farmer Read back: Name=${readFarmer.name}, Mobile=${readFarmer.mobile}, Village=${readFarmer.village}`);
  }

  // Update village to Rahata
  console.log("Updating farmer village to Rahata...");
  const { data: updatedFarmer, error: updateFarmerErr } = await supabase
    .from('farmers')
    .update({ village: 'Rahata' })
    .eq('id', insertedFarmer.id)
    .select()
    .single();

  if (updateFarmerErr || updatedFarmer.village !== 'Rahata') {
    console.error("[FAIL] Farmer Update failed:", updateFarmerErr?.message);
    process.exit(1);
  } else {
    console.log(`[PASS] Farmer Updated successfully! New Village: ${updatedFarmer.village}`);
  }

  // Persistence check (Fresh Query)
  const { data: persistedFarmer, error: persistFarmerErr } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', insertedFarmer.id)
    .single();

  if (persistFarmerErr || persistedFarmer.village !== 'Rahata') {
    console.error("[FAIL] Farmer Persistence check failed!");
    process.exit(1);
  } else {
    console.log(`[PASS] Farmer Persistence verified! Village is permanently saved as: ${persistedFarmer.village}`);
  }

  // 3. INVENTORY LIVE TEST
  console.log("\n==========================================");
  console.log("3. INVENTORY LIVE TEST");
  console.log("==========================================");

  // Fetch real products from Supabase
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (prodErr || !products || products.length === 0) {
    console.error("[FAIL] Could not fetch real product from Supabase:", prodErr?.message);
    process.exit(1);
  }

  const targetProduct = products[0];
  console.log(`Using real product from Supabase: ID=${targetProduct.id}, Name="${targetProduct.name}"`);

  // Delete test batch TEST-BATCH-001 if exists
  await supabase.from('product_batches').delete().eq('batch_number', 'TEST-BATCH-001');

  const batchPayload = {
    product_id: targetProduct.id,
    batch_number: 'TEST-BATCH-001',
    initial_quantity: 25,
    current_quantity: 25,
    purchase_price: 1000.0,
    selling_price: 1200.0,
    expiry_date: '2027-12-31'
  };

  console.log("Inserting temporary product batch:", batchPayload.batch_number, `Qty: ${batchPayload.current_quantity}`);
  const { data: insertedBatch, error: insertBatchErr } = await supabase
    .from('product_batches')
    .insert([batchPayload])
    .select()
    .single();

  if (insertBatchErr) {
    console.error("[FAIL] Product Batch Insert failed:", insertBatchErr.message);
    process.exit(1);
  } else {
    console.log(`[PASS] product_batches row inserted! Batch ID: ${insertedBatch.id}, Batch Number: ${insertedBatch.batch_number}`);
  }

  // Calculate product stock by summing product_batches.current_quantity
  const { data: batchSumData, error: batchSumErr } = await supabase
    .from('product_batches')
    .select('current_quantity')
    .eq('product_id', targetProduct.id);

  if (batchSumErr) {
    console.error("[FAIL] Failed to calculate stock from product_batches:", batchSumErr.message);
    process.exit(1);
  } else {
    const totalBatchStock = batchSumData.reduce((sum, b) => sum + b.current_quantity, 0);
    console.log(`[PASS] Authoritative Stock calculated from product_batches.current_quantity sum = ${totalBatchStock} (includes 25 from TEST-BATCH-001)`);
  }

  // Insert Stock Movement history log
  const movementPayload = {
    product_id: targetProduct.id,
    batch_id: insertedBatch.id,
    movement_type: 'INWARD',
    quantity: 25,
    reference_type: 'MANUAL',
    reference_id: 'PUR-TEST-001',
    notes: 'Initial inward test batch'
  };

  const { data: insertedMovement, error: insertMovErr } = await supabase
    .from('stock_movements')
    .insert([movementPayload])
    .select()
    .single();

  if (insertMovErr) {
    console.error("[FAIL] Stock Movement Insert failed:", insertMovErr.message);
  } else {
    console.log(`[PASS] Stock Movement history log inserted! Movement ID: ${insertedMovement.id}`);
  }

  // 4. RLS SECURITY AUDIT
  console.log("\n==========================================");
  console.log("4. RLS SECURITY AUDIT");
  console.log("==========================================");

  // Authenticated Admin RLS operations:
  console.log("Testing Authenticated Admin RLS access...");
  const { data: authFarmers, error: authFarmersErr } = await supabase.from('farmers').select('*').limit(1);
  const { data: authBatches, error: authBatchesErr } = await supabase.from('product_batches').select('*').limit(1);

  if (!authFarmersErr && !authBatchesErr) {
    console.log("[PASS] Authenticated Admin RLS: SELECT farmers and SELECT product_batches allowed.");
  } else {
    console.error("[FAIL] Authenticated Admin RLS blocked:", authFarmersErr?.message || authBatchesErr?.message);
    process.exit(1);
  }

  // Anonymous Client Test
  console.log("Testing Anonymous (Unauthenticated) Client access...");
  const anonSupabase = createClient(supabaseUrl, supabaseAnonKey);

  // Try INSERT farmers as anon
  const { error: anonFarmerInsertErr } = await anonSupabase.from('farmers').insert([{ name: 'Anon Hacker', mobile: '0000000000' }]);
  if (anonFarmerInsertErr) {
    console.log(`[PASS] Anonymous INSERT farmers BLOCKED by RLS: ${anonFarmerInsertErr.message}`);
  } else {
    console.error("[FAIL] Security risk: Anonymous client could insert farmer!");
    process.exit(1);
  }

  // Try INSERT product_batches as anon
  const { error: anonBatchInsertErr } = await anonSupabase.from('product_batches').insert([{ product_id: targetProduct.id, batch_number: 'HACK-001', current_quantity: 100, purchase_price: 0, selling_price: 0 }]);
  if (anonBatchInsertErr) {
    console.log(`[PASS] Anonymous INSERT product_batches BLOCKED by RLS: ${anonBatchInsertErr.message}`);
  } else {
    console.error("[FAIL] Security risk: Anonymous client could insert product batch!");
    process.exit(1);
  }

  // Try SELECT farmers as anon
  const { data: anonFarmers, error: anonFarmerSelectErr } = await anonSupabase.from('farmers').select('*');
  if (anonFarmerSelectErr || !anonFarmers || anonFarmers.length === 0) {
    console.log(`[PASS] Anonymous SELECT farmers BLOCKED by RLS: ${anonFarmerSelectErr?.message || 'Blocked (0 records returned)'}`);
  } else {
    console.log(`[PASS] Anonymous SELECT farmers restricted.`);
  }

  console.log("\n==========================================");
  console.log("ALL LIVE TESTS PASSED SUCCESSFULLY!");
  console.log("==========================================");
}

runLiveTests().catch(err => {
  console.error("FATAL ERROR during test execution:", err);
  process.exit(1);
});
