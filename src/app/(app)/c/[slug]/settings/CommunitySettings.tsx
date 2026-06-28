'use client';

import { useState, useTransition } from 'react';
import { updateCommunity, deleteCommunity, uploadCommunityAsset } from '@/app/actions';
import { GILD_FONTS, DeleteCommunityModal } from '@/components/gild';
import { Camera, Image as ImageIcon, Palette } from 'lucide-react';
import { RolePermissionsEditor } from '@/components/gild';
import CustomDomainCard from './CustomDomainCard';

interface Props {
  community: {
    id: string;
    name: string;
    description: string | null;
    theme_hue: number | null;
    logo_url: string | null;
    banner_url: string | null;
    is_private: boolean;
    category: string | null;
    welcome_message: string | null;
    goodbye_message: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON permissions blob (DB Json column)
    role_permissions: any;
    pricing_type?: string | null;
    price_amount?: number | null;
    pricing_period?: string | null;
  };
  customDomain?: {
    isPro: boolean;
    slug: string;
    initialDomain: string | null;
    initialStatus: 'pending' | 'active' | 'error' | null;
    initialDns: { type: 'A' | 'CNAME'; name: string; value: string } | null;
  } | null;
}

const NICHES = [
  'Business', 'Technology', 'Health & Fitness', 'Arts & Design',
  'Lifestyle', 'Education', 'Marketing', 'Real Estate',
  'Crypto & Web3', 'AI & Machine Learning', 'Gaming', 'Personal Development'
];

