import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const buckets = ['media', 'avatars', 'branding'];

async function initBuckets() {
  console.log('Initializing Supabase storage buckets...');

  for (const bucketName of buckets) {
    const { data: bucket, error: getError } = await supabase.storage.getBucket(bucketName);

    if (getError && getError.message.includes('not found')) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });

      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError.message);
      } else {
        console.log(`Successfully created bucket: ${bucketName}`);
      }
    } else if (getError) {
      console.error(`Error checking bucket ${bucketName}:`, getError.message);
    } else {
      console.log(`Bucket already exists: ${bucketName}`);
    }
  }

  console.log('Done!');
}

initBuckets().catch(console.error);
