'use client';

import { useState, forwardRef } from 'react';
import { GILD_FONTS } from '@/components/gild';
import { uploadMedia } from '@/app/actions';

type Props = {
  communityId: string;
  spaceId: string;
  hue?: number;
  /** Called with (title, body, mediaUrls) when user submits. Caller owns the server action. */
  onSubmit: (title: string, body: string, mediaUrls?: string[]) => Promise<void>;
  /** Error injected from parent (e.g. after optimistic rollback). */
  externalError?: string | null;
  onClearError?: () => void;
};

const PostForm = forwardRef<HTMLFormElement, Props>(({ communityId, hue = 250, onSubmit, externalError, onClearError }, ref) => {
  const [activeTab, setActiveTab] = useState<'post' | 'poll'>('post');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);


  const error = externalError ?? localError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLocalError(null);
    onClearError?.();
    setIsPending(true);
    try {
      const isPoll = activeTab === 'poll';
      await onSubmit(
        title, 
        body, 
        isPoll ? undefined : (attachments.length > 0 ? attachments : undefined),
        isPoll ? 'poll' : 'post',
        isPoll ? pollOptions.filter(o => !!o.trim()).map((o, i) => ({ id: `opt-${i}`, text: o })) : undefined
      );
      setTitle('');
      setBody('');
      setAttachments([]);
      setPollOptions(['', '']);
      setActiveTab('post');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsPending(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setLocalError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadMedia(communityId, formData);
      if (res.ok && res.url) {
        setAttachments([...attachments, res.url]);
      } else {
        setLocalError(res.error || 'Upload failed');
      }
    } catch (err) {
      setLocalError('Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      ref={ref}
      onSubmit={handleSubmit}
      style={{
        background: '#fff',
        border: '1px solid oklch(0.94 0.005 250)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', gap: 16, marginBottom: 4, borderBottom: '1px solid oklch(0.98 0.005 250)' }}>
        <button 
          type="button" 
          onClick={() => setActiveTab('post')} 
          style={{ 
            padding: '8px 4px', 
            fontSize: 13, 
            fontWeight: 700, 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'post' ? `oklch(0.45 0.16 ${hue})` : '#888',
            borderBottom: activeTab === 'post' ? `2px solid oklch(0.45 0.16 ${hue})` : 'none',
            cursor: 'pointer'
          }}
        >Post</button>
        <button 
          type="button" 
          onClick={() => setActiveTab('poll')} 
          style={{ 
            padding: '8px 4px', 
            fontSize: 13, 
            fontWeight: 700, 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'poll' ? `oklch(0.45 0.16 ${hue})` : '#888',
            borderBottom: activeTab === 'poll' ? `2px solid oklch(0.45 0.16 ${hue})` : 'none',
            cursor: 'pointer'
          }}
        >Poll</button>
      </div>

      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={300}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          fontSize: 15,
          fontWeight: 600,
          fontFamily: GILD_FONTS.display,
          letterSpacing: '-0.01em',
          background: 'transparent',
        }}
      />
      <textarea
        placeholder="Write a new post…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={3}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          fontSize: 14,
          color: '#202020',
          resize: 'vertical',
          fontFamily: GILD_FONTS.sans,
          background: 'transparent',
          minHeight: 60,
        }}
      />
      
      {activeTab === 'poll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Poll Options</p>
          {pollOptions.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                value={opt} 
                onChange={(e) => {
                  const newOpts = [...pollOptions];
                  newOpts[i] = e.target.value;
                  setPollOptions(newOpts);
                }}
                placeholder={`Option ${i + 1}`}
                style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
              />
              {pollOptions.length > 2 && (
                <button 
                  type="button" 
                  onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >×</button>
              )}
            </div>
          ))}
          {pollOptions.length < 10 && (
            <button 
              type="button" 
              onClick={() => setPollOptions([...pollOptions, ''])}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: `oklch(0.45 0.16 ${hue})`, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}
            >+ Add Option</button>
          )}
        </div>
      )}
      
      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {attachments.map((url, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
              <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              <button
                type="button"
                onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, background: '#111', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ color: '#c00', fontSize: 13, margin: 0 }}>{error}</p>}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid oklch(0.96 0.005 250)', paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ cursor: 'pointer', color: 'oklch(0.40 0.02 250)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isUploading} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            {isUploading ? 'Uploading...' : 'Image'}
          </label>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="gild-btn"
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            background: `oklch(0.45 0.16 ${hue})`,
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: isPending ? 'default' : 'pointer',
            opacity: isPending ? 0.7 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'oklch(0.99 0.002 250)',
};

PostForm.displayName = 'PostForm';

export default PostForm;
