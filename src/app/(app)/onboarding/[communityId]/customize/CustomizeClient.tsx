'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadCommunityAsset } from '@/app/actions/community';
import { createSpace } from '@/app/actions';
import { GILD_FONTS } from '@/components/gild';

type Props = {
  communityId: string;
  existingLogoUrl?: string | null;
  existingBannerUrl?: string | null;
};

type SpacePreset = 'feed_only' | 'course_hub' | null;

export default function CustomizeClient({
  communityId,
  existingLogoUrl,
  existingBannerUrl,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [logoPreview, setLogoPreview] = useState<string | null>(existingLogoUrl ?? null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(existingBannerUrl ?? null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [preset, setPreset] = useState<SpacePreset>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner',
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (type === 'logo') setLogoError('Please select an image file.');
      else setBannerError('Please select an image file.');
      return;
    }

    const preview = URL.createObjectURL(file);
    if (type === 'logo') {
      setLogoPreview(preview);
      setLogoError(null);
      setLogoUploading(true);
    } else {
      setBannerPreview(preview);
      setBannerError(null);
      setBannerUploading(true);
    }

    const fd = new FormData();
    fd.append('file', file);
    const result = await uploadCommunityAsset(communityId, fd, type);

    if (type === 'logo') {
      setLogoUploading(false);
      if (!result.ok) {
        setLogoError(result.error ?? 'Upload failed.');
        setLogoPreview(existingLogoUrl ?? null);
      }
    } else {
      setBannerUploading(false);
      if (!result.ok) {
        setBannerError(result.error ?? 'Upload failed.');
        setBannerPreview(existingBannerUrl ?? null);
      }
    }
  }

  function handleContinue() {
    startTransition(async () => {
      if (preset === 'feed_only') {
        await createSpace({ communityId, name: 'general', type: 'feed' });
      } else if (preset === 'course_hub') {
        await createSpace({ communityId, name: 'general', type: 'feed' });
        await createSpace({ communityId, name: 'courses', type: 'course' });
      }
      router.push(`/onboarding/${communityId}/spaces`);
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: GILD_FONTS.sans }}>

      {/* Logo upload */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={labelStyle}>Community logo</label>
        <div
          onClick={() => logoInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${logoError ? '#ef4444' : 'oklch(0.88 0.01 250)'}`,
            borderRadius: 12,
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: logoPreview ? 'transparent' : 'oklch(0.985 0.003 250)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            minHeight: 80,
            transition: 'border-color 0.15s',
          }}
        >
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoPreview}
              alt="Logo preview"
              style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)' }}>
              {logoUploading ? 'Uploading…' : 'Click to upload logo (PNG, JPG, SVG)'}
            </span>
          )}
          {logoPreview && (
            <span style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)' }}>
              {logoUploading ? 'Uploading…' : 'Click to change'}
            </span>
          )}
        </div>
        {logoError && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{logoError}</p>}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e, 'logo')}
        />
      </div>

      {/* Banner upload */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={labelStyle}>Banner image</label>
        <div
          onClick={() => bannerInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${bannerError ? '#ef4444' : 'oklch(0.88 0.01 250)'}`,
            borderRadius: 12,
            cursor: 'pointer',
            background: 'oklch(0.985 0.003 250)',
            overflow: 'hidden',
            minHeight: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.15s',
          }}
        >
          {bannerPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerPreview}
              alt="Banner preview"
              style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <span style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)' }}>
              {bannerUploading ? 'Uploading…' : 'Click to upload banner (recommended 1600×400)'}
            </span>
          )}
        </div>
        {bannerError && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{bannerError}</p>}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e, 'banner')}
        />
      </div>

      {/* Space preset */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={labelStyle}>Quick space setup <span style={{ fontWeight: 400, color: 'oklch(0.55 0.02 250)' }}>(optional)</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(preset === p.id ? null : p.id as SpacePreset)}
              style={{
                border: `2px solid ${preset === p.id ? '#111' : 'oklch(0.92 0.01 250)'}`,
                borderRadius: 12,
                padding: '16px 14px',
                textAlign: 'left',
                background: preset === p.id ? 'oklch(0.97 0.005 250)' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>{p.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'oklch(0.50 0.02 250)', lineHeight: 1.4 }}>
                {p.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={isPending || logoUploading || bannerUploading}
        style={{
          display: 'block',
          width: '100%',
          background: isPending ? 'oklch(0.40 0.02 250)' : '#111',
          color: '#fff',
          border: 'none',
          borderRadius: 9,
          padding: '13px 0',
          fontSize: 15,
          fontWeight: 600,
          cursor: isPending ? 'default' : 'pointer',
          marginTop: 4,
        }}
      >
        {isPending ? 'Setting up…' : 'Continue →'}
      </button>

      <p style={{ textAlign: 'center', margin: 0 }}>
        <button
          onClick={() => router.push(`/onboarding/${communityId}/spaces`)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 13,
            color: 'oklch(0.60 0.02 250)',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Skip for now
        </button>
      </p>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#222',
};

const PRESETS = [
  {
    id: 'feed_only',
    icon: '💬',
    label: 'Feed Only',
    description: 'A single discussion feed — perfect for communities built around conversation.',
  },
  {
    id: 'course_hub',
    icon: '🎓',
    label: 'Course Hub',
    description: 'A feed space plus a courses library — ideal for teaching and learning.',
  },
];
