import React, { useState } from 'react';
import {
  Subject,
  Task,
  TimetableSlot,
  Note,
  SubjectSyllabus,
  CodingProblem,
  DayOfWeek,
  StudySession,
  WeeklyGoals,
  StudentUser,
  AppNotification,
} from '../types';
import { DynamicGreeting } from './DynamicGreeting';
import { TeacherDashboardView } from './TeacherDashboardView';
import { AdminDashboardView } from './AdminDashboardView';
import { AiCourseworkSidebar } from './AiCourseworkSidebar';
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Calendar,
  Flame,
  ArrowRight,
  Plus,
  Play,
  Check,
  Code2,
  Sparkles,
  MapPin,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  Trophy,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { formatMinutesToHuman, formatTime24To12, isTimeInRange, getTimeUntil } from '../utils/helpers';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  currentUser?: StudentUser | null;
  subjects: Subject[];
  tasks: Task[];
  timetable: TimetableSlot[];
  syllabus: SubjectSyllabus[];
  notes?: Note[];
  codingProblems: CodingProblem[];
  studySessions: StudySession[];
  todayStudyMinutes: number;
  weeklyGoals: WeeklyGoals;
  onUpdateWeeklyGoals: (goals: WeeklyGoals) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Partial<Task>) => void;
  onNavigateTab: (tab: string) => void;
  onSelectSubjectNotes?: (subjectId: string) => void;
  onTriggerAlert?: (notification: AppNotification) => void;
  onToggleTopic?: (syllabusId: string, topicId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  subjects,
  tasks,
  timetable,
  syllabus,
  notes = [],
  codingProblems,
  studySessions,
  todayStudyMinutes,
  weeklyGoals,
  onUpdateWeeklyGoals,
  onToggleTask,
  onAddTask,
  onNavigateTab,
  onTriggerAlert,
  onToggleTopic,
}) => {
  const [perspectiveOverride, setPerspectiveOverride] = useState<'student' | 'teacher' | 'admin' | null>(null);
  const effectiveRole = perspectiveOverride || currentUser?.role || 'student';
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [activeDayOverride, setActiveDayOverride] = useState<DayOfWeek | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempHoursTarget, setTempHoursTarget] = useState(weeklyGoals.studyHoursTarget);
  const [tempTasksTarget, setTempTasksTarget] = useState(weeklyGoals.tasksTarget);

  // Compute Overall Progress %
  let totalTopics = 0;
  let completedTopics = 0;
  syllabus.forEach((s) => {
    s.topics.forEach((t) => {
      totalTopics++;
      if (t.completed) completedTopics++;
    });
  });
  const overallProgressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Compute pending tasks count
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  // Compute 7-day study activity dataset for Recharts
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    const dayName = i === 6 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayDisplay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const daySessions = studySessions.filter((s) => s.date === iso);
    const minutes = daySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const hours = parseFloat((minutes / 60).toFixed(1));

    return {
      day: dayName,
      displayDate: dayDisplay,
      iso,
      minutes,
      hours,
      sessionsCount: daySessions.length,
      isToday: i === 6,
    };
  });

  const totalWeeklyMinutes = last7DaysData.reduce((acc, d) => acc + d.minutes, 0);
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / 7);
  const bestDay = [...last7DaysData].sort((a, b) => b.minutes - a.minutes)[0];
  const goalMetDays = last7DaysData.filter((d) => d.minutes >= 120).length;

  // Weekly Goal Calculations
  const completedStudyHours = parseFloat((totalWeeklyMinutes / 60).toFixed(1));
  const targetStudyHours = weeklyGoals.studyHoursTarget;
  const studyHoursPct = Math.min(100, Math.round((completedStudyHours / Math.max(0.1, targetStudyHours)) * 100));
  const studyHoursRemaining = Math.max(0, parseFloat((targetStudyHours - completedStudyHours).toFixed(1)));

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const targetTasks = weeklyGoals.tasksTarget;
  const tasksPct = Math.min(100, Math.round((completedTasksCount / Math.max(1, targetTasks)) * 100));
  const tasksRemaining = Math.max(0, targetTasks - completedTasksCount);

  const activeGoalType = weeklyGoals.activeType;
  const activePct = activeGoalType === 'hours' ? studyHoursPct : tasksPct;
  const activeCompleted = activeGoalType === 'hours' ? `${completedStudyHours} hrs` : `${completedTasksCount} tasks`;
  const activeTarget = activeGoalType === 'hours' ? `${targetStudyHours} hrs` : `${targetTasks} tasks`;
  const isGoalAchieved = activePct >= 100;

  const handleQuickAdjustTarget = (delta: number) => {
    if (activeGoalType === 'hours') {
      const newTarget = Math.max(1, weeklyGoals.studyHoursTarget + delta);
      onUpdateWeeklyGoals({ ...weeklyGoals, studyHoursTarget: newTarget });
    } else {
      const newTarget = Math.max(1, weeklyGoals.tasksTarget + delta);
      onUpdateWeeklyGoals({ ...weeklyGoals, tasksTarget: newTarget });
    }
  };

  const handleToggleGoalType = (type: 'hours' | 'tasks') => {
    onUpdateWeeklyGoals({ ...weeklyGoals, activeType: type });
  };

  const handleSaveCustomGoals = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWeeklyGoals({
      ...weeklyGoals,
      studyHoursTarget: Math.max(1, Number(tempHoursTarget)),
      tasksTarget: Math.max(1, Number(tempTasksTarget)),
    });
    setIsGoalModalOpen(false);
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof last7DaysData[0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const h = Math.floor(data.minutes / 60);
      const m = data.minutes % 60;
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs font-sans min-w-[150px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-1.5">
            <span className="font-bold text-slate-100">{data.day}</span>
            <span className="text-[11px] text-slate-400 font-mono">{data.displayDate}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-slate-400">Study Time:</span>
            <span className="font-mono font-bold text-indigo-300 text-sm">{timeStr}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 mt-1">
            <span>Sessions:</span>
            <span className="font-mono text-slate-200">{data.sessionsCount} logged</span>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>2h Daily Goal:</span>
            <span className={data.minutes >= 120 ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {data.minutes >= 120 ? '✓ Met' : `${Math.max(0, 120 - data.minutes)}m needed`}
            </span>
          </div>
        </div>
      );
    };
    return null;
  };

  // Today's real day of week
  const daysMap: DayOfWeek[] = ['Mon', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDayIndex = new Date().getDay();
  const currentActualDay = daysMap[todayDayIndex] || 'Mon';
  const effectiveDay = activeDayOverride || currentActualDay;

  // Filter timetable for effective day
  const todayClasses = timetable
    .filter((slot) => slot.day === effectiveDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Current active class check
  const now = new Date();
  const currentActiveClass = todayClasses.find((slot) => isTimeInRange(slot.startTime, slot.endTime, now));

  // Tasks due today or general pending tasks
  const todayDateStr = now.toISOString().split('T')[0];
  const todaysTasks = tasks.filter((t) => t.dueDate === todayDateStr || t.status === 'pending');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    onAddTask({
      title: quickTaskTitle.trim(),
      subjectId: selectedSubjectId || subjects[0]?.id,
      dueDate: todayDateStr,
      priority: 'medium',
      status: 'pending',
      type: 'assignment',
    });

    setQuickTaskTitle('');
  };

  const handleTaskCheckbox = (taskId: string, isCompleted: boolean) => {
    onToggleTask(taskId);
    if (!isCompleted) {
      // Completed a task, celebratory mini burst
      try {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#4f46e5', '#10b981', '#f59e0b'],
        });
      } catch {
        // ignore
      }
    }
  };

  // Problem of the day (first non-solved or interesting problem)
  const problemOfTheDay = codingProblems.find((p) => p.status !== 'Solved') || codingProblems[0];

  // Conditionally render based on user's role:
  // 'teacher' -> Teacher Class Management Tools & Faculty Portal
  if (effectiveRole === 'teacher') {
    return (
      <div className="space-y-4">
        {perspectiveOverride && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900">
              Previewing <strong>Teacher Class Management Suite</strong>
            </span>
            <button
              type="button"
              onClick={() => setPerspectiveOverride(null)}
              className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Exit Preview (Return to {currentUser?.role?.toUpperCase() || 'STUDENT'})
            </button>
          </div>
        )}
        <TeacherDashboardView
          currentUser={currentUser || null}
          subjects={subjects}
          tasks={tasks}
          timetable={timetable}
          syllabus={syllabus}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onNavigateTab={onNavigateTab}
          onTriggerAlert={onTriggerAlert}
          onToggleTopic={onToggleTopic}
          onPreviewStudentView={() => setPerspectiveOverride('student')}
        />

        {/* Floating Quick Action Button to open AI Assistant */}
        {!isAiSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsAiSidebarOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 text-white shadow-2xl hover:scale-105 transition-all cursor-pointer border border-indigo-400/30"
            title="Open AI Course Assistant"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-xs font-bold hidden sm:inline">Ask Course AI</span>
          </button>
        )}

        {/* AI Coursework Assistant Sidebar */}
        <AiCourseworkSidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
          subjects={subjects}
          notes={notes || []}
          syllabus={syllabus}
          currentUser={currentUser || null}
        />
      </div>
    );
  }

  // 'admin' -> Institutional Administration & Campus Oversight
  if (effectiveRole === 'admin') {
    return (
      <div className="space-y-4">
        {perspectiveOverride && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-900">
              Previewing <strong>Campus Administration Portal</strong>
            </span>
            <button
              type="button"
              onClick={() => setPerspectiveOverride(null)}
              className="font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
            >
              Exit Preview (Return to {currentUser?.role?.toUpperCase() || 'STUDENT'})
            </button>
          </div>
        )}
        <AdminDashboardView
          currentUser={currentUser || null}
          subjects={subjects}
          tasks={tasks}
          timetable={timetable}
          syllabus={syllabus}
          onNavigateTab={onNavigateTab}
          onTriggerAlert={onTriggerAlert}
          onPreviewStudentView={() => setPerspectiveOverride('student')}
          onPreviewTeacherView={() => setPerspectiveOverride('teacher')}
        />

        {/* Floating Quick Action Button to open AI Assistant */}
        {!isAiSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsAiSidebarOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 text-white shadow-2xl hover:scale-105 transition-all cursor-pointer border border-indigo-400/30"
            title="Open AI Course Assistant"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-xs font-bold hidden sm:inline">Ask Course AI</span>
          </button>
        )}

        {/* AI Coursework Assistant Sidebar */}
        <AiCourseworkSidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
          subjects={subjects}
          notes={notes || []}
          syllabus={syllabus}
          currentUser={currentUser || null}
        />
      </div>
    );
  }

  // 'student' -> Student Productivity Suite
  return (
    <div className="space-y-6">
      {/* If logged in as Teacher/Admin but viewing student view, show banner to return */}
      {(perspectiveOverride || (currentUser?.role && currentUser.role !== 'student')) && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
          <span className="font-semibold text-indigo-900">
            Viewing <strong>Student Productivity Suite</strong> {currentUser?.role ? `(Logged in as ${currentUser.role.toUpperCase()})` : ''}
          </span>
          <button
            type="button"
            onClick={() => setPerspectiveOverride(currentUser?.role || null)}
            className="font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
          >
            Return to {currentUser?.role === 'teacher' ? 'Teacher Class Hub' : currentUser?.role === 'admin' ? 'Admin Hub' : 'Default View'} →
          </button>
        </div>
      )}

      {/* Dynamic Time-of-Day Greeting Component */}
      <DynamicGreeting
        currentUser={currentUser}
        onNavigateTab={onNavigateTab}
        pendingTasksCount={pendingTasks.length}
        todayStudyMinutes={todayStudyMinutes}
      />

      {/* AI Coursework Assistant Launch Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">AI Course Material Assistant</h3>
              <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                Syllabus & Notes
              </span>
            </div>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              Ask questions grounded directly in your syllabus modules and personal lecture notes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAiSidebarOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-indigo-50 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Ask Course Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Metric Cards Grid (Matching User Brief) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Tasks */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Pending Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate-500">of {tasks.length} total</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-indigo-600 font-medium group-hover:underline">
            <span>View assignments</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Subjects */}
        <div
          onClick={() => onNavigateTab('notes')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Enrolled Subjects</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {subjects.length}
            </span>
            <span className="text-xs text-slate-500">courses</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-600 font-medium group-hover:underline">
            <span>Browse lecture notes</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Overall Study Progress */}
        <div
          onClick={() => onNavigateTab('progress')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-sky-300 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Study Progress</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {overallProgressPercent}%
            </span>
            <span className="text-xs text-slate-500">{completedTopics}/{totalTopics} topics</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Study Time Today */}
        <div
          onClick={() => onNavigateTab('pomodoro')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Study Time Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {formatMinutesToHuman(todayStudyMinutes)}
            </span>
            <span className="text-xs text-slate-500">logged</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-amber-700 font-medium group-hover:underline">
            <span>Open Pomodoro timer</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>

      {/* Weekly Goals & 7-Day Study Time Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Weekly Goal Progress Ring & Goal Setter (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Weekly Goal</h2>
                <p className="text-[11px] text-slate-500">Target tasks & study hours per week</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempHoursTarget(weeklyGoals.studyHoursTarget);
                setTempTasksTarget(weeklyGoals.tasksTarget);
                setIsGoalModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Configure goals"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Set Goal</span>
            </button>
          </div>

          {/* Goal Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleToggleGoalType('hours')}
              className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                activeGoalType === 'hours'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Study Hours ({targetStudyHours}h)
            </button>
            <button
              type="button"
              onClick={() => handleToggleGoalType('tasks')}
              className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                activeGoalType === 'tasks'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tasks ({targetTasks} tasks)
            </button>
          </div>

          {/* Central Progress Ring & Counter */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
            {/* SVG Progress Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
                <circle
                  cx="55"
                  cy="55"
                  r="46"
                  stroke="#f1f5f9"
                  strokeWidth="9"
                  fill="transparent"
                />
                <circle
                  cx="55"
                  cy="55"
                  r="46"
                  stroke={activeGoalType === 'hours' ? '#4f46e5' : '#059669'}
                  strokeWidth="9"
                  strokeDasharray={289.03}
                  strokeDashoffset={289.03 * (1 - activePct / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Center percentage and text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <span className="text-2xl font-black font-mono tracking-tight text-slate-900 leading-none">
                  {activePct}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  {activeCompleted}
                </span>
              </div>
            </div>

            {/* Quick adjust & status */}
            <div className="flex flex-col justify-center space-y-2 text-center sm:text-left">
              <div>
                <span className="text-xs text-slate-500 block">Weekly Target</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {activeCompleted} of {activeTarget}
                </span>
              </div>

              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                    isGoalAchieved
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {isGoalAchieved ? (
                    <>
                      <Trophy className="w-3 h-3 text-emerald-600" />
                      <span>Target Achieved!</span>
                    </>
                  ) : (
                    <span>
                      {activeGoalType === 'hours'
                        ? `${studyHoursRemaining}h remaining`
                        : `${tasksRemaining} tasks to go`}
                    </span>
                  )}
                </span>
              </div>

              {/* Quick Stepper Buttons */}
              <div className="flex items-center gap-1 pt-1 justify-center sm:justify-start text-xs">
                <span className="text-[11px] text-slate-400 mr-1">Target:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAdjustTarget(activeGoalType === 'hours' ? -2 : -1)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono font-bold transition-colors"
                  title="Decrease target"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjustTarget(activeGoalType === 'hours' ? 2 : 1)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono font-bold transition-colors"
                  title="Increase target"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempHoursTarget(weeklyGoals.studyHoursTarget);
                    setTempTasksTarget(weeklyGoals.tasksTarget);
                    setIsGoalModalOpen(true);
                  }}
                  className="ml-1 text-[11px] text-indigo-600 hover:underline font-semibold"
                >
                  custom...
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Goal Overview Bar */}
          <div className="pt-3 border-t border-slate-100">
            {activeGoalType === 'hours' ? (
              <div
                onClick={() => handleToggleGoalType('tasks')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-700">Tasks Goal Progress</span>
                  <span className="font-mono text-slate-500">
                    {completedTasksCount}/{targetTasks} ({tasksPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${tasksPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleToggleGoalType('hours')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-700">Study Hours Progress</span>
                  <span className="font-mono text-slate-500">
                    {completedStudyHours}/{targetStudyHours}h ({studyHoursPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${studyHoursPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Study Time Activity Chart Card (Recharts) (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Weekly Study Activity
                </h2>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Last 7 Days
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily focused study hours and consistency tracking
              </p>
            </div>

            {/* Quick Metrics & View Toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">7-Day Total</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatMinutesToHuman(totalWeeklyMinutes)}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Daily Average</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatMinutesToHuman(avgDailyMinutes)}/day
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Met</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {goalMetDays}/7 days
                  </span>
                </div>
              </div>

              {/* Toggle bar vs area */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                    chartType === 'bar'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Bar Chart View"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Bars</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                    chartType === 'area'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Smooth Trend View"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Trend</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Chart Canvas */}
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart
                  data={last7DaysData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    unit="h"
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={2.0}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: '2h Goal',
                      fill: '#059669',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {last7DaysData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isToday ? '#4f46e5' : '#818cf8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart
                  data={last7DaysData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    unit="h"
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={2.0}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: '2h Goal',
                      fill: '#059669',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#studyGradient)"
                    dot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#4338ca', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart Footer Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <span>Today: {formatMinutesToHuman(todayStudyMinutes)}</span>
              </span>
              <span>·</span>
              <span>Peak: {bestDay?.day} ({formatMinutesToHuman(bestDay?.minutes || 0)})</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('pomodoro')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Log study time</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Tasks & Schedule */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Tasks Card (Matches Mockup) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Today's Tasks</h2>
                <p className="text-xs text-slate-500">Stay on top of assignments & lab submissions</p>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View all ({tasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task list with checkboxes */}
            <div className="divide-y divide-slate-100">
              {todaysTasks.slice(0, 5).map((task) => {
                const sub = subjects.find((s) => s.id === task.subjectId);
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className="py-3 flex items-start justify-between gap-3 group transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleTaskCheckbox(task.id, isCompleted)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium tracking-tight truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          {sub && (
                            <span className="font-medium text-slate-600">
                              {sub.code}
                            </span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              task.priority === 'high'
                                ? 'text-rose-600 font-medium'
                                : task.priority === 'medium'
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }
                          >
                            {task.priority.toUpperCase()} Priority
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-xs text-slate-400 font-mono shrink-0 pt-0.5">
                      {task.dueDate === todayDateStr ? 'Today' : task.dueDate}
                    </span>
                  </div>
                );
              })}

              {todaysTasks.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No pending tasks for today. You're all caught up!
                </div>
              )}
            </div>

            {/* Quick Add Task Input */}
            {currentUser?.role !== 'student' ? (
              <form onSubmit={handleQuickAdd} className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="+ Add a quick task for today..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.length === 0 && (
                    <option value="">General</option>
                  )}
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!quickTaskTitle.trim()}
                  className="px-3 py-2 bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Assigned coursework · Click checkbox to mark complete</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('tasks')}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  View All Tasks →
                </button>
              </div>
            )}
          </div>

          {/* Today's College Timetable & Active Class */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Classes for {effectiveDay}
                  </h2>
                  {currentActiveClass && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Class in session!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Live timetable tracker</p>
              </div>

              {/* Day filter selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as DayOfWeek[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setActiveDayOverride(d)}
                    className={`px-2 py-1 rounded transition-colors ${
                      effectiveDay === d
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Class Highlight Banner */}
            {currentActiveClass && (
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    NOW
                  </div>
                  <div>
                    {(() => {
                      const sub = subjects.find((s) => s.id === currentActiveClass.subjectId);
                      return (
                        <>
                          <h3 className="text-sm font-bold text-slate-900">
                            {sub ? sub.name : 'Current Class'}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                            <span className="font-mono font-medium text-emerald-800">
                              {formatTime24To12(currentActiveClass.startTime)} – {formatTime24To12(currentActiveClass.endTime)}
                            </span>
                            <span>·</span>
                            <span>{currentActiveClass.room}</span>
                            <span>·</span>
                            <span>{currentActiveClass.type}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-emerald-700 bg-white/80 px-2 py-1 rounded">
                    {Math.max(0, getTimeUntil(currentActiveClass.endTime, now))}m left
                  </span>
                </div>
              </div>
            )}

            {/* Timetable slot list */}
            <div className="space-y-2">
              {todayClasses.map((slot) => {
                const sub = subjects.find((s) => s.id === slot.subjectId);
                const isActive = currentActiveClass?.id === slot.id;

                return (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center w-24 shrink-0">
                        <span className="text-xs font-mono font-semibold text-slate-800 block">
                          {formatTime24To12(slot.startTime)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatTime24To12(slot.endTime)}
                        </span>
                      </div>

                      <div className="h-8 w-1 rounded-full" style={{ backgroundColor: sub?.color || '#cbd5e1' }} />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {sub ? sub.name : slot.subjectId}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            ({sub?.code})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {slot.room}
                          </span>
                          <span>·</span>
                          <span>{slot.type}</span>
                          {slot.instructor && (
                            <>
                              <span>·</span>
                              <span>{slot.instructor}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        slot.type === 'Lab'
                          ? 'bg-purple-50 text-purple-700'
                          : slot.type === 'Tutorial'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {slot.type}
                    </span>
                  </div>
                );
              })}

              {todayClasses.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-sm">
                  No classes scheduled for {effectiveDay}. Enjoy your study day!
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => onNavigateTab('timetable')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View full Monday–Saturday schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Coding of the Day, Subject Progress snapshot, CGPA preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Coding Problem of the Day */}
          {problemOfTheDay && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Problem of the Day</h3>
                    <p className="text-xs text-slate-500">Sharpen your DSA skills daily</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    problemOfTheDay.difficulty === 'Easy'
                      ? 'text-emerald-700 bg-emerald-50'
                      : problemOfTheDay.difficulty === 'Medium'
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-rose-700 bg-rose-50'
                  }`}
                >
                  {problemOfTheDay.difficulty}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 text-sm">
                    {problemOfTheDay.title}
                  </h4>
                  {problemOfTheDay.url && (
                    <a
                      href={problemOfTheDay.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1"
                    >
                      <span>{problemOfTheDay.platform}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {problemOfTheDay.tags.map((tag) => (
                    <span key={tag} className="text-[11px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {problemOfTheDay.notes && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {problemOfTheDay.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Status:{' '}
                  <span className={problemOfTheDay.status === 'Solved' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                    {problemOfTheDay.status}
                  </span>
                </span>
                <button
                  onClick={() => onNavigateTab('coding')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Practice more questions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Subject Progress Summary */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Curriculum Progress</h3>
                <p className="text-xs text-slate-500">Topic completion per course</p>
              </div>
              <button
                onClick={() => onNavigateTab('progress')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Full syllabus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {subjects.map((sub) => {
                const subSyllabus = syllabus.filter((s) => s.subjectId === sub.id);
                let total = 0;
                let done = 0;
                subSyllabus.forEach((module) => {
                  module.topics.forEach((t) => {
                    total++;
                    if (t.completed) done++;
                  });
                });
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div key={sub.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                        {sub.code}: {sub.name}
                      </span>
                      <span className="font-mono text-slate-500">
                        {done}/{total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: sub.color || '#4f46e5',
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {subjects.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No courses enrolled yet. Add your subjects to start tracking topic completions.
                </div>
              )}
            </div>
          </div>

          {/* Quick Academic Quote / Tips */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>COLLEGE FOCUS TIP</span>
            </div>
            <p className="text-sm font-medium text-slate-200 italic">
              "Consistency beats intensity. 25 minutes of deep focus on DSA or DBMS every day compounds into mastery by semester end."
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-indigo-200/80 pt-3 border-t border-indigo-900/50">
              <span>Semester 3</span>
              <button
                onClick={() => onNavigateTab('cgpa')}
                className="hover:text-white underline underline-offset-2"
              >
                Track target CGPA →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goal Customization Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Set Weekly Goals</h3>
                  <p className="text-[11px] text-slate-500">Customize your study targets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomGoals} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Weekly Study Hours Target (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tempHoursTarget}
                  onChange={(e) => setTempHoursTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Recommended: 14 to 20 hours/week for full-time engineering courses
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Weekly Completed Tasks Target (tasks)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tempTasksTarget}
                  onChange={(e) => setTempTasksTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Recommended: 5 to 10 tasks/week
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg transition-colors"
                >
                  Save Goals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Quick Action Button to open AI Assistant */}
      {!isAiSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsAiSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 text-white shadow-2xl hover:scale-105 transition-all cursor-pointer border border-indigo-400/30"
          title="Open AI Course Assistant"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="text-xs font-bold hidden sm:inline">Ask Course AI</span>
        </button>
      )}

      {/* AI Coursework Assistant Sidebar */}
      <AiCourseworkSidebar
        isOpen={isAiSidebarOpen}
        onClose={() => setIsAiSidebarOpen(false)}
        subjects={subjects}
        notes={notes || []}
        syllabus={syllabus}
        currentUser={currentUser || null}
      />
    </div>
  );
};
