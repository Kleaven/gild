import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'gate3-1746083162704@gild.test', // use the email from our test
  });
  console.log(JSON.stringify(data, null, 2));
}
run();
