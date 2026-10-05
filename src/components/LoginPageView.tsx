import React, { useState, useEffect } from 'react';
import { StudentUser, AppThemeId, UserRole, TeacherAuthPass } from '../types';
import { createStudentUser, Storage, RegisteredAccount } from '../utils/storage';
import { toggleThemeMode, isDarkMode } from '../utils/theme';
import { RiteLogo } from './RiteLogo';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Sun,
  Moon,
  LogIn,
  BookOpen,
  Briefcase,
  KeyRound,
  Building,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  Award,
  Check,
  RefreshCw,
  AlertCircle,
  Copy,
  Send,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateTeacherTemporaryPassword, sendTeacherTemporaryPasswordEmail } from '../services/emailService';
import { TeacherEmailCredentialNotice } from '../types';

interface LoginPageViewProps {
  onLoginSuccess: (user: StudentUser) => void;
  onNavigateLanding: () => void;
  currentTheme?: AppThemeId;
  onSelectTheme?: (theme: AppThemeId) => void;
}

export const LoginPageView: React.FC<LoginPageViewProps> = ({
  onLoginSuccess,
  onNavigateLanding,
  currentTheme = 'daybreak',
  onSelectTheme,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Common Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUniversity, setRegUniversity] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regColor, setRegColor] = useState('#4f46e5');

  // Student specific register fields
  const [regMajor, setRegMajor] = useState('');
  const [regSemester, setRegSemester] = useState('Semester 1');
  const [regStudentId, setRegStudentId] = useState('');

  // Teacher & HOD specific register fields
  const [teacherDepartment, setTeacherDepartment] = useState('');
  const [teacherDesignation, setTeacherDesignation] = useState('Assistant Professor');
  const [teacherFacultyId, setTeacherFacultyId] = useState('');

  // Teacher / HOD Authorization Pass Verification State
  const [authPassCode, setAuthPassCode] = useState('');
  const [verifiedPass, setVerifiedPass] = useState<TeacherAuthPass | null>(null);
  const [isVerifyingPass, setIsVerifyingPass] = useState(false);
  const [passVerificationMsg, setPassVerificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin specific register fields
  const [adminOffice, setAdminOffice] = useState('Office of Academic Affairs');
  const [adminCode, setAdminCode] = useState('');

  // Automated Email Service for Teacher Registration: Temporary Password
  const [teacherTempPassword, setTeacherTempPassword] = useState<string>(() =>
    generateTeacherTemporaryPassword('teacher')
  );
  const [credentialEmailNotice, setCredentialEmailNotice] = useState<TeacherEmailCredentialNotice | null>(null);
  const [isSendingTempEmail, setIsSendingTempEmail] = useState(false);
  const [copiedTempPassword, setCopiedTempPassword] = useState(false);
  const [showSuccessCredentialModal, setShowSuccessCredentialModal] = useState(false);
  const [newlyRegisteredTeacher, setNewlyRegisteredTeacher] = useState<RegisteredAccount | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const isDark = isDarkMode(currentTheme);

  // Live time ticker for RITE-OS immersion
  const [clockString, setClockString] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 45,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#7c3aed'],
      });
    } catch {
      // ignore
    }
  };

  const handleVerifyPass = async (codeToVerify?: string) => {
    const code = (codeToVerify || authPassCode).trim().toUpperCase();
    if (!code) {
      setPassVerificationMsg({
        type: 'error',
        text: 'Please enter the authorization pass code sent to your email by your Administrator.',
      });
      return;
    }

    setIsVerifyingPass(true);
    setPassVerificationMsg(null);

    try {
      // Validate via storage
      const res = Storage.validateTeacherAuthPass(code, regEmail.trim() || undefined);
      if (!res.valid || !res.pass) {
        setPassVerificationMsg({
          type: 'error',
          text: res.error || 'Invalid passcode or email mismatch. Please check with your Administrator.',
        });
        setVerifiedPass(null);
        return;
      }

      const pass = res.pass;
      setVerifiedPass(pass);
      setAuthPassCode(pass.passCode);
      if (pass.teacherEmail) setRegEmail(pass.teacherEmail);
      if (pass.teacherName && !regName.trim()) setRegName(pass.teacherName);
      if (pass.department) setTeacherDepartment(pass.department);
      if (pass.generatedFacultyId) setTeacherFacultyId(pass.generatedFacultyId);

      if (pass.role) {
        setSelectedRole(pass.role);
        if (pass.role === 'hod') {
          setTeacherDesignation('Head of Department & Professor');
        }
      }

      setPassVerificationMsg({
        type: 'success',
        text: `✓ Authorization Pass Verified! Issued to ${pass.teacherEmail}. Official Teacher ID: ${pass.generatedFacultyId} is unlocked and assigned.`,
      });
      triggerConfetti();
    } finally {
      setIsVerifyingPass(false);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = loginIdentifier.trim();
    if (!trimmed) {
      setFormError(
        selectedRole === 'student'
          ? 'Please enter your registered student roll number or institutional email.'
          : selectedRole === 'teacher'
          ? 'Please enter your registered faculty ID or academic email.'
          : 'Please enter your registered administrator code or institutional email.'
      );
      return;
    }

    // Look up in registered accounts database
    const existing = Storage.findRegisteredUser(trimmed, selectedRole) || Storage.findRegisteredUser(trimmed);

    if (!existing) {
      // User is not registered! Reject direct login and route to full profile registration
      setFormError(
        `Account not found for "${trimmed}". New users must complete full profile registration before signing in.`
      );
      if (trimmed.includes('@')) {
        setRegEmail(trimmed);
      } else {
        setRegName(trimmed);
      }
      if (loginPassword) {
        setRegPassword(loginPassword);
      }
      // Direct them to complete registration
      setAuthMode('register');
      return;
    }

    // Verify password if password was set on the account (supports both permanent and issued temporary password)
    if (
      existing.password &&
      loginPassword &&
      existing.password !== loginPassword &&
      existing.initialTempPassword !== loginPassword
    ) {
      setFormError('Incorrect password. Please check your credentials or enter the correct password.');
      return;
    }

    // If matching user exists under a different role, switch role to match
    if (existing.role && existing.role !== selectedRole) {
      setSelectedRole(existing.role);
    }

    triggerConfetti();
    onLoginSuccess(existing);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const isTeacherRole = selectedRole === 'teacher' || selectedRole === 'hod';

    // Common Profile Validations: MANDATORY
    if (!regName.trim() || regName.trim().length < 2) {
      setFormError('Please enter your full legal or institutional name (minimum 2 characters).');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@') || !regEmail.includes('.')) {
      setFormError('Please enter a valid institutional or academic email address.');
      return;
    }
    if (!regUniversity.trim()) {
      setFormError('Please enter your University or Institution name (e.g. Radhakrishna Institute of Technology).');
      return;
    }

    // Password validation: required for student & admin.
    // For teacher/HOD, temporary password is automatically generated and dispatched to their email
    if (!isTeacherRole && (!regPassword.trim() || regPassword.length < 4)) {
      setFormError('Please set an account security password (minimum 4 characters).');
      return;
    }

    // Role-specific validations: FULL PROFILE MANDATORY
    if (selectedRole === 'student') {
      if (!regMajor.trim()) {
        setFormError('Please specify your Degree Branch or Academic Department.');
        return;
      }
      if (!regStudentId.trim()) {
        setFormError('Please enter your official Student Roll Number or University Registration ID.');
        return;
      }
    } else if (selectedRole === 'teacher' || selectedRole === 'hod') {
      if (!teacherDepartment.trim()) {
        setFormError('Please specify your Teaching Department or Academic Faculty.');
        return;
      }

      // Authorization pass validation: strictly required to create Teacher ID
      const passToValidate = authPassCode.trim().toUpperCase();
      if (!passToValidate) {
        setFormError(
          `An authorization pass code sent to your email by your Administrator is required to create a ${
            selectedRole === 'hod' ? 'Head of Department (HOD)' : 'Teacher'
          } ID.`
        );
        return;
      }

      const passValidation = Storage.validateTeacherAuthPass(passToValidate, regEmail.trim());
      if (!passValidation.valid || !passValidation.pass) {
        setFormError(
          passValidation.error ||
          'Invalid Authorization Passcode. Please enter the valid pass sent to your institutional email.'
        );
        return;
      }

      // Ensure teacher faculty ID is set from pass or input
      const assignedId = passValidation.pass.generatedFacultyId || teacherFacultyId.trim();
      if (!assignedId) {
        setFormError('Faculty ID is required.');
        return;
      }

      // Claim pass in storage and backend
      Storage.claimTeacherAuthPass(passToValidate);
      try {
        fetch('/api/auth/claim-teacher-pass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passCode: passToValidate }),
        }).catch(() => {});
      } catch {
        // silent fallback
      }
    } else if (selectedRole === 'admin') {
      if (!adminOffice.trim()) {
        setFormError('Please specify your Administrative Office or Directorate.');
        return;
      }
      if (!adminCode.trim()) {
        setFormError('Please enter your Admin Security Clearance Code.');
        return;
      }
    }

    // Check for duplicate registered accounts
    const existingEmail = Storage.findRegisteredUser(regEmail.trim());
    const existingId = Storage.findRegisteredUser(
      selectedRole === 'student'
        ? regStudentId.trim()
        : selectedRole === 'teacher' || selectedRole === 'hod'
        ? (verifiedPass?.generatedFacultyId || teacherFacultyId.trim())
        : adminCode.trim()
    );

    if (existingEmail || existingId) {
      setFormError('An account with this email address or identifier is already registered. Please sign in instead.');
      setAuthMode('signin');
      setLoginIdentifier(regEmail.trim());
      return;
    }

    const roleColor =
      selectedRole === 'hod'
        ? '#d97706'
        : selectedRole === 'teacher'
        ? '#059669'
        : selectedRole === 'admin'
        ? '#7c3aed'
        : '#4f46e5';

    const assignedFacultyId =
      selectedRole === 'teacher' || selectedRole === 'hod'
        ? (verifiedPass?.generatedFacultyId || teacherFacultyId.trim())
        : '';

    const newUser: RegisteredAccount = {
      id: `user-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      role: selectedRole,
      university: regUniversity.trim(),
      major: selectedRole === 'student' ? regMajor.trim() : teacherDepartment.trim(),
      semester: selectedRole === 'student' ? regSemester : '',
      studentId:
        selectedRole === 'student'
          ? regStudentId.trim()
          : selectedRole === 'teacher' || selectedRole === 'hod'
          ? assignedFacultyId
          : adminCode.trim(),
      department:
        selectedRole === 'teacher' || selectedRole === 'hod'
          ? teacherDepartment.trim()
          : selectedRole === 'student'
          ? regMajor.trim()
          : '',
      designation:
        selectedRole === 'hod'
          ? 'Head of Department & Professor'
          : selectedRole === 'teacher'
          ? teacherDesignation
          : '',
      facultyId: assignedFacultyId,
      adminOffice: selectedRole === 'admin' ? adminOffice.trim() : '',
      adminCode: selectedRole === 'admin' ? adminCode.trim() : '',
      avatarColor: regColor || roleColor,
      joinedAt: new Date().toISOString(),
      password: isTeacherRole ? (teacherTempPassword || generateTeacherTemporaryPassword(selectedRole)) : regPassword.trim(),
      initialTempPassword: isTeacherRole ? (teacherTempPassword || generateTeacherTemporaryPassword(selectedRole)) : undefined,
      tempPasswordIssued: isTeacherRole,
      isProfileComplete: true,
      authPassUsed:
        selectedRole === 'teacher' || selectedRole === 'hod'
          ? authPassCode.trim().toUpperCase()
          : undefined,
    };

    // Save newly registered user with full profile into registered accounts
    Storage.registerNewUser(newUser);

    if (isTeacherRole) {
      const finalTempPassword = newUser.password;
      setIsSendingTempEmail(true);
      sendTeacherTemporaryPasswordEmail({
        teacherEmail: regEmail.trim(),
        teacherName: regName.trim(),
        facultyId: assignedFacultyId,
        department: teacherDepartment.trim(),
        role: selectedRole,
        customTempPassword: finalTempPassword,
      })
        .then((res) => {
          setCredentialEmailNotice(res.notice);
          setIsSendingTempEmail(false);
        })
        .catch((err) => {
          console.warn('Temporary password email dispatch fallback:', err);
          setIsSendingTempEmail(false);
        });

      triggerConfetti();
      setNewlyRegisteredTeacher(newUser);
      setShowSuccessCredentialModal(true);
    } else {
      triggerConfetti();
      onLoginSuccess(newUser);
    }
  };

  const roleMeta = {
    student: {
      label: 'Student',
      icon: GraduationCap,
      color: 'bg-indigo-600',
      badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      tagline: 'Personal Academic Productivity Suite',
      description: 'Coursework deadlines, AI study assistant, live timetable, and personal lecture notes.',
      placeholder: 'Enter student roll or email (e.g. 2201289045 or ashish@riteindia.edu.in)...',
      labelTitle: 'Student Identifier or Email',
      highlightColor: 'from-indigo-600 to-blue-600',
      features: [
        'AI Course Material Q&A grounded in your syllabus',
        'Task deadline alerts & live lecture timetables',
        'Personal lecture notes with topic checklists',
      ],
    },
    teacher: {
      label: 'Teacher',
      icon: BookOpen,
      color: 'bg-emerald-600',
      badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      tagline: 'Faculty Portal & Class Management Tools',
      description: 'Interactive class attendance rosters, curriculum coverage tracking, and assignment dispatchers.',
      placeholder: 'Enter faculty ID or academic email (e.g. FAC-CSE-102 or prof@riteindia.edu.in)...',
      labelTitle: 'Faculty Name or Academic Email',
      highlightColor: 'from-emerald-600 to-teal-600',
      features: [
        'Live student attendance roster & lecture timer',
        'Direct assignment dispatcher straight to classes',
        'Curriculum syllabus module coverage tracker',
      ],
    },
    hod: {
      label: 'HOD',
      icon: Award,
      color: 'bg-amber-600',
      badgeClass: 'bg-amber-50 border-amber-200 text-amber-700',
      tagline: 'Department Leadership & Academic Oversight',
      description: 'Departmental faculty coordination, syllabus progress metrics, and academic governance.',
      placeholder: 'Enter HOD ID or institutional email (e.g. HOD-CSE-101 or d.swain@riteindia.edu.in)...',
      labelTitle: 'HOD Identifier or Academic Email',
      highlightColor: 'from-amber-600 to-orange-600',
      features: [
        'Departmental faculty coordination & course allocations',
        'Syllabus delivery & module audit metrics',
        'Direct student attendance oversight & academic reviews',
      ],
    },
    admin: {
      label: 'Admin',
      icon: Shield,
      color: 'bg-purple-600',
      badgeClass: 'bg-purple-50 border-purple-200 text-purple-700',
      tagline: 'Campus Administration & Institutional Registry',
      description: 'Campus facility occupancy, departmental course catalog, and institute-wide broadcasts.',
      placeholder: 'Enter administrator code or system email (e.g. ADM-8800 or admin@riteindia.edu.in)...',
      labelTitle: 'Administrator Name or System Email',
      highlightColor: 'from-purple-600 to-indigo-600',
      features: [
        'Faculty & HOD authorization pass dispatcher',
        'Campus-wide emergency & academic notice broadcaster',
        'Department curriculum & schedule clash management',
      ],
    },
  }[selectedRole];

  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row antialiased bg-slate-900 text-slate-100 overflow-x-hidden">
      {/* LEFT HALF: Expansive RITE-OS Immersion & Brand Showcase */}
      <div className="w-full lg:w-1/2 min-h-[420px] lg:min-h-screen bg-slate-950 flex flex-col justify-between p-6 sm:p-10 lg:p-16 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-indigo-950/80">
        {/* Real Sunset Skyline Background with Atmospheric Gradient */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <img
            src="/pexels-apasaric-3629227.jpg"
            alt="Skyline Backdrop"
            className="w-full h-full object-cover object-center opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-indigo-950/85 to-slate-950/95" />
        </div>

        {/* Background ambient mesh glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Nav */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateLanding}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Splash Screen</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-indigo-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{clockString || 'CAMPUS LIVE'}</span>
            </div>
            {onSelectTheme && (
              <button
                type="button"
                onClick={() => onSelectTheme(toggleThemeMode(currentTheme))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
              </button>
            )}
          </div>
        </div>

        {/* Central Hero Branding & Dynamic Role Showcase */}
        <div className="relative z-10 my-8 sm:my-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>RADHAKRISHNA INSTITUTE OF TECHNOLOGY & ENGINEERING</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-serif"
                style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
              >
                RITE
              </h1>
              <span className="text-2xl sm:text-3xl font-black font-sans px-3 py-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                OS
              </span>
            </div>
            <p className="text-base sm:text-lg text-indigo-200/90 font-medium max-w-xl">
              The official academic operating system for Radhakrishna Institute students, faculty instructors, and institutional administration.
            </p>
          </div>

          {/* Dynamic Role Capability Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl space-y-4 max-w-xl transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${roleMeta.highlightColor} flex items-center justify-center text-white shadow-md`}>
                  <RoleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {roleMeta.label} Experience
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-indigo-200">
                      Active
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200/80">{roleMeta.tagline}</p>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {roleMeta.description}
            </p>

            {/* Feature Bullets */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              {roleMeta.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-indigo-100 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Status Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-300/80">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>RITE Campus Database · Clean & Ready</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Powered by Google Gemini 3.8 & React SPA
          </span>
        </div>
      </div>

      {/* RIGHT HALF: Spacious, Full-Screen Auth Portal */}
      <div className="w-full lg:w-1/2 min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-center p-6 sm:p-10 lg:p-16 overflow-y-auto">
        <div className="max-w-xl w-full mx-auto space-y-6">
          {/* Top Title & Subtitle */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <RiteLogo size="sm" showText={true} showSubtitle={false} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {authMode === 'signin' ? 'Sign In to RITE-OS' : 'Create New RITE-OS Account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select your role below and enter your credentials to open your academic workspace.
            </p>
          </div>

          {/* 4-Way Role Selector (Student, Teacher, HOD, Admin) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Your Account Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('student');
                  setFormError(null);
                }}
                className={`py-2.5 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'student'
                    ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('teacher');
                  setFormError(null);
                }}
                className={`py-2.5 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'teacher'
                    ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Teacher</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('hod');
                  setFormError(null);
                }}
                className={`py-2.5 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'hod'
                    ? 'bg-amber-600 text-white shadow-md font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>HOD</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setFormError(null);
                }}
                className={`py-2.5 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-purple-600 text-white shadow-md font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher: Sign In vs New Account */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-200/50 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setFormError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Quick Sign In / Enter
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setFormError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Full Profile Registration
            </button>
          </div>

          {/* Error Message Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* FORM: Sign In or Register */}
          {authMode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Pre-registered Institutional Accounts quick fill */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Institutional Profile (For Testing):
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRole === 'student') {
                        setLoginIdentifier('2201289045');
                        setLoginPassword('password123');
                      } else if (selectedRole === 'teacher') {
                        setLoginIdentifier('FAC-ECE-204');
                        setLoginPassword('password123');
                      } else if (selectedRole === 'hod') {
                        setLoginIdentifier('HOD-CSE-101');
                        setLoginPassword('password123');
                      } else {
                        setLoginIdentifier('ADM-8800');
                        setLoginPassword('admin');
                      }
                      setFormError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <span>
                      {selectedRole === 'student'
                        ? 'Ashish Kumar (2201289045)'
                        : selectedRole === 'teacher'
                        ? 'Prof. Ananya Jena (FAC-ECE-204)'
                        : selectedRole === 'hod'
                        ? 'Dr. Debabrata Swain (HOD-CSE-101)'
                        : 'Academic Administrator (ADM-8800)'}
                    </span>
                    <span className="text-[10px] font-normal opacity-75">Click to auto-fill</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {roleMeta.labelTitle}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={roleMeta.placeholder}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-2xs"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {selectedRole === 'admin' ? 'Administrator Key / Password' : 'Password or PIN'}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Optional for instant access
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Save session on this browser</span>
                </label>
                <span className="text-slate-400 text-[11px]">Instant workspace setup</span>
              </div>

              {/* Big Prominent ENTER Button */}
              <button
                type="submit"
                className={`w-full py-4 px-6 text-white rounded-2xl font-black text-sm sm:text-base shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer group mt-4 ${
                  selectedRole === 'teacher'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : selectedRole === 'hod'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                    : selectedRole === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                <LogIn className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" />
                <span>ENTER RITE-OS AS {roleMeta.label.toUpperCase()}</span>
                <span className="text-xs font-mono opacity-60 ml-auto hidden sm:inline">&lt;Enter ↵&gt;</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>

              {/* For Teacher and HOD: Option to activate account using Admin email pass */}
              {(selectedRole === 'teacher' || selectedRole === 'hod') && (
                <div className="pt-2">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
                      <KeyRound className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div>
                        <span className="font-bold">Received an Authorization Pass from Admin?</span>
                        <p className="text-[11px] opacity-80">Use the passcode dispatched to your email to verify and create your Teacher ID.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setFormError(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                    >
                      Claim Pass
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={
                      selectedRole === 'student'
                        ? 'e.g. Maya Lin'
                        : selectedRole === 'teacher'
                        ? 'e.g. Prof. Robert Chen'
                        : 'e.g. Sarah Miller'
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  University / Academic Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'student'
                        ? 'student.roll@riteindia.edu.in'
                        : selectedRole === 'teacher'
                        ? 'faculty@riteindia.edu.in'
                        : 'admin@riteindia.edu.in'
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  University / Institution <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regUniversity}
                    onChange={(e) => setRegUniversity(e.target.value)}
                    placeholder="e.g. Radhakrishna Institute of Technology & Engineering (RITE)"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Student Fields */}
              {selectedRole === 'student' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Major / Branch <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regMajor}
                        onChange={(e) => setRegMajor(e.target.value)}
                        placeholder="e.g. Computer Science & Engg"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Academic Term <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={regSemester}
                        onChange={(e) => setRegSemester(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={`Semester ${sem}`}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Student Roll Number / Registration ID <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regStudentId}
                        onChange={(e) => setRegStudentId(e.target.value)}
                        placeholder="e.g. 2201289045"
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher and HOD Fields: Strictly Verified via Admin Email Authorization Pass */}
              {(selectedRole === 'teacher' || selectedRole === 'hod') && (
                <div className="space-y-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Institutional Authorization Passcode</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-extrabold uppercase">
                            Required
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {selectedRole === 'hod'
                            ? 'Enter the passcode dispatched by the Administrator to your email to verify and unlock your HOD ID.'
                            : 'Enter the passcode dispatched by the Administrator to your email to verify and unlock your Teacher ID.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Authorization Pass Code (from Admin Email) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={authPassCode}
                          onChange={(e) => {
                            setAuthPassCode(e.target.value);
                            setPassVerificationMsg(null);
                          }}
                          placeholder={selectedRole === 'hod' ? 'e.g. HOD-PASS-992314' : 'e.g. FAC-PASS-884102'}
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase font-bold tracking-wider"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleVerifyPass()}
                        disabled={isVerifyingPass || !authPassCode.trim()}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        {isVerifyingPass ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Verify Pass</span>
                      </button>
                    </div>

                    {/* Quick Demo Passes Helper */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Quick Test Passes:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthPassCode('FAC-PASS-884102');
                          setRegEmail('subhashree.cse@riteindia.edu.in');
                          handleVerifyPass('FAC-PASS-884102');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono font-bold cursor-pointer transition-colors"
                      >
                        FAC-PASS-884102 (Teacher)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthPassCode('HOD-PASS-992314');
                          setRegEmail('hod.ece@riteindia.edu.in');
                          handleVerifyPass('HOD-PASS-992314');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-mono font-bold cursor-pointer transition-colors"
                      >
                        HOD-PASS-992314 (HOD)
                      </button>
                    </div>

                    {/* Pass verification feedback banner */}
                    {passVerificationMsg && (
                      <div
                        className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          passVerificationMsg.type === 'success'
                            ? 'bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100/80 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {passVerificationMsg.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        )}
                        <span>{passVerificationMsg.text}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Academic Department <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={teacherDepartment}
                        onChange={(e) => setTeacherDepartment(e.target.value)}
                        placeholder="e.g. Computer Science & Engineering"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Designation <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={teacherDesignation}
                        onChange={(e) => setTeacherDesignation(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      >
                        {selectedRole === 'hod' ? (
                          <>
                            <option value="Head of Department & Professor">Head of Department & Professor</option>
                            <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                            <option value="Professor & Head of Department">Professor & Head of Department</option>
                            <option value="Associate Professor & HOD">Associate Professor & HOD</option>
                          </>
                        ) : (
                          <>
                            <option value="Professor">Professor</option>
                            <option value="Associate Professor">Associate Professor</option>
                            <option value="Assistant Professor">Assistant Professor</option>
                            <option value="Senior Lecturer">Senior Lecturer</option>
                            <option value="Faculty Lecturer">Faculty Lecturer</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {selectedRole === 'hod' ? 'Official HOD ID Code' : 'Official Teacher ID Code'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        {verifiedPass ? '✓ Unlocked via Admin Pass' : 'Auto-assigned by Admin Pass verification'}
                      </span>
                    </div>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={teacherFacultyId}
                        onChange={(e) => setTeacherFacultyId(e.target.value)}
                        placeholder={selectedRole === 'hod' ? 'e.g. HOD-CSE-101' : 'e.g. FAC-CSE-102'}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Fields */}
              {selectedRole === 'admin' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Administrative Office / Directorate <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminOffice}
                      onChange={(e) => setAdminOffice(e.target.value)}
                      placeholder="e.g. Office of Academic Registrar & Dean"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Admin Security Clearance Code <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="e.g. ADM-8800"
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password Configuration */}
              {selectedRole === 'teacher' || selectedRole === 'hod' ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Automated Account Security Email Service
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      Dispatched on Registration
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    To secure your initial account access, an automated email service will generate and dispatch your official temporary password directly to{' '}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono break-all">
                      {regEmail || 'your institutional email address'}
                    </strong>
                    .
                  </p>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/60">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Generated Initial Temporary Password
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                          {teacherTempPassword}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          (Sent to Email)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setTeacherTempPassword(generateTeacherTemporaryPassword(selectedRole))
                      }
                      title="Generate another temporary password"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Use this temporary password for your initial account access. You can update your permanent credentials in account settings after initial sign-in.
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Security Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password (min 4 characters)..."
                      className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={isSendingTempEmail}
                className={`w-full py-4 px-6 text-white rounded-2xl font-black text-sm sm:text-base shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer group mt-4 ${
                  selectedRole === 'teacher'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : selectedRole === 'hod'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                    : selectedRole === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                {isSendingTempEmail ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-white/90 animate-spin" />
                    <span>DISPATCHING TEMPORARY PASSWORD TO EMAIL...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" />
                    <span>
                      {selectedRole === 'teacher' || selectedRole === 'hod'
                        ? 'REGISTER & DISPATCH TEMPORARY PASSWORD TO EMAIL'
                        : 'COMPLETE REGISTRATION & ENTER'}
                    </span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Automated Email Service: Temporary Password Dispatched Success Modal */}
      {showSuccessCredentialModal && newlyRegisteredTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-200 dark:border-emerald-800 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold tracking-wide">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>AUTOMATED EMAIL SERVICE ACTIVE</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Temporary Password Sent to Email!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Initial account access credentials for <strong>{newlyRegisteredTeacher.name}</strong> have been generated and dispatched to secure initial access.
                </p>
              </div>
            </div>

            {/* Credential summary card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 break-all font-mono">
                    {newlyRegisteredTeacher.email}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Faculty ID</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {newlyRegisteredTeacher.facultyId || newlyRegisteredTeacher.studentId}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Generated Temporary Password
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Secures Initial Access
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700">
                  <span className="font-mono text-base font-black text-slate-900 dark:text-white tracking-wider">
                    {newlyRegisteredTeacher.password}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyRegisteredTeacher.password || '');
                      setCopiedTempPassword(true);
                      setTimeout(() => setCopiedTempPassword(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {copiedTempPassword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTempPassword ? 'Copied!' : 'Copy Password'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Guidance */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <KeyRound className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                An official security email containing these credentials and initial access instructions has been dispatched to <strong>{newlyRegisteredTeacher.email}</strong>. Use this temporary password for your initial sign-in.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessCredentialModal(false);
                  setAuthMode('signin');
                  setLoginIdentifier(newlyRegisteredTeacher.facultyId || newlyRegisteredTeacher.email);
                  setLoginPassword(newlyRegisteredTeacher.password || '');
                }}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Sign In with Temporary Password
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessCredentialModal(false);
                  onLoginSuccess(newlyRegisteredTeacher);
                }}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Enter Faculty Suite Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
