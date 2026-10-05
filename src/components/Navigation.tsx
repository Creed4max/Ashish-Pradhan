import React from 'react';
import { StudentUser } from '../types';
import {
  Compass,
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Calendar,
  Target,
  Calculator,
  Timer,
  Code2,
  LogIn,
  Mail,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingTasksCount: number;
  isClassActiveNow: boolean;
  currentUser?: StudentUser | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingTasksCount,
  isClassActiveNow,
  currentUser,
}) => {
  const isTeacher = currentUser?.role === 'teacher';
  const isHOD = currentUser?.role === 'hod';
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    {
      id: 'welcome',
      label: 'RITE-OS',
      icon: Compass,
    },
    ...(!currentUser || activeTab === 'login'
      ? [
          {
            id: 'login',
            label: 'RITE-OS Login',
            icon: LogIn,
          },
        ]
      : []),
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'tasks',
      label: isTeacher || isHOD ? 'Assignments' : 'Tasks',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    {
      id: 'notes',
      label: isTeacher || isHOD ? 'Lecture Notes' : 'Notes',
      icon: BookOpen,
    },
    {
      id: 'timetable',
      label: isTeacher || isHOD ? 'Teaching Schedule' : isAdmin ? 'Campus Timetable' : 'Timetable',
      icon: Calendar,
      indicator: isClassActiveNow,
    },
    {
      id: 'progress',
      label: isTeacher || isHOD ? 'Curriculum Coverage' : 'Study Progress',
      icon: Target,
    },
    {
      id: 'workspace',
      label: 'Gmail & Meet',
      icon: Mail,
    },
    {
      id: 'cgpa',
      label: 'CGPA Calc',
      icon: Calculator,
    },
    ...(!isAdmin
      ? [
          {
            id: 'pomodoro',
            label: 'Pomodoro',
            icon: Timer,
          },
        ]
      : []),
    {
      id: 'coding',
      label: 'Coding Practice',
      icon: Code2,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-16 z-20 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>

                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.indicator && (
                  <span className="relative flex h-2 w-2 ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Role tag indicator on the right */}
        {currentUser && (
          <div className="hidden lg:flex items-center pl-4 shrink-0">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                isHOD
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : isTeacher
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isAdmin
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}
            >
              {isHOD ? '🏛️ HOD Portal' : isTeacher ? '👨‍🏫 Faculty Portal' : isAdmin ? '🛡️ Admin Portal' : '🎓 Student Portal'}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
};
