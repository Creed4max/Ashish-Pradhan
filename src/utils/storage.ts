import {
  Subject,
  Note,
  Task,
  TimetableSlot,
  SubjectSyllabus,
  Semester,
  CodingProblem,
  PomodoroSettings,
  StudySession,
  WeeklyGoals,
  StudentUser,
  UserRole,
  AppThemeId,
  AppNotification,
  NotificationSettings,
  AuthSession,
} from '../types';

const STORAGE_KEYS = {
  SUBJECTS: 'campusos_subjects_v3',
  NOTES: 'campusos_notes_v3',
  TASKS: 'campusos_tasks_v3',
  TIMETABLE: 'campusos_timetable_v3',
  SYLLABUS: 'campusos_syllabus_v3',
  SEMESTERS: 'campusos_semesters_v3',
  CODING: 'campusos_coding_v3',
  POMODORO_SETTINGS: 'campusos_pomo_settings_v3',
  STUDY_SESSIONS: 'campusos_study_sessions_v3',
  GRADING_SCALE: 'campusos_grading_scale_v3',
  WEEKLY_GOALS: 'campusos_weekly_goals_v3',
  CURRENT_USER: 'campusos_student_user_v3',
  THEME: 'campusos_theme_v3',
  NOTIFICATIONS: 'campusos_notifications_v3',
  NOTIFICATION_SETTINGS: 'campusos_notification_settings_v3',
  CLEARED_V3_FLAG: 'campusos_cleared_predefined_v3_clean',
  REGISTERED_ACCOUNTS: 'campusos_registered_accounts_v3',
  AUTH_SESSION: 'campusos_auth_session_v3',
};

// Purge any legacy predefined cached data once so user gets a pristine clean state
try {
  if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEYS.CLEARED_V3_FLAG)) {
    const legacyPrefixes = ['campusos_subjects_', 'campusos_notes_', 'campusos_tasks_', 'campusos_timetable_', 'campusos_syllabus_', 'campusos_semesters_', 'campusos_coding_', 'campusos_study_sessions_', 'campusos_student_user_', 'campusos_weekly_goals_', 'campusos_notifications_'];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (legacyPrefixes.some(p => key.startsWith(p)) || key.startsWith('campusos_'))) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(STORAGE_KEYS.CLEARED_V3_FLAG, 'true');
  }
} catch {
  // localStorage might be unavailable in some iframe sandboxes
}

// Clean Default States (No predefined data!)
export const DEFAULT_SUBJECTS: Subject[] = [];
export const DEFAULT_TASKS: Task[] = [];
export const DEFAULT_TIMETABLE: TimetableSlot[] = [];
export const DEFAULT_NOTES: Note[] = [];
export const DEFAULT_SYLLABUS: SubjectSyllabus[] = [];
export const DEFAULT_SEMESTERS: Semester[] = [];
export const DEFAULT_CODING_PROBLEMS: CodingProblem[] = [];
export const DEFAULT_STUDY_SESSIONS: StudySession[] = [];

export const DEFAULT_POMO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
};

export const DEFAULT_WEEKLY_GOALS: WeeklyGoals = {
  studyHoursTarget: 10,
  tasksTarget: 5,
  activeType: 'hours',
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  browserNotifications: false,
  taskAlertHoursBefore: 24,
  classAlertMinutesBefore: 15,
};

export const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

export const DEFAULT_USER: StudentUser | null = null;

export interface RegisteredAccount extends StudentUser {
  password?: string;
}

export const DEFAULT_REGISTERED_USERS: RegisteredAccount[] = [
  {
    id: 'user-ashish-01',
    name: 'Ashish Kumar',
    email: 'ashish.cse@riteindia.edu.in',
    role: 'student',
    university: 'Radhakrishna Institute of Technology and Engineering (RITE)',
    major: 'Computer Science & Engineering',
    semester: 'Semester 5',
    studentId: '2201289045',
    avatarColor: '#4f46e5',
    joinedAt: '2026-08-01T00:00:00.000Z',
    password: 'password123',
    isProfileComplete: true,
  },
  {
    id: 'user-swain-02',
    name: 'Dr. Debabrata Swain',
    email: 'd.swain@riteindia.edu.in',
    role: 'teacher',
    university: 'Radhakrishna Institute of Technology and Engineering (RITE)',
    major: 'Computer Science & Engineering',
    semester: '',
    studentId: 'FAC-CSE-102',
    department: 'Computer Science & Engineering',
    designation: 'HOD & Professor',
    facultyId: 'FAC-CSE-102',
    avatarColor: '#059669',
    joinedAt: '2026-07-15T00:00:00.000Z',
    password: 'password123',
    isProfileComplete: true,
  },
  {
    id: 'user-admin-03',
    name: 'Academic Administrator',
    email: 'admin@riteindia.edu.in',
    role: 'admin',
    university: 'Radhakrishna Institute of Technology and Engineering (RITE)',
    major: 'Institutional Governance',
    semester: '',
    studentId: 'ADM-8800',
    adminOffice: 'Office of Academic Affairs',
    adminCode: 'ADM-8800',
    avatarColor: '#7c3aed',
    joinedAt: '2026-01-01T00:00:00.000Z',
    password: 'admin',
    isProfileComplete: true,
  },
];

