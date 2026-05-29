import { getSupabaseServiceClient } from '../lib/auth/server';

async function seed() {
  const supabase = getSupabaseServiceClient();

  const categories = ['Business', 'Technology', 'Health & Fitness', 'Arts & Design', 'Lifestyle', 'Education'];

  const { data: communities } = await supabase
    .from('communities')
    .select('id');

  if (!communities) return;

  for (let i = 0; i < communities.length; i++) {
    const community = communities[i];
    if (!community) continue;
    const category = categories[i % categories.length];
    await supabase
      .from('communities')
      .update({ category })
      .eq('id', community.id);
    console.log(`Updated community ${community.id} with category ${category}`);
  }
}

seed().catch(console.error);
