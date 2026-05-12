'use client';

import React, { useState, useTransition } from 'react';
import { GILD_FONTS } from '@/components/gild';
import { updateLesson, uploadMedia } from '@/app/actions/courses';
import { X, Save, Video, Image as ImageIcon, FileText, Plus, Trash2 } from 'lucide-react';

interface LessonEditorModalProps {
  communityId: string;
  courseId: string;
  lesson: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function LessonEditorModal({ communityId, courseId, lesson, isOpen, onClose, onSaved }: LessonEditorModalProps) {
  const [title, setTitle] = useState(lesson.title);
  const [body, setBody] = useState(lesson.body || '');
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || '');
  const [imageUrl, setImageUrl] = useState(lesson.image_url || '');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>(lesson.attachment_urls || []);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'attachment') {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(type);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadMedia(communityId, formData);
      if (res.ok && res.url) {
        if (type === 'image') setImageUrl(res.url);
        else setAttachmentUrls([...attachmentUrls, res.url]);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(null);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateLesson(lesson.id, {
        title,
        body,
        videoUrl,
        imageUrl,
        attachmentUrls,
      }, communityId, courseId);
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save lesson');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: 800,
        maxHeight: '90vh',
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        animation: 'gild-modal-in 0.3s ease-out'
      }}>
        <header style={{
          padding: '20px 24px',
          borderBottom: '1px solid oklch(0.95 0.005 250)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontFamily: GILD_FONTS.display, fontSize: 20, fontWeight: 800, margin: 0 }}>Edit Lesson</h2>
            <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: 0 }}>Create rich educational content</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'oklch(0.55 0.02 250)' }}>
            <X size={24} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Lesson Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Introduction to Physics"
            />
          </div>

          {/* Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Content / Description</label>
            <textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: GILD_FONTS.sans, lineHeight: 1.6 }}
              placeholder="Write your lesson content here..."
            />
          </div>

          {/* Video */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Video URL (Vimeo, YouTube, or Direct Link)</label>
            <div style={{ position: 'relative' }}>
              <Video size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'oklch(0.55 0.02 250)' }} />
              <input 
                type="text" 
                value={videoUrl} 
                onChange={(e) => setVideoUrl(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 40 }}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Image */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Lesson Banner Image</label>
            <div style={{ 
              width: '100%', 
              aspectRatio: '21/9', 
              borderRadius: 12, 
              background: 'oklch(0.98 0.005 250)', 
              border: '1px dashed oklch(0.90 0.01 250)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {imageUrl ? (
                <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', color: 'oklch(0.55 0.02 250)' }}>
                  <ImageIcon size={24} style={{ marginBottom: 4 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>Upload banner</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileUpload(e, 'image')} 
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
              />
            </div>
          </div>

          {/* Attachments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Supplementary Materials</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attachmentUrls.map((url, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  padding: '8px 12px', 
                  background: 'oklch(0.98 0.005 250)', 
                  borderRadius: 8,
                  border: '1px solid oklch(0.95 0.005 250)'
                }}>
                  <FileText size={16} color="oklch(0.55 0.02 250)" />
                  <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url.split('/').pop()}</span>
                  <button 
                    onClick={() => setAttachmentUrls(attachmentUrls.filter((_, idx) => idx !== i))}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'oklch(0.50 0.16 25)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px',
                borderRadius: 8,
                border: '1px dashed oklch(0.90 0.01 250)',
                color: 'oklch(0.55 0.02 250)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                justifyContent: 'center'
              }}>
                <Plus size={16} /> Add Attachment
                <input type="file" onChange={(e) => handleFileUpload(e, 'attachment')} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        <footer style={{
          padding: '20px 24px',
          borderTop: '1px solid oklch(0.95 0.005 250)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          <button 
            onClick={onClose}
            style={{ 
              padding: '10px 20px', 
              borderRadius: 10, 
              background: 'transparent', 
              border: '1px solid oklch(0.90 0.01 250)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ 
              padding: '10px 24px', 
              borderRadius: 10, 
              background: '#111', 
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: isSaving ? 'default' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {isSaving ? 'Saving...' : <><Save size={18} /> Save Lesson</>}
          </button>
        </footer>
      </div>
      <style>{`
        @keyframes gild-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'oklch(0.40 0.02 250)'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
};