// Helper to determine if a user's registration and profile data is fully complete
export const isUserProfileComplete = (user: StudentUser | null): boolean => {
  if (!user) return false;
  if (!user.isProfileComplete) return false;

  // Basic common profile requirements
  const hasBasicInfo = Boolean(
    user.name?.trim() &&
    user.email?.trim() &&
    user.university?.trim()
  );
  if (!hasBasicInfo) return false;

  if (user.role === 'student') {
    return Boolean(
      user.major?.trim() &&
      user.semester?.trim() &&
      user.studentId?.trim()
    );
  } else if (user.role === 'teacher') {
    return Boolean(
      user.department?.trim() &&
      user.designation?.trim() &&
      (user.facultyId?.trim() || user.studentId?.trim())
    );
  } else if (user.role === 'admin') {
    return Boolean(
      user.adminOffice?.trim() &&
      (user.adminCode?.trim() || user.studentId?.trim())
    );
  }

  return true;
};

// Helper to create a new user profile supporting Student, Teacher, and Admin roles
export const createStudentUser = (
  name = 'Student',
  email?: string,
  role: UserRole = 'student',
  extra?: Partial<StudentUser>
): StudentUser => {
  const defaultName = role === 'teacher' ? 'Faculty Member' : role === 'admin' ? 'Campus Admin' : 'Student';
  const cleanName = name.trim() || defaultName;
  const cleanEmail = email?.trim() || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@campus.edu`;
  
  return {
    id: `user-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    role,
    university: extra?.university || '',
    major: extra?.major || (role === 'student' ? '' : extra?.department || ''),
    semester: extra?.semester || (role === 'student' ? 'Semester 1' : ''),
    studentId: extra?.studentId || (
      role === 'teacher' 
        ? `FAC-${Math.floor(100 + Math.random() * 900)}` 
        : role === 'admin' 
        ? `ADM-${Math.floor(100 + Math.random() * 900)}` 
        : `STU-${Math.floor(1000 + Math.random() * 9000)}`
    ),
    avatarColor: extra?.avatarColor || (role === 'teacher' ? '#059669' : role === 'admin' ? '#7c3aed' : '#4f46e5'),
    joinedAt: new Date().toISOString(),
    department: extra?.department || '',
    designation: extra?.designation || (role === 'teacher' ? 'Assistant Professor' : ''),
    facultyId: extra?.facultyId || '',
    adminOffice: extra?.adminOffice || (role === 'admin' ? 'System Administration' : ''),
    adminCode: extra?.adminCode || '',
    ...extra,
  };
};

