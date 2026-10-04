import React, { useState } from 'react';
import { StudentUser, AppThemeId, UserRole } from '../types';
import {
  GraduationCap,
  BookOpen,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Building,
  Mail,
  User,
  Hash,
  Award,
  Layers,
  Palette,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProfileCompletionViewProps {
  currentUser: StudentUser;
  onProfileComplete: (completedUser: StudentUser) => void;
  onSignOut: () => void;
  currentTheme: AppThemeId;
  onSelectTheme?: (theme: AppThemeId) => void;
}

export const ProfileCompletionView: React.FC<ProfileCompletionViewProps> = ({
  currentUser,
  onProfileComplete,
  onSignOut,
}) => {
  const [role, setRole] = useState<UserRole>(currentUser.role || 'student');
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [university, setUniversity] = useState(
    currentUser.university || 'Radhakrishna Institute of Technology and Engineering (RITE)'
  );
  
  // Student fields
  const [major, setMajor] = useState(currentUser.major || 'Computer Science & Engineering');
  const [semester, setSemester] = useState(currentUser.semester || 'Semester 5');
  const [studentId, setStudentId] = useState(currentUser.studentId || '');

  // Teacher fields
  const [department, setDepartment] = useState(currentUser.department || currentUser.major || 'Computer Science & Engineering');
  const [designation, setDesignation] = useState(currentUser.designation || 'Assistant Professor');
  const [facultyId, setFacultyId] = useState(currentUser.facultyId || currentUser.studentId || '');

  // Admin fields
  const [adminOffice, setAdminOffice] = useState(currentUser.adminOffice || 'Office of Academic Affairs');
  const [adminCode, setAdminCode] = useState(currentUser.adminCode || currentUser.studentId || '');

  // Avatar color
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || '#4f46e5');

  // Error feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleMeta = {
    student: {
      label: 'Student Account',
      icon: GraduationCap,
      color: '#4f46e5',
      badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    },
    teacher: {
      label: 'Faculty / Teacher Account',
      icon: BookOpen,
      color: '#059669',
      badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    admin: {
      label: 'Institutional Administrator',
      icon: Shield,
      color: '#7c3aed',
      badgeClass: 'bg-purple-50 border-purple-200 text-purple-700',
    },
  };

  // Missing fields audit
  const missingItems: string[] = [];
  if (!name.trim()) missingItems.push('Full Legal Name');
  if (!email.trim() || !email.includes('@')) missingItems.push('Institutional Email');
  if (!university.trim()) missingItems.push('University / Institution');
  if (role === 'student') {
    if (!major.trim()) missingItems.push('Major / Degree Branch');
    if (!semester.trim()) missingItems.push('Academic Semester');
    if (!studentId.trim()) missingItems.push('Student Roll Number / Registration ID');
  } else if (role === 'teacher') {
    if (!department.trim()) missingItems.push('Teaching Department');
    if (!designation.trim()) missingItems.push('Academic Designation');
    if (!facultyId.trim()) missingItems.push('Faculty ID Code');
  } else if (role === 'admin') {
    if (!adminOffice.trim()) missingItems.push('Administrative Directorate');
    if (!adminCode.trim()) missingItems.push('Admin Security Code');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (missingItems.length > 0) {
      setErrorMessage(`Please complete all required fields: ${missingItems.join(', ')}.`);
      return;
    }

    const updatedUser: StudentUser = {
      ...currentUser,
      id: currentUser.id || `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      university: university.trim(),
      major: role === 'student' ? major.trim() : department.trim(),
      semester: role === 'student' ? semester : '',
      studentId: role === 'student' ? studentId.trim() : (role === 'teacher' ? facultyId.trim() : adminCode.trim()),
      department: role === 'teacher' ? department.trim() : (role === 'student' ? major.trim() : ''),
      designation: role === 'teacher' ? designation : '',
      facultyId: role === 'teacher' ? facultyId.trim() : '',
      adminOffice: role === 'admin' ? adminOffice.trim() : '',
      adminCode: role === 'admin' ? adminCode.trim() : '',
      avatarColor,
      joinedAt: currentUser.joinedAt || new Date().toISOString(),
      isProfileComplete: true,
    };

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#7c3aed', '#f59e0b'],
      });
    } catch {
      // safe fallback
    }

    onProfileComplete(updatedUser);
  };

  const CurrentRoleIcon = roleMeta[role].icon;

  return (
    <div className="min-h-screen bg-slate-900/95 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm">
            R
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-sm sm:text-base">CampusOS</span>
            <span className="text-[11px] text-indigo-400 font-mono ml-2">Profile Verification Gateway</span>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl w-full mx-auto my-6 sm:my-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Action Required · Missing Registration Data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Complete Your Institutional Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Before accessing the academic dashboard, your institutional registration data must be completed and confirmed for identity verification and role-based permissions.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md font-bold text-lg"
              style={{ backgroundColor: avatarColor }}
            >
              {name.trim() ? name.trim().charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <CurrentRoleIcon className="w-3.5 h-3.5" />
              <span>{roleMeta[role].label}</span>
            </span>
          </div>
        </div>

        {/* Missing items indicator */}
        <div className="mt-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <p className="font-bold">Missing Required Fields:</p>
            {missingItems.length > 0 ? (
              <p className="mt-0.5 opacity-90">
                The following registration attributes are required before dashboard access is permitted: <span className="font-semibold underline">{missingItems.join(', ')}</span>.
              </p>
            ) : (
              <p className="mt-0.5 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 inline" />
                All mandatory profile details are completed. Click below to enter your workspace!
              </p>
            )}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Role Verification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              1. Institutional Role Classification <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['student', 'teacher', 'admin'] as UserRole[]).map((r) => {
                const meta = roleMeta[r];
                const Icon = meta.icon;
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setAvatarColor(meta.color);
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl text-white`}
                      style={{ backgroundColor: meta.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">{r}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {r === 'student' ? 'Assignments & timetable' : r === 'teacher' ? 'Course management' : 'Academic directorate'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Core Identity */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              2. Core Identity Details <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ashish Kumar"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@riteindia.edu.in"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                University / Institution Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Radhakrishna Institute of Technology and Engineering (RITE)"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Role-Specific Credentials */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. {role === 'student' ? 'Student Academic Information' : role === 'teacher' ? 'Faculty Departmental Details' : 'Administrator Clearance'} <span className="text-rose-500">*</span>
            </label>

            {role === 'student' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Roll No / University ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. 2201289045"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Major / Branch <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={`Semester ${s}`}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {role === 'teacher' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty ID Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                      placeholder="e.g. FAC-CSE-102"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Associate Professor & HOD"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Administrative Directorate / Office <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={adminOffice}
                      onChange={(e) => setAdminOffice(e.target.value)}
                      placeholder="e.g. Office of Academic Affairs"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Admin Security Clearance Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      placeholder="e.g. ADM-8800"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Accent Color */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span>4. Profile Accent Color</span>
            </label>
            <div className="flex items-center gap-2">
              {['#4f46e5', '#059669', '#0284c7', '#d97706', '#e11d48', '#7c3aed', '#0d9488'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    avatarColor === c ? 'scale-115 border-slate-900 dark:border-white shadow-sm' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSignOut}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Sign Out & Use Different Account
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <span>Save Profile & Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto text-center py-2 text-xs text-slate-500">
        CampusOS Academic Suite · Radhakrishna Institute of Technology & Engineering (RITE)
      </div>
    </div>
  );
};
