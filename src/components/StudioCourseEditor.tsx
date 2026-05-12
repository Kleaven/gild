'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GILD_FONTS } from '@/components/gild';
import type { CourseWithModules } from '@/lib/courses';
import { updateCourse, createModule, updateModule, deleteModule, createLesson, updateLesson, deleteLesson } from '@/app/actions/courses';
import { uploadMedia } from '@/app/actions';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Save,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react';
import { LessonEditorModal } from './LessonEditorModal';

interface StudioCourseEditorProps {
  communityId: string;
  course: CourseWithModules;
}

export function StudioCourseEditor({ communityId, course }: StudioCourseEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'settings' | 'curriculum'>('curriculum');
  const [editingLesson, setEditingLesson] = useState<any>(null);

  const handleLessonSaved = () => {
    router.refresh();
  };

  return (
    <div style={{ fontFamily: GILD_FONTS.sans, color: '#111', maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: GILD_FONTS.display, fontSize: 32, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
              Manage Course
            </h1>
            <p style={{ color: 'oklch(0.55 0.02 250)', fontSize: 14, margin: 0 }}>
              Edit your course structure and settings
            </p>
          </div>
          <button
            onClick={() => router.push(`/c/${communityId}/courses/${course.id}`)}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid oklch(0.90 0.01 250)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Eye size={16} /> View Course
          </button>
        </div>

        <nav style={{ display: 'flex', gap: 24, borderBottom: '1px solid oklch(0.95 0.005 250)' }}>
          <TabButton active={activeTab === 'curriculum'} onClick={() => setActiveTab('curriculum')}>
            Curriculum
          </TabButton>
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            Settings
          </TabButton>
        </nav>
      </header>

      {activeTab === 'settings' ? (
        <CourseSettingsPanel communityId={communityId} course={course} />
      ) : (
        <CurriculumPanel communityId={communityId} course={course} onEditLesson={setEditingLesson} />
      )}

      {editingLesson && (
        <LessonEditorModal
          communityId={communityId}
          courseId={course.id}
          lesson={editingLesson}
          isOpen={!!editingLesson}
          onClose={() => setEditingLesson(null)}
          onSaved={handleLessonSaved}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid #111' : '2px solid transparent',
        color: active ? '#111' : 'oklch(0.55 0.02 250)',
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        marginBottom: -1,
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </button>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function CourseSettingsPanel({ communityId, course }: StudioCourseEditorProps) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || '');
  const [imageUrl, setImageUrl] = useState(course.image_url || '');
  const [isPublished, setIsPublished] = useState(course.is_published);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadMedia(communityId, formData);
      if (res.ok && res.url) {
        setImageUrl(res.url);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateCourse(course.id, communityId, {
        title,
        description,
        imageUrl,
        isPublished
      });
      alert('Course saved!');
    } catch (err) {
      console.error('Failed to save course', err);
      alert('Failed to save course');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 640 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'oklch(0.40 0.02 250)' }}>Course Thumbnail</label>
        <div style={{ 
          width: '100%', 
          aspectRatio: '16/9', 
          borderRadius: 16, 
          background: 'oklch(0.98 0.005 250)', 
          border: '1px dashed oklch(0.90 0.01 250)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer'
        }}>
          {imageUrl ? (
            <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', color: 'oklch(0.55 0.02 250)' }}>
              <ImageIcon size={32} strokeWidth={1.5} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, margin: 0 }}>Click to upload thumbnail</p>
            </div>
          )}
          {isUploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Uploading...</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'oklch(0.40 0.02 250)' }}>Course Title</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter course title"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'oklch(0.40 0.02 250)' }}>Description</label>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What will students learn?"
          rows={5}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderRadius: 12, background: 'oklch(0.98 0.005 250)', border: '1px solid oklch(0.95 0.005 250)' }}>
        <button
          onClick={() => setIsPublished(!isPublished)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: isPublished ? '#111' : 'oklch(0.90 0.01 250)',
            border: 'none',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: isPublished ? 23 : 3,
            transition: 'all 0.2s ease'
          }} />
        </button>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Public Course</p>
          <p style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)', margin: 0 }}>When off, only admins can see this course</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          marginTop: 8,
          padding: '12px 24px',
          borderRadius: 12,
          background: '#111',
          color: '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 700,
          cursor: isSaving ? 'default' : 'pointer',
          opacity: isSaving ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
      </button>
    </div>
  );
}

// ─── Curriculum Panel ─────────────────────────────────────────────────────────