// LocalStorage helpers with fallbacks
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save to localStorage for key ${key}`, e);
  }
}

export const Storage = {
  getSubjects: (): Subject[] => load(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS),
  saveSubjects: (data: Subject[]) => save(STORAGE_KEYS.SUBJECTS, data),

  getTasks: (): Task[] => load(STORAGE_KEYS.TASKS, DEFAULT_TASKS),
  saveTasks: (data: Task[]) => save(STORAGE_KEYS.TASKS, data),

  getTimetable: (): TimetableSlot[] => load(STORAGE_KEYS.TIMETABLE, DEFAULT_TIMETABLE),
  saveTimetable: (data: TimetableSlot[]) => save(STORAGE_KEYS.TIMETABLE, data),

  getNotes: (): Note[] => load(STORAGE_KEYS.NOTES, DEFAULT_NOTES),
  saveNotes: (data: Note[]) => save(STORAGE_KEYS.NOTES, data),

  getSyllabus: (): SubjectSyllabus[] => load(STORAGE_KEYS.SYLLABUS, DEFAULT_SYLLABUS),
  saveSyllabus: (data: SubjectSyllabus[]) => save(STORAGE_KEYS.SYLLABUS, data),

  getSemesters: (): Semester[] => load(STORAGE_KEYS.SEMESTERS, DEFAULT_SEMESTERS),
  saveSemesters: (data: Semester[]) => save(STORAGE_KEYS.SEMESTERS, data),

  getCodingProblems: (): CodingProblem[] => load(STORAGE_KEYS.CODING, DEFAULT_CODING_PROBLEMS),
  saveCodingProblems: (data: CodingProblem[]) => save(STORAGE_KEYS.CODING, data),

  getPomodoroSettings: (): PomodoroSettings => load(STORAGE_KEYS.POMODORO_SETTINGS, DEFAULT_POMO_SETTINGS),
  savePomodoroSettings: (data: PomodoroSettings) => save(STORAGE_KEYS.POMODORO_SETTINGS, data),

  getStudySessions: (): StudySession[] => load(STORAGE_KEYS.STUDY_SESSIONS, DEFAULT_STUDY_SESSIONS),
  saveStudySessions: (data: StudySession[]) => save(STORAGE_KEYS.STUDY_SESSIONS, data),

  getWeeklyGoals: (): WeeklyGoals => load(STORAGE_KEYS.WEEKLY_GOALS, DEFAULT_WEEKLY_GOALS),
  saveWeeklyGoals: (data: WeeklyGoals) => save(STORAGE_KEYS.WEEKLY_GOALS, data),

  getCurrentUser: (): StudentUser | null => load<StudentUser | null>(STORAGE_KEYS.CURRENT_USER, null),
  saveCurrentUser: (user: StudentUser | null) => {
    if (user === null) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      save(STORAGE_KEYS.CURRENT_USER, user);
    }
  },

  getRegisteredUsers: (): RegisteredAccount[] => load<RegisteredAccount[]>(STORAGE_KEYS.REGISTERED_ACCOUNTS, DEFAULT_REGISTERED_USERS),
  saveRegisteredUsers: (users: RegisteredAccount[]) => save(STORAGE_KEYS.REGISTERED_ACCOUNTS, users),
  registerNewUser: (newUser: RegisteredAccount): RegisteredAccount => {
    const existing = Storage.getRegisteredUsers();
    const cleanEmail = newUser.email.trim().toLowerCase();
    const cleanId = newUser.studentId.trim().toLowerCase();
    const filtered = existing.filter(
      (u) => u.email.trim().toLowerCase() !== cleanEmail && u.studentId.trim().toLowerCase() !== cleanId
    );
    const updated = [newUser, ...filtered];
    Storage.saveRegisteredUsers(updated);
    return newUser;
  },
  findRegisteredUser: (identifier: string, role?: UserRole): RegisteredAccount | null => {
    const users = Storage.getRegisteredUsers();
    const clean = identifier.trim().toLowerCase();
    return (
      users.find((u) => {
        const matchRole = !role || u.role === role;
        const matchId =
          u.email.trim().toLowerCase() === clean ||
          u.studentId.trim().toLowerCase() === clean ||
          (u.facultyId && u.facultyId.trim().toLowerCase() === clean) ||
          (u.adminCode && u.adminCode.trim().toLowerCase() === clean) ||
          u.name.trim().toLowerCase() === clean;
        return matchRole && matchId;
      }) || null
    );
  },

  getTheme: (): AppThemeId => load<AppThemeId>(STORAGE_KEYS.THEME, 'rite'),
  saveTheme: (theme: AppThemeId) => save(STORAGE_KEYS.THEME, theme),

  exportAllData: (): string => {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      subjects: Storage.getSubjects(),
      tasks: Storage.getTasks(),
      timetable: Storage.getTimetable(),
      notes: Storage.getNotes(),
      syllabus: Storage.getSyllabus(),
      semesters: Storage.getSemesters(),
      coding: Storage.getCodingProblems(),
      pomodoroSettings: Storage.getPomodoroSettings(),
      studySessions: Storage.getStudySessions(),
      weeklyGoals: Storage.getWeeklyGoals(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importAllData: (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.subjects)) Storage.saveSubjects(data.subjects);
      if (Array.isArray(data.tasks)) Storage.saveTasks(data.tasks);
      if (Array.isArray(data.timetable)) Storage.saveTimetable(data.timetable);
      if (Array.isArray(data.notes)) Storage.saveNotes(data.notes);
      if (Array.isArray(data.syllabus)) Storage.saveSyllabus(data.syllabus);
      if (Array.isArray(data.semesters)) Storage.saveSemesters(data.semesters);
      if (Array.isArray(data.coding)) Storage.saveCodingProblems(data.coding);
      if (data.pomodoroSettings) Storage.savePomodoroSettings(data.pomodoroSettings);
      if (Array.isArray(data.studySessions)) Storage.saveStudySessions(data.studySessions);
      if (data.weeklyGoals) Storage.saveWeeklyGoals(data.weeklyGoals);
      return true;
    } catch {
      return false;
    }
  },

  // Auth Session & Refresh Token Storage
  getSession: (): AuthSession | null => load<AuthSession | null>(STORAGE_KEYS.AUTH_SESSION, null),
  saveSession: (session: AuthSession | null): void => {
    if (session === null) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } else {
      save(STORAGE_KEYS.AUTH_SESSION, session);
    }
  },

  createLocalSession: (userId: string, email?: string, durationMinutes = 15): AuthSession => {
    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;
    const session: AuthSession = {
      accessToken: `access_${userId.slice(0, 10)}_${now}_${Math.random().toString(36).slice(2, 10)}`,
      refreshToken: `refresh_${userId.slice(0, 10)}_${now}_${Math.random().toString(36).slice(2, 12)}`,
      expiresAt,
      issuedAt: now,
      userId,
      userEmail: email,
      tokenType: 'Bearer',
    };
    Storage.saveSession(session);
    return session;
  },

  refreshSessionToken: async (currentSession?: AuthSession | null): Promise<AuthSession> => {
    const sessionToRefresh = currentSession || Storage.getSession();
    const currentUser = Storage.getCurrentUser();
    const userId = sessionToRefresh?.userId || currentUser?.id || 'guest-user';
    const email = sessionToRefresh?.userEmail || currentUser?.email;
    const refreshToken = sessionToRefresh?.refreshToken || `refresh_${userId}_${Date.now()}`;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken,
          userId,
          durationMinutes: 15,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSession: AuthSession = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
          issuedAt: data.issuedAt,
          userId: data.userId || userId,
          userEmail: email,
          tokenType: data.tokenType || 'Bearer',
        };
        Storage.saveSession(updatedSession);
        return updatedSession;
      }
    } catch (err) {
      console.warn('Network call to /api/auth/refresh failed, extending local session token:', err);
    }

    // Local fallback refresh token renewal
    const updated = Storage.createLocalSession(userId, email, 15);
    return updated;
  },

  // Notification Center Storage
  getNotifications: (): AppNotification[] => load(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS),
  saveNotifications: (data: AppNotification[]) => save(STORAGE_KEYS.NOTIFICATIONS, data),

  getNotificationSettings: (): NotificationSettings => load(STORAGE_KEYS.NOTIFICATION_SETTINGS, DEFAULT_NOTIFICATION_SETTINGS),
  saveNotificationSettings: (settings: NotificationSettings) => save(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings),

  // Reset all workspace data to a clean empty state
  resetToDefault: (): void => {
    Storage.saveSubjects([]);
    Storage.saveTasks([]);
    Storage.saveTimetable([]);
    Storage.saveNotes([]);
    Storage.saveSyllabus([]);
    Storage.saveSemesters([]);
    Storage.saveCodingProblems([]);
    Storage.savePomodoroSettings(DEFAULT_POMO_SETTINGS);
    Storage.saveStudySessions([]);
    Storage.saveWeeklyGoals(DEFAULT_WEEKLY_GOALS);
    Storage.saveNotifications([]);
  },

  // Optional sample curriculum loader if user explicitly requests sample data in Backup modal
  loadSampleCurriculum: (): void => {
    const sampleSubjects: Subject[] = [
      { id: 'sub-dsa', name: 'Data Structures & Algorithms', code: 'CS201', instructor: 'Prof. Turing', color: '#4f46e5', credits: 4, room: 'Lab 302' },
      { id: 'sub-dbms', name: 'Database Management Systems', code: 'CS202', instructor: 'Dr. Codd', color: '#059669', credits: 4, room: 'Hall B' },
      { id: 'sub-os', name: 'Operating Systems', code: 'CS203', instructor: 'Prof. Torvalds', color: '#0284c7', credits: 4, room: 'Hall A' },
    ];
    const sampleTasks: Task[] = [
      { id: 'task-s1', subjectId: 'sub-dsa', title: 'Implement Binary Search Tree Traversals', dueDate: new Date().toISOString().split('T')[0], priority: 'high', status: 'pending', type: 'assignment' },
      { id: 'task-s2', subjectId: 'sub-dbms', title: 'SQL Joins & Group By Practice', dueDate: new Date().toISOString().split('T')[0], priority: 'medium', status: 'pending', type: 'lab' },
    ];
    Storage.saveSubjects(sampleSubjects);
    Storage.saveTasks(sampleTasks);
  },
};
