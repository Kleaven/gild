'use client';

import { useState, useTransition } from 'react';
import { updateCommunity, deleteCommunity, uploadCommunityAsset } from '@/app/actions';
import { GILD_FONTS } from '@/components/gild';
import { Camera, Image as ImageIcon, Palette, ShieldAlert } from 'lucide-react';
import { RolePermissionsEditor } from '@/components/gild';

interface Props {
  community: {
    id: string;
    name: string;
    description: string | null;
    theme_hue: number;
    logo_url: string | null;
    banner_url: string | null;
    is_private: boolean;
    category: string | null;
    welcome_message: string | null;
    goodbye_message: string | null;
    role_permissions: any;
  };
}

const NICHES = [
  'Business', 'Technology', 'Health & Fitness', 'Arts & Design',
  'Lifestyle', 'Education', 'Marketing', 'Real Estate',
  'Crypto & Web3', 'AI & Machine Learning', 'Gaming', 'Personal Development'
];

export default function CommunitySettings({ community }: Props) {
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

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateCommunity(community.id, { 
          name, 
          description, 
          theme_hue: themeHue,
          is_private: isPrivate,
          category: category || undefined,
          welcome_message: welcomeMessage || undefined,
          goodbye_message: goodbyeMessage || undefined,
          role_permissions: rolePermissions,
        });
      } catch (err) {
        console.error('Failed to update community', err);
      }
    });
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
            </div>
          </div>

          {/* Theme Color */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 12 }}>
              <Palette size={16} />
              Theme Color (Hue)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range"
                min="0"
                max="360"
                value={themeHue}
                onChange={(e) => setThemeHue(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: `oklch(0.55 0.15 ${themeHue})` }}
              />
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `oklch(0.55 0.15 ${themeHue})`,
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px oklch(0.90 0.01 250)',
              }} />
            </div>
          </div>
        </div>
      </section>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Governance & Permissions</h2>
            <span style={{ fontSize: 10, background: 'oklch(0.94 0.01 250)', color: 'oklch(0.40 0.15 250)', padding: '2px 8px', borderRadius: 999, fontWeight: 800 }}>SOTA CONTROLS</span>
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
      </form>

      <section style={{ borderTop: '1px solid oklch(0.90 0.01 250)', paddingTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'oklch(0.40 0.15 25)', marginBottom: 12 }}>Danger Zone</h2>
        <p style={{ fontSize: 14, color: 'oklch(0.40 0.02 250)', marginBottom: 20 }}>
          Permanently delete this community. This action cannot be undone and will remove all spaces, posts, and memberships.
        </p>
        <button
          onClick={() => {
            if (!confirm(`Are you sure you want to delete ${community.name}? This cannot be undone.`)) return;
            startTransition(async () => {
              try {
                await deleteCommunity(community.id);
              } catch (err) {
                console.error('Failed to delete community', err);
              }
            });
          }}
          disabled={isPending}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'oklch(0.96 0.02 25)',
            color: 'oklch(0.45 0.15 25)',
            border: '1px solid oklch(0.85 0.05 25)',
            fontSize: 14,
            fontWeight: 600,
            cursor: isPending ? 'default' : 'pointer',
            opacity: isPending ? 0.7 : 1,
            fontFamily: 'inherit',
          }}
        >
          Delete Community
        </button>
      </section>
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
