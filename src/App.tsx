/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Subject,
  Task,
  TimetableSlot,
  Note,
  SubjectSyllabus,
  Semester,
  CodingProblem,
  PomodoroSettings,
  StudySession,
  WeeklyGoals,
  StudentUser,
  DayOfWeek,
  AppThemeId,
  AppNotification,
  NotificationSettings,
  AuthSession,
} from './types';
import { Storage, createStudentUser, isUserProfileComplete } from './utils/storage';
import { isTimeInRange } from './utils/helpers';
import { applyThemeToDocument } from './utils/theme';
import {
  evaluateReminders,
  playNotificationSound,
  showSystemNotification,
} from './utils/notifications';
import { Navbar } from './components/Navbar';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TasksView } from './components/TasksView';
import { NotesView } from './components/NotesView';
import { TimetableView } from './components/TimetableView';
import { StudyProgressView } from './components/StudyProgressView';
import { CgpaCalculatorView } from './components/CgpaCalculatorView';
import { PomodoroView } from './components/PomodoroView';
import { CodingPracticeView } from './components/CodingPracticeView';
import { LoginPageView } from './components/LoginPageView';
import { CampusOsSplashView } from './components/CampusOsSplashView';
import { ProfileCompletionView } from './components/ProfileCompletionView';
import { SessionTokenManager } from './components/SessionTokenManager';
import { BackupModal } from './components/BackupModal';
import { ToastNotificationContainer } from './components/ToastNotificationContainer';
import { NotificationDrawer } from './components/NotificationDrawer';

