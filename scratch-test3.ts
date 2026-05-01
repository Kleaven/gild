import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  const email = 'gate3-1746083162704@gild.test';
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  console.log("Link Data:", linkData?.properties?.action_link);
  
  if (!linkData?.properties?.action_link) return;
  const url = new URL(linkData.properties.action_link);
  const token = url.searchParams.get('token');
  
  if (!token) return;
  console.log("Extracted token hash:", token);
  
  // Use token_hash instead of token
  const { data: verifyData, error: verifyError } = await supabaseAnon.auth.verifyOtp({
    email,
    token_hash: token,
    type: 'magiclink'
  });
  
  if (verifyError) {
    console.log("Verify Error:", verifyError);
  } else {
    console.log("Verify Success! Session:", verifyData.session?.access_token ? "YES" : "NO");
  }
}
run();
