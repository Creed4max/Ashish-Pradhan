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
  TeacherAuthPass,
  DepartmentGovernance,
  DepartmentAccessPermissions,
  TeacherEmailCredentialNotice,
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
  TEACHER_AUTH_PASSES: 'campusos_teacher_auth_passes_v3',
  DEPARTMENT_GOVERNANCE: 'campusos_department_governance_v3',
  TEACHER_CREDENTIAL_EMAILS: 'campusos_teacher_credential_emails_v3',
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
    role: 'hod',
    university: 'Radhakrishna Institute of Technology and Engineering (RITE)',
    major: 'Computer Science & Engineering',
    semester: '',
    studentId: 'HOD-CSE-101',
    department: 'Computer Science & Engineering',
    designation: 'Head of Department & Professor',
    facultyId: 'HOD-CSE-101',
    avatarColor: '#059669',
    joinedAt: '2026-07-15T00:00:00.000Z',
    password: 'password123',
    isProfileComplete: true,
  },
  {
    id: 'user-jena-04',
    name: 'Prof. Ananya Jena',
    email: 'a.jena@riteindia.edu.in',
    role: 'teacher',
    university: 'Radhakrishna Institute of Technology and Engineering (RITE)',
    major: 'Electronics & Communication',
    semester: '',
    studentId: 'FAC-ECE-204',
    department: 'Electronics & Communication',
    designation: 'Assistant Professor',
    facultyId: 'FAC-ECE-204',
    avatarColor: '#0284c7',
    joinedAt: '2026-08-10T00:00:00.000Z',
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
  } else if (user.role === 'teacher' || user.role === 'hod') {
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

export const DEFAULT_TEACHER_PASSES: TeacherAuthPass[] = [
  {
    id: 'pass-demo-1',
    passCode: 'FAC-PASS-884102',
    teacherEmail: 'subhashree.cse@riteindia.edu.in',
    teacherName: 'Dr. Subhashree Mishra',
    department: 'Computer Science & Engineering',
    role: 'teacher',
    createdDate: new Date().toISOString(),
    createdByAdminEmail: 'admin@riteindia.edu.in',
    status: 'active',
    generatedFacultyId: 'FAC-CSE-105',
  },
  {
    id: 'pass-demo-2',
    passCode: 'HOD-PASS-992314',
    teacherEmail: 'hod.ece@riteindia.edu.in',
    teacherName: 'Prof. Rajesh K. Sahu',
    department: 'Electronics & Communication',
    role: 'hod',
    createdDate: new Date().toISOString(),
    createdByAdminEmail: 'admin@riteindia.edu.in',
    status: 'active',
    generatedFacultyId: 'HOD-ECE-101',
  },
];

export const DEFAULT_DEPARTMENT_GOVERNANCE: DepartmentGovernance[] = [
  {
    department: 'Computer Science & Engineering',
    hodUserId: 'user-swain-02',
    hodName: 'Dr. Debabrata Swain',
    hodEmail: 'd.swain@riteindia.edu.in',
    hodFacultyId: 'HOD-CSE-101',
    assignedDate: '2026-07-15T00:00:00.000Z',
    activeFacultyCount: 14,
    permissions: {
      curriculumApproval: true,
      facultyAllocation: true,
      attendanceSanction: true,
      emergencyBroadcast: true,
      labGovernance: true,
      marksVerification: true,
      googleMeetConferencing: true,
    },
  },
  {
    department: 'Electronics & Communication',
    hodUserId: '',
    hodName: 'Prof. Rajesh K. Sahu',
    hodEmail: 'hod.ece@riteindia.edu.in',
    hodFacultyId: 'HOD-ECE-101',
    assignedDate: '2026-08-01T00:00:00.000Z',
    activeFacultyCount: 9,
    permissions: {
      curriculumApproval: true,
      facultyAllocation: true,
      attendanceSanction: true,
      emergencyBroadcast: false,
      labGovernance: true,
      marksVerification: true,
      googleMeetConferencing: true,
    },
  },
  {
    department: 'Mechanical Engineering',
    hodUserId: '',
    hodName: '',
    hodEmail: '',
    hodFacultyId: '',
    assignedDate: '',
    activeFacultyCount: 8,
    permissions: {
      curriculumApproval: false,
      facultyAllocation: false,
      attendanceSanction: false,
      emergencyBroadcast: false,
      labGovernance: false,
      marksVerification: false,
      googleMeetConferencing: false,
    },
  },
  {
    department: 'Electrical Engineering',
    hodUserId: '',
    hodName: '',
    hodEmail: '',
    hodFacultyId: '',
    assignedDate: '',
    activeFacultyCount: 7,
    permissions: {
      curriculumApproval: false,
      facultyAllocation: false,
      attendanceSanction: false,
      emergencyBroadcast: false,
      labGovernance: false,
      marksVerification: false,
      googleMeetConferencing: false,
    },
  },
  {
    department: 'Civil Engineering',
    hodUserId: '',
    hodName: '',
    hodEmail: '',
    hodFacultyId: '',
    assignedDate: '',
    activeFacultyCount: 6,
    permissions: {
      curriculumApproval: false,
      facultyAllocation: false,
      attendanceSanction: false,
      emergencyBroadcast: false,
      labGovernance: false,
      marksVerification: false,
      googleMeetConferencing: false,
    },
  },
  {
    department: 'Management Studies (MBA)',
    hodUserId: '',
    hodName: '',
    hodEmail: '',
    hodFacultyId: '',
    assignedDate: '',
    activeFacultyCount: 5,
    permissions: {
      curriculumApproval: false,
      facultyAllocation: false,
      attendanceSanction: false,
      emergencyBroadcast: false,
      labGovernance: false,
      marksVerification: false,
      googleMeetConferencing: false,
    },
  },
];

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

  createLocalSession: (userId: string, email?: string, durationMinutes = 60): AuthSession => {
    const now = Date.now();
    // 1-hour session access token (60 minutes = 3,600,000 ms)
    const expiresAt = now + Math.max(60, durationMinutes) * 60 * 1000;
    // 10-day refresh token rotation window (10 days = 864,000,000 ms)
    const refreshTokenExpiresAt = now + 10 * 24 * 60 * 60 * 1000;
    const session: AuthSession = {
      accessToken: `access_${userId.slice(0, 10)}_${now}_${Math.random().toString(36).slice(2, 10)}`,
      refreshToken: `refresh_${userId.slice(0, 10)}_${now}_${Math.random().toString(36).slice(2, 12)}`,
      expiresAt,
      refreshTokenExpiresAt,
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

    // Verify 10-day refresh token validity locally
    if (sessionToRefresh?.refreshTokenExpiresAt && sessionToRefresh.refreshTokenExpiresAt < Date.now()) {
      throw new Error('Refresh token has expired (10-day limit exceeded). Please log in again.');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken,
          userId,
          durationMinutes: 60,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSession: AuthSession = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
          refreshTokenExpiresAt: data.refreshTokenExpiresAt || (Date.now() + 10 * 24 * 60 * 60 * 1000),
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

    // Local fallback refresh token renewal (1-hour access, 10-day refresh)
    const updated = Storage.createLocalSession(userId, email, 60);
    return updated;
  },

  // Teacher Authorization Pass Management
  getTeacherAuthPasses: (): TeacherAuthPass[] =>
    load(STORAGE_KEYS.TEACHER_AUTH_PASSES, DEFAULT_TEACHER_PASSES),
  saveTeacherAuthPasses: (data: TeacherAuthPass[]): void =>
    save(STORAGE_KEYS.TEACHER_AUTH_PASSES, data),

  createTeacherAuthPass: (params: {
    teacherEmail: string;
    teacherName?: string;
    department: string;
    role: 'teacher' | 'hod';
    adminEmail?: string;
  }): TeacherAuthPass => {
    const passes = Storage.getTeacherAuthPasses();
    const prefix = params.role === 'hod' ? 'HOD-PASS' : 'FAC-PASS';
    const randCode = Math.floor(100000 + Math.random() * 900000);
    const passCode = `${prefix}-${randCode}`;

    // Generate suggested faculty/HOD code based on department
    const deptPrefix =
      params.department.includes('Computer') ? 'CSE' :
      params.department.includes('Electronics') ? 'ECE' :
      params.department.includes('Mechanical') ? 'MECH' :
      params.department.includes('Civil') ? 'CIVIL' :
      params.department.includes('Electrical') ? 'EE' : 'MGMT';
    const num = Math.floor(100 + Math.random() * 900);
    const generatedFacultyId = params.role === 'hod' ? `HOD-${deptPrefix}-01` : `FAC-${deptPrefix}-${num}`;

    const newPass: TeacherAuthPass = {
      id: `pass-${Date.now()}`,
      passCode,
      teacherEmail: params.teacherEmail.trim().toLowerCase(),
      teacherName: params.teacherName?.trim(),
      department: params.department,
      role: params.role,
      createdDate: new Date().toISOString(),
      createdByAdminEmail: params.adminEmail || 'admin@riteindia.edu.in',
      status: 'active',
      generatedFacultyId,
    };

    Storage.saveTeacherAuthPasses([newPass, ...passes]);
    return newPass;
  },

  validateTeacherAuthPass: (
    passCode: string,
    email?: string
  ): { valid: boolean; pass?: TeacherAuthPass; error?: string } => {
    const trimmed = passCode.trim().toUpperCase();
    if (!trimmed) {
      return { valid: false, error: 'Please enter the authorization pass provided by the Admin.' };
    }

    const passes = Storage.getTeacherAuthPasses();
    const found = passes.find((p) => p.passCode.toUpperCase() === trimmed);

    if (!found) {
      return {
        valid: false,
        error: 'Invalid Authorization Pass. Please request an authorized faculty pass from your Admin.',
      };
    }

    if (found.status === 'used') {
      return {
        valid: false,
        error: `This Authorization Pass has already been redeemed for Teacher ID (${found.generatedFacultyId || 'claimed'}).`,
      };
    }

    if (found.status === 'revoked') {
      return { valid: false, error: 'This Authorization Pass has been revoked by the Administrator.' };
    }

    if (email && found.teacherEmail && email.trim().toLowerCase() !== found.teacherEmail.toLowerCase()) {
      return {
        valid: false,
        error: `This pass was issued to ${found.teacherEmail}. Please register with that institutional email address.`,
      };
    }

    return { valid: true, pass: found };
  },

  claimTeacherAuthPass: (passCode: string): boolean => {
    const trimmed = passCode.trim().toUpperCase();
    const passes = Storage.getTeacherAuthPasses();
    const idx = passes.findIndex((p) => p.passCode.toUpperCase() === trimmed);
    if (idx >= 0) {
      passes[idx] = {
        ...passes[idx],
        status: 'used',
        usedAt: new Date().toISOString(),
      };
      Storage.saveTeacherAuthPasses(passes);
      return true;
    }
    return false;
  },

  // Notification Center Storage
  getNotifications: (): AppNotification[] => load(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS),
  saveNotifications: (data: AppNotification[]) => save(STORAGE_KEYS.NOTIFICATIONS, data),

  getNotificationSettings: (): NotificationSettings => load(STORAGE_KEYS.NOTIFICATION_SETTINGS, DEFAULT_NOTIFICATION_SETTINGS),
  saveNotificationSettings: (settings: NotificationSettings) => save(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings),

  // Department Governance & HOD Permission Management
  getDepartmentGovernance: (): DepartmentGovernance[] =>
    load(STORAGE_KEYS.DEPARTMENT_GOVERNANCE, DEFAULT_DEPARTMENT_GOVERNANCE),
  saveDepartmentGovernance: (data: DepartmentGovernance[]): void =>
    save(STORAGE_KEYS.DEPARTMENT_GOVERNANCE, data),

  updateDepartmentPermissions: (
    departmentName: string,
    permissions: Partial<DepartmentAccessPermissions>
  ): DepartmentGovernance[] => {
    const list = Storage.getDepartmentGovernance();
    const updated = list.map((dept) => {
      if (dept.department === departmentName) {
        return {
          ...dept,
          permissions: {
            ...dept.permissions,
            ...permissions,
          },
        };
      }
      return dept;
    });
    Storage.saveDepartmentGovernance(updated);
    return updated;
  },

  assignHODToDepartment: (
    departmentName: string,
    facultyUser: RegisteredAccount,
    permissions?: Partial<DepartmentAccessPermissions>
  ): DepartmentGovernance[] => {
    const list = Storage.getDepartmentGovernance();
    const updated = list.map((dept) => {
      if (dept.department === departmentName) {
        return {
          ...dept,
          hodUserId: facultyUser.id,
          hodName: facultyUser.name,
          hodEmail: facultyUser.email,
          hodFacultyId: facultyUser.facultyId || `HOD-${departmentName.slice(0, 3).toUpperCase()}-101`,
          assignedDate: new Date().toISOString(),
          permissions: {
            ...dept.permissions,
            ...(permissions || {
              curriculumApproval: true,
              facultyAllocation: true,
              attendanceSanction: true,
              emergencyBroadcast: true,
              labGovernance: true,
              marksVerification: true,
              googleMeetConferencing: true,
            }),
          },
        };
      }
      return dept;
    });
    Storage.saveDepartmentGovernance(updated);

    // Promote the registered user account role to 'hod'
    const registered = Storage.getRegisteredUsers();
    const userIdx = registered.findIndex((u) => u.id === facultyUser.id || u.email === facultyUser.email);
    if (userIdx >= 0) {
      registered[userIdx] = {
        ...registered[userIdx],
        role: 'hod',
        department: departmentName,
        designation: 'Head of Department & Professor',
        facultyId: registered[userIdx].facultyId?.startsWith('HOD-')
          ? registered[userIdx].facultyId
          : `HOD-${departmentName.slice(0, 3).toUpperCase()}-01`,
      };
      Storage.saveRegisteredUsers(registered);
    }

    return updated;
  },

  relieveHODFromDepartment: (departmentName: string): DepartmentGovernance[] => {
    const list = Storage.getDepartmentGovernance();
    let relievedUserId = '';
    const updated = list.map((dept) => {
      if (dept.department === departmentName) {
        relievedUserId = dept.hodUserId || '';
        return {
          ...dept,
          hodUserId: '',
          hodName: '',
          hodEmail: '',
          hodFacultyId: '',
          assignedDate: '',
        };
      }
      return dept;
    });
    Storage.saveDepartmentGovernance(updated);

    if (relievedUserId) {
      const registered = Storage.getRegisteredUsers();
      const userIdx = registered.findIndex((u) => u.id === relievedUserId);
      if (userIdx >= 0) {
        registered[userIdx] = {
          ...registered[userIdx],
          role: 'teacher',
          designation: 'Professor',
        };
        Storage.saveRegisteredUsers(registered);
      }
    }

    return updated;
  },

  // Automated Email Service: Dispatched teacher credential notices
  getTeacherCredentialEmails: (): TeacherEmailCredentialNotice[] => {
    return load<TeacherEmailCredentialNotice[]>(STORAGE_KEYS.TEACHER_CREDENTIAL_EMAILS, []);
  },

  saveTeacherCredentialEmail: (notice: TeacherEmailCredentialNotice): void => {
    const existing = Storage.getTeacherCredentialEmails();
    const updated = [notice, ...existing.filter((n) => n.id !== notice.id)];
    save(STORAGE_KEYS.TEACHER_CREDENTIAL_EMAILS, updated);
  },

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
