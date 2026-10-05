import React, { useState, useMemo } from 'react';
import { StudentUser, DepartmentGovernance, DepartmentAccessPermissions } from '../types';
import { Storage, RegisteredAccount } from '../utils/storage';
import {
  Award,
  Shield,
  Users,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  UserCheck,
  UserMinus,
  Settings2,
  Video,
  KeyRound,
  FileCheck,
  CalendarCheck,
  Megaphone,
  Radio,
  Sliders,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AdminHODViewProps {
  currentUser?: StudentUser | null;
  onTriggerAlert?: (alert: any) => void;
  onOpenGoogleMeet?: (department: string) => void;
}

export const AdminHODView: React.FC<AdminHODViewProps> = ({
  currentUser,
  onTriggerAlert,
  onOpenGoogleMeet,
}) => {
  const [departments, setDepartments] = useState<DepartmentGovernance[]>(() =>
    Storage.getDepartmentGovernance()
  );
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredAccount[]>(() =>
    Storage.getRegisteredUsers()
  );

  const [selectedDeptForAssign, setSelectedDeptForAssign] = useState<DepartmentGovernance | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [searchFacultyQuery, setSearchFacultyQuery] = useState('');

  const [selectedDeptForPerms, setSelectedDeptForPerms] = useState<DepartmentGovernance | null>(null);
  const [tempPermissions, setTempPermissions] = useState<DepartmentAccessPermissions>({
    curriculumApproval: true,
    facultyAllocation: true,
    attendanceSanction: true,
    emergencyBroadcast: true,
    labGovernance: true,
    marksVerification: true,
    googleMeetConferencing: true,
  });

  const [confirmRelieveDept, setConfirmRelieveDept] = useState<DepartmentGovernance | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Registered faculty eligible to be appointed as HOD
  const eligibleFaculty = useMemo(() => {
    return registeredUsers.filter((u) => {
      const isFacultyOrHod = u.role === 'teacher' || u.role === 'hod';
      const matchesSearch =
        u.name.toLowerCase().includes(searchFacultyQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchFacultyQuery.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchFacultyQuery.toLowerCase()));
      return isFacultyOrHod && matchesSearch;
    });
  }, [registeredUsers, searchFacultyQuery]);

  const assignedCount = departments.filter((d) => Boolean(d.hodName)).length;
  const vacantCount = departments.length - assignedCount;

  // Handle HOD Assignment
  const handleAssignHOD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptForAssign || !selectedFacultyId) return;

    const faculty = registeredUsers.find((u) => u.id === selectedFacultyId);
    if (!faculty) return;

    const updated = Storage.assignHODToDepartment(selectedDeptForAssign.department, faculty);
    setDepartments(updated);
    setRegisteredUsers(Storage.getRegisteredUsers());

    const notice = `Successfully appointed ${faculty.name} as Head of Department for ${selectedDeptForAssign.department}!`;
    setSuccessBanner(notice);
    setTimeout(() => setSuccessBanner(null), 5000);

    if (onTriggerAlert) {
      onTriggerAlert({
        id: `hod-assign-${Date.now()}`,
        type: 'system',
        title: `HOD Role Appointed: ${selectedDeptForAssign.department}`,
        message: `${faculty.name} has been assigned the HOD role with full department authority.`,
        timestamp: new Date().toISOString(),
        read: false,
        urgent: false,
      });
    }

    setSelectedDeptForAssign(null);
    setSelectedFacultyId('');
  };

  // Handle Relieve HOD
  const handleRelieveHOD = () => {
    if (!confirmRelieveDept) return;

    const updated = Storage.relieveHODFromDepartment(confirmRelieveDept.department);
    setDepartments(updated);
    setRegisteredUsers(Storage.getRegisteredUsers());

    const notice = `Relieved HOD leadership from ${confirmRelieveDept.department}. Role reverted to faculty instructor.`;
    setSuccessBanner(notice);
    setTimeout(() => setSuccessBanner(null), 5000);

    setConfirmRelieveDept(null);
  };

  // Handle Save Permissions
  const handleSavePermissions = () => {
    if (!selectedDeptForPerms) return;

    const updated = Storage.updateDepartmentPermissions(
      selectedDeptForPerms.department,
      tempPermissions
    );
    setDepartments(updated);

    const notice = `Access permissions updated for ${selectedDeptForPerms.department}.`;
    setSuccessBanner(notice);
    setTimeout(() => setSuccessBanner(null), 4000);

    setSelectedDeptForPerms(null);
  };

  // Quick Preset Actions for Permissions
  const handleApplyPreset = (preset: 'full' | 'academic' | 'minimal') => {
    if (preset === 'full') {
      setTempPermissions({
        curriculumApproval: true,
        facultyAllocation: true,
        attendanceSanction: true,
        emergencyBroadcast: true,
        labGovernance: true,
        marksVerification: true,
        googleMeetConferencing: true,
      });
    } else if (preset === 'academic') {
      setTempPermissions({
        curriculumApproval: true,
        facultyAllocation: true,
        attendanceSanction: true,
        emergencyBroadcast: false,
        labGovernance: true,
        marksVerification: true,
        googleMeetConferencing: true,
      });
    } else {
      setTempPermissions({
        curriculumApproval: true,
        facultyAllocation: false,
        attendanceSanction: false,
        emergencyBroadcast: false,
        labGovernance: false,
        marksVerification: true,
        googleMeetConferencing: false,
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-amber-900/60 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide">
              <Award className="w-4 h-4 text-amber-400" />
              <span>ACADEMIC GOVERNANCE & HOD ASSIGNMENT PORTAL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Head of Department (HOD) Leadership & Permissions
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/80 max-w-2xl leading-relaxed">
              Designate registered faculty members to institutional HOD roles per academic department.
              Configure granular permissions for curriculum approval, timetable course allocations, attendance waivers, and Google Meet faculty conferences.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center">
              <span className="block text-2xl font-black text-amber-300">{departments.length}</span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Departments</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center">
              <span className="block text-2xl font-black text-emerald-300">{assignedCount}</span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">HODs Appointed</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center">
              <span className="block text-2xl font-black text-rose-300">{vacantCount}</span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Vacant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-bold uppercase opacity-60 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Department Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {departments.map((dept) => {
          const isAssigned = Boolean(dept.hodName);
          const enabledPermsCount = Object.values(dept.permissions).filter(Boolean).length;

          return (
            <div
              key={dept.department}
              className={`rounded-2xl border transition-all flex flex-col justify-between p-6 ${
                isAssigned
                  ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 shadow-xs'
                  : 'bg-amber-50/40 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-800'
              }`}
            >
              <div className="space-y-4">
                {/* Department Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                        isAssigned
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {dept.department}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{dept.activeFacultyCount || 8} Active Faculty Members</span>
                        <span>·</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {enabledPermsCount} Active Permissions
                        </span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isAssigned
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {isAssigned ? 'HOD Appointed' : 'Leadership Vacant'}
                  </span>
                </div>

                {/* HOD Status Card */}
                {isAssigned ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {dept.hodName ? dept.hodName.charAt(0) : 'H'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {dept.hodName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono font-bold">
                            {dept.hodFacultyId || 'HOD-ID'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {dept.hodEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onOpenGoogleMeet && (
                        <button
                          type="button"
                          onClick={() => onOpenGoogleMeet(dept.department)}
                          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                          title="Host Google Meet Department Sync"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmRelieveDept(dept)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        title="Relieve HOD / Rotate Role"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-100/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No HOD currently designated for this department.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDeptForAssign(dept);
                        setSelectedFacultyId('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                    >
                      Assign HOD
                    </button>
                  </div>
                )}

                {/* Permissions Matrix Pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Delegated Access Authority:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'curriculumApproval', label: 'Curriculum Scheme', icon: FileCheck },
                      { key: 'facultyAllocation', label: 'Course Allocation', icon: Users },
                      { key: 'attendanceSanction', label: 'Attendance Override', icon: CalendarCheck },
                      { key: 'emergencyBroadcast', label: 'Dept Broadcast', icon: Megaphone },
                      { key: 'labGovernance', label: 'Lab Access', icon: Building },
                      { key: 'marksVerification', label: 'Internal Marks', icon: CheckCircle2 },
                      { key: 'googleMeetConferencing', label: 'Meet Sync', icon: Video },
                    ].map((p) => {
                      const enabled = (dept.permissions as any)[p.key];
                      const PIcon = p.icon;
                      return (
                        <span
                          key={p.key}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                            enabled
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 line-through opacity-60'
                          }`}
                        >
                          <PIcon className="w-3 h-3" />
                          <span>{p.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeptForPerms(dept);
                    setTempPermissions({ ...dept.permissions });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Configure Permissions</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeptForAssign(dept);
                    setSelectedFacultyId(dept.hodUserId || '');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isAssigned ? 'Reassign HOD' : 'Appoint HOD'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ASSIGN HOD TO DEPARTMENT */}
      {/* ======================================================== */}
      {selectedDeptForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Appoint Head of Department
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    {selectedDeptForAssign.department}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeptForAssign(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignHOD} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Registered Faculty Member to Promote to HOD
                </label>

                {/* Faculty Search */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFacultyQuery}
                    onChange={(e) => setSearchFacultyQuery(e.target.value)}
                    placeholder="Search faculty by name, email, department..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
                  {eligibleFaculty.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      No matching registered faculty instructors found.
                    </div>
                  ) : (
                    eligibleFaculty.map((faculty) => {
                      const isSelected = selectedFacultyId === faculty.id;
                      return (
                        <div
                          key={faculty.id}
                          onClick={() => setSelectedFacultyId(faculty.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="facultySelection"
                              checked={isSelected}
                              onChange={() => setSelectedFacultyId(faculty.id)}
                              className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {faculty.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {faculty.facultyId || faculty.studentId}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {faculty.email} · {faculty.department || 'General Faculty'}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                            {faculty.designation || faculty.role}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  Automated Role Updates:
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Upon assignment, this user will receive the official <strong>HOD</strong> role in RITE-OS,
                  updated designation as <strong>Head of Department & Professor</strong>, and department governance access.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedDeptForAssign(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFacultyId}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  Confirm & Elevate to HOD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CONFIGURE DEPARTMENT ACCESS PERMISSIONS */}
      {/* ======================================================== */}
      {selectedDeptForPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Department Access Permissions
                  </h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    {selectedDeptForPerms.department}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeptForPerms(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('full')}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold hover:underline cursor-pointer"
              >
                Full Authority
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('academic')}
                className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 font-bold hover:underline cursor-pointer"
              >
                Standard Academic
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('minimal')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:underline cursor-pointer"
              >
                Restricted
              </button>
            </div>

            {/* Permissions Toggles List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {[
                {
                  key: 'curriculumApproval',
                  title: 'Curriculum & Syllabus Approval Authority',
                  desc: 'Authorize BPUT syllabus module coverage, electives, and department curriculum schemes.',
                  icon: FileCheck,
                },
                {
                  key: 'facultyAllocation',
                  title: 'Faculty Teaching Load & Course Allocation',
                  desc: 'Distribute class lecture slots, assign lab sections, and balance teacher workload.',
                  icon: Users,
                },
                {
                  key: 'attendanceSanction',
                  title: 'Attendance Threshold Override & Leave Sanction',
                  desc: 'Approve medical waivers, condone attendance deficits, and verify student attendance rosters.',
                  icon: CalendarCheck,
                },
                {
                  key: 'emergencyBroadcast',
                  title: 'Department Circular & Emergency Alert Broadcasting',
                  desc: 'Publish departmental emergency notices and exam schedule revision bulletins.',
                  icon: Megaphone,
                },
                {
                  key: 'labGovernance',
                  title: 'Lab Facilities & Hardware Governance',
                  desc: 'Govern specialized department laboratories, high-performance computing centers, and instrumentation.',
                  icon: Building,
                },
                {
                  key: 'marksVerification',
                  title: 'Internal Assessment & Marks Verification',
                  desc: 'Sign off on semester internal assessments, practical viva scores, and assignment grading.',
                  icon: CheckCircle2,
                },
                {
                  key: 'googleMeetConferencing',
                  title: 'Google Meet Department Conferencing Oversight',
                  desc: 'Schedule and host official virtual Google Meet rooms for department reviews and viva exams.',
                  icon: Video,
                },
              ].map((item) => {
                const isChecked = Boolean((tempPermissions as any)[item.key]);
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    onClick={() =>
                      setTempPermissions((prev) => ({
                        ...prev,
                        [item.key]: !isChecked,
                      }))
                    }
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1 space-y-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDeptForPerms(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CONFIRM RELIEVE HOD */}
      {/* ======================================================== */}
      {confirmRelieveDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-2xl w-fit text-rose-600 dark:text-rose-400">
              <UserMinus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Relieve Department HOD?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to relieve <strong>{confirmRelieveDept.hodName}</strong> from the HOD position in <strong>{confirmRelieveDept.department}</strong>?
                Their account role will be transitioned back to standard Faculty Teacher.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmRelieveDept(null)}
                className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRelieveHOD}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Confirm Relieve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