function CurriculumPanel({ communityId, course, onEditLesson }: StudioCourseEditorProps & { onEditLesson: (lesson: any) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleAddModule() {
    startTransition(async () => {
      try {
        await createModule({
          courseId: course.id,
          title: 'Untitled Module',
          position: course.modules.length
        }, communityId);
        router.refresh();
      } catch (err) {
        console.error('Failed to create module', err);
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {course.modules.length === 0 ? (
        <div style={{ 
          padding: '60px 20px', 
          textAlign: 'center', 
          border: '2px dashed oklch(0.92 0.01 250)', 
          borderRadius: 16,
          background: 'oklch(0.99 0.002 250)'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Your curriculum is empty</h3>
          <p style={{ color: 'oklch(0.55 0.02 250)', fontSize: 14, margin: '0 0 24px' }}>
            Start by adding your first module.
          </p>
          <button 
            onClick={handleAddModule}
            style={primaryBtnStyle}
          >
            <Plus size={18} /> Add Module
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {course.modules.map((module, idx) => (
              <ModuleItem key={module.id} module={module} communityId={communityId} courseId={course.id} onEditLesson={onEditLesson} />
            ))}
          </div>
          <button 
            onClick={handleAddModule}
            style={{ ...primaryBtnStyle, alignSelf: 'flex-start', background: 'transparent', border: '1px solid oklch(0.90 0.01 250)', color: '#111' }}
          >
            <Plus size={18} /> Add Module
          </button>
        </>
      )}
    </div>
  );
}

function ModuleItem({ module, communityId, courseId, onEditLesson }: { module: CourseWithModules['modules'][0], communityId: string, courseId: string, onEditLesson: (lesson: any) => void }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function handleUpdateTitle() {
    if (title === module.title) {
      setIsEditing(false);
      return;
    }
    startTransition(async () => {
      try {
        await updateModule(module.id, { title }, communityId, courseId);
        setIsEditing(false);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  async function handleDelete() {
    if (!confirm('Are you sure? All lessons in this module will be deleted.')) return;
    startTransition(async () => {
      try {
        await deleteModule(module.id, communityId, courseId);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  async function handleAddLesson() {
    startTransition(async () => {
      try {
        await createLesson({
          moduleId: module.id,
          title: 'Untitled Lesson',
          position: module.lessons.length
        }, communityId, courseId);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <div style={{ border: '1px solid oklch(0.92 0.01 250)', borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
      <header style={{ 
        padding: '16px 20px', 
        background: 'oklch(0.99 0.002 250)', 
        borderBottom: isExpanded ? '1px solid oklch(0.95 0.005 250)' : 'none',
        display: 'flex', 
        alignItems: 'center', 
        gap: 12 
      }}>
        <GripVertical size={16} color="oklch(0.80 0.01 250)" style={{ cursor: 'grab' }} />
        {isEditing ? (
          <input 
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
            style={{ ...inputStyle, padding: '4px 8px', fontSize: 16, fontWeight: 700 }}
          />
        ) : (
          <h3 
            onClick={() => setIsEditing(true)}
            style={{ fontSize: 16, fontWeight: 700, margin: 0, flex: 1, cursor: 'text' }}
          >
            {module.title}
          </h3>
        )}
        
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
          <IconButton onClick={handleDelete} title="Delete Module" danger>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </header>

      {isExpanded && (
        <div style={{ padding: '8px 0' }}>
          {module.lessons.map((lesson, idx) => (
            <LessonItem key={lesson.id} lesson={lesson} communityId={communityId} courseId={courseId} onEdit={onEditLesson} />
          ))}
          <button
            onClick={handleAddLesson}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'transparent',
              border: 'none',
              borderTop: module.lessons.length > 0 ? '1px solid oklch(0.97 0.002 250)' : 'none',
              color: 'oklch(0.55 0.02 250)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} /> Add Lesson
          </button>
        </div>
      )}
    </div>
  );
}

function LessonItem({ lesson, communityId, courseId, onEdit }: { lesson: any, communityId: string, courseId: string, onEdit: (lesson: any) => void }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    if (!confirm('Delete this lesson?')) return;
    startTransition(async () => {
      try {
        await deleteLesson(lesson.id, communityId, courseId);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  async function togglePublish() {
    startTransition(async () => {
      try {
        await updateLesson(lesson.id, { isPublished: !lesson.is_published }, communityId, courseId);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <div style={{ 
      padding: '12px 20px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: 12,
      borderTop: '1px solid oklch(0.97 0.002 250)',
      group: 'lesson'
    }}>
      <div style={{ 
        width: 32, 
        height: 32, 
        borderRadius: 8, 
        background: 'oklch(0.96 0.005 250)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'oklch(0.55 0.02 250)'
      }}>
        {lesson.video_url ? <Video size={14} /> : <FileText size={14} />}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{lesson.title}</span>
          {!lesson.is_published && (
            <span style={{ 
              fontSize: 10, 
              fontWeight: 700, 
              color: 'oklch(0.55 0.02 250)', 
              background: 'oklch(0.95 0.01 250)', 
              padding: '2px 6px', 
              borderRadius: 4,
              fontFamily: GILD_FONTS.mono
            }}>DRAFT</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <IconButton onClick={togglePublish} title={lesson.is_published ? 'Unpublish' : 'Publish'}>
          {lesson.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
        </IconButton>
        <IconButton onClick={() => onEdit(lesson)} title="Edit Lesson">
          <Edit2 size={16} />
        </IconButton>
        <IconButton onClick={handleDelete} title="Delete Lesson" danger>
          <Trash2 size={16} />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({ children, onClick, title, danger = false }: { children: React.ReactNode, onClick: () => void, title?: string, danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'transparent',
        border: 'none',
        color: danger ? 'oklch(0.50 0.16 25)' : 'oklch(0.55 0.02 250)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = danger ? 'oklch(0.98 0.01 25)' : 'oklch(0.95 0.01 250)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 12,
  background: '#111',
  color: '#fff',
  border: 'none',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  transition: 'all 0.2s ease'
};
