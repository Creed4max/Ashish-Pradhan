import React, { useState } from 'react';
import {
  Subject,
  Task,
  TimetableSlot,
  SubjectSyllabus,
  StudentUser,
  DayOfWeek,
  AppNotification,
} from '../types';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Plus,
  Send,
  Megaphone,
  Check,
  ChevronRight,
  BarChart2,
  Sliders,
  UserCheck,
  UserX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  AlertCircle,
  FileText,
  BadgeCheck,
  Eye,
  Shield,
  Layers,
} from 'lucide-react';
import { formatTime24To12, isTimeInRange } from '../utils/helpers';
import confetti from 'canvas-confetti';
import { WeeklyTaskChart } from './WeeklyTaskChart';

interface TeacherDashboardViewProps {
  currentUser: StudentUser | null;
  subjects: Subject[];
  tasks: Task[];
  timetable: TimetableSlot[];
  syllabus: SubjectSyllabus[];
  onAddTask: (task: Partial<Task>) => void;
  onToggleTask: (taskId: string) => void;
  onNavigateTab: (tab: string) => void;
  onTriggerAlert?: (notification: AppNotification) => void;
  onToggleTopic?: (syllabusId: string, topicId: string) => void;
  onPreviewStudentView: () => void;
}

interface StudentRosterItem {
  id: string;
  name: string;
  rollNo: string;
  status: 'present' | 'late' | 'absent';
}

