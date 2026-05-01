import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

// Use the service role client to bypass RLS and create users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function bootstrap() {
  const args = process.argv.slice(2);
  const email = args[0];

  if (!email || !email.includes('@')) {
    console.error('Usage: npm run admin:bootstrap -- <email>');
    process.exit(1);
  }

  console.log(`Bootstrapping platform admin: ${email}`);

  // 1. Check if user exists
  let userId: string;
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Failed to list users:', listError);
    process.exit(1);
  }

  const existingUser = users.users.find((u) => u.email === email);

  if (existingUser) {
    console.log(`User ${email} already exists in auth.users.`);
    userId = existingUser.id;
  } else {
    console.log(`User ${email} not found. Creating...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      // Create a long random password since they will never use it
      password: crypto.randomBytes(32).toString('hex'),
    });

    if (createError || !newUser.user) {
      console.error('Failed to create user:', createError);
      process.exit(1);
    }
    userId = newUser.user.id;
    
    // Ensure profile exists
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      display_name: 'Platform Admin',
      username: `admin_${crypto.randomBytes(4).toString('hex')}`,
    });

    if (profileError && profileError.code !== '23505') { // Ignore unique violation if it exists
      console.error('Failed to create profile:', profileError);
      process.exit(1);
    }
  }

  // 2. Check platform_admins and setup token
  let platformAdminId: string;
  const { data: adminData, error: adminQueryError } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (adminQueryError) {
    console.error('Failed to check platform_admins:', adminQueryError);
    process.exit(1);
  }

  if (adminData) {
    platformAdminId = adminData.id;
    console.log(`User is already a platform admin (id: ${platformAdminId}).`);
  } else {
    console.log('Promoting user to platform_admin...');
    const { data: newAdmin, error: promoteError } = await supabase
      .from('platform_admins')
      .insert({ user_id: userId, email })
      .select('id')
      .single();

    if (promoteError || !newAdmin) {
      console.error('Failed to promote to platform_admin:', promoteError);
      process.exit(1);
    }
    platformAdminId = newAdmin.id;
  }

  // 3. Check credentials and generate token
  const { count, error: credError } = await supabase
    .from('webauthn_credentials')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', platformAdminId);

  if (credError) {
    console.error('Failed to check credentials:', credError);
    process.exit(1);
  }

  if (count && count > 0) {
    console.log(`Admin already has ${count} WebAuthn credentials. Bootstrap complete.`);
    console.log('They can log in at: http://localhost:3000/admin/login');
    process.exit(0);
  }

  // 0 credentials -> generate setup token
  const setupToken = crypto.randomBytes(16).toString('hex'); // 32 characters

  const { error: tokenError } = await supabase
    .from('platform_admins')
    .update({ setup_token: setupToken })
    .eq('id', platformAdminId);

  if (tokenError) {
    console.error('Failed to set setup_token:', tokenError);
    process.exit(1);
  }

  console.log('\n✅ Bootstrap successful!');
  console.log('\nTo complete WebAuthn setup, the admin must visit this URL exactly once:');
  console.log(`\n    http://localhost:3000/admin/setup?token=${setupToken}\n`);
}

bootstrap().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
