import React, { useState, useMemo } from 'react';
import {
  Subject,
  Task,
  TimetableSlot,
  SubjectSyllabus,
  StudentUser,
  AppNotification,
  TeacherAuthPass,
} from '../types';
import { Storage } from '../utils/storage';
import {
  Shield,
  Users,
  Building,
  Calendar,
  CheckCircle2,
  Database,
  Megaphone,
  Plus,
  Send,
  Download,
  Eye,
  Activity,
  Layers,
  Sparkles,
  BadgeCheck,
  Search,
  Filter,
  UserCheck,
  AlertTriangle,
  Server,
  Cpu,
  Wifi,
  Radio,
  FileText,
  Clock,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  GraduationCap,
  Briefcase,
  KeyRound,
  Mail,
  ChevronRight,
  HardDrive,
  Check,
  Edit2,
  Trash2,
  X,
  UserX,
  BookOpen,
  Upload,
  Award,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminD3Analytics } from './AdminD3Analytics';
import { AdminActivityLog, ActivityLogItem, INITIAL_ACTIVITY_LOGS } from './AdminActivityLog';
import { AdminCsvImportModal } from './AdminCsvImportModal';
import { AdminHODView } from './AdminHODView';

interface AdminDashboardViewProps {
  currentUser: StudentUser | null;
  subjects: Subject[];
  tasks: Task[];
  timetable: TimetableSlot[];
  syllabus: SubjectSyllabus[];
  onNavigateTab: (tab: string) => void;
  onTriggerAlert?: (notification: AppNotification) => void;
  onPreviewStudentView: () => void;
  onPreviewTeacherView: () => void;
}

type AdminTab = 'overview' | 'users' | 'hod' | 'passes' | 'facilities' | 'curriculum' | 'broadcast' | 'activity';

export interface RosterMember {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'hod';
  department: string;
  rollOrCode: string;
  email: string;
  semesterOrDesignation: string;
  status: 'active' | 'leave' | 'inactive';
  attendanceRate: number;
  studyHoursWeek?: number;
  tasksCompleted?: number;
  joinedDate?: string;
  authPassUsed?: string;
}

const INITIAL_ROSTER: RosterMember[] = [
  {
    id: 'mem-1',
    name: 'Ashish Kumar',
    role: 'student',
    department: 'Computer Science & Engineering',
    rollOrCode: '2201289045',
    email: 'ashish.cse@riteindia.edu.in',
    semesterOrDesignation: 'Semester 5',
    status: 'active',
    attendanceRate: 94.2,
    studyHoursWeek: 28.5,
    tasksCompleted: 38,
    joinedDate: 'Aug 2022',
  },
  {
    id: 'mem-2',
    name: 'Priyanka Mohapatra',
    role: 'student',
    department: 'Computer Science & Engineering',
    rollOrCode: '2201289088',
    email: 'priyanka.cse@riteindia.edu.in',
    semesterOrDesignation: 'Semester 5',
    status: 'active',
    attendanceRate: 91.5,
    studyHoursWeek: 26.0,
    tasksCompleted: 35,
    joinedDate: 'Aug 2022',
  },
  {
    id: 'mem-3',
    name: 'Dr. Debabrata Swain',
    role: 'hod',
    department: 'Computer Science & Engineering',
    rollOrCode: 'HOD-CSE-101',
    email: 'd.swain@riteindia.edu.in',
    semesterOrDesignation: 'Head of Department & Professor',
    status: 'active',
    attendanceRate: 98.4,
    studyHoursWeek: 40.0,
    tasksCompleted: 45,
    joinedDate: 'Jul 2018',
  },
  {
    id: 'mem-4',
    name: 'Prof. Ananya Jena',
    role: 'teacher',
    department: 'Electronics & Communication',
    rollOrCode: 'FAC-ECE-204',
    email: 'a.jena@riteindia.edu.in',
    semesterOrDesignation: 'Associate Professor',
    status: 'active',
    attendanceRate: 96.0,
    studyHoursWeek: 36.5,
    tasksCompleted: 40,
    joinedDate: 'Jan 2020',
  },
  {
    id: 'mem-5',
    name: 'Rohan Ray',
    role: 'student',
    department: 'Mechanical Engineering',
    rollOrCode: '2201289112',
    email: 'rohan.me@riteindia.edu.in',
    semesterOrDesignation: 'Semester 3',
    status: 'active',
    attendanceRate: 88.0,
    studyHoursWeek: 22.0,
    tasksCompleted: 29,
    joinedDate: 'Aug 2023',
  },
  {
    id: 'mem-6',
    name: 'Dr. Saroj Nayak',
    role: 'teacher',
    department: 'Electrical Engineering',
    rollOrCode: 'FAC-EE-301',
    email: 's.nayak@riteindia.edu.in',
    semesterOrDesignation: 'Assistant Professor',
    status: 'active',
    attendanceRate: 95.2,
    studyHoursWeek: 34.0,
    tasksCompleted: 36,
    joinedDate: 'Aug 2021',
  },
  {
    id: 'mem-7',
    name: 'Subhashree Dash',
    role: 'student',
    department: 'Civil Engineering',
    rollOrCode: '2201289150',
    email: 'subhashree.ce@riteindia.edu.in',
    semesterOrDesignation: 'Semester 5',
    status: 'active',
    attendanceRate: 92.8,
    studyHoursWeek: 24.5,
    tasksCompleted: 33,
    joinedDate: 'Aug 2022',
  },
  {
    id: 'mem-8',
    name: 'Smruti Ranjan Panda',
    role: 'student',
    department: 'Management Studies (MBA)',
    rollOrCode: '2301289201',
    email: 'smruti.mba@riteindia.edu.in',
    semesterOrDesignation: 'Semester 1',
    status: 'leave',
    attendanceRate: 86.4,
    studyHoursWeek: 19.0,
    tasksCompleted: 24,
    joinedDate: 'Aug 2024',
  },
];

