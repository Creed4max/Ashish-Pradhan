import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Subject, Task, TaskPriority, TaskStatus, TaskType, StudentUser } from '../types';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Tag,
  Hash,
  Folder,
  Layers,
  GripVertical,
  BarChart3,
  PieChart as PieIcon,
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  SlidersHorizontal,
  CheckSquare,
  Square,
  MinusSquare,
  Check,
  CheckCheck,
} from 'lucide-react';
import { getDaysRemaining } from '../utils/helpers';
import confetti from 'canvas-confetti';
import { TasksAnalyticsChart } from './TasksAnalyticsChart';

interface TasksViewProps {
  tasks: Task[];
  subjects: Subject[];
  currentUser?: StudentUser | null;
  isReadOnly?: boolean;
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onReorderTasks?: (tasks: Task[]) => void;
  onBulkUpdateTasks?: (taskIds: string[], updates: Partial<Task>) => void;
  onBulkDeleteTasks?: (taskIds: string[]) => void;
}

const DEFAULT_CATEGORIES = [
  'Homework',
  'Lab Work',
  'Project',
  'Exam Prep',
  'Research',
  'Revision',
  'Reading',
  'General',
];

const SUGGESTED_TAGS = [
  'urgent',
  'midterm',
  'viva',
  'lab-report',
  'graded',
  'presentation',
  'theory',
  'reading',
  'code',
];

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  subjects,
  currentUser,
  isReadOnly,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask,
  onReorderTasks,
  onBulkUpdateTasks,
  onBulkDeleteTasks,
}) => {
  const readOnly = isReadOnly !== undefined ? isReadOnly : currentUser?.role === 'student';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'custom' | 'dueDate' | 'priority' | 'urgency'>('custom');

  // Bulk selection states
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('Homework');
  const [isBulkCustomCategory, setIsBulkCustomCategory] = useState(false);
  const [bulkCustomCategory, setBulkCustomCategory] = useState('');
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Data viz analytics collapse/expand toggle
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Drag and drop reordering states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragDropPosition, setDragDropPosition] = useState<'before' | 'after' | null>(null);
  const [reorderNotification, setReorderNotification] = useState<string | null>(null);

  // Mobile Touch Drag & Drop tracking
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (taskId: string, e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    setDraggedTaskId(taskId);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedTaskId) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = element?.closest('[data-task-id]') as HTMLElement | null;
    if (card) {
      const targetId = card.getAttribute('data-task-id');
      if (targetId && targetId !== draggedTaskId) {
        setDragOverTaskId(targetId);
        const rect = card.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        setDragDropPosition(touch.clientY < midpoint ? 'before' : 'after');
      }
    }
  };

  const handleTouchEnd = () => {
    if (draggedTaskId && dragOverTaskId && draggedTaskId !== dragOverTaskId) {
      handleReorder(draggedTaskId, dragOverTaskId, dragDropPosition || 'before');
    }
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragDropPosition(null);
    touchStartYRef.current = null;
  };

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut: Press '/' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !(
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('assignment');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [category, setCategory] = useState('Homework');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Collect all unique tags dynamically from tasks
  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      t.tags?.forEach((tg) => {
        const cleaned = tg.trim().toLowerCase();
        if (cleaned) set.add(cleaned);
      });
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Collect all unique categories dynamically from tasks + default set
  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    tasks.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return Array.from(set);
  }, [tasks]);

  // Drag and drop reorder handler
  const handleReorder = (
    sourceId: string,
    targetId: string,
    position: 'before' | 'after' = 'before'
  ) => {
    if (sourceId === targetId) return;

    const currentList = [...tasks];
    const sourceIndex = currentList.findIndex((t) => t.id === sourceId);
    const targetIndex = currentList.findIndex((t) => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [movedTask] = currentList.splice(sourceIndex, 1);
    const adjustedTargetIndex = currentList.findIndex((t) => t.id === targetId);
    const insertIndex = position === 'after' ? adjustedTargetIndex + 1 : adjustedTargetIndex;

    currentList.splice(insertIndex, 0, movedTask);

    if (onReorderTasks) {
      onReorderTasks(currentList);
    }

    setSortBy('custom');
    setReorderNotification(`Moved "${movedTask.title.slice(0, 26)}..." in priority queue`);
    setTimeout(() => setReorderNotification(null), 3000);
  };

  // Quick reorder helpers (Move Up / Move Down / Move to Top / Move to Bottom)
  const handleMoveTask = (taskId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const currentList = [...tasks];
    const index = currentList.findIndex((t) => t.id === taskId);
    if (index === -1) return;

    if (direction === 'top') {
      if (index === 0) return;
      const [task] = currentList.splice(index, 1);
      currentList.unshift(task);
    } else if (direction === 'bottom') {
      if (index === currentList.length - 1) return;
      const [task] = currentList.splice(index, 1);
      currentList.push(task);
    } else if (direction === 'up') {
      if (index === 0) return;
      const [task] = currentList.splice(index, 1);
      currentList.splice(index - 1, 0, task);
    } else if (direction === 'down') {
      if (index === currentList.length - 1) return;
      const [task] = currentList.splice(index, 1);
      currentList.splice(index + 1, 0, task);
    }

    if (onReorderTasks) {
      onReorderTasks(currentList);
    }
    setSortBy('custom');
    setReorderNotification(
      direction === 'top'
        ? 'Moved task to #1 Highest Priority'
        : direction === 'bottom'
        ? 'Moved task to bottom priority'
        : 'Reordered task position in queue'
    );
    setTimeout(() => setReorderNotification(null), 2500);
  };

  // Auto-prioritize button: Sort tasks by urgency (High -> Medium -> Low, then by due date)
  const handleAutoPrioritize = () => {
    const pMap: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
    const sorted = [...tasks].sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      if (pMap[b.priority] !== pMap[a.priority]) {
        return pMap[b.priority] - pMap[a.priority];
      }
      return a.dueDate.localeCompare(b.dueDate);
    });

    if (onReorderTasks) {
      onReorderTasks(sorted);
    }
    setSortBy('custom');
    setReorderNotification('Tasks auto-prioritized by urgency & deadlines');
    setTimeout(() => setReorderNotification(null), 3500);
  };

  const openAddModal = () => {
    if (readOnly) return;
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setSubjectId(subjects[0]?.id || '');
    setDueDate(new Date().toISOString().split('T')[0]);
    setPriority('medium');
    setType('assignment');
    setStatus('pending');
    setCategory('Homework');
    setIsCustomCategory(false);
    setCustomCategory('');
    setTags([]);
    setTagInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    if (readOnly) return;
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setSubjectId(task.subjectId);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setType(task.type);
    setStatus(task.status);

    const taskCat = task.category || 'Homework';
    if (DEFAULT_CATEGORIES.includes(taskCat)) {
      setCategory(taskCat);
      setIsCustomCategory(false);
      setCustomCategory('');
    } else {
      setCategory('custom');
      setIsCustomCategory(true);
      setCustomCategory(taskCat);
    }

    setTags(task.tags || []);
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleAddTag = (rawTag: string) => {
    const cleaned = rawTag.trim().toLowerCase().replace(/^#+/, '');
    if (!cleaned) return;
    if (!tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const resolvedCategory =
      (isCustomCategory ? customCategory.trim() : category.trim()) || 'Homework';

    const taskPayload: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      subjectId,
      dueDate,
      priority,
      type,
      status,
      category: resolvedCategory,
      tags: tags.map((t) => t.trim().toLowerCase()),
    };

    if (editingTaskId) {
      onUpdateTask(editingTaskId, taskPayload);
    } else {
      onAddTask(taskPayload);
    }

    setIsModalOpen(false);
  };

  const handleToggle = (taskId: string, currentStatus: TaskStatus) => {
    onToggleTask(taskId);
    if (currentStatus !== 'completed') {
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#4f46e5', '#10b981'],
        });
      } catch {
        // ignore
      }
    }
  };

  // Helper to highlight matching text in title & description
  const highlightMatch = (text: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return text;
    try {
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-100 text-amber-900 font-semibold rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  // Filter and sort logic: filters tasks by title, description, category, and tags
  const filteredTasks = tasks.filter((t) => {
    if (selectedSubject !== 'all' && t.subjectId !== selectedSubject) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (
      selectedCategory !== 'all' &&
      (t.category || 'General').toLowerCase() !== selectedCategory.toLowerCase()
    ) {
      return false;
    }
    if (selectedTag !== 'all') {
      const taskTags = (t.tags || []).map((tg) => tg.toLowerCase());
      if (!taskTags.includes(selectedTag.toLowerCase())) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;
      const sub = subjects.find((s) => s.id === t.subjectId);
      const matchSub = sub
        ? sub.code.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q)
        : false;
      const matchDate = t.dueDate.toLowerCase().includes(q);
      const matchCategory = t.category ? t.category.toLowerCase().includes(q) : false;
      const matchTags = t.tags
        ? t.tags.some((tag) => tag.toLowerCase().includes(q) || `#${tag.toLowerCase()}`.includes(q))
        : false;
      const daysInfo = getDaysRemaining(t.dueDate);
      const matchDeadlineStatus =
        (q === 'today' || q === 'due today') && daysInfo.isToday
          ? true
          : (q === 'overdue' || q === 'due' || q === 'late') && daysInfo.isOverdue
          ? true
          : false;

      if (
        !matchTitle &&
        !matchDesc &&
        !matchSub &&
        !matchDate &&
        !matchDeadlineStatus &&
        !matchCategory &&
        !matchTags
      ) {
        return false;
      }
    }
    return true;
  });

  const sortedTasks = useMemo(() => {
    if (sortBy === 'custom') {
      return filteredTasks;
    } else if (sortBy === 'dueDate') {
      return [...filteredTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    } else if (sortBy === 'priority') {
      const pMap: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
      return [...filteredTasks].sort((a, b) => pMap[b.priority] - pMap[a.priority]);
    } else if (sortBy === 'urgency') {
      const pMap: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
      return [...filteredTasks].sort((a, b) => {
        if (pMap[b.priority] !== pMap[a.priority]) {
          return pMap[b.priority] - pMap[a.priority];
        }
        return a.dueDate.localeCompare(b.dueDate);
      });
    }
    return filteredTasks;
  }, [filteredTasks, sortBy]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  // Toggle selection for a single task
  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Toggle selection for all visible tasks
  const areAllVisibleSelected =
    sortedTasks.length > 0 && sortedTasks.every((t) => selectedTaskIds.includes(t.id));
  const isSomeVisibleSelected =
    !areAllVisibleSelected && sortedTasks.some((t) => selectedTaskIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (areAllVisibleSelected) {
      setSelectedTaskIds((prev) =>
        prev.filter((id) => !sortedTasks.some((t) => t.id === id))
      );
    } else {
      const newIds = new Set([...selectedTaskIds, ...sortedTasks.map((t) => t.id)]);
      setSelectedTaskIds(Array.from(newIds));
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  // Bulk Action: Mark selected tasks as completed
  const handleBulkMarkCompleted = () => {
    if (selectedTaskIds.length === 0) return;
    const count = selectedTaskIds.length;
    const idSet = new Set(selectedTaskIds);
    const nowIso = new Date().toISOString();

    if (onBulkUpdateTasks) {
      onBulkUpdateTasks(selectedTaskIds, { status: 'completed', completedAt: nowIso });
    } else if (onReorderTasks) {
      const updated = tasks.map((t) =>
        idSet.has(t.id) ? { ...t, status: 'completed' as const, completedAt: nowIso } : t
      );
      onReorderTasks(updated);
    }

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#6366f1', '#f59e0b'],
      });
    } catch {
      // ignore
    }

    setReorderNotification(`Marked ${count} ${count === 1 ? 'task' : 'tasks'} as completed!`);
    setTimeout(() => setReorderNotification(null), 3500);
    setSelectedTaskIds([]);
  };

  // Bulk Action: Mark selected tasks as pending
  const handleBulkMarkPending = () => {
    if (selectedTaskIds.length === 0) return;
    const count = selectedTaskIds.length;
    const idSet = new Set(selectedTaskIds);

    if (onBulkUpdateTasks) {
      onBulkUpdateTasks(selectedTaskIds, { status: 'pending', completedAt: undefined });
    } else if (onReorderTasks) {
      const updated = tasks.map((t) =>
        idSet.has(t.id) ? { ...t, status: 'pending' as const, completedAt: undefined } : t
      );
      onReorderTasks(updated);
    }

    setReorderNotification(`Marked ${count} ${count === 1 ? 'task' : 'tasks'} as pending`);
    setTimeout(() => setReorderNotification(null), 3000);
    setSelectedTaskIds([]);
  };

  // Bulk Action: Change category for selected tasks
  const handleBulkChangeCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || selectedTaskIds.length === 0) return;
    const count = selectedTaskIds.length;
    const idSet = new Set(selectedTaskIds);

    if (onBulkUpdateTasks) {
      onBulkUpdateTasks(selectedTaskIds, { category: trimmed });
    } else if (onReorderTasks) {
      const updated = tasks.map((t) =>
        idSet.has(t.id) ? { ...t, category: trimmed } : t
      );
      onReorderTasks(updated);
    }

    setReorderNotification(`Updated category to "${trimmed}" for ${count} ${count === 1 ? 'task' : 'tasks'}`);
    setTimeout(() => setReorderNotification(null), 3500);
    setSelectedTaskIds([]);
    setIsBulkCategoryModalOpen(false);
  };

  // Bulk Action: Delete selected tasks
  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    const count = selectedTaskIds.length;
    const idSet = new Set(selectedTaskIds);

    if (onBulkDeleteTasks) {
      onBulkDeleteTasks(selectedTaskIds);
    } else if (onReorderTasks) {
      const updated = tasks.filter((t) => !idSet.has(t.id));
      onReorderTasks(updated);
    }

    setReorderNotification(`Deleted ${count} ${count === 1 ? 'task' : 'tasks'}`);
    setTimeout(() => setReorderNotification(null), 3500);
    setSelectedTaskIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Manager</h1>
            <span className="text-xs text-slate-400 font-medium hidden xs:inline">
              · Prioritize & Organize
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Track college assignments, lab submissions, reorder priority queue, and analyze completion metrics
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Analytics Chart */}
          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[42px] ${
              showAnalytics
                ? 'bg-indigo-50 border-indigo-200/80 text-indigo-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle Recharts Data Analytics & Trends visualization"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
            {showAnalytics ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {!readOnly ? (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Task</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs font-semibold text-indigo-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assigned Tasks · View & Complete Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Data Visualization Component for TasksView using Recharts */}
      {showAnalytics && (
        <TasksAnalyticsChart tasks={tasks} subjects={subjects} />
      )}

      {/* Drag & Drop Reorder Toast Feedback */}
      {reorderNotification && (
        <div className="p-3 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg border border-slate-700 animate-fadeIn">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-amber-400" />
            <span>{reorderNotification}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Custom order active</span>
        </div>
      )}

      {/* Search Bar Component */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label htmlFor="task-search-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-600" />
              <span>Search Deadlines & Tasks</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Filter tasks by title, problem description, course, or deadline date
            </p>
          </div>
          {searchQuery.trim() && (
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60 self-start sm:self-auto font-mono">
              {sortedTasks.length} {sortedTasks.length === 1 ? 'task found' : 'tasks found'}
            </span>
          )}
        </div>

        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            id="task-search-input"
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks by title or description... (e.g. 'B-Tree', 'Lab Report', 'midterms', 'due today')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-2xs"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Quick Deadline & Course Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 pt-0.5">
          <span className="text-[11px] font-semibold text-slate-400">Quick deadline filters:</span>
          {['Due today', 'Overdue', 'Assignment', 'Lab', 'Exam', 'Project'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(searchQuery.toLowerCase() === tag.toLowerCase() ? '' : tag)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                searchQuery.toLowerCase() === tag.toLowerCase()
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
          {subjects.slice(0, 3).map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSearchQuery(searchQuery.toLowerCase() === sub.code.toLowerCase() ? '' : sub.code)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                searchQuery.toLowerCase() === sub.code.toLowerCase()
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub.code}
            </button>
          ))}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-rose-600 hover:underline font-semibold ml-1 cursor-pointer"
            >
              Reset search
            </button>
          )}
        </div>
      </div>

      {/* Status Segmented Tabs & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Horizontal scrollable status segmented tabs for mobile */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium overflow-x-auto scrollbar-none touch-pan-x -mx-1 px-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg transition-colors min-h-[38px] sm:min-h-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg transition-colors min-h-[38px] sm:min-h-0 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg transition-colors min-h-[38px] sm:min-h-0 cursor-pointer ${
              statusFilter === 'in_progress'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg transition-colors min-h-[38px] sm:min-h-0 cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Filter dropdowns row (Grid on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[42px] sm:min-h-0 cursor-pointer font-medium"
            title="Filter by Task Category"
          >
            <option value="all">All Categories</option>
            {allAvailableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[42px] sm:min-h-0 cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[42px] sm:min-h-0 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[42px] sm:min-h-0 cursor-pointer font-medium"
            title="Sort task queue order"
          >
            <option value="custom">Custom Order (Drag & Drop)</option>
            <option value="urgency">Urgency (High → Low)</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority Tier</option>
          </select>

          {/* Quick Auto-Prioritize Action Button */}
          <button
            type="button"
            onClick={handleAutoPrioritize}
            title="Auto-arrange tasks by priority tier (High → Medium → Low) & deadlines"
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[42px] sm:min-h-0"
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Auto-Prioritize</span>
          </button>
        </div>
      </div>

      {/* Tag / Label Filter Bar with Horizontal Scroll for Mobile */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Filter by Tag or Label:</span>
            {selectedTag !== 'all' && (
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70 inline-flex items-center gap-1">
                #{selectedTag}
                <button
                  type="button"
                  onClick={() => setSelectedTag('all')}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  title="Remove tag filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {(selectedTag !== 'all' || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedTag('all');
                setSelectedCategory('all');
              }}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer min-h-[30px] flex items-center"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Scrollable chip container with smooth touch scrolling for mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-2 px-2 sm:mx-0 sm:px-0 touch-pan-x">
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] flex items-center ${
              selectedTag === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tags ({tasks.length})
          </button>

          {allAvailableTags.map((tg) => {
            const count = tasks.filter((t) =>
              (t.tags || []).some((tag) => tag.toLowerCase() === tg)
            ).length;
            const isSelected = selectedTag.toLowerCase() === tg;
            return (
              <button
                key={tg}
                type="button"
                onClick={() => setSelectedTag(isSelected ? 'all' : tg)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
                }`}
              >
                <Hash className="w-3 h-3 opacity-70" />
                <span>{tg}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-indigo-800 text-white' : 'bg-indigo-200/60 text-indigo-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {allAvailableTags.length === 0 && (
            <span className="text-xs text-slate-400 italic py-1 whitespace-nowrap">
              No custom tags on tasks yet. Add tags when creating or editing tasks to filter here!
            </span>
          )}
        </div>
      </div>

      {/* Task Cards Grid / List with Drag & Drop Reordering */}
      <div className="space-y-3">
        {/* Drag-and-drop & Bulk Selection Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600 bg-slate-50/90 px-3.5 py-2.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Select All Checkbox */}
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer min-h-[34px]"
              title={areAllVisibleSelected ? 'Deselect all visible tasks' : 'Select all visible tasks'}
            >
              <div
                className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all ${
                  areAllVisibleSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                    : isSomeVisibleSelected
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                {areAllVisibleSelected ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isSomeVisibleSelected ? (
                  <MinusSquare className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                ) : null}
              </div>
              <span>
                {selectedTaskIds.length > 0
                  ? `${selectedTaskIds.length} of ${sortedTasks.length} selected`
                  : `Select All (${sortedTasks.length})`}
              </span>
            </button>

            {selectedTaskIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px] flex-wrap">
            <span className="hidden sm:inline-flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Drag handle <GripVertical className="w-3 h-3 inline text-slate-400" /> or arrows to prioritize.</span>
            </span>
            <span className="font-mono text-slate-400">
              Queue: {sortedTasks.length} items
            </span>
          </div>
        </div>

        {sortedTasks.map((task, taskIndex) => {
          const sub = subjects.find((s) => s.id === task.subjectId);
          const isDone = task.status === 'completed';
          const { label: dueLabel, isOverdue, isToday } = getDaysRemaining(task.dueDate);
          const isSelected = selectedTaskIds.includes(task.id);

          const isBeingDragged = draggedTaskId === task.id;
          const isDragTarget = dragOverTaskId === task.id;

          return (
            <div
              key={task.id}
              data-task-id={task.id}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.effectAllowed = 'move';
                setDraggedTaskId(task.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (draggedTaskId && draggedTaskId !== task.id) {
                  setDragOverTaskId(task.id);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const midpoint = rect.top + rect.height / 2;
                  setDragDropPosition(e.clientY < midpoint ? 'before' : 'after');
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  if (dragOverTaskId === task.id) {
                    setDragOverTaskId(null);
                    setDragDropPosition(null);
                  }
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                if (sourceId && sourceId !== task.id) {
                  handleReorder(sourceId, task.id, dragDropPosition || 'before');
                }
                setDraggedTaskId(null);
                setDragOverTaskId(null);
                setDragDropPosition(null);
              }}
              onDragEnd={() => {
                setDraggedTaskId(null);
                setDragOverTaskId(null);
                setDragDropPosition(null);
              }}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all relative ${
                isBeingDragged
                  ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/20 scale-[0.99]'
                  : isDragTarget
                  ? dragDropPosition === 'before'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md border-t-4 border-t-indigo-600'
                    : 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md border-b-4 border-b-indigo-600'
                  : isSelected
                  ? 'border-indigo-400 ring-2 ring-indigo-500/25 bg-indigo-50/15 shadow-xs'
                  : isDone
                  ? 'border-slate-200/60 bg-slate-50/50 opacity-75'
                  : isOverdue
                  ? 'border-rose-200 shadow-xs'
                  : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5 sm:gap-4">
                {/* Selection Checkbox, Drag Handle, Priority Number, Completion Checkbox & Main Info */}
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Bulk Selection Checkbox */}
                  <div className="flex items-center pt-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectTask(task.id);
                      }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                          : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
                      }`}
                      title={isSelected ? 'Deselect task for bulk action' : 'Select task for bulk action'}
                      aria-label={`Select task: ${task.title}`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>

                  {/* Drag Handle & Priority Queue Rank */}
                  <div className="flex flex-col items-center shrink-0 -mt-0.5">
                    <div
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedTaskId(task.id);
                      }}
                      onTouchStart={(e) => handleTouchStart(task.id, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverTaskId(null);
                        setDragDropPosition(null);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none flex items-center justify-center min-w-[28px] min-h-[32px]"
                      title="Drag and drop or touch-drag to manually reorder tasks by priority or urgency"
                      aria-label="Drag handle to reorder task"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold text-slate-400 select-none cursor-default"
                      title={`Priority queue rank #${taskIndex + 1}`}
                    >
                      #{taskIndex + 1}
                    </span>
                  </div>

                  {/* Task Completion Checkbox */}
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    className="mt-0.5 min-w-[36px] min-h-[36px] -m-1 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none shrink-0 cursor-pointer"
                    aria-label={isDone ? 'Mark task as incomplete' : 'Mark task as complete'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3
                        className={`text-base font-semibold ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {highlightMatch(task.title, searchQuery)}
                      </h3>

                      {/* Subject Code Badge */}
                      {sub && (
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: `${sub.color}15`,
                            color: sub.color,
                          }}
                        >
                          {sub.code} · {sub.name}
                        </span>
                      )}

                      {/* Category Badge */}
                      {task.category && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          <Folder className="w-3 h-3 text-slate-400" />
                          <span>{task.category}</span>
                        </span>
                      )}

                      {/* Priority Badge */}
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          task.priority === 'high'
                            ? 'bg-rose-50 text-rose-700'
                            : task.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority.toUpperCase()}
                      </span>

                      {/* Type Badge */}
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded capitalize">
                        {task.type}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed break-words">
                        {highlightMatch(task.description, searchQuery)}
                      </p>
                    )}

                    {/* Interactive Tags / Labels Row */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                        {task.tags.map((tg) => {
                          const isTagActive = selectedTag.toLowerCase() === tg.toLowerCase();
                          return (
                            <button
                              key={tg}
                              type="button"
                              onClick={() => setSelectedTag(isTagActive ? 'all' : tg.toLowerCase())}
                              title={`Filter tasks by tag #${tg}`}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer min-h-[30px] ${
                                isTagActive
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                                  : 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border-indigo-200/60'
                              }`}
                            >
                              <Hash className="w-3 h-3 opacity-70" />
                              <span>{tg}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Metadata line */}
                    <div className="flex items-center gap-2 sm:gap-3 mt-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{task.dueDate}</span>
                      </span>

                      <span aria-hidden="true">·</span>

                      <span
                        className={`font-medium ${
                          isOverdue
                            ? 'text-rose-600 font-semibold'
                            : isToday
                            ? 'text-amber-600 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        {dueLabel}
                      </span>

                      <span aria-hidden="true">·</span>

                      <span className="capitalize">
                        Status: <strong className="font-semibold text-slate-700">{task.status.replace('_', ' ')}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions & Priority Reorder buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Quick Priority Queue Reorder buttons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveTask(task.id, 'top')}
                      disabled={taskIndex === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-20 min-h-[36px] min-w-[32px] flex items-center justify-center cursor-pointer transition-colors"
                      title="Move to #1 Highest Urgency"
                      aria-label="Move to top priority"
                    >
                      <ChevronsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveTask(task.id, 'up')}
                      disabled={taskIndex === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 min-h-[36px] min-w-[32px] flex items-center justify-center cursor-pointer transition-colors"
                      title="Move task up in priority queue"
                      aria-label="Move task up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveTask(task.id, 'down')}
                      disabled={taskIndex === sortedTasks.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 min-h-[36px] min-w-[32px] flex items-center justify-center cursor-pointer transition-colors"
                      title="Move task down in priority queue"
                      aria-label="Move task down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => !readOnly && openEditModal(task)}
                    disabled={readOnly}
                    className={`min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                      readOnly
                        ? 'text-slate-300 cursor-not-allowed opacity-40'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer'
                    }`}
                    title={readOnly ? 'Task editing disabled' : 'Edit task'}
                    aria-label="Edit task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => !readOnly && onDeleteTask(task.id)}
                    disabled={readOnly}
                    className={`min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                      readOnly
                        ? 'text-slate-300 cursor-not-allowed opacity-40'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                    }`}
                    title={readOnly ? 'Task deletion disabled' : 'Delete task'}
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sortedTasks.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">
              {searchQuery.trim() || selectedCategory !== 'all' || selectedTag !== 'all'
                ? 'No tasks found matching your filter criteria'
                : 'No tasks match your criteria'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery.trim() || selectedCategory !== 'all' || selectedTag !== 'all'
                ? 'We could not find any assignments or tasks matching the selected filters, category, or tags.'
                : 'Try resetting filters or create a new assignment'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {(searchQuery.trim() || selectedCategory !== 'all' || selectedTag !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedTag('all');
                    setStatusFilter('all');
                    setSelectedSubject('all');
                    setPriorityFilter('all');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
                >
                  Clear All Filters
                </button>
              )}
              {!readOnly && (
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
                >
                  + Create Task
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedTaskIds.length > 0 && (
        <aside
          aria-label="Bulk actions toolbar"
          className="fixed bottom-5 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-2xl z-40 bg-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-2xl border border-slate-700/90 flex flex-col md:flex-row items-center justify-between gap-3 animate-slideUp"
        >
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold font-mono shadow-xs">
                {selectedTaskIds.length}
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {selectedTaskIds.length === 1 ? 'task selected' : 'tasks selected'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer md:hidden"
            >
              <X className="w-3.5 h-3.5" />
              <span>Deselect</span>
            </button>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end w-full md:w-auto">
            {/* Mark Completed */}
            <button
              type="button"
              onClick={handleBulkMarkCompleted}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer min-h-[40px] shadow-xs"
              title="Mark selected tasks as completed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Completed</span>
            </button>

            {/* Change Category */}
            <button
              type="button"
              onClick={() => {
                setBulkCategory('Homework');
                setIsBulkCustomCategory(false);
                setBulkCustomCategory('');
                setIsBulkCategoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer min-h-[40px] shadow-xs"
              title="Change category for all selected tasks"
            >
              <Folder className="w-4 h-4" />
              <span>Change Category</span>
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600/90 hover:bg-rose-600 text-white transition-colors cursor-pointer min-h-[40px] shadow-xs"
              title="Delete all selected tasks"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            {/* Clear selection */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden md:flex items-center justify-center min-h-[40px] min-w-[40px]"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Bulk Change Category Modal */}
      {isBulkCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slideUp sm:animate-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Change Category</h3>
                  <p className="text-xs text-slate-500">
                    Apply new category to {selectedTaskIds.length} selected tasks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Select or enter target category:
              </label>
              <select
                value={isBulkCustomCategory ? 'custom' : bulkCategory}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsBulkCustomCategory(true);
                  } else {
                    setIsBulkCustomCategory(false);
                    setBulkCategory(e.target.value);
                  }
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] cursor-pointer"
              >
                {allAvailableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom">+ Custom Category...</option>
              </select>

              {isBulkCustomCategory && (
                <input
                  type="text"
                  placeholder="Enter custom category name..."
                  value={bulkCustomCategory}
                  onChange={(e) => setBulkCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                  autoFocus
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors min-h-[40px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalCat = isBulkCustomCategory ? bulkCustomCategory.trim() : bulkCategory;
                  if (finalCat) {
                    handleBulkChangeCategory(finalCat);
                  }
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors min-h-[40px] cursor-pointer shadow-xs"
              >
                Apply Category to {selectedTaskIds.length} Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slideUp sm:animate-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Tasks?</h3>
                  <p className="text-xs text-slate-500">
                    This will permanently delete {selectedTaskIds.length} selected tasks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700">
              {selectedTaskIds.slice(0, 4).map((id) => {
                const t = tasks.find((item) => item.id === id);
                return (
                  <div key={id} className="flex items-center gap-2 py-0.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="truncate">{t?.title || 'Task'}</span>
                  </div>
                );
              })}
              {selectedTaskIds.length > 4 && (
                <p className="text-[11px] text-slate-400 italic pt-1">
                  ... and {selectedTaskIds.length - 4} more tasks
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors min-h-[40px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors min-h-[40px] cursor-pointer shadow-xs"
              >
                Delete {selectedTaskIds.length} Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal (Add / Edit) - Mobile bottom sheet & centered modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slideUp sm:animate-none">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTaskId ? 'Edit Task' : 'New College Task'}
                </h2>
                <p className="text-xs text-slate-500">
                  Add details, category, tags, and deadline for coursework
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  disabled={readOnly}
                  placeholder="e.g. Implement B-Tree & AVL Rotations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Category Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Category</span>
                  <span className="text-[11px] text-slate-400">Organize by task type</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    disabled={readOnly}
                    value={isCustomCategory ? 'custom' : category}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="custom">+ Custom Category...</option>
                  </select>

                  {isCustomCategory && (
                    <input
                      type="text"
                      placeholder="Enter custom category name..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Tags / Labels Builder */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Tags & Labels</span>
                  <span className="text-[11px] text-slate-400">Add tags for quick filtering</span>
                </label>

                {/* Active Tags Chips Container */}
                <div className="flex items-center gap-1.5 flex-wrap min-h-[40px] p-2 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                  {tags.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      No tags attached yet. Type below or choose from suggestions.
                    </span>
                  ) : (
                    tags.map((tg) => (
                      <span
                        key={tg}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-1 rounded-lg"
                      >
                        <Hash className="w-3 h-3 opacity-60" />
                        <span>{tg}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tg)}
                          className="hover:text-rose-600 transition-colors p-0.5 cursor-pointer ml-0.5"
                          title={`Remove ${tg}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Tag Input Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Type a tag & press Enter (e.g. urgent, midterm, viva)..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    disabled={!tagInput.trim()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors min-h-[44px] cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {/* Tag Quick Suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
                  {SUGGESTED_TAGS.filter((st) => !tags.includes(st))
                    .slice(0, 6)
                    .map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleAddTag(st)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors cursor-pointer min-h-[28px]"
                      >
                        +{st}
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject *
                  </label>
                  <select
                    disabled={readOnly}
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {subjects.length === 0 && (
                      <option value="">General / No Subject</option>
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
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={readOnly}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    disabled={readOnly}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    disabled={readOnly}
                    value={type}
                    onChange={(e) => setType(e.target.value as TaskType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="lab">Lab Exercise</option>
                    <option value="exam">Exam Prep</option>
                    <option value="project">Project Work</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    disabled={readOnly}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  disabled={readOnly}
                  placeholder="Specify problem numbers, rubric criteria, or github repo links..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={readOnly}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
                >
                  {editingTaskId ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
