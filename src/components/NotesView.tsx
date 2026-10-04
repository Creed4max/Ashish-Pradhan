import React, { useState } from 'react';
import { Subject, Note, StudentUser } from '../types';
import {
  BookOpen,
  Plus,
  Search,
  Pin,
  Tag,
  Copy,
  Check,
  Download,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  FileText,
  Eye,
  Code,
  LayoutGrid,
  Columns,
  X,
  Clock,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Maximize2,
} from 'lucide-react';

interface NotesViewProps {
  notes: Note[];
  subjects: Subject[];
  currentUser?: StudentUser | null;
  isReadOnly?: boolean;
  onAddNote: (note: Partial<Note>) => void;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  onAddSubject: (subject: Subject) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  subjects,
  currentUser,
  isReadOnly,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddSubject,
}) => {
  const readOnly = isReadOnly !== undefined ? isReadOnly : currentUser?.role === 'student';
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // View presentation mode: 'grid' (card grid with quick preview) or 'split' (side-by-side)
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');

  // Quick Preview modal target note
  const [quickPreviewNote, setQuickPreviewNote] = useState<Note | null>(null);

  // Active Note being viewed/edited in panel
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit/Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || '');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);

  // Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubInstructor, setNewSubInstructor] = useState('');
  const [newSubColor, setNewSubColor] = useState('#4f46e5');
  const [newSubCredits, setNewSubCredits] = useState(4);
  const [newSubRoom, setNewSubRoom] = useState('Hall A');

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (selectedSubjectId !== 'all' && n.subjectId !== selectedSubjectId) return false;
    if (activeTag && !n.tags.includes(activeTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchTags = n.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }
    return true;
  });

  // Sort pinned notes first, then latest updated
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Extract all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  // Selected active note in split view
  const currentNote = notes.find((n) => n.id === activeNoteId) || sortedNotes[0] || null;

  // Helper to extract clean content snippet
  const getNoteSnippet = (content: string, maxLen = 160) => {
    const plain = content
      .replace(/^#+\s+/gm, '') // strip markdown headings
      .replace(/```[\s\S]*?```/g, ' [Code Block] ') // condense code blocks
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/^>\s+/gm, '') // blockquotes
      .replace(/^[-*+]\s+/gm, '') // lists
      .replace(/\s+/g, ' ')
      .trim();

    if (plain.length <= maxLen) return plain;
    return plain.slice(0, maxLen).trim() + '…';
  };

  // Helper for word count and reading time
  const getNoteStats = (content: string) => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return {
      words,
      readingTime: `${minutes} min read`,
      chars: content.length,
      lines: content.split('\n').length,
    };
  };

  const handleStartCreateNote = () => {
    if (readOnly) return;
    setFormTitle('');
    setFormSubjectId(selectedSubjectId !== 'all' ? selectedSubjectId : subjects[0]?.id || '');
    setFormContent(
      '# Lecture Notes\n\n## 1. Key Concepts\n- Concept A: explanation\n- Concept B: key formula\n\n```python\n# Implementation snippet\ndef example():\n    return True\n```\n\n## 2. Summary & Exam Tips\n- Review before quiz'
    );
    setFormTags('notes, revision');
    setFormIsPinned(false);
    setActiveNoteId(null);
    setQuickPreviewNote(null);
    setIsEditing(true);
    setViewMode('split');
  };

  const handleStartEditNote = (note: Note) => {
    if (readOnly) return;
    setFormTitle(note.title);
    setFormSubjectId(note.subjectId);
    setFormContent(note.content);
    setFormTags(note.tags.join(', '));
    setFormIsPinned(note.isPinned);
    setActiveNoteId(note.id);
    setQuickPreviewNote(null);
    setIsEditing(true);
    setViewMode('split');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!formTitle.trim()) return;

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (activeNoteId) {
      onUpdateNote(activeNoteId, {
        title: formTitle.trim(),
        subjectId: formSubjectId,
        content: formContent,
        tags: parsedTags,
        isPinned: formIsPinned,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
    } else {
      const newId = `note-${Date.now()}`;
      onAddNote({
        id: newId,
        title: formTitle.trim(),
        subjectId: formSubjectId,
        content: formContent,
        tags: parsedTags,
        isPinned: formIsPinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setActiveNoteId(newId);
      setIsEditing(false);
    }
  };

  const handleCopy = (note: Note) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (note: Note) => {
    const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!newSubName.trim() || !newSubCode.trim()) return;

    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name: newSubName.trim(),
      code: newSubCode.trim().toUpperCase(),
      instructor: newSubInstructor.trim() || 'Staff',
      color: newSubColor,
      credits: Number(newSubCredits) || 3,
      room: newSubRoom.trim(),
    };

    onAddSubject(newSub);
    setIsSubjectModalOpen(false);
    setNewSubName('');
    setNewSubCode('');
  };

  // Formatted markdown preview renderer
  const renderFormattedPreview = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeKey = 0;

    lines.forEach((line, idx) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div
              key={`code-${codeKey++}`}
              className="my-3 bg-slate-900 text-slate-100 rounded-xl p-3.5 font-mono text-xs overflow-x-auto border border-slate-800"
            >
              <pre>{codeBuffer.join('\n')}</pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-xl font-extrabold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-base font-bold text-slate-900 mt-3 mb-1.5 text-indigo-950">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-sm font-bold text-slate-800 mt-2 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={idx} className="text-xs text-slate-700 ml-4 list-disc leading-relaxed">
            {line.substring(2)}
          </li>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={idx}
            className="border-l-4 border-indigo-500 bg-indigo-50/50 text-indigo-900 px-3 py-1.5 my-2 rounded-r-lg text-xs italic"
          >
            {line.replace('> ', '')}
          </blockquote>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={idx} className="h-2" />);
      } else {
        elements.push(
          <p key={idx} className="text-xs text-slate-700 leading-relaxed font-sans">
            {line}
          </p>
        );
      }
    });

    if (inCodeBlock && codeBuffer.length > 0) {
      elements.push(
        <div
          key={`code-end-${codeKey}`}
          className="my-3 bg-slate-900 text-slate-100 rounded-xl p-3.5 font-mono text-xs overflow-x-auto border border-slate-800"
        >
          <pre>{codeBuffer.join('\n')}</pre>
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notes & Study Hub</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono">
              {notes.length} saved
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Subject-wise lecture summaries, cheatsheets, formulas, and revision materials
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher: Cards (Quick Preview) vs Split View */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => {
                setViewMode('grid');
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' && !isEditing
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card Grid with Quick Preview"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card Grid</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'split' || isEditing
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Split View Editor"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split Editor</span>
            </button>
          </div>

          {!readOnly ? (
            <>
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Course</span>
              </button>

              <button
                onClick={handleStartCreateNote}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Note</span>
              </button>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs font-semibold text-indigo-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Institutional Notes · Read & Study Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar: Subject Pills, Search & Tags */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedSubjectId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                selectedSubjectId === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Subjects ({notes.length})
            </button>
            {subjects.map((s) => {
              const count = notes.filter((n) => n.subjectId === s.id).length;
              const isSelected = selectedSubjectId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectId(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span>{s.code}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes, text, or #tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tags bar if any tags exist */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3" />
              <span>Tags:</span>
            </span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-[11px] px-2.5 py-0.5 rounded-lg font-mono transition-colors ${
                  activeTag === tag
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="text-[10px] text-indigo-600 hover:underline font-semibold ml-2"
              >
                Clear tag filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main View Area: Card Grid Mode vs Split Editor Mode */}
      {viewMode === 'grid' && !isEditing ? (
        /* ================= CARD GRID VIEW WITH QUICK PREVIEWS ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                Showing {sortedNotes.length} Note{sortedNotes.length === 1 ? '' : 's'} · Card Format with Quick Preview
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Click Quick Preview to preview content or Open Editor to modify
            </span>
          </div>

          {sortedNotes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No notes found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No lecture notes matched your current course or search filter. Create your first note or reset your filter.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                {(selectedSubjectId !== 'all' || searchQuery || activeTag) && (
                  <button
                    onClick={() => {
                      setSelectedSubjectId('all');
                      setSearchQuery('');
                      setActiveTag(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  onClick={handleStartCreateNote}
                  className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  + Create New Note
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedNotes.map((note) => {
                const sub = subjects.find((s) => s.id === note.subjectId);
                const stats = getNoteStats(note.content);
                const snippet = getNoteSnippet(note.content, 180);
                const hasCode = note.content.includes('```');

                return (
                  <div
                    key={note.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Card Content Top */}
                    <div className="p-5 space-y-3.5">
                      {/* Course badge, Pinned status, and Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {sub && (
                            <span
                              className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5"
                              style={{
                                backgroundColor: `${sub.color}15`,
                                color: sub.color,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: sub.color }}
                              />
                              <span>{sub.code}</span>
                            </span>
                          )}
                          {note.isPinned && (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Pinned</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(note.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Note Title */}
                      <h2
                        onClick={() => setQuickPreviewNote(note)}
                        className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
                        title={note.title}
                      >
                        {note.title}
                      </h2>

                      {/* Quick Preview Content Snippet Box */}
                      <div
                        onClick={() => setQuickPreviewNote(note)}
                        className="bg-slate-50/90 group-hover:bg-indigo-50/30 border border-slate-100 rounded-xl p-3.5 cursor-pointer transition-colors relative"
                      >
                        <div className="flex items-center justify-between mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1 text-indigo-600">
                            <Eye className="w-3 h-3" />
                            <span>Quick Preview Snippet</span>
                          </span>
                          {hasCode && (
                            <span className="flex items-center gap-0.5 text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[9px]">
                              <Code className="w-2.5 h-2.5" /> code
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-3">
                          {snippet}
                        </p>
                      </div>

                      {/* Tags Badges */}
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono"
                            >
                              #{t}
                            </span>
                          ))}
                          {note.tags.length > 4 && (
                            <span className="text-[10px] text-slate-400 px-1 py-0.5 font-mono">
                              +{note.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer with Meta & Action Buttons */}
                    <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{stats.readingTime}</span>
                        <span>·</span>
                        <span>{stats.words}w</span>
                      </div>

                      {/* Primary Actions: Quick Preview & Open Full Editor */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQuickPreviewNote(note)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                          title="View Quick Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Quick Preview</span>
                        </button>

                        {!readOnly && (
                          <button
                            onClick={() => handleStartEditNote(note)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                            title="Open Full Note Editor"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Open Editor</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= SPLIT VIEW (LIST + READER / FULL EDITOR) ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (4 cols): Note List with quick snippets */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              <span>Notes List ({sortedNotes.length})</span>
              <button
                onClick={() => setViewMode('grid')}
                className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Card Grid</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {sortedNotes.map((note) => {
                const sub = subjects.find((s) => s.id === note.subjectId);
                const isSelected = (!isEditing && currentNote?.id === note.id) || (isEditing && activeNoteId === note.id);
                const snippet = getNoteSnippet(note.content, 90);

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {note.title}
                      </h3>
                      {note.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Quick Preview Snippet */}
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-sans">
                      {snippet}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        {sub && (
                          <span
                            className="font-bold text-[10px] px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: `${sub.color}15`,
                              color: sub.color,
                            }}
                          >
                            {sub.code}
                          </span>
                        )}
                        <span>·</span>
                        <span>{new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickPreviewNote(note);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          title="Quick Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditNote(note);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                            title="Open Full Editor"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {sortedNotes.length === 0 && (
                <div className="bg-white rounded-2xl py-8 text-center text-xs text-slate-400 border border-slate-200">
                  No notes match your filters.
                </div>
              )}
            </div>
          </div>

          {/* Right Column (8 cols): Editor or Full Reader */}
          <div className="lg:col-span-8">
            {isEditing ? (
              /* Full Note Editor Form */
              <form onSubmit={handleSaveNote} className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Back to reader"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {activeNoteId ? 'Full Note Editor' : 'Create New Note'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Supports rich Markdown with headings, code blocks, lists, and quotes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={readOnly}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Note
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Note Title *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={readOnly}
                    placeholder="e.g. Normalization Rules Cheat Sheet (1NF to BCNF)"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject Course *
                    </label>
                    <select
                      disabled={readOnly}
                      value={formSubjectId}
                      onChange={(e) => setFormSubjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {subjects.length === 0 && (
                        <option value="">General (No subject selected)</option>
                      )}
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code}: {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      placeholder="sql, normalization, midterms"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinNote"
                    disabled={readOnly}
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="pinNote" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Pin this note to top of card list
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Content (Markdown: # headers, - lists, `code`, &gt; quotes)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formContent.length} chars · {formContent.split('\n').length} lines
                    </span>
                  </div>
                  <textarea
                    rows={16}
                    disabled={readOnly}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </form>
            ) : currentNote ? (
              /* Note Reader View */
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {(() => {
                        const sub = subjects.find((s) => s.id === currentNote.subjectId);
                        return sub ? (
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-lg"
                            style={{
                              backgroundColor: `${sub.color}15`,
                              color: sub.color,
                            }}
                          >
                            {sub.code} · {sub.name}
                          </span>
                        ) : null;
                      })()}

                      {currentNote.isPinned && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200/60">
                          <Pin className="w-3 h-3 fill-amber-500" />
                          <span>Pinned</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-400 font-mono">
                        Updated {new Date(currentNote.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                      {currentNote.title}
                    </h2>
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(currentNote)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                      title="Copy note content"
                    >
                      {copiedId === currentNote.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {copiedId === currentNote.id ? 'Copied' : 'Copy'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleDownload(currentNote)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                      title="Download as Markdown .md"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export .md</span>
                    </button>

                    {!readOnly && (
                      <button
                        onClick={() => handleStartEditNote(currentNote)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                        title="Open Full Note Editor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Open Full Editor</span>
                      </button>
                    )}

                    <button
                      onClick={() => !readOnly && onDeleteNote(currentNote.id)}
                      disabled={readOnly}
                      className={`p-2 rounded-xl transition-colors ${
                        readOnly
                          ? 'text-slate-300 cursor-not-allowed opacity-40'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                      }`}
                      title={readOnly ? 'Note deletion disabled for students' : 'Delete note'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tag Badges */}
                {currentNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentNote.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Note Content Render */}
                <div className="bg-slate-50/60 rounded-2xl p-6 border border-slate-100">
                  <div className="prose prose-slate max-w-none">
                    {renderFormattedPreview(currentNote.content)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No Note Selected</h3>
                <p className="text-xs text-slate-400 mt-1">Select a note from the left or create a new one.</p>
                {!readOnly && (
                  <button
                    onClick={handleStartCreateNote}
                    className="mt-4 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    + Create Note
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= QUICK PREVIEW MODAL ================= */}
      {quickPreviewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const sub = subjects.find((s) => s.id === quickPreviewNote.subjectId);
                    return sub ? (
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5"
                        style={{
                          backgroundColor: `${sub.color}15`,
                          color: sub.color,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
                        <span>{sub.code} · {sub.name}</span>
                      </span>
                    ) : null;
                  })()}

                  {quickPreviewNote.isPinned && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>Pinned Note</span>
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400 font-mono">
                    Updated {new Date(quickPreviewNote.updatedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {quickPreviewNote.title}
                </h2>
              </div>

              <button
                onClick={() => setQuickPreviewNote(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Rendered preview */}
            <div className="p-6 overflow-y-auto space-y-4">
              {quickPreviewNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
                  {quickPreviewNote.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Rendered content */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                {renderFormattedPreview(quickPreviewNote.content)}
              </div>
            </div>

            {/* Modal Footer with Actions: Copy, Export, Close, and "Open Full Editor" */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                {(() => {
                  const stats = getNoteStats(quickPreviewNote.content);
                  return (
                    <>
                      <span>{stats.words} words</span>
                      <span>·</span>
                      <span>{stats.readingTime}</span>
                      <span>·</span>
                      <span>{stats.chars} chars</span>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleCopy(quickPreviewNote)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === quickPreviewNote.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownload(quickPreviewNote)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>

                {!readOnly && (
                  <button
                    onClick={() => handleStartEditNote(quickPreviewNote)}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Open Full Editor</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD SUBJECT MODAL ================= */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Add College Subject</h2>
            <p className="text-xs text-slate-500 mb-4">
              Enroll a new course into your semester schedule
            </p>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={readOnly}
                  placeholder="e.g. Artificial Intelligence & Machine Learning"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={readOnly}
                    placeholder="e.g. CS301"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    disabled={readOnly}
                    value={newSubCredits}
                    onChange={(e) => setNewSubCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instructor
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    placeholder="e.g. Prof. Russell"
                    value={newSubInstructor}
                    onChange={(e) => setNewSubInstructor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Room
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    placeholder="e.g. Lab 401"
                    value={newSubRoom}
                    onChange={(e) => setNewSubRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {['#4f46e5', '#059669', '#0284c7', '#d97706', '#e11d48', '#9333ea', '#0d9488'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      disabled={readOnly}
                      onClick={() => setNewSubColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newSubColor === c ? 'scale-110 border-slate-900' : 'border-transparent'
                      } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={readOnly}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