const BROADCAST_TEMPLATES = [
  {
    title: 'Midterm Examination Schedule & Hall Tickets Released',
    message: 'The Midterm Examination timetable has been finalized and uploaded. Students must download and verify their hall tickets before the exam window begins.',
    priority: 'high' as const,
  },
  {
    title: 'Central Library Extended Study Hours for Finals',
    message: 'The central digital library and quiet reading rooms will remain open until 11:30 PM on all weekdays throughout the upcoming examination period.',
    priority: 'medium' as const,
  },
  {
    title: 'Annual Utkarsh Tech-Fest & Innovation Hackathon Registration',
    message: 'Registrations are now open for RITE Utkarsh Tech-Fest & Hackathon. Interested student teams may submit project proposals through their department coordinators.',
    priority: 'low' as const,
  },
  {
    title: 'Hostel Gate Pass & Weekend Transportation Notice',
    message: 'Weekend shuttle buses to Bhubaneswar City Centre will operate on a revised schedule. Day scholars and hostellers please note the modified timings.',
    priority: 'medium' as const,
  },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  subjects,
  tasks,
  timetable,
  syllabus,
  onNavigateTab,
  onTriggerAlert,
  onPreviewStudentView,
  onPreviewTeacherView,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<Array<{ id: string; title: string; priority: string; time: string }>>([
    {
      id: 'b-init-1',
      title: 'BPUT Odd Semester Academic Calendar Synchronized',
      priority: 'high',
      time: 'Today, 09:30 AM',
    },
    {
      id: 'b-init-2',
      title: 'AICTE Mandatory Disclosure Portal Verification Complete',
      priority: 'medium',
      time: 'Yesterday, 04:15 PM',
    },
  ]);

  // User Management State (CRUD)
  const [userList, setUserList] = useState<RosterMember[]>(INITIAL_ROSTER);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'teacher' | 'hod'>('all');
  const [userDeptFilter, setUserDeptFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  // Modal States: View, Edit, Delete, Add
  const [viewingUser, setViewingUser] = useState<RosterMember | null>(null);
  const [editingUser, setEditingUser] = useState<RosterMember | null>(null);
  const [deletingUser, setDeletingUser] = useState<RosterMember | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Add User Form (strictly email-based, no phone number)
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'teacher' | 'hod'>('student');
  const [newUserDept, setNewUserDept] = useState('Computer Science & Engineering');
  const [newUserCode, setNewUserCode] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDesignation, setNewUserDesignation] = useState('');
  const [dispatchPassOnAdd, setDispatchPassOnAdd] = useState(true);

  // Teacher / HOD Authorization Pass Dispatcher State
  const [authPasses, setAuthPasses] = useState<TeacherAuthPass[]>(() => Storage.getTeacherAuthPasses());
  const [passRecipientEmail, setPassRecipientEmail] = useState('');
  const [passRecipientName, setPassRecipientName] = useState('');
  const [passRole, setPassRole] = useState<'teacher' | 'hod'>('teacher');
  const [passDept, setPassDept] = useState('Computer Science & Engineering');
  const [dispatchedPassNotice, setDispatchedPassNotice] = useState<TeacherAuthPass | null>(null);
  const [isDispatchingPass, setIsDispatchingPass] = useState(false);
  const [copiedPassCode, setCopiedPassCode] = useState<string | null>(null);

  // Toast notice
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [lastDeletedUser, setLastDeletedUser] = useState<RosterMember | null>(null);

  // Activity Logs State (User logins and admin actions)
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOGS);
  const [showCsvImportModal, setShowCsvImportModal] = useState<boolean>(false);

  // Computed metrics
  const uniqueRooms = useMemo(
    () => Array.from(new Set(timetable.map((t) => t.room).filter(Boolean))),
    [timetable]
  );
  const totalSlots = timetable.length;
  const studentCount = useMemo(() => userList.filter((u) => u.role === 'student').length, [userList]);
  const teacherCount = useMemo(() => userList.filter((u) => u.role === 'teacher').length, [userList]);
  const hodCount = useMemo(() => userList.filter((u) => u.role === 'hod').length, [userList]);
  const completedTasksCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);

  // Filtered Users for Management Table
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.rollOrCode.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchDept = userDeptFilter === 'all' || u.department === userDeptFilter;
      const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchSearch && matchRole && matchDept && matchStatus;
    });
  }, [userList, userSearch, userRoleFilter, userDeptFilter, userStatusFilter]);

  // CRUD Handlers
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUserList((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...editingUser } : u))
    );

    // Log administrative action
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        type: 'admin_action',
        action: 'USER_EDITED',
        actorName: currentUser?.name || 'Academic Administrator',
        actorRole: 'admin',
        actorId: currentUser?.adminCode || 'ADM-8800',
        details: `Updated profile details and status for ${editingUser.name}`,
        target: `${editingUser.name} (${editingUser.rollOrCode})`,
        ipAddress: '192.168.1.104',
        device: 'Admin Console',
        timestamp: 'Just now',
        status: 'info',
      },
      ...prev,
    ]);

    setActionNotice(`Updated profile for ${editingUser.name}`);
    setEditingUser(null);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return;

    const userToDelete = deletingUser;
    setUserList((prev) => prev.filter((u) => u.id !== userToDelete.id));
    setLastDeletedUser(userToDelete);

    // Log administrative action
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        type: 'admin_action',
        action: 'USER_DELETED',
        actorName: currentUser?.name || 'Academic Administrator',
        actorRole: 'admin',
        actorId: currentUser?.adminCode || 'ADM-8800',
        details: `Permanently removed user account from institutional directory`,
        target: `${userToDelete.name} (${userToDelete.rollOrCode})`,
        ipAddress: '192.168.1.104',
        device: 'Admin Console',
        timestamp: 'Just now',
        status: 'warning',
      },
      ...prev,
    ]);

    setDeletingUser(null);
    setActionNotice(`User ${userToDelete.name} was removed from the institution registry.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleUndoDelete = () => {
    if (!lastDeletedUser) return;
    setUserList((prev) => [lastDeletedUser, ...prev]);

    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        type: 'admin_action',
        action: 'USER_RESTORED',
        actorName: currentUser?.name || 'Academic Administrator',
        actorRole: 'admin',
        actorId: currentUser?.adminCode || 'ADM-8800',
        details: `Restored deleted user account`,
        target: `${lastDeletedUser.name} (${lastDeletedUser.rollOrCode})`,
        ipAddress: '192.168.1.104',
        device: 'Admin Console',
        timestamp: 'Just now',
        status: 'info',
      },
      ...prev,
    ]);

    setActionNotice(`Restored ${lastDeletedUser.name} to registered users.`);
    setLastDeletedUser(null);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDispatchTeacherPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passRecipientEmail.trim() || !passRecipientEmail.includes('@')) {
      setActionNotice('Please enter a valid institutional faculty email address.');
      return;
    }

    setIsDispatchingPass(true);
    try {
      const createdPass = Storage.createTeacherAuthPass({
        teacherEmail: passRecipientEmail.trim(),
        teacherName: passRecipientName.trim() || undefined,
        department: passDept,
        role: passRole,
        adminEmail: currentUser?.email || 'admin@riteindia.edu.in',
      });

      // Synchronize with server if available
      try {
        await fetch('/api/admin/send-teacher-pass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherEmail: passRecipientEmail.trim(),
            teacherName: passRecipientName.trim() || undefined,
            department: passDept,
            role: passRole,
            adminEmail: currentUser?.email || 'admin@riteindia.edu.in',
          }),
        });
      } catch (err) {
        console.warn('Server pass dispatch fallback to local state:', err);
      }

      setAuthPasses(Storage.getTeacherAuthPasses());
      setDispatchedPassNotice(createdPass);

      if (onTriggerAlert) {
        onTriggerAlert({
          id: `pass-dispatch-${Date.now()}`,
          type: 'system',
          title: `Faculty Pass Sent: ${createdPass.passCode}`,
          message: `Authorization pass ${createdPass.passCode} dispatched to ${createdPass.teacherEmail}. Use this pass to create Teacher ID (${createdPass.generatedFacultyId}).`,
          timestamp: new Date().toISOString(),
          read: false,
          urgent: false,
        });
      }

      try {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#10b981', '#f59e0b'],
        });
      } catch {
        // ignore
      }

      setActivityLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          type: 'admin_action',
          action: 'FACULTY_PASS_DISPATCHED',
          actorName: currentUser?.name || 'Academic Administrator',
          actorRole: 'admin',
          actorId: currentUser?.adminCode || 'ADM-8800',
          details: `Sent ${createdPass.role.toUpperCase()} registration pass (${createdPass.passCode}) to ${createdPass.teacherEmail} for ID ${createdPass.generatedFacultyId}`,
          target: `${createdPass.teacherEmail} (${createdPass.generatedFacultyId})`,
          ipAddress: '192.168.1.104',
          device: 'Admin Console',
          timestamp: 'Just now',
          status: 'success',
        },
        ...prev,
      ]);

      setActionNotice(`Pass ${createdPass.passCode} dispatched to ${createdPass.teacherEmail}!`);
      setPassRecipientEmail('');
      setPassRecipientName('');
    } finally {
      setIsDispatchingPass(false);
    }
  };

  const handleCopyPassCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedPassCode(code);
      setTimeout(() => setCopiedPassCode(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserCode.trim() || !newUserEmail.trim()) {
      setActionNotice('Please complete name, roll/code, and email address.');
      return;
    }

    const newUser: RosterMember = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      role: newUserRole,
      department: newUserDept,
      rollOrCode: newUserCode.trim(),
      email: newUserEmail.trim(),
      semesterOrDesignation:
        newUserDesignation.trim() ||
        (newUserRole === 'student' ? 'Semester 1' : newUserRole === 'hod' ? 'Head of Department & Professor' : 'Assistant Professor'),
      status: 'active',
      attendanceRate: 100.0,
      studyHoursWeek: newUserRole === 'student' ? 24.0 : 38.0,
      tasksCompleted: 10,
      joinedDate: 'Oct 2026',
    };

    setUserList((prev) => [newUser, ...prev]);

    // If teacher or HOD and dispatchPassOnAdd is selected, issue and dispatch pass to email
    let generatedPassNotice = '';
    if ((newUserRole === 'teacher' || newUserRole === 'hod') && dispatchPassOnAdd) {
      try {
        const createdPass = Storage.createTeacherAuthPass({
          teacherEmail: newUser.email,
          teacherName: newUser.name,
          department: newUser.department,
          role: newUserRole,
          adminEmail: currentUser?.email || 'admin@riteindia.edu.in',
        });

        // Sync with backend endpoint
        try {
          await fetch('/api/admin/send-teacher-pass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teacherEmail: newUser.email,
              teacherName: newUser.name,
              department: newUser.department,
              role: newUserRole,
              adminEmail: currentUser?.email || 'admin@riteindia.edu.in',
            }),
          });
        } catch {
          // fallback to client store
        }

        setAuthPasses(Storage.getTeacherAuthPasses());
        setDispatchedPassNotice(createdPass);
        generatedPassNotice = ` Passcode ${createdPass.passCode} sent to ${newUser.email} to create Teacher ID (${createdPass.generatedFacultyId})!`;

        if (onTriggerAlert) {
          onTriggerAlert({
            id: `pass-alert-${Date.now()}`,
            type: 'system',
            title: `Authorization Pass Sent: ${createdPass.passCode}`,
            message: `Authorization pass ${createdPass.passCode} dispatched to ${createdPass.teacherEmail}. Use this pass to create Teacher ID (${createdPass.generatedFacultyId}).`,
            timestamp: new Date().toISOString(),
            read: false,
            urgent: false,
          });
        }
      } catch (err) {
        console.warn('Failed to dispatch teacher pass:', err);
      }
    }

    // Log administrative action
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        type: 'admin_action',
        action: 'USER_CREATED',
        actorName: currentUser?.name || 'Academic Administrator',
        actorRole: 'admin',
        actorId: currentUser?.adminCode || 'ADM-8800',
        details: `Registered new ${newUser.role.toUpperCase()} (${newUser.name}) in ${newUser.department}.${generatedPassNotice}`,
        target: `${newUser.name} (${newUser.rollOrCode})`,
        ipAddress: '192.168.1.104',
        device: 'Admin Console',
        timestamp: 'Just now',
        status: 'success',
      },
      ...prev,
    ]);

    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserCode('');
    setNewUserEmail('');
    setNewUserDesignation('');
    setActionNotice(
      `Registered ${newUser.name} as ${newUser.role.toUpperCase()} in ${newUser.department}.${generatedPassNotice}`
    );
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleBulkImportUsers = (newUsers: RosterMember[]) => {
    setUserList((prev) => [...newUsers, ...prev]);

    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Log administrative action
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        type: 'admin_action',
        action: 'CSV_BULK_IMPORT',
        actorName: currentUser?.name || 'Academic Administrator',
        actorRole: 'admin',
        actorId: currentUser?.adminCode || 'ADM-8800',
        details: `Bulk imported ${newUsers.length} student and faculty records from CSV file`,
        target: `Registry: ${newUsers.length} Accounts`,
        ipAddress: '192.168.1.104',
        device: 'Admin Terminal (Registrar Node)',
        timestamp: 'Just now',
        status: 'success',
      },
      ...prev,
    ]);

    setActionNotice(`Successfully imported ${newUsers.length} users from CSV file!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleExportUsers = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Name,Role,Department,Roll/Code,Email,Status,Attendance,StudyHoursWeek']
        .concat(
          userList.map(
            (u) =>
              `"${u.name}","${u.role}","${u.department}","${u.rollOrCode}","${u.email}","${u.status}","${u.attendanceRate}%","${u.studyHoursWeek || 0}h"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RITE_Registered_Users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionNotice('User database exported to CSV file.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleExportActivityLogs = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,Type,Action,ActorName,ActorId,Role,Details,Target,IPAddress,Status']
        .concat(
          activityLogs.map(
            (l) =>
              `"${l.timestamp}","${l.type}","${l.action}","${l.actorName}","${l.actorId}","${l.actorRole}","${l.details}","${l.target || ''}","${l.ipAddress}","${l.status}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RITE_Activity_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionNotice('Activity audit trail exported to CSV.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleSendCampusBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    if (onTriggerAlert) {
      onTriggerAlert({
        id: `campus-broadcast-${Date.now()}`,
        type: 'custom',
        title: `Campus Notice: ${broadcastTitle.trim()}`,
        message: broadcastMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        priority: broadcastPriority === 'high' ? 'high' : 'medium',
        relatedTab: 'dashboard',
      });
    }

    try {
      confetti({
        particleCount: 35,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Log administrative action
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        type: 'admin_action',
        action: 'BROADCAST_SENT',
        actorName: currentUser?.name || 'Academic Administrator',
        actorRole: 'admin',
        actorId: currentUser?.adminCode || 'ADM-8800',
        details: `Dispatched ${broadcastPriority}-priority campus alert: ${broadcastTitle.trim()}`,
        target: 'All Students & Faculty',
        ipAddress: '192.168.1.104',
        device: 'Admin Console',
        timestamp: 'Just now',
        status: 'success',
      },
      ...prev,
    ]);

    setBroadcastHistory((prev) => [
      {
        id: `b-${Date.now()}`,
        title: broadcastTitle.trim(),
        priority: broadcastPriority,
        time: 'Just now',
      },
      ...prev,
    ]);

    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification with Undo */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-purple-500/40 animate-in fade-in slide-in-from-top-4 duration-200">
          <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{actionNotice}</span>
          {lastDeletedUser && (
            <button
              type="button"
              onClick={handleUndoDelete}
              className="ml-2 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* 1. Institutional Admin Command Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        {/* Glow ambient meshes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/25 text-purple-200 border border-purple-400/40 text-xs font-bold tracking-wider uppercase">
                <Shield className="w-3.5 h-3.5 text-purple-300" />
                RITE-OS · Institutional Administration
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                Live Node Operational
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <span>{currentUser?.name || 'Academic Administrator'}</span>
                <span className="text-sm sm:text-base font-medium px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-indigo-200">
                  {currentUser?.adminOffice || "Registrar's Directorate"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl">
                Admin Code: <span className="font-mono text-purple-300 font-bold">{currentUser?.adminCode || 'ADM-8800'}</span> ·{' '}
                Total registered users: <strong className="text-white">{userList.length}</strong> ({studentCount} Students, {teacherCount} Faculty{hodCount > 0 ? `, ${hodCount} HODs` : ''}) · {uniqueRooms.length} lecture facilities monitored.
              </p>
            </div>
          </div>

          {/* Quick System Telemetry & View Switching */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onPreviewTeacherView}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition-all backdrop-blur-xs cursor-pointer shadow-xs"
              title="Preview UI through Teacher portal"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-300" />
              <span>Teacher View</span>
            </button>
            <button
              type="button"
              onClick={onPreviewStudentView}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition-all backdrop-blur-xs cursor-pointer shadow-xs"
              title="Preview UI through Student portal"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-300" />
              <span>Student View</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('timetable')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Timetable Master</span>
            </button>
          </div>
        </div>

        {/* Real-time System Health Telemetry Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">System Uptime</span>
              <span className="font-semibold text-white">99.98% Operational</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <Database className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">BPUT & AICTE Node</span>
              <span className="font-semibold text-white">Cloud Synchronized</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">D3.js Charts Engine</span>
              <span className="font-semibold text-white">Active & Rendering</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <Wifi className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Campus Network</span>
              <span className="font-semibold text-white">10 Gbps Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. D3.JS EXECUTIVE ANALYTICS SUMMARY DASHBOARD */}
      <AdminD3Analytics
        totalUsersCount={userList.length}
        studentCount={studentCount}
        teacherCount={teacherCount}
        hodCount={hodCount}
        completedTasksCount={completedTasksCount}
        totalTasksCount={tasks.length}
      />

      {/* 3. Admin Section Sub-Navigation Tabs */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {[
            { id: 'overview', label: 'Overview & Facilities', icon: Activity, count: null },
            { id: 'users', label: 'User Management (Students, Faculty & HODs)', icon: Users, count: userList.length },
            { id: 'hod', label: 'HOD Governance & Roles', icon: Award, count: Storage.getDepartmentGovernance().length },
            { id: 'passes', label: 'Faculty & HOD Pass Dispatcher', icon: KeyRound, count: authPasses.filter(p => p.status === 'active').length },
            { id: 'facilities', label: 'Halls & Spaces', icon: Building, count: uniqueRooms.length },
            { id: 'curriculum', label: 'Courses & Syllabus', icon: Layers, count: subjects.length },
            { id: 'broadcast', label: 'Broadcast Dispatcher', icon: Megaphone, count: broadcastHistory.length },
            { id: 'activity', label: 'Activity & Login Audit Logs', icon: Clock, count: activityLogs.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.02]'
                    : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400 dark:text-purple-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB: USER MANAGEMENT (View, Edit, Delete Students and Teachers) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Header Controls Bar */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Institutional User Management</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold font-mono">
                    {filteredUsers.length} of {userList.length} users
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full administrative control: View dossiers, edit profiles, register, or delete students & teachers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('passes')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all border border-amber-300 dark:border-amber-800 cursor-pointer shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Issue Faculty / HOD Pass</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportUsers}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCsvImportModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all border border-purple-200 dark:border-purple-800 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Member</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              {/* Search Box (5 cols) */}
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, roll/faculty code, email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              {/* Role Filter (3 cols) */}
              <div className="lg:col-span-3 flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
                {(['all', 'student', 'teacher', 'hod'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUserRoleFilter(r)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      userRoleFilter === r
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {r === 'all' ? 'All' : r === 'hod' ? 'HOD' : `${r}s`}
                  </button>
                ))}
              </div>

              {/* Department Filter (2 cols) */}
              <div className="lg:col-span-2">
                <select
                  value={userDeptFilter}
                  onChange={(e) => setUserDeptFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Departments</option>
                  <option value="Computer Science & Engineering">CSE</option>
                  <option value="Electronics & Communication">ECE</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                  <option value="Electrical Engineering">Electrical</option>
                  <option value="Civil Engineering">Civil</option>
                  <option value="Management Studies (MBA)">MBA</option>
                </select>
              </div>

              {/* Status Filter (2 cols) */}
              <div className="lg:col-span-2">
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Management Table */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">Member / Contact</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Identifier / Code</th>
                    <th className="py-3.5 px-4">Department & Level</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Study / Attendance</th>
                    <th className="py-3.5 px-4 text-center">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">No registered users matched the filter criteria.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setUserSearch('');
                            setUserRoleFilter('all');
                            setUserDeptFilter('all');
                            setUserStatusFilter('all');
                          }}
                          className="mt-2 text-purple-600 font-bold hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                      >
                        {/* Member / Contact */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                user.role === 'hod'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : user.role === 'teacher'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {user.name}
                              </span>
                              <span className="text-[11px] text-slate-400 block font-normal">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              user.role === 'hod'
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : user.role === 'teacher'
                                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {user.role === 'hod' ? (
                              <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            ) : user.role === 'teacher' ? (
                              <Briefcase className="w-3 h-3" />
                            ) : (
                              <GraduationCap className="w-3 h-3" />
                            )}
                            {user.role === 'hod' ? 'HOD' : user.role}
                          </span>
                        </td>

                        {/* Roll / Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {user.rollOrCode}
                        </td>

                        {/* Department & Level */}
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-900 dark:text-white block">{user.department}</span>
                          <span className="text-[11px] text-slate-400">{user.semesterOrDesignation}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              user.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : user.status === 'leave'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'active'
                                  ? 'bg-emerald-500'
                                  : user.status === 'leave'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {user.status}
                          </span>
                        </td>

                        {/* Attendance / Study Hours */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Attendance:</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {user.attendanceRate}%
                              </span>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${user.attendanceRate}%` }}
                              />
                            </div>
                            {user.studyHoursWeek !== undefined && (
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">
                                {user.studyHoursWeek}h studied this week
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ACTIONS: View, Edit, Delete */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            {/* VIEW BUTTON */}
                            <button
                              type="button"
                              onClick={() => setViewingUser(user)}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                              title="View User Dossier"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* EDIT BUTTON */}
                            <button
                              type="button"
                              onClick={() => setEditingUser(user)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                              title="Edit User Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              type="button"
                              onClick={() => setDeletingUser(user)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                              title="Delete User from System"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: HOD GOVERNANCE & ROLES (Assign HOD role to faculty, manage department-level access permissions) */}
      {activeTab === 'hod' && (
        <AdminHODView
          currentUser={currentUser}
          onTriggerAlert={onTriggerAlert}
          onOpenGoogleMeet={(dept) => {
            if (onNavigateTab) {
              onNavigateTab('workspace');
            }
          }}
        />
      )}

      {/* TAB: FACULTY & HOD PASS DISPATCHER */}
      {activeTab === 'passes' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>FACULTY & HOD AUTHORIZATION PASS SYSTEM</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Send Passcode to Email to Create Teacher ID
                </h2>
                <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
                  Generate secure authorization passes and dispatch them directly to institutional faculty & HOD email addresses.
                  Educators use their received passcode during registration to verify their credentials and auto-create their official Teacher ID.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-amber-300">{authPasses.length}</span>
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Passes Dispatched</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-emerald-300">
                    {authPasses.filter((p) => p.status === 'active').length}
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Active & Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Left Dispatch Form, Right Passes Roster */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Dispatch Form & Live Notification (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Dispatch Pass to Email
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sends pass for Teacher or HOD account creation
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleDispatchTeacherPass} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Faculty / HOD Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={passRecipientEmail}
                        onChange={(e) => setPassRecipientEmail(e.target.value)}
                        placeholder="e.g. prof.sharma@riteindia.edu.in"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recipient Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={passRecipientName}
                      onChange={(e) => setPassRecipientName(e.target.value)}
                      placeholder="e.g. Dr. Ramesh Sharma"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Role to Authorize <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={passRole}
                        onChange={(e) => setPassRole(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      >
                        <option value="teacher">Faculty Member (Teacher)</option>
                        <option value="hod">Head of Department (HOD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Department
                      </label>
                      <select
                        value={passDept}
                        onChange={(e) => setPassDept(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      >
                        <option value="Computer Science & Engineering">CSE</option>
                        <option value="Electronics & Communication">ECE</option>
                        <option value="Mechanical Engineering">Mechanical</option>
                        <option value="Electrical Engineering">Electrical</option>
                        <option value="Civil Engineering">Civil</option>
                        <option value="Management Studies (MBA)">MBA</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isDispatchingPass || !passRecipientEmail.trim() || !passRecipientEmail.includes('@')}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs"
                  >
                    {isDispatchingPass ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Dispatching Passcode...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Passcode to Email</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Live Dispatched Email Preview Card */}
                {dispatchedPassNotice && (
                  <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                          Passcode Dispatched to Email
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Just Now</span>
                    </div>

                    <div className="text-[11px] space-y-1 text-slate-700 dark:text-slate-300">
                      <p>
                        <strong>To:</strong> <span className="font-mono text-indigo-700 dark:text-indigo-400">{dispatchedPassNotice.teacherEmail}</span>
                      </p>
                      <p>
                        <strong>Role Clearance:</strong>{' '}
                        <span className="uppercase font-bold text-amber-800 dark:text-amber-300">
                          {dispatchedPassNotice.role === 'hod' ? 'Head of Department (HOD)' : 'Faculty Member'}
                        </span>
                      </p>
                      <p>
                        <strong>Assigned Teacher ID:</strong>{' '}
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {dispatchedPassNotice.generatedFacultyId}
                        </span>
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                          Authorization Passcode
                        </span>
                        <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400 tracking-wider">
                          {dispatchedPassNotice.passCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPassCode(dispatchedPassNotice.passCode)}
                        className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedPassCode === dispatchedPassNotice.passCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Pass</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      The teacher can now open the RITE-OS portal, select <strong>{dispatchedPassNotice.role.toUpperCase()}</strong>, and enter passcode <code className="font-bold font-mono text-amber-700 dark:text-amber-300">{dispatchedPassNotice.passCode}</code> to auto-generate and activate their Teacher ID.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Passes Registry Table (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Issued Authorization Passes</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold">
                      {authPasses.length} total
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official passes sent to educators to claim and create their Teacher IDs
                  </p>
                </div>
              </div>

              {/* Passes List Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Passcode</th>
                      <th className="py-2.5 px-3">Recipient Email</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Teacher ID</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {authPasses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No authorization passes issued yet. Use the form to send a pass.
                        </td>
                      </tr>
                    ) : (
                      authPasses.map((pass) => (
                        <tr key={pass.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                              {pass.passCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-900 dark:text-white block">{pass.teacherEmail}</span>
                            {pass.teacherName && (
                              <span className="text-[10px] text-slate-400 block">{pass.teacherName}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                pass.role === 'hod'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              }`}
                            >
                              {pass.role === 'hod' ? 'HOD' : 'Teacher'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {pass.generatedFacultyId || 'FAC-CSE-100'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pass.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {pass.status === 'active' ? 'Active / Unclaimed' : 'Used / Registered'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopyPassCode(pass.passCode)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Copy Passcode"
                            >
                              {copiedPassCode === pass.passCode ? 'Copied' : 'Copy'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Demo Helper Pill */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    <strong>Quick Test:</strong> Copy an active pass code above, then log out and go to <strong>Register &gt; Teacher or HOD</strong> to create a Teacher ID!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: OVERVIEW & FACILITIES */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Facilities & Course Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Campus Facilities & Timetable Master */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Campus Facility Utilization
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Room occupancies and equipment readiness
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('facilities')}
                    className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View All Facilities</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uniqueRooms.slice(0, 4).map((roomName, idx) => {
                    const slotsInRoom = timetable.filter((t) => t.room === roomName);
                    const sub = subjects.find((s) => s.id === slotsInRoom[0]?.subjectId);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl space-y-2 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{roomName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            {slotsInRoom.length} {slotsInRoom.length === 1 ? 'Slot' : 'Slots'} Scheduled
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 truncate">
                          {sub ? `${sub.code}: ${sub.name}` : 'General Lecture Space'}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                          <span>Capacity: 60 seats</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">Projector Ready</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Departmental Course Registry Preview */}
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Curriculum Syllabus Progress
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Course completion and faculty assignees
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('curriculum')}
                    className="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Manage Courses</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {subjects.slice(0, 4).map((s) => {
                    const subSyllabus = syllabus.filter((mod) => mod.subjectId === s.id);
                    return (
                      <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {s.code}: {s.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Instructor: {s.instructor} · {s.credits} Credits · {subSyllabus.length} Modules
                          </span>
                        </div>
                        <span className="font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                          Active
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Notice Dispatcher & Academic Calendar */}
            <div className="lg:col-span-5 space-y-6">
              {/* Quick Broadcast Widget */}
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Dispatch Campus Alert
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Broadcast instantly to all students & faculty
                      </p>
                    </div>
                  </div>
                </div>

                {broadcastSent && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                    <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Notice broadcasted across RITE-OS!</span>
                  </div>
                )}

                <form onSubmit={handleSendCampusBroadcast} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Notice Headline
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Midterm Examination Schedule Released"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Details
                    </label>
                    <textarea
                      rows={2}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="e.g. Please verify your hall ticket in the student portal."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={broadcastPriority}
                      onChange={(e) => setBroadcastPriority(e.target.value as any)}
                      className="flex-1 px-2.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      <option value="high">High Priority (Urgent)</option>
                      <option value="medium">Medium Priority (Academic)</option>
                      <option value="low">Low Priority (Info)</option>
                    </select>

                    <button
                      type="submit"
                      disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Academic Calendar Milestones */}
              <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    ACADEMIC SEMESTER TIMELINE
                  </span>
                  <span className="text-[10px] text-slate-400">Term: Fall 2026</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-800/80 rounded-xl flex items-center justify-between">
                    <span>Midterm Evaluation Window</span>
                    <span className="font-mono text-purple-300 font-bold">Oct 14 – Oct 22</span>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 rounded-xl flex items-center justify-between">
                    <span>Course Drop & Elective Final</span>
                    <span className="font-mono text-emerald-400 font-bold">Completed</span>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 rounded-xl flex items-center justify-between">
                    <span>Semester Final Submissions</span>
                    <span className="font-mono text-amber-300 font-bold">Dec 08 – Dec 18</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FACILITIES & HALLS */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lecture Halls & Laboratories</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutional facilities mapped into the semester schedule
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('timetable')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Modify Weekly Schedule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueRooms.map((roomName, idx) => {
              const slots = timetable.filter((t) => t.room === roomName);
              const subjectIds = Array.from(new Set(slots.map((s) => s.subjectId)));
              const assignedSubjects = subjects.filter((s) => subjectIds.includes(s.id));

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{roomName}</h4>
                        <span className="text-[11px] text-slate-400">Academic Wing</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      {slots.length} Classes / Wk
                    </span>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">60 Desks</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">Smart Projector</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">Dual AC</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">Audio PA System</span>
                  </div>

                  {/* Assigned Courses */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assigned Subjects
                    </span>
                    {assignedSubjects.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No assigned subjects</p>
                    ) : (
                      assignedSubjects.map((asub) => (
                        <div key={asub.id} className="flex items-center justify-between text-xs py-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {asub.code} · {asub.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">{asub.instructor}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: COURSES & SYLLABUS */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum & Course Registry</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AICTE & BPUT accredited degree courses and module progress
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('notes')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Course</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub) => {
              const subSyllabus = syllabus.filter((m) => m.subjectId === sub.id);
              const totalTopics = subSyllabus.reduce((acc, curr) => acc + (curr.topics?.length || 0), 0);
              const completedTopics = subSyllabus.reduce(
                (acc, curr) => acc + (curr.topics?.filter((t) => t.completed)?.length || 0),
                0
              );
              const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

              return (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {sub.code}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{sub.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Lead Faculty: {sub.instructor} · {sub.credits} Academic Credits
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Approved
                    </span>
                  </div>

                  {/* Progress Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Syllabus Completion</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {completedTopics} of {totalTopics} Topics ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Modules */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-3">
                    <span>{subSyllabus.length} Curriculum Units</span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('syllabus')}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Audit Syllabus Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: BROADCAST DISPATCHER & LOG */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Dispatcher Form (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dispatch Campus-Wide Alert</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transmit instant announcements to student and faculty portals
              </p>
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Preset Templates
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BROADCAST_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setBroadcastTitle(tpl.title);
                      setBroadcastMessage(tpl.message);
                      setBroadcastPriority(tpl.priority);
                    }}
                    className="p-2.5 text-left bg-slate-50 dark:bg-slate-900/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all cursor-pointer text-xs space-y-1"
                  >
                    <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">{tpl.title}</span>
                    <span className="text-[11px] text-slate-400 block line-clamp-1">{tpl.message}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendCampusBroadcast} className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notice Headline
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Midterm Examination Schedule & Seating Allotment Released"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Body
                </label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Provide comprehensive details, instructions, or deadlines for the campus community..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium resize-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Urgency Level
                </label>
                <select
                  value={broadcastPriority}
                  onChange={(e) => setBroadcastPriority(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <option value="high">High Priority (Urgent Campus Alert with Sound Chime)</option>
                  <option value="medium">Medium Priority (Academic Announcement)</option>
                  <option value="low">Low Priority (General Information Bulletin)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Broadcast Notice Across Institution</span>
              </button>
            </form>
          </div>

          {/* Broadcast History Log (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Recent Dispatches</h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Live Broadcast Feed</span>
            </div>

            <div className="space-y-2.5">
              {broadcastHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.priority === 'high'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                  <h5 className="font-semibold text-xs text-slate-900 dark:text-white">{item.title}</h5>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ACTIVITY & LOGIN AUDIT LOGS */}
      {activeTab === 'activity' && (
        <AdminActivityLog
          logs={activityLogs}
          onExportLogs={handleExportActivityLogs}
          onRefresh={() => {
            setActionNotice('Activity logs refreshed.');
            setTimeout(() => setActionNotice(null), 2500);
          }}
        />
      )}

      {/* 5. MODALS */}

      {/* MODAL 1: VIEW USER DOSSIER */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                    viewingUser.role === 'hod'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : viewingUser.role === 'teacher'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                  }`}
                >
                  {viewingUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{viewingUser.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">{viewingUser.rollOrCode}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        viewingUser.role === 'hod'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : viewingUser.role === 'teacher'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {viewingUser.role}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Department</span>
                <p className="font-semibold text-slate-900 dark:text-white">{viewingUser.department}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Academic Designation</span>
                <p className="font-semibold text-slate-900 dark:text-white">{viewingUser.semesterOrDesignation}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Institutional Email</span>
                <p className="font-mono text-slate-900 dark:text-white truncate">{viewingUser.email}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Authorization Status</span>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Institutional Member</span>
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Attendance Record</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {viewingUser.attendanceRate}% Average
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Weekly Study Time</span>
                <p className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                  {viewingUser.studyHoursWeek || 25.0} Hours / Week
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingUser(viewingUser);
                  setViewingUser(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER DETAILS */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit User Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Type</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Faculty Member</option>
                    <option value="hod">Head of Department (HOD)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Roll / Code</label>
                  <input
                    type="text"
                    value={editingUser.rollOrCode}
                    onChange={(e) => setEditingUser({ ...editingUser, rollOrCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Management Studies (MBA)">Management Studies (MBA)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attendance Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingUser.attendanceRate}
                    onChange={(e) => setEditingUser({ ...editingUser, attendanceRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION DIALOG */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-200 dark:border-rose-950 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2">
              <UserX className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Confirm User Removal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 dark:text-white font-bold">{deletingUser.name}</strong> (
                {deletingUser.rollOrCode}) from the institutional records?
              </p>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-800 dark:text-rose-300">
              <strong>Warning:</strong> This will revoke institutional RITE-OS portal access and remove timetable seat allocations.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD NEW USER (STUDENT / TEACHER) */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register New Institutional Member</h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Swagatika Sahoo"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Type</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => {
                      const r = e.target.value as any;
                      setNewUserRole(r);
                      if (r === 'hod' && !newUserDesignation) {
                        setNewUserDesignation('Head of Department & Professor');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Faculty Member (Teacher)</option>
                    <option value="hod">Head of Department (HOD)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {newUserRole === 'student' ? 'Student Roll Number' : newUserRole === 'hod' ? 'HOD Code / ID' : 'Faculty ID Code'}
                  </label>
                  <input
                    type="text"
                    value={newUserCode}
                    onChange={(e) => setNewUserCode(e.target.value)}
                    placeholder={newUserRole === 'hod' ? 'e.g. HOD-CSE-01' : newUserRole === 'teacher' ? 'e.g. FAC-CSE-102' : 'e.g. 2201289190'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. faculty.member@riteindia.edu.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Management Studies (MBA)">Management Studies (MBA)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Semester
                  </label>
                  <input
                    type="text"
                    value={newUserDesignation}
                    onChange={(e) => setNewUserDesignation(e.target.value)}
                    placeholder={newUserRole === 'student' ? 'Semester 1' : newUserRole === 'hod' ? 'Head of Department & Professor' : 'Assistant Professor'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              {/* Passcode Dispatch Option for Teacher / HOD */}
              {(newUserRole === 'teacher' || newUserRole === 'hod') && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-900 dark:text-white font-bold text-xs">
                    <input
                      type="checkbox"
                      checked={dispatchPassOnAdd}
                      onChange={(e) => setDispatchPassOnAdd(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Dispatch Official Passcode to Email</span>
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 leading-relaxed">
                    Sends an authorization pass to this email so the educator can use it to register and create their official Teacher ID.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Confirm & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: BULK CSV IMPORT MODAL */}
      <AdminCsvImportModal
        isOpen={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        onImportUsers={handleBulkImportUsers}
        existingIdentifiers={userList.map((u) => u.rollOrCode)}
      />
    </div>
  );
};