const DEFAULT_ROSTER: StudentRosterItem[] = [];

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  currentUser,
  subjects,
  tasks,
  timetable,
  syllabus,
  onAddTask,
  onToggleTask,
  onNavigateTab,
  onTriggerAlert,
  onToggleTopic,
  onPreviewStudentView,
}) => {
  // Active course selection for attendance and tools
  const [selectedCourseId, setSelectedCourseId] = useState<string>(subjects[0]?.id || '');
  const [roster, setRoster] = useState<StudentRosterItem[]>(DEFAULT_ROSTER);
  const [rosterSavedMessage, setRosterSavedMessage] = useState<string | null>(null);

  // Quick Add Student to Roster state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');

  // Assignment Creator state
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentSubjectId, setAssignmentSubjectId] = useState(subjects[0]?.id || '');
  const [assignmentDueDate, setAssignmentDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [assignmentPriority, setAssignmentPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [assignmentType, setAssignmentType] = useState<'assignment' | 'project' | 'exam' | 'quiz'>('assignment');
  const [assignmentCreatedSuccess, setAssignmentCreatedSuccess] = useState(false);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementCourseId, setAnnouncementCourseId] = useState<string>('all');
  const [announcementBroadcasted, setAnnouncementBroadcasted] = useState(false);

  // Lecture Mode Timer
  const [isLectureActive, setIsLectureActive] = useState(false);
  const [lectureSeconds, setLectureSeconds] = useState(50 * 60); // 50 mins
  const [lectureTopic, setLectureTopic] = useState('Unit 3: Core Implementation & Live Coding Examples');

  // Days mapping
  const daysMap: DayOfWeek[] = ['Mon', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDayIndex = new Date().getDay();
  const todayDay = daysMap[todayDayIndex] || 'Mon';

  const todayClasses = timetable
    .filter((slot) => slot.day === todayDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const now = new Date();
  const currentActiveClass = todayClasses.find((slot) => isTimeInRange(slot.startTime, slot.endTime, now));

  // Current selected subject object
  const activeSubject = subjects.find((s) => s.id === selectedCourseId) || subjects[0];

  // Syllabus stats for courses
  let totalTopicsCount = 0;
  let deliveredTopicsCount = 0;
  syllabus.forEach((s) => {
    s.topics.forEach((t) => {
      totalTopicsCount++;
      if (t.completed) deliveredTopicsCount++;
    });
  });
  const curriculumCoveragePct = totalTopicsCount > 0
    ? Math.round((deliveredTopicsCount / totalTopicsCount) * 100)
    : 0;

  // Attendance stats
  const presentCount = roster.filter((r) => r.status === 'present').length;
  const lateCount = roster.filter((r) => r.status === 'late').length;
  const absentCount = roster.filter((r) => r.status === 'absent').length;
  const attendanceRate = Math.round(((presentCount + lateCount) / roster.length) * 100);

  // Handle roster status change
  const handleToggleStudentStatus = (studentId: string) => {
    setRoster((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        const nextStatus: StudentRosterItem['status'] =
          student.status === 'present' ? 'late' : student.status === 'late' ? 'absent' : 'present';
        return { ...student, status: nextStatus };
      })
    );
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'present' })));
    setRosterSavedMessage('All students marked present');
    setTimeout(() => setRosterSavedMessage(null), 3000);
  };

  const handleSaveRoster = () => {
    setRosterSavedMessage(`Attendance saved for ${activeSubject?.name || 'Class'} (${presentCount + lateCount}/${roster.length} attended)`);
    try {
      confetti({
        particleCount: 20,
        spread: 30,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
    setTimeout(() => setRosterSavedMessage(null), 3500);
  };

  // Handle assignment dispatch
  const handleDispatchAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim()) return;

    const categoryByType: Record<string, string> = {
      assignment: 'Homework',
      lab: 'Lab Work',
      project: 'Project',
      exam: 'Exam Prep',
      quiz: 'Exam Prep',
    };

    onAddTask({
      title: assignmentTitle.trim(),
      subjectId: assignmentSubjectId || subjects[0]?.id,
      dueDate: assignmentDueDate,
      priority: assignmentPriority,
      status: 'pending',
      type: assignmentType,
      category: categoryByType[assignmentType] || 'Homework',
      tags: [assignmentType, assignmentPriority === 'high' ? 'urgent' : 'graded'],
    });

    const targetSub = subjects.find((s) => s.id === assignmentSubjectId);

    // Also trigger in-app alert for students
    if (onTriggerAlert) {
      onTriggerAlert({
        id: `assign-${Date.now()}`,
        type: 'deadline',
        title: `New Coursework: ${assignmentTitle.trim()}`,
        message: `${currentUser?.name || 'Instructor'} posted a new ${assignmentType} for ${targetSub?.name || 'your class'}. Due: ${assignmentDueDate}`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: assignmentPriority === 'high' ? 'high' : 'medium',
        relatedTab: 'tasks',
      });
    }

    setAssignmentTitle('');
    setAssignmentCreatedSuccess(true);
    setTimeout(() => setAssignmentCreatedSuccess(false), 3500);
  };

  // Handle Broadcast announcement
  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    const targetCourse = announcementCourseId === 'all'
      ? 'All Enrolled Classes'
      : subjects.find((s) => s.id === announcementCourseId)?.name || 'Class';

    if (onTriggerAlert) {
      onTriggerAlert({
        id: `broadcast-${Date.now()}`,
        type: 'custom',
        title: `Faculty Notice: ${targetCourse}`,
        message: announcementText.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high',
        relatedTab: 'notes',
      });
    }

    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setAnnouncementText('');
    setAnnouncementBroadcasted(true);
    setTimeout(() => setAnnouncementBroadcasted(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Faculty Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>FACULTY ACADEMIC OPERATIONS · TEACHER PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Welcome, {currentUser?.name || 'Professor'}
              <span className="text-emerald-400 text-base font-normal">
                ({currentUser?.designation || 'Faculty Instructor'})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl">
              Department of {currentUser?.department || 'Computer Science & Engineering'} · Faculty ID:{' '}
              <span className="font-mono text-emerald-300 font-bold">{currentUser?.facultyId || 'FAC-2024'}</span> ·{' '}
              {todayClasses.length} {todayClasses.length === 1 ? 'lecture' : 'lectures'} scheduled today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onPreviewStudentView}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all backdrop-blur-xs cursor-pointer shadow-xs"
              title="Preview Student productivity suite"
            >
              <Eye className="w-4 h-4 text-emerald-300" />
              <span>Preview Student View</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('timetable')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>Teaching Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Metric KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Courses */}
        <div
          onClick={() => onNavigateTab('progress')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Courses Taught</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {subjects.length}
            </span>
            <span className="text-xs text-slate-500">active sections</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-700 font-medium group-hover:underline">
            <span>Curriculum progress: {curriculumCoveragePct}%</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </div>
        </div>

        {/* Today's Lectures */}
        <div
          onClick={() => onNavigateTab('timetable')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Today's Lectures</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {todayClasses.length}
            </span>
            <span className="text-xs text-slate-500">sessions today</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-teal-700 font-medium group-hover:underline">
            {currentActiveClass ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live: {currentActiveClass.room}
              </span>
            ) : (
              <span>Next: {todayClasses[0] ? formatTime24To12(todayClasses[0].startTime) : 'Done for today'}</span>
            )}
          </div>
        </div>

        {/* Assignments Dispatched */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Assignments & Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {tasks.length}
            </span>
            <span className="text-xs text-slate-500">coursework items</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-indigo-600 font-medium group-hover:underline">
            <span>Review assignments</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </div>
        </div>

        {/* Student Attendance Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {attendanceRate}%
            </span>
            <span className="text-xs text-slate-500">present today</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-purple-700 font-medium">
            <span>{presentCount} present · {lateCount} late · {absentCount} absent</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Class Management Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Class Attendance & Session Hub (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Class & Attendance Roster */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Live Class Roster & Attendance
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select course section and mark student attendance for today's lecture
                </p>
              </div>

              {/* Course Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notification / confirmation message */}
            {rosterSavedMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{rosterSavedMessage}</span>
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-4 font-mono font-semibold">
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {presentCount} Present
                </span>
                <span className="text-amber-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {lateCount} Late
                </span>
                <span className="text-rose-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {absentCount} Absent
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(!isAddStudentOpen)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Student</span>
                </button>
                {roster.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Mark All Present
                  </button>
                )}
                {roster.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveRoster}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                  >
                    Save Attendance
                  </button>
                )}
              </div>
            </div>

            {/* Add Student Inline Form */}
            {isAddStudentOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newStudentName.trim()) return;
                  const newEntry: StudentRosterItem = {
                    id: `stu-${Date.now()}`,
                    name: newStudentName.trim(),
                    rollNo: newStudentRoll.trim() || `ROLL-${roster.length + 1}`,
                    status: 'present',
                  };
                  setRoster((prev) => [...prev, newEntry]);
                  setNewStudentName('');
                  setNewStudentRoll('');
                  setIsAddStudentOpen(false);
                }}
                className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center gap-2 text-xs animate-fadeIn"
              >
                <input
                  type="text"
                  placeholder="Student Full Name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
                <input
                  type="text"
                  placeholder="Roll / Student ID (e.g. CS-101)"
                  value={newStudentRoll}
                  onChange={(e) => setNewStudentRoll(e.target.value)}
                  className="w-full sm:w-44 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddStudentOpen(false)}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Student List */}
            <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
              {roster.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No students in this class roster yet. Click <strong className="text-emerald-700 font-bold">+ Add Student</strong> to add enrolled attendees.
                </div>
              )}
              {roster.map((student) => (
                <div
                  key={student.id}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">
                        {student.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {student.rollNo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleStudentStatus(student.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        student.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : student.status === 'late'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {student.status.toUpperCase()}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Lecture Room & Mode Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Lecture Room: <strong className="text-slate-800">{currentActiveClass?.room || 'Hall 204'}</strong>
              </span>
              <span className="text-[11px] text-slate-400">
                Click status button on any student to cycle Present → Late → Absent
              </span>
            </div>
          </div>

          {/* Weekly Task Analytics (Recharts Bar Chart: Completed vs Pending) */}
          <WeeklyTaskChart
            tasks={tasks}
            onNavigateTasks={() => onNavigateTab('tasks')}
          />

          {/* Curriculum & Syllabus Topic Progress */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Curriculum Delivery & Syllabus Modules
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track topic coverage for {activeSubject?.name || 'Course'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('progress')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <span>Full Syllabus</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subject syllabus items */}
            {(() => {
              const subModules = syllabus.filter((s) => s.subjectId === selectedCourseId);
              if (subModules.length === 0) {
                return (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No curriculum modules loaded yet for this course. Visit the Syllabus tab to add modules.
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {subModules.map((mod) => (
                    <div key={mod.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-2">
                        <span>{mod.moduleName}</span>
                        <span className="font-mono text-slate-500 font-normal">
                          {mod.topics.filter((t) => t.completed).length}/{mod.topics.length} Delivered
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {mod.topics.map((top) => (
                          <div
                            key={top.id}
                            onClick={() => onToggleTopic && onToggleTopic(mod.id, top.id)}
                            className="flex items-center justify-between p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  top.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 group-hover:border-emerald-500'
                                }`}
                              >
                                {top.completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span
                                className={`${
                                  top.completed ? 'line-through text-slate-400' : 'text-slate-700'
                                }`}
                              >
                                {top.title}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                top.completed
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {top.completed ? 'Delivered' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Column: Assignment Dispatcher & Announcements (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Course Assignment Dispatcher */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dispatch Course Assignment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign coursework, lab reports, or midterm tasks
                  </p>
                </div>
              </div>
            </div>

            {assignmentCreatedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Coursework dispatched to students successfully!</span>
              </div>
            )}

            <form onSubmit={handleDispatchAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assignment Title / Topic
                </label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="e.g. Lab 4: Binary Search Tree Balancing & Benchmarks"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Course
                  </label>
                  <select
                    value={assignmentSubjectId}
                    onChange={(e) => setAssignmentSubjectId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Submission Due Date
                  </label>
                  <input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={assignmentType}
                    onChange={(e) => setAssignmentType(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="assignment">Homework Assignment</option>
                    <option value="project">Course Project / Lab</option>
                    <option value="exam">Midterm / Exam Review</option>
                    <option value="quiz">Weekly Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={assignmentPriority}
                    onChange={(e) => setAssignmentPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="high">High (Mandatory)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low (Optional Practice)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!assignmentTitle.trim()}
                className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Post Assignment to Students</span>
              </button>
            </form>
          </div>

          {/* Quick Broadcast Notice to Classes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Broadcast Class Notice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sends instant notification banner to enrolled students
                  </p>
                </div>
              </div>
            </div>

            {announcementBroadcasted && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Class notice broadcasted with sound notification!</span>
              </div>
            )}

            <form onSubmit={handleBroadcastAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recipient Students
                </label>
                <select
                  value={announcementCourseId}
                  onChange={(e) => setAnnouncementCourseId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="all">All Enrolled Students (All Courses)</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code}: {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Announcement Message
                </label>
                <textarea
                  rows={3}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. Please bring your laptops for the Graph Traversal lab tomorrow. Office hours rescheduled to 4 PM."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!announcementText.trim()}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Send Alert to Students</span>
              </button>
            </form>
          </div>

          {/* Quick Faculty Office Hours Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                FACULTY CONSULTATION
              </span>
              <span className="text-[11px] text-slate-400">Room 304</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Office Hours: Mon & Thu 3:00 PM – 5:00 PM</h4>
              <p className="text-xs text-slate-300 mt-1">
                Open for student project guidance, syllabus clarifications, and exam prep doubts.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Next Slot: Tomorrow 3:00 PM</span>
              <button
                type="button"
                onClick={() => onNavigateTab('notes')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Upload Lecture Notes →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
