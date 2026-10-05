export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface Subject {
  id: string;
  name: string;
  code: string;
  instructor: string;
  color: string; // Tailwind color token or hex
  credits: number;
  room?: string;
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskType = 'assignment' | 'lab' | 'exam' | 'project' | 'general' | 'quiz';

export interface Task {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD or ISO
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  category?: string; // e.g. 'Homework', 'Lab Report', 'Exam Prep', 'Project Work', 'Research', 'Revision', 'Reading', 'General'
  tags?: string[]; // e.g. ['urgent', 'midterm', 'chapter-4', 'viva']
  completedAt?: string;
}

export interface TimetableSlot {
  id: string;
  day: DayOfWeek;
  startTime: string; // HH:mm 24-hr format e.g. "09:00"
  endTime: string;   // HH:mm 24-hr format e.g. "10:00"
  subjectId: string;
  room: string;
  type: 'Lecture' | 'Lab' | 'Tutorial';
  instructor?: string;
}

export interface TopicItem {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

export interface SubjectSyllabus {
  id: string;
  subjectId: string;
  moduleName: string;
  topics: TopicItem[];
}

export interface CourseGrade {
  id: string;
  code: string;
  name: string;
  credits: number;
  grade: string;
  gradePoint: number;
}

export interface Semester {
  id: string;
  semesterName: string;
  courses: CourseGrade[];
}

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';
export type ProblemStatus = 'Todo' | 'Revising' | 'Solved';
export type ProblemPlatform = 'LeetCode' | 'Codeforces' | 'HackerRank' | 'GeeksforGeeks' | 'Lab Assignment' | 'Other';

export interface CodingProblem {
  id: string;
  title: string;
  platform: ProblemPlatform;
  difficulty: ProblemDifficulty;
  tags: string[];
  status: ProblemStatus;
  url?: string;
  solutionSnippet?: string;
  notes?: string;
  solvedAt?: string;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
  soundEnabled: boolean;
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  subjectId?: string;
  timestamp: string;
}

export interface WeeklyGoals {
  studyHoursTarget: number;
  tasksTarget: number;
  activeType: 'hours' | 'tasks';
}

export type UserRole = 'student' | 'teacher' | 'hod' | 'admin';

export interface TeacherAuthPass {
  id: string;
  passCode: string;
  teacherEmail: string;
  teacherName?: string;
  department: string;
  role: 'teacher' | 'hod';
  createdDate: string;
  createdByAdminEmail: string;
  status: 'active' | 'used' | 'revoked';
  usedAt?: string;
  generatedFacultyId?: string;
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  university: string;
  major: string;
  semester: string;
  studentId: string;
  avatarColor: string;
  joinedAt: string;
  isProfileComplete?: boolean;
  // Role-specific fields
  department?: string;
  designation?: string; // e.g. Assistant Professor, Professor & HOD
  facultyId?: string;   // e.g. FAC-204
  adminOffice?: string; // e.g. Academic Registrar, Dean's Office
  adminCode?: string;   // e.g. ADM-901
  authPassUsed?: string; // The teacher authorization pass used to create the account
  initialTempPassword?: string; // Automated temporary password issued upon registration
  tempPasswordIssued?: boolean;
}

export interface TeacherEmailCredentialNotice {
  id: string;
  teacherEmail: string;
  teacherName: string;
  facultyId: string;
  department: string;
  role: 'teacher' | 'hod';
  temporaryPassword: string;
  sentAt: string;
  status: 'dispatched' | 'delivered';
  subject: string;
  messageId?: string;
}

export type AppUser = StudentUser;

export type NotificationType =
  | 'task_deadline'
  | 'class_starting'
  | 'class_now'
  | 'system'
  | 'announcement'
  | 'deadline'
  | 'custom';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  relatedId?: string; // taskId or slotId
  actionTab?: string;
  priority?: 'low' | 'medium' | 'high';
  relatedTab?: string;
  urgent?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  browserNotifications: boolean;
  taskAlertHoursBefore: number; // e.g. 2 hours before or day-of
  classAlertMinutesBefore: number; // e.g. 10 or 15 minutes before
}

export type AppThemeId = 'rite' | 'daybreak' | 'midnight' | 'forest' | 'ocean' | 'sunset';

export interface AppTheme {
  id: AppThemeId;
  name: string;
  tagline: string;
  type: 'light' | 'dark';
  accentColor: string;
  bgColor: string;
  surfaceColor: string;
  textColor: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds (1-hour access token)
  refreshTokenExpiresAt?: number; // Unix timestamp in milliseconds (10-day refresh window)
  issuedAt: number;  // Unix timestamp in milliseconds
  userId: string;
  userEmail?: string;
  tokenType?: string;
}

export interface DepartmentAccessPermissions {
  curriculumApproval: boolean;
  facultyAllocation: boolean;
  attendanceSanction: boolean;
  emergencyBroadcast: boolean;
  labGovernance: boolean;
  marksVerification: boolean;
  googleMeetConferencing: boolean;
}

export interface DepartmentGovernance {
  department: string;
  hodUserId?: string;
  hodName?: string;
  hodEmail?: string;
  hodFacultyId?: string;
  assignedDate?: string;
  activeFacultyCount?: number;
  permissions: DepartmentAccessPermissions;
}


