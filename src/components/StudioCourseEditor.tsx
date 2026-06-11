'use client';

import React, { useState, useTransition, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import { GILD_FONTS } from '@/components/gild';
import type { CourseWithModules } from '@/lib/courses';
import { updateCourse, deleteCourse, createModule, updateModule, deleteModule, createLesson, updateLesson, deleteLesson, setModuleTier } from '@/app/actions/courses';
import { uploadMedia } from '@/app/actions/media';
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
  GripVertical,
  ListChecks,
  AlertTriangle,
  X
} from 'lucide-react';
import { LessonEditorModal } from './LessonEditorModal';
import { QuizEditorModal } from './QuizEditorModal';
import { ConfirmDialog } from './ConfirmDialog';

interface EditorTier {
  id: string;
  name: string;
  priceMonthUsd: number;
}

interface StudioCourseEditorProps {
  // UUID drives DB-scoped server actions; slug drives navigation.
  communityId: string;
  communitySlug: string;
  course: CourseWithModules;
  tiers?: EditorTier[];
}

export function StudioCourseEditor({ communityId, communitySlug, course, tiers = [] }: StudioCourseEditorProps) {
  const router = useRouter();
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
            onClick={() => router.push(`/c/${communitySlug}/courses/${course.id}`)}
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
        <CourseSettingsPanel communityId={communityId} communitySlug={communitySlug} course={course} />
      ) : (
        <CurriculumPanel communityId={communityId} communitySlug={communitySlug} course={course} tiers={tiers} onEditLesson={setEditingLesson} />
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

function CourseSettingsPanel({ communityId, communitySlug, course }: StudioCourseEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || '');
  const [imageUrl, setImageUrl] = useState(course.image_url || '');
  const [isPublished, setIsPublished] = useState(course.is_published);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function performDelete() {
    setActionError(null);
    setIsDeleting(true);
    try {
      await deleteCourse(course.id, communityId);
      router.push(`/c/${communitySlug}/courses`);
    } catch {
      setActionError('Could not delete the course. Please try again.');
      setConfirmOpen(false);
      setIsDeleting(false);
    }
  }

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
    } catch {
      setActionError('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setActionError(null);
    setSaveMsg(null);
    try {
      await updateCourse(course.id, communityId, {
        title,
        description,
        imageUrl,
        isPublished
      });
      setSaveMsg('All changes saved.');
    } catch {
      setActionError('Could not save changes. Please try again.');
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

      {saveMsg && (
        <p style={{ margin: '-12px 0 0', fontSize: 13, fontWeight: 600, color: 'oklch(0.50 0.15 150)' }}>{saveMsg}</p>
      )}
      {actionError && (
        <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />
      )}

      {/* Danger zone — destructive, hard-confirmed, visually separated. */}
      <div style={{
        marginTop: 16,
        padding: 20,
        borderRadius: 12,
        border: '1px solid oklch(0.88 0.06 25)',
        background: 'oklch(0.985 0.01 25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'oklch(0.40 0.16 25)' }}>Delete course</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'oklch(0.50 0.06 25)', lineHeight: 1.5 }}>
            Permanently removes this course and all of its modules and lessons.
          </p>
        </div>
        <button
          onClick={() => { setActionError(null); setConfirmOpen(true); }}
          disabled={isDeleting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 10,
            background: 'oklch(0.55 0.20 25)',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: isDeleting ? 'default' : 'pointer',
            opacity: isDeleting ? 0.7 : 1,
            flexShrink: 0,
            fontFamily: 'inherit',
          }}
        >
          <Trash2 size={16} /> {isDeleting ? 'Deleting…' : 'Delete Course'}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete course?"
        message={`This permanently removes "${course.title}" and all of its modules and lessons. This cannot be undone.`}
        confirmLabel="Delete Course"
        busy={isDeleting}
        onConfirm={performDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// ─── Curriculum Panel ─────────────────────────────────────────────────────────

type ModuleT = CourseWithModules['modules'][number];
type LessonT = ModuleT['lessons'][number];

type OptimisticAction =
  | { type: 'addModule'; module: ModuleT }
  | { type: 'deleteModule'; moduleId: string }
  | { type: 'addLesson'; moduleId: string; lesson: LessonT }
  | { type: 'deleteLesson'; moduleId: string; lessonId: string }
  | { type: 'setLessonPublished'; moduleId: string; lessonId: string; isPublished: boolean };

function curriculumReducer(state: ModuleT[], action: OptimisticAction): ModuleT[] {
  switch (action.type) {
    case 'addModule':
      return [...state, action.module];
    case 'deleteModule':
      return state.filter((m) => m.id !== action.moduleId);
    case 'addLesson':
      return state.map((m) =>
        m.id === action.moduleId ? { ...m, lessons: [...m.lessons, action.lesson] } : m,
      );
    case 'deleteLesson':
      return state.map((m) =>
        m.id === action.moduleId
          ? { ...m, lessons: m.lessons.filter((l) => l.id !== action.lessonId) }
          : m,
      );
    case 'setLessonPublished':
      return state.map((m) =>
        m.id === action.moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === action.lessonId ? { ...l, is_published: action.isPublished } : l,
              ),
            }
          : m,
      );
    default:
      return state;
  }
}

function CurriculumPanel({ communityId, course, tiers = [], onEditLesson }: StudioCourseEditorProps & { onEditLesson: (lesson: any) => void }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Pending destructive action awaiting confirmation in the in-app dialog.
  const [confirmTarget, setConfirmTarget] = useState<
    | { kind: 'module'; moduleId: string }
    | { kind: 'lesson'; moduleId: string; lessonId: string }
    | null
  >(null);
  // Optimistic overlay on top of the server-rendered modules. After each
  // server action completes we router.refresh(); the transition stays pending
  // until fresh props arrive, at which point the optimistic state resets to the
  // real data. On failure we surface an inline message and refresh to snap back.
  const [optimisticModules, applyOptimistic] = useOptimistic(course.modules, curriculumReducer);

  function handleAddModule() {
    const tempModule = {
      id: `temp-${crypto.randomUUID()}`,
      title: 'Untitled Module',
      position: optimisticModules.length,
      lessons: [],
    } as unknown as ModuleT;
    startTransition(async () => {
      applyOptimistic({ type: 'addModule', module: tempModule });
      try {
        await createModule({ courseId: course.id, title: 'Untitled Module', position: optimisticModules.length }, communityId);
      } catch {
        setError('Could not add the module. Please try again.');
      }
      router.refresh();
    });
  }

  function performDeleteModule(moduleId: string) {
    startTransition(async () => {
      applyOptimistic({ type: 'deleteModule', moduleId });
      try {
        await deleteModule(moduleId, communityId, course.id);
      } catch {
        setError('Could not delete the module. Please try again.');
      }
      router.refresh();
    });
  }

  function handleAddLesson(moduleId: string, position: number) {
    const tempLesson = {
      id: `temp-${crypto.randomUUID()}`,
      title: 'Untitled Lesson',
      position,
      is_published: false,
      video_url: null,
    } as unknown as LessonT;
    startTransition(async () => {
      applyOptimistic({ type: 'addLesson', moduleId, lesson: tempLesson });
      try {
        await createLesson({ moduleId, title: 'Untitled Lesson', position }, communityId, course.id);
      } catch {
        setError('Could not add the lesson. Please try again.');
      }
      router.refresh();
    });
  }

  function performDeleteLesson(moduleId: string, lessonId: string) {
    startTransition(async () => {
      applyOptimistic({ type: 'deleteLesson', moduleId, lessonId });
      try {
        await deleteLesson(lessonId, communityId, course.id);
      } catch {
        setError('Could not delete the lesson. Please try again.');
      }
      router.refresh();
    });
  }

  function handleTogglePublish(moduleId: string, lessonId: string, next: boolean) {
    startTransition(async () => {
      applyOptimistic({ type: 'setLessonPublished', moduleId, lessonId, isPublished: next });
      try {
        await updateLesson(lessonId, { isPublished: next }, communityId, course.id);
      } catch {
        setError('Could not update lesson visibility. Please try again.');
      }
      router.refresh();
    });
  }

  // Trash buttons request confirmation; the dialog performs the delete.
  function requestDeleteModule(moduleId: string) {
    setError(null);
    setConfirmTarget({ kind: 'module', moduleId });
  }

  function requestDeleteLesson(moduleId: string, lessonId: string) {
    setError(null);
    setConfirmTarget({ kind: 'lesson', moduleId, lessonId });
  }

  function handleConfirmDelete() {
    const target = confirmTarget;
    setConfirmTarget(null);
    if (!target) return;
    if (target.kind === 'module') performDeleteModule(target.moduleId);
    else performDeleteLesson(target.moduleId, target.lessonId);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {optimisticModules.length === 0 ? (
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
            {optimisticModules.map((module) => (
              <ModuleItem
                key={module.id}
                module={module}
                communityId={communityId}
                courseId={course.id}
                onEditLesson={onEditLesson}
                onDeleteModule={requestDeleteModule}
                onAddLesson={handleAddLesson}
                onDeleteLesson={requestDeleteLesson}
                onTogglePublish={handleTogglePublish}
                onError={setError}
                tiers={tiers}
              />
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

      <ConfirmDialog
        open={confirmTarget !== null}
        title={confirmTarget?.kind === 'lesson' ? 'Delete lesson?' : 'Delete module?'}
        message={
          confirmTarget?.kind === 'lesson'
            ? 'This permanently removes the lesson and its content. This cannot be undone.'
            : 'This permanently removes the module and every lesson inside it. This cannot be undone.'
        }
        confirmLabel={confirmTarget?.kind === 'lesson' ? 'Delete Lesson' : 'Delete Module'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

function ModuleItem({ module, communityId, courseId, onEditLesson, onDeleteModule, onAddLesson, onDeleteLesson, onTogglePublish, onError, tiers }: {
  module: ModuleT,
  communityId: string,
  courseId: string,
  onEditLesson: (lesson: any) => void,
  onDeleteModule: (moduleId: string) => void,
  onAddLesson: (moduleId: string, position: number) => void,
  onDeleteLesson: (moduleId: string, lessonId: string) => void,
  onTogglePublish: (moduleId: string, lessonId: string, next: boolean) => void,
  onError: (message: string) => void,
  tiers: EditorTier[],
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [isExpanded, setIsExpanded] = useState(true);
  const [, startTransition] = useTransition();
  // Guards against the rename firing twice when Enter both submits and blurs.
  const savingRef = React.useRef(false);
  // A just-added module isn't in the DB yet — block edits/lesson-adds against
  // its placeholder id until the server round-trip reconciles a real id.
  const isTemp = typeof module.id === 'string' && module.id.startsWith('temp-');

  async function handleUpdateTitle() {
    if (savingRef.current) return;
    if (title === module.title) {
      setIsEditing(false);
      return;
    }
    savingRef.current = true;
    startTransition(async () => {
      try {
        await updateModule(module.id, { title }, communityId, courseId);
        setIsEditing(false);
        router.refresh();
      } catch {
        setTitle(module.title);
        setIsEditing(false);
        onError('Could not rename the module. Please try again.');
      } finally {
        savingRef.current = false;
      }
    });
  }

  function handleAddLesson() {
    onAddLesson(module.id, module.lessons.length);
  }

  function handleTierChange(value: string) {
    const tierId = value === '' ? null : value;
    startTransition(async () => {
      try {
        await setModuleTier(module.id, communityId, courseId, tierId);
        router.refresh();
      } catch {
        onError('Could not update the module tier. Please try again.');
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
        {isEditing && !isTemp ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={{ ...inputStyle, padding: '4px 8px', fontSize: 16, fontWeight: 700 }}
          />
        ) : (
          <h3
            onClick={() => { if (!isTemp) setIsEditing(true); }}
            style={{ fontSize: 16, fontWeight: 700, margin: 0, flex: 1, cursor: isTemp ? 'default' : 'text' }}
          >
            {module.title}
          </h3>
        )}

        {isTemp && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'oklch(0.55 0.02 250)', fontFamily: GILD_FONTS.mono }}>
            Saving…
          </span>
        )}

        {!isTemp && tiers.length > 0 && (
          <select
            value={module.min_tier_id ?? ''}
            onChange={(e) => handleTierChange(e.target.value)}
            title="Require a membership tier to unlock this module"
            style={{
              padding: '5px 8px',
              borderRadius: 8,
              border: '1px solid oklch(0.90 0.01 250)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              color: module.min_tier_id ? 'oklch(0.45 0.14 300)' : 'oklch(0.50 0.02 250)',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="">Free</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                🔒 {t.name} (${t.priceMonthUsd}/mo)
              </option>
            ))}
          </select>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
          {!isTemp && (
            <IconButton onClick={() => onDeleteModule(module.id)} title="Delete Module" danger>
              <Trash2 size={16} />
            </IconButton>
          )}
        </div>
      </header>

      {isExpanded && (
        <div style={{ padding: '8px 0' }}>
          {module.lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              communityId={communityId}
              courseId={courseId}
              onEdit={onEditLesson}
              onDelete={() => onDeleteLesson(module.id, lesson.id)}
              onTogglePublish={(next) => onTogglePublish(module.id, lesson.id, next)}
            />
          ))}
          <button
            onClick={handleAddLesson}
            disabled={isTemp}
            title={isTemp ? 'Saving the module first…' : 'Add a lesson'}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'transparent',
              border: 'none',
              borderTop: module.lessons.length > 0 ? '1px solid oklch(0.97 0.002 250)' : 'none',
              color: isTemp ? 'oklch(0.75 0.01 250)' : 'oklch(0.55 0.02 250)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: isTemp ? 'default' : 'pointer',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} /> {isTemp ? 'Saving module…' : 'Add Lesson'}
          </button>
        </div>
      )}
    </div>
  );
}

function LessonItem({ lesson, communityId, courseId, onEdit, onDelete, onTogglePublish }: { lesson: any, communityId: string, courseId: string, onEdit: (lesson: any) => void, onDelete: () => void, onTogglePublish: (next: boolean) => void }) {
  const router = useRouter();
  const [quizOpen, setQuizOpen] = useState(false);
  // Temp (optimistic) lessons aren't persisted yet, so quiz authoring — which
  // writes against a real lesson id — must wait until the row reconciles.
  const isTemp = typeof lesson.id === 'string' && lesson.id.startsWith('temp-');

  return (
    <div style={{ 
      padding: '12px 20px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: 12,
      borderTop: '1px solid oklch(0.97 0.002 250)',
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

      {/* A just-added lesson isn't persisted yet — its id is a placeholder, so
          editing/publishing/deleting/quizzing it would 500. Show a saving state
          until the server round-trip swaps in the real row. */}
      {isTemp ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: 'oklch(0.55 0.02 250)', fontFamily: GILD_FONTS.mono }}>
          Saving…
        </span>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <IconButton onClick={() => setQuizOpen(true)} title="Manage Quiz">
            <ListChecks size={16} />
          </IconButton>
          <IconButton onClick={() => onTogglePublish(!lesson.is_published)} title={lesson.is_published ? 'Unpublish' : 'Publish'}>
            {lesson.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
          </IconButton>
          <IconButton onClick={() => onEdit(lesson)} title="Edit Lesson">
            <Edit2 size={16} />
          </IconButton>
          <IconButton onClick={onDelete} title="Delete Lesson" danger>
            <Trash2 size={16} />
          </IconButton>
        </div>
      )}

      {quizOpen && (
        <QuizEditorModal
          communityId={communityId}
          courseId={courseId}
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          isOpen={quizOpen}
          onClose={() => setQuizOpen(false)}
          onSaved={() => router.refresh()}
        />
      )}
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

// ─── Inline error banner ──────────────────────────────────────────────────────
// Replaces alert()/console.error for recoverable failures — dismissible, in-flow.

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 16px',
      borderRadius: 12,
      background: 'oklch(0.96 0.03 25)',
      border: '1px solid oklch(0.88 0.06 25)',
      color: 'oklch(0.40 0.16 25)',
      fontSize: 13,
      fontWeight: 600,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={16} /> {message}
      </span>
      <button
        onClick={onDismiss}
        title="Dismiss"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
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