export default function CommunitySettings({ community, customDomain }: Props) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || '');
  const [themeHue, setThemeHue] = useState(community.theme_hue || 250);
  const [isPrivate, setIsPrivate] = useState(community.is_private);
  const [category, setCategory] = useState(community.category || '');
  const [welcomeMessage, setWelcomeMessage] = useState(community.welcome_message || '');
  const [goodbyeMessage, setGoodbyeMessage] = useState(community.goodbye_message || '');
  const [rolePermissions, setRolePermissions] = useState(community.role_permissions || {
    member: { can_post: true, can_comment: true, can_react: true, can_invite: true },
    admin: { can_post: true, can_comment: true, can_react: true, can_invite: true, manage_members: true, manage_spaces: true }
  });
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState<'logo' | 'banner' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(false);
    startTransition(async () => {
      try {
        const result = await updateCommunity(community.id, {
          name,
          description,
          theme_hue: themeHue,
          is_private: isPrivate,
          category: category || undefined,
          welcome_message: welcomeMessage || undefined,
          goodbye_message: goodbyeMessage || undefined,
          role_permissions: rolePermissions,
        });
        if (!result.ok) {
          setUpdateError(result.message);
          return;
        }
        setUpdateSuccess(true);
        // Auto-clear the success banner after 3s so it doesn't linger.
        setTimeout(() => setUpdateSuccess(false), 3000);
      } catch (err) {
        setUpdateError(err instanceof Error ? err.message : 'Failed to update community');
      }
    });
  }

  async function handleRemoveAsset(type: 'logo' | 'banner') {
    setUpdateError(null);
    const result = await updateCommunity(community.id, type === 'logo' ? { logo_url: null } : { banner_url: null });
    if (!result.ok) {
      setUpdateError(result.message);
      return;
    }
    window.location.reload();
  }

  async function handleAssetUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(type);
    const formData = new FormData();
    formData.append('file', file);
    
    await uploadCommunityAsset(community.id, formData, type);
    setIsUploading(null);
    window.location.reload();
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px', fontFamily: GILD_FONTS.sans }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: GILD_FONTS.display, fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Community Settings
        </h1>
      </div>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Branding</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Logo & Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 12 }}>
                Logo
              </label>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 16,
                  background: `oklch(0.96 0.01 ${themeHue})`,
                  border: '1px solid oklch(0.90 0.01 250)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {community.logo_url ? (
                    <img src={community.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 24, fontWeight: 800, color: `oklch(0.40 0.15 ${themeHue})` }}>{name[0]}</span>
                  )}
                </div>
                <label style={uploadIconStyle}>
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={(e) => handleAssetUpload(e, 'logo')} hidden disabled={!!isUploading} />
                </label>
              </div>
              {community.logo_url ? (
                <button type="button" onClick={() => handleRemoveAsset('logo')} style={removeAssetStyle}>
                  Remove image — use accent color
                </button>
              ) : (
                <p style={{ fontSize: 11.5, color: 'oklch(0.55 0.02 250)', margin: '8px 0 0' }}>
                  No image — your initial on the accent color.
                </p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 12 }}>
                Banner
              </label>
              <div style={{ position: 'relative', width: '100%', height: 80 }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 16,
                  background: community.banner_url ? `url(${community.banner_url}) center/cover` : `linear-gradient(135deg, oklch(0.40 0.15 ${themeHue}), oklch(0.60 0.15 ${themeHue}))`,
                  border: '1px solid oklch(0.90 0.01 250)',
                }} />
                <label style={uploadIconStyle}>
                  <ImageIcon size={14} />
                  <input type="file" accept="image/*" onChange={(e) => handleAssetUpload(e, 'banner')} hidden disabled={!!isUploading} />
                </label>
              </div>
              {community.banner_url ? (
                <button type="button" onClick={() => handleRemoveAsset('banner')} style={removeAssetStyle}>
                  Remove image — use accent gradient
                </button>
              ) : (
                <p style={{ fontSize: 11.5, color: 'oklch(0.55 0.02 250)', margin: '8px 0 0' }}>
                  No image — a gradient from your accent color.
                </p>
              )}
            </div>
          </div>

          {/* Accent color — hue drives highlights/badges/space dots everywhere,
              and the icon/banner ONLY when no image is uploaded. */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 6 }}>
              <Palette size={16} />
              Accent color
            </label>
            <p style={{ fontSize: 12, color: 'oklch(0.52 0.02 250)', margin: '0 0 12px', lineHeight: 1.5 }}>
              Colors highlights, badges, and space dots across your community
              {community.logo_url || community.banner_url
                ? ' — your uploaded images stay as-is.'
                : ' — and your icon and banner while no images are uploaded.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range"
                min="0"
                max="360"
                value={themeHue}
                onChange={(e) => setThemeHue(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: `oklch(0.55 0.15 ${themeHue})` }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: `oklch(0.96 0.02 ${themeHue})`, color: `oklch(0.40 0.14 ${themeHue})`,
                }}>badge</span>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: `oklch(0.62 0.16 ${themeHue})` }} />
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `oklch(0.55 0.15 ${themeHue})`,
                  border: '2px solid #fff', boxShadow: '0 0 0 1px oklch(0.90 0.01 250)',
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {customDomain && (
        <CustomDomainCard
          communityId={community.id}
          slug={customDomain.slug}
          isPro={customDomain.isPro}
          themeHue={themeHue}
          initialDomain={customDomain.initialDomain}
          initialStatus={customDomain.initialStatus}
          initialDns={customDomain.initialDns}
        />
      )}

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40, borderTop: '1px solid oklch(0.90 0.01 250)', paddingTop: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Basic Info</h2>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 8 }}>
            Community Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 8 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 8 }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="" disabled>Select a niche</option>
              {NICHES.map(niche => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 8 }}>
              Privacy
            </label>
            <select
              value={isPrivate ? 'private' : 'public'}
              onChange={(e) => setIsPrivate(e.target.value === 'private')}
              style={inputStyle}
            >
              <option value="public">Public (Discoverable)</option>
              <option value="private">Private (Invite Only)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 8 }}>
            Welcome Message
          </label>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            rows={3}
            placeholder="Shown to new members immediately after joining..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 8 }}>
            Goodbye Message
          </label>
          <textarea
            value={goodbyeMessage}
            onChange={(e) => setGoodbyeMessage(e.target.value)}
            rows={2}
            placeholder="Shown when a member clicks 'Leave Community'..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <section style={{ marginTop: 24, borderTop: '1px solid oklch(0.90 0.01 250)', paddingTop: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Pricing & payouts</h2>
          <p style={{ fontSize: 13, color: 'oklch(0.52 0.02 250)', margin: 0, lineHeight: 1.6 }}>
            Everything money lives in one place now — entry pricing, membership tiers, and your
            Stripe payout account are all under <strong>Monetization</strong> in the sidebar.
          </p>
        </section>

        <section style={{ marginTop: 24, borderTop: '1px solid oklch(0.90 0.01 250)', paddingTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Governance & Permissions</h2>
          </div>

          <RolePermissionsEditor 
            role="member" 
            permissions={rolePermissions.member} 
            onChange={(p) => setRolePermissions({ ...rolePermissions, member: p })} 
          />
          
          <RolePermissionsEditor 
            role="admin" 
            permissions={rolePermissions.admin} 
            onChange={(p) => setRolePermissions({ ...rolePermissions, admin: p })} 
          />
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: `oklch(0.20 0.02 ${themeHue})`,
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: (isPending || !name.trim()) ? 'default' : 'pointer',
              opacity: (isPending || !name.trim()) ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {updateSuccess && (
          <p
            role="status"
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'oklch(0.96 0.05 150)',
              border: '1px solid oklch(0.85 0.10 150)',
              borderRadius: 8,
              color: 'oklch(0.36 0.14 150)',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            Settings saved.
          </p>
        )}

        {updateError && (
          <p
            role="alert"
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'oklch(0.96 0.04 25)',
              border: '1px solid oklch(0.88 0.08 25)',
              borderRadius: 8,
              color: 'oklch(0.40 0.16 25)',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            {updateError}
          </p>
        )}
      </form>

      <section style={{ borderTop: '1px solid oklch(0.90 0.01 250)', paddingTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'oklch(0.40 0.15 25)', marginBottom: 12 }}>Danger Zone</h2>
        <p style={{ fontSize: 14, color: 'oklch(0.40 0.02 250)', marginBottom: 20 }}>
          Permanently delete this community. This action cannot be undone and
          will remove all spaces, posts, and memberships. Only the community
          owner can perform this action.
        </p>
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
          disabled={isDeleting}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'oklch(0.96 0.02 25)',
            color: 'oklch(0.45 0.15 25)',
            border: '1px solid oklch(0.85 0.05 25)',
            fontSize: 14,
            fontWeight: 600,
            cursor: isDeleting ? 'default' : 'pointer',
            opacity: isDeleting ? 0.7 : 1,
            fontFamily: 'inherit',
          }}
        >
          Delete Community
        </button>
      </section>

      <DeleteCommunityModal
        expectedName={community.name}
        isOpen={showDeleteModal}
        isPending={isDeleting}
        error={deleteError}
        onClose={() => {
          if (isDeleting) return; // never close mid-flight
          setShowDeleteModal(false);
          setDeleteError(null);
        }}
        onConfirm={() => {
          setDeleteError(null);
          setIsDeleting(true);
          // Use a manual async block instead of startTransition so we can
          // hard-redirect on success — once deleted, the current /c/<slug>
          // route returns notFound() (the layout calls it when
          // getCommunityContextBySlug returns null), so we navigate the
          // user to / before that can happen.
          (async () => {
            try {
              const result = await deleteCommunity(community.id);
              if (!result.ok) {
                setDeleteError(result.message);
                setIsDeleting(false);
                return;
              }
              // Success — leave the now-deleted route immediately.
              //
              // CRITICAL: use a hard navigation (window.location), NOT
              // router.push + router.refresh. router.refresh() triggers a
              // Server Component re-render that does NOT pass through
              // middleware. @supabase/ssr's getSupabaseServerClient
              // intentionally silences cookie-write failures inside Server
              // Components (writes are forbidden by Next outside Server
              // Actions / Route Handlers / Middleware). If the access
              // token is near expiry when the home-page Server Component
              // runs, Supabase rotates the refresh token server-side, our
              // setAll() silently fails to persist the new cookies, and
              // the next real request submits an already-rotated refresh
              // token → 401 → supabase-ssr clears the cookie → the user
              // is unexpectedly signed out a few seconds after delete.
              //
              // Hard navigation forces a fresh request through middleware
              // (where setAll DOES persist), so the token rotation
              // completes cleanly and the session survives.
              //
              // We also route to /communities (Discover) so the user
              // lands on a populated, browsable surface — joining an
              // existing community is the natural next step, and the
              // page itself surfaces a CTA to /communities/new for
              // users who'd rather start fresh.
              window.location.assign('/communities');
            } catch (err) {
              setDeleteError(
                err instanceof Error
                  ? err.message
                  : 'Unexpected error — the community was not deleted.',
              );
              setIsDeleting(false);
            }
          })();
        }}
      />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const uploadIconStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: -2,
  right: -2,
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: 'oklch(0.20 0.02 250)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: '3px solid #fff',
  boxShadow: '0 2px 8px oklch(0 0 0 / 0.15)',
};

const removeAssetStyle: React.CSSProperties = {
  marginTop: 8,
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontSize: 11.5,
  fontWeight: 600,
  color: 'oklch(0.45 0.16 25)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