export default function App() {
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(() => Storage.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('welcome');
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    Storage.getNotifications()
  );
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    Storage.getNotificationSettings()
  );
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);

  // Core Data States
  const [subjects, setSubjects] = useState<Subject[]>(() => Storage.getSubjects());
  const [tasks, setTasks] = useState<Task[]>(() => Storage.getTasks());
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => Storage.getTimetable());
  const [notes, setNotes] = useState<Note[]>(() => Storage.getNotes());
  const [syllabus, setSyllabus] = useState<SubjectSyllabus[]>(() => Storage.getSyllabus());
  const [semesters, setSemesters] = useState<Semester[]>(() => Storage.getSemesters());
  const [codingProblems, setCodingProblems] = useState<CodingProblem[]>(() => Storage.getCodingProblems());
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(() => Storage.getPomodoroSettings());
  const [studySessions, setStudySessions] = useState<StudySession[]>(() => Storage.getStudySessions());
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>(() => Storage.getWeeklyGoals());
  const [currentTheme, setCurrentTheme] = useState<AppThemeId>(() => Storage.getTheme());

  // Session & Refresh Token States
  const [session, setSession] = useState<AuthSession | null>(() => Storage.getSession());
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  // Maintain active token session for signed-in user
  useEffect(() => {
    if (currentUser && !session) {
      const newSess = Storage.createLocalSession(currentUser.id, currentUser.email, 15);
      setSession(newSess);
    }
  }, [currentUser, session]);

  // Apply theme to document element on mount and change
  useEffect(() => {
    applyThemeToDocument(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = (newTheme: AppThemeId) => {
    setCurrentTheme(newTheme);
    Storage.saveTheme(newTheme);
    applyThemeToDocument(newTheme);
  };

  // Reload all from storage
  const reloadData = () => {
    setSubjects(Storage.getSubjects());
    setTasks(Storage.getTasks());
    setTimetable(Storage.getTimetable());
    setNotes(Storage.getNotes());
    setSyllabus(Storage.getSyllabus());
    setSemesters(Storage.getSemesters());
    setCodingProblems(Storage.getCodingProblems());
    setPomodoroSettings(Storage.getPomodoroSettings());
    setStudySessions(Storage.getStudySessions());
    setWeeklyGoals(Storage.getWeeklyGoals());
    setCurrentUser(Storage.getCurrentUser());
    setSession(Storage.getSession());
    setNotifications(Storage.getNotifications());
    setNotificationSettings(Storage.getNotificationSettings());
    const savedTheme = Storage.getTheme();
    setCurrentTheme(savedTheme);
    applyThemeToDocument(savedTheme);
  };

  // Notification Handlers
  const handleTriggerAlert = (newNotif: AppNotification) => {
    setNotifications((prev) => {
      // Avoid duplicate alert with same id
      if (prev.some((n) => n.id === newNotif.id)) return prev;
      const updated = [newNotif, ...prev].slice(0, 50); // keep recent 50
      Storage.saveNotifications(updated);
      return updated;
    });

    // Add to floating in-app toasts
    setActiveToasts((prev) => [newNotif, ...prev.filter((t) => t.id !== newNotif.id)]);

    // Play chime sound if enabled
    if (notificationSettings.sound) {
      playNotificationSound();
    }

    // Native browser notification if enabled
    if (notificationSettings.browserNotifications) {
      showSystemNotification(newNotif.title, newNotif.message);
    }

    // Auto-dismiss toast after 6.5 seconds
    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== newNotif.id));
    }, 6500);
  };

  const handleDismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      Storage.saveNotifications(updated);
      return updated;
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      Storage.saveNotifications(updated);
      return updated;
    });
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    Storage.saveNotifications([]);
    setActiveToasts([]);
  };

  const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    Storage.saveNotificationSettings(newSettings);
  };

  // Test Notification Trigger so user can immediately experience alerts & audio
  const handleTriggerTestNotification = () => {
    const isSlotSample = Math.random() > 0.5;
    const testNotif: AppNotification = isSlotSample
      ? {
          id: `test-slot-${Date.now()}`,
          type: 'class_starting',
          title: 'Class Starting in 10 mins: CS201 Algorithms',
          message: 'Lecture at 10:00 AM · Room 302 with Prof. Turing',
          timestamp: new Date().toISOString(),
          read: false,
          actionTab: 'timetable',
          urgent: false,
        }
      : {
          id: `test-task-${Date.now()}`,
          type: 'task_deadline',
          title: 'Task Deadline Today: Binary Trees Assignment',
          message: 'Course: Computer Science · Due today at 11:59 PM',
          timestamp: new Date().toISOString(),
          read: false,
          actionTab: 'tasks',
          urgent: true,
        };

    handleTriggerAlert(testNotif);
  };

  // Scheduled Reminder Engine: Evaluates tasks & timetable slots every 30 seconds
  useEffect(() => {
    // Initial check
    evaluateReminders(
      tasks,
      timetable,
      subjects,
      notificationSettings,
      notifications,
      handleTriggerAlert
    );

    const intervalTimer = setInterval(() => {
      evaluateReminders(
        tasks,
        timetable,
        subjects,
        notificationSettings,
        notifications,
        handleTriggerAlert
      );
    }, 30000);

    return () => clearInterval(intervalTimer);
  }, [tasks, timetable, subjects, notificationSettings, notifications]);

  const handleLoginSuccess = (user: StudentUser) => {
    setCurrentUser(user);
    Storage.saveCurrentUser(user);

    // Issue fresh active session tokens
    const newSess = Storage.createLocalSession(user.id, user.email, 15);
    setSession(newSess);

    const isComplete = Boolean(user.isProfileComplete && isUserProfileComplete(user));
    if (!isComplete) {
      setActiveTab('profile-setup');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshingToken(true);
    try {
      const updated = await Storage.refreshSessionToken(session);
      setSession(updated);
      handleTriggerAlert({
        id: `refresh-${Date.now()}`,
        type: 'system',
        title: 'Security Session Renewed',
        message: 'Access and refresh tokens successfully renewed. Session extended for 15 minutes.',
        timestamp: new Date().toISOString(),
        read: false,
        urgent: false,
      });
    } catch (err) {
      console.error('Failed to refresh token:', err);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleProfileComplete = (completedUser: StudentUser) => {
    setCurrentUser(completedUser);
    Storage.saveCurrentUser(completedUser);

    // Sync with registered accounts
    const registered = Storage.getRegisteredUsers();
    const idx = registered.findIndex(
      (u) =>
        u.id === completedUser.id ||
        (u.email && completedUser.email && u.email.toLowerCase() === completedUser.email.toLowerCase())
    );
    if (idx >= 0) {
      registered[idx] = {
        ...registered[idx],
        ...completedUser,
        isProfileComplete: true,
      };
      Storage.saveRegisteredUsers(registered);
    } else {
      Storage.registerNewUser({
        ...completedUser,
        isProfileComplete: true,
      });
    }

    setActiveTab('dashboard');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    Storage.saveCurrentUser(null);
    Storage.saveSession(null);
    setSession(null);
    setActiveTab('welcome');
  };

  const handleUpdateWeeklyGoals = (newGoals: WeeklyGoals) => {
    setWeeklyGoals(newGoals);
    Storage.saveWeeklyGoals(newGoals);
  };

  // Keyboard shortcut navigation (1 to 9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const tabs = ['welcome', 'login', 'dashboard', 'tasks', 'notes', 'timetable', 'progress', 'cgpa', 'pomodoro', 'coding'];
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        if (tabs[index]) {
          setActiveTab(tabs[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync to storage
  const handleUpdateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    Storage.saveTasks(newTasks);
  };

  const handleAddTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      subjectId: taskData.subjectId || subjects[0]?.id || '',
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      type: taskData.type || 'assignment',
    };
    const updated = [newTask, ...tasks];
    handleUpdateTasks(updated);
  };

  const handleEditTask = (taskId: string, updates: Partial<Task>) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    handleUpdateTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    handleUpdateTasks(updated);
  };

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const isDone = t.status === 'completed';
      return {
        ...t,
        status: (isDone ? 'pending' : 'completed') as Task['status'],
        completedAt: !isDone ? new Date().toISOString() : undefined,
      };
    });
    handleUpdateTasks(updated);
  };

  // Subjects & Notes handlers
  const handleAddSubject = (newSubject: Subject) => {
    const updated = [...subjects, newSubject];
    setSubjects(updated);
    Storage.saveSubjects(updated);
  };

  const handleAddNote = (newNoteData: Partial<Note>) => {
    const newNote: Note = {
      id: newNoteData.id || `note-${Date.now()}`,
      title: newNoteData.title || 'Untitled Note',
      subjectId: newNoteData.subjectId || subjects[0]?.id || '',
      content: newNoteData.content || '',
      tags: newNoteData.tags || [],
      isPinned: newNoteData.isPinned || false,
      createdAt: newNoteData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    Storage.saveNotes(updated);
  };

  const handleUpdateNote = (noteId: string, updates: Partial<Note>) => {
    const updated = notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n));
    setNotes(updated);
    Storage.saveNotes(updated);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    Storage.saveNotes(updated);
  };

  // Timetable handlers
  const handleAddTimetableSlot = (slotData: Partial<TimetableSlot>) => {
    const newSlot: TimetableSlot = {
      id: `slot-${Date.now()}`,
      day: slotData.day || 'Mon',
      startTime: slotData.startTime || '09:00',
      endTime: slotData.endTime || '10:00',
      subjectId: slotData.subjectId || subjects[0]?.id || '',
      room: slotData.room || 'Hall A',
      type: slotData.type || 'Lecture',
      instructor: slotData.instructor,
    };
    const updated = [...timetable, newSlot];
    setTimetable(updated);
    Storage.saveTimetable(updated);
  };

  const handleUpdateTimetableSlot = (slotId: string, updates: Partial<TimetableSlot>) => {
    const updated = timetable.map((s) => (s.id === slotId ? { ...s, ...updates } : s));
    setTimetable(updated);
    Storage.saveTimetable(updated);
  };

  const handleDeleteTimetableSlot = (slotId: string) => {
    const updated = timetable.filter((s) => s.id !== slotId);
    setTimetable(updated);
    Storage.saveTimetable(updated);
  };

  // Syllabus handlers
  const handleToggleTopic = (syllabusId: string, topicId: string) => {
    const updated = syllabus.map((s) => {
      if (s.id !== syllabusId) return s;
      return {
        ...s,
        topics: s.topics.map((t) => (t.id === topicId ? { ...t, completed: !t.completed } : t)),
      };
    });
    setSyllabus(updated);
    Storage.saveSyllabus(updated);
  };

  const handleAddTopic = (syllabusId: string, topicTitle: string) => {
    const updated = syllabus.map((s) => {
      if (s.id !== syllabusId) return s;
      return {
        ...s,
        topics: [...s.topics, { id: `top-${Date.now()}`, title: topicTitle, completed: false }],
      };
    });
    setSyllabus(updated);
    Storage.saveSyllabus(updated);
  };

  const handleAddModule = (subjectId: string, moduleName: string) => {
    const newMod: SubjectSyllabus = {
      id: `syl-${Date.now()}`,
      subjectId,
      moduleName,
      topics: [],
    };
    const updated = [...syllabus, newMod];
    setSyllabus(updated);
    Storage.saveSyllabus(updated);
  };

  // Semesters & GPA
  const handleUpdateSemesters = (updatedSemesters: Semester[]) => {
    setSemesters(updatedSemesters);
    Storage.saveSemesters(updatedSemesters);
  };

  // Coding Problems handlers
  const handleAddCodingProblem = (p: Partial<CodingProblem>) => {
    const newProblem: CodingProblem = {
      id: p.id || `code-${Date.now()}`,
      title: p.title || 'Untitled Problem',
      platform: p.platform || 'LeetCode',
      difficulty: p.difficulty || 'Medium',
      tags: p.tags || [],
      status: p.status || 'Todo',
      url: p.url,
      solutionSnippet: p.solutionSnippet,
      notes: p.notes,
      solvedAt: p.solvedAt,
    };
    const updated = [newProblem, ...codingProblems];
    setCodingProblems(updated);
    Storage.saveCodingProblems(updated);
  };

  const handleUpdateCodingProblem = (id: string, updates: Partial<CodingProblem>) => {
    const updated = codingProblems.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setCodingProblems(updated);
    Storage.saveCodingProblems(updated);
  };

  const handleDeleteCodingProblem = (id: string) => {
    const updated = codingProblems.filter((p) => p.id !== id);
    setCodingProblems(updated);
    Storage.saveCodingProblems(updated);
  };

  // Pomodoro & Study session logging
  const handleUpdatePomodoroSettings = (newSettings: PomodoroSettings) => {
    setPomodoroSettings(newSettings);
    Storage.savePomodoroSettings(newSettings);
  };

  const handleLogStudySession = (newSession: StudySession) => {
    const updated = [newSession, ...studySessions];
    setStudySessions(updated);
    Storage.saveStudySessions(updated);
  };

  // Total study minutes today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStudyMinutes = studySessions
    .filter((s) => s.date === todayStr)
    .reduce((acc, curr) => acc + curr.durationMinutes, 0);

  // Check if any class is active right now
  const now = new Date();
  const dayNames: DayOfWeek[] = ['Mon', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = dayNames[now.getDay()];
  const isClassActiveNow = timetable.some(
    (slot) => slot.day === todayDay && isTimeInRange(slot.startTime, slot.endTime, now)
  );

  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length;

  // Step 1: First show RITE-OS only with Enter button directly below
  if (activeTab === 'welcome') {
    return (
      <div
        className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased theme-root transition-colors duration-200"
        data-theme={currentTheme}
      >
        <CampusOsSplashView
          onEnter={() => setActiveTab('login')}
          currentTheme={currentTheme}
          onSelectTheme={handleSelectTheme}
          currentUser={currentUser}
        />
      </div>
    );
  }

  // Step 2: If user navigates to login or has not logged in yet, show clean full-screen Login
  if (activeTab === 'login' || !currentUser) {
    return (
      <div
        className="min-h-screen w-full flex flex-col antialiased theme-root transition-colors duration-200"
        data-theme={currentTheme}
      >
        <LoginPageView
          onLoginSuccess={handleLoginSuccess}
          onNavigateLanding={() => setActiveTab('welcome')}
          currentTheme={currentTheme}
          onSelectTheme={handleSelectTheme}
        />
      </div>
    );
  }

  // Step 2.5: Enforce check for 'isProfileComplete' on the user object;
  // Redirect users to a new profile completion setup flow if their registration data is missing before they can access the dashboard.
  const isProfileComplete = Boolean(
    currentUser.isProfileComplete && isUserProfileComplete(currentUser)
  );

  if (!isProfileComplete || activeTab === 'profile-setup') {
    return (
      <div
        className="min-h-screen w-full flex flex-col antialiased theme-root transition-colors duration-200"
        data-theme={currentTheme}
      >
        <ProfileCompletionView
          currentUser={currentUser}
          onProfileComplete={handleProfileComplete}
          onSignOut={handleSignOut}
          currentTheme={currentTheme}
          onSelectTheme={handleSelectTheme}
        />
      </div>
    );
  }

  // Step 3: Workspace with Dashboard, Tasks, Notes, Timetable, etc.
  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased theme-root transition-colors duration-200"
      data-theme={currentTheme}
    >
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        onOpenNewTask={() => setActiveTab('tasks')}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenLogin={() => setActiveTab('login')}
        onSignOut={handleSignOut}
        todayStudyMinutes={todayStudyMinutes}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
        session={session}
        onRefreshToken={handleRefreshToken}
        isRefreshingToken={isRefreshingToken}
      />

      {/* Main Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        pendingTasksCount={pendingTasksCount}
        isClassActiveNow={isClassActiveNow}
        currentUser={currentUser}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            subjects={subjects}
            tasks={tasks}
            timetable={timetable}
            syllabus={syllabus}
            notes={notes}
            codingProblems={codingProblems}
            studySessions={studySessions}
            todayStudyMinutes={todayStudyMinutes}
            weeklyGoals={weeklyGoals}
            onUpdateWeeklyGoals={handleUpdateWeeklyGoals}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onTriggerAlert={handleTriggerAlert}
            onToggleTopic={handleToggleTopic}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            subjects={subjects}
            currentUser={currentUser}
            isReadOnly={currentUser?.role === 'student'}
            onAddTask={handleAddTask}
            onUpdateTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onToggleTask={handleToggleTask}
          />
        )}

        {activeTab === 'notes' && (
          <NotesView
            notes={notes}
            subjects={subjects}
            currentUser={currentUser}
            isReadOnly={currentUser?.role === 'student'}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onAddSubject={handleAddSubject}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableView
            timetable={timetable}
            subjects={subjects}
            currentUser={currentUser}
            isReadOnly={currentUser?.role === 'student'}
            onAddSlot={handleAddTimetableSlot}
            onUpdateSlot={handleUpdateTimetableSlot}
            onDeleteSlot={handleDeleteTimetableSlot}
          />
        )}

        {activeTab === 'progress' && (
          <StudyProgressView
            subjects={subjects}
            syllabus={syllabus}
            onToggleTopic={handleToggleTopic}
            onAddTopic={handleAddTopic}
            onAddModule={handleAddModule}
          />
        )}

        {activeTab === 'cgpa' && (
          <CgpaCalculatorView
            semesters={semesters}
            onUpdateSemesters={handleUpdateSemesters}
          />
        )}

        {activeTab === 'pomodoro' && currentUser?.role !== 'admin' && (
          <PomodoroView
            subjects={subjects}
            settings={pomodoroSettings}
            studySessions={studySessions}
            onUpdateSettings={handleUpdatePomodoroSettings}
            onLogStudySession={handleLogStudySession}
          />
        )}

        {activeTab === 'coding' && (
          <CodingPracticeView
            problems={codingProblems}
            onAddProblem={handleAddCodingProblem}
            onUpdateProblem={handleUpdateCodingProblem}
            onDeleteProblem={handleDeleteCodingProblem}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 font-serif">RITE-OS</span>
            <span>·</span>
            <span>Radhakrishna Institute of Technology & Engineering</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-slate-400">
              Shortcuts: <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Alt + 1..8</kbd> to switch tabs
            </span>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Export / Import Data
            </button>
          </div>
        </div>
      </footer>

      {/* Backup & Data Management Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataReload={reloadData}
      />

      {/* Floating In-App Toast Notifications for Deadlines & Classes */}
      <ToastNotificationContainer
        toasts={activeToasts}
        onDismiss={handleDismissToast}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Notifications & Reminders Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        notifications={notifications}
        settings={notificationSettings}
        onUpdateSettings={handleUpdateNotificationSettings}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAllNotifications}
        onTriggerTestNotification={handleTriggerTestNotification}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Session Expiration & Refresh Token Manager */}
      <SessionTokenManager
        session={session}
        currentUser={currentUser}
        onRefreshToken={handleRefreshToken}
        onSignOut={handleSignOut}
        isRefreshing={isRefreshingToken}
      />
    </div>
  );
}
