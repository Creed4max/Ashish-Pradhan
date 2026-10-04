import React, { useState, useRef, useEffect } from 'react';
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
  X,
  Sparkles,
} from 'lucide-react';
import { getDaysRemaining } from '../utils/helpers';
import confetti from 'canvas-confetti';

interface TasksViewProps {
  tasks: Task[];
  subjects: Subject[];
  currentUser?: StudentUser | null;
  isReadOnly?: boolean;
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  subjects,
  currentUser,
  isReadOnly,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask,
}) => {
  const readOnly = isReadOnly !== undefined ? isReadOnly : currentUser?.role === 'student';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut: Press '/' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
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
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTaskId) {
      onUpdateTask(editingTaskId, {
        title: title.trim(),
        description: description.trim(),
        subjectId,
        dueDate,
        priority,
        type,
        status,
      });
    } else {
      onAddTask({
        title: title.trim(),
        description: description.trim(),
        subjectId,
        dueDate,
        priority,
        type,
        status,
      });
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

  // Filter and sort logic: filters tasks by title OR description (as well as course/deadline match)
  const filteredTasks = tasks.filter((t) => {
    if (selectedSubject !== 'all' && t.subjectId !== selectedSubject) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;
      const sub = subjects.find((s) => s.id === t.subjectId);
      const matchSub = sub
        ? sub.code.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q)
        : false;
      const matchDate = t.dueDate.toLowerCase().includes(q);
      const daysInfo = getDaysRemaining(t.dueDate);
      const matchDeadlineStatus =
        (q === 'today' || q === 'due today') && daysInfo.isToday
          ? true
          : (q === 'overdue' || q === 'due' || q === 'late') && daysInfo.isOverdue
          ? true
          : false;

      if (!matchTitle && !matchDesc && !matchSub && !matchDate && !matchDeadlineStatus) {
        return false;
      }
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return a.dueDate.localeCompare(b.dueDate);
    } else {
      const pMap: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
  });

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Manager</h1>
          <p className="text-sm text-slate-500">
            Track college assignments, lab submissions, term projects and deadlines
          </p>
        </div>

        {!readOnly ? (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
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

      {/* Status Segmented Tabs & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'in_progress'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority')}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid / List */}
      <div className="space-y-3">
        {sortedTasks.map((task) => {
          const sub = subjects.find((s) => s.id === task.subjectId);
          const isDone = task.status === 'completed';
          const { label: dueLabel, isOverdue, isToday } = getDaysRemaining(task.dueDate);

          return (
            <div
              key={task.id}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                isDone
                  ? 'border-slate-200/60 bg-slate-50/50 opacity-75'
                  : isOverdue
                  ? 'border-rose-200 shadow-xs'
                  : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-base font-semibold ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {highlightMatch(task.title, searchQuery)}
                      </h3>

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

                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded capitalize">
                        {task.type}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {highlightMatch(task.description, searchQuery)}
                      </p>
                    )}

                    {/* Metadata line */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
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

                {/* Actions (Enabled for Teachers/Admins, disabled for Students / readOnly) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => !readOnly && openEditModal(task)}
                    disabled={readOnly}
                    className={`p-1.5 rounded-lg transition-colors ${
                      readOnly
                        ? 'text-slate-300 cursor-not-allowed opacity-40'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer'
                    }`}
                    title={readOnly ? 'Task editing disabled for students' : 'Edit task'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => !readOnly && onDeleteTask(task.id)}
                    disabled={readOnly}
                    className={`p-1.5 rounded-lg transition-colors ${
                      readOnly
                        ? 'text-slate-300 cursor-not-allowed opacity-40'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                    }`}
                    title={readOnly ? 'Task deletion disabled for students' : 'Delete task'}
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
              {searchQuery.trim()
                ? `No tasks found matching "${searchQuery}"`
                : 'No tasks match your criteria'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery.trim()
                ? 'We could not find any assignments or tasks matching your query in their title or description.'
                : 'Try resetting filters or create a new assignment'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              {!readOnly && (
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Create Task
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingTaskId ? 'Edit Task' : 'New College Task'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Add details for assignment, lab submission, or exam prep
            </p>

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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject *
                  </label>
                  <select
                    disabled={readOnly}
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    disabled={readOnly}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={readOnly}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
