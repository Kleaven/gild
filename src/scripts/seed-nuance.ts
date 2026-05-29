import { getSupabaseServiceClient } from '../lib/auth/server';

async function seed() {
  const supabase = getSupabaseServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No user found to own the seed communities. Please sign in first.');
    return;
  }

  const userId = user.id;

  // 1. Create a Paid Community
  const { data: paidCommunity, error: err1 } = await supabase
    .from('communities')
    .insert({
      name: 'Paid Alpha Mastermind',
      slug: 'paid-alpha',
      description: 'The most exclusive paid mastermind for high-growth founders.',
      owner_id: userId,
      is_private: false,
      category: 'Business',
      theme_hue: 150, // Greenish
    })
    .select()
    .single();

  if (paidCommunity) {
    // Add a paid tier
    await supabase.from('membership_tiers').insert({
      community_id: paidCommunity.id,
      name: 'Alpha Membership',
      price_month_usd: 97,
      description: 'Exclusive Content · Weekly Calls · Alpha Chat',
    });
    console.log('Created Paid Community:', paidCommunity.name);
  } else {
    console.error('Error creating paid community:', err1);
  }

  // 2. Create a Private Community
  const { data: privateCommunity, error: err2 } = await supabase
    .from('communities')
    .insert({
      name: 'Secret Society',
      slug: 'secret-society',
      description: 'You should not be seeing this in discovery.',
      owner_id: userId,
      is_private: true,
      category: 'Lifestyle',
      theme_hue: 280, // Purple
    })
    .select()
    .single();

  if (privateCommunity) {
    console.log('Created Private Community:', privateCommunity.name);
  } else {
    console.error('Error creating private community:', err2);
  }

  // 3. Create a Free Niche Community
  const { data: freeCommunity } = await supabase
    .from('communities')
    .insert({
      name: 'Tech Enthusiasts',
      slug: 'tech-niche',
      description: 'A free community for tech lovers.',
      owner_id: userId,
      is_private: false,
      category: 'Technology',
      theme_hue: 210, // Blue
    })
    .select()
    .single();

  if (freeCommunity) {
    console.log('Created Free Community:', freeCommunity.name);
  }
}

seed().catch(console.error);
