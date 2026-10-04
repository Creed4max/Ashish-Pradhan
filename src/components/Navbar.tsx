import React, { useEffect, useState, useRef } from 'react';
import { StudentUser, AppThemeId, AuthSession } from '../types';
import { ThemeSelector, LightDarkToggle } from './ThemeSelector';
import { APP_THEMES, toggleThemeMode } from '../utils/theme';
import { RiteLogo } from './RiteLogo';
import {
  GraduationCap,
  Clock,
  Plus,
  Play,
  Database,
  Flame,
  CalendarDays,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
  Palette,
  Bell,
  BookOpen,
  Shield,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  KeyRound,
} from 'lucide-react';

interface NavbarProps {
  currentUser: StudentUser | null;
  currentTheme: AppThemeId;
  onSelectTheme: (theme: AppThemeId) => void;
  onOpenNewTask: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenBackup: () => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
  todayStudyMinutes: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  session?: AuthSession | null;
  onRefreshToken?: () => Promise<void>;
  isRefreshingToken?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTheme,
  onSelectTheme,
  onOpenNewTask,
  onNavigateToTab,
  onOpenBackup,
  onOpenLogin,
  onSignOut,
  todayStudyMinutes,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  session,
  onRefreshToken,
  isRefreshingToken = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [sessionRemainingSec, setSessionRemainingSec] = useState<number>(() => {
    if (!session?.expiresAt) return 900;
    return Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!session?.expiresAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setSessionRemainingSec(remaining);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatStudyTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity: RITE-OS with official logo */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigateToTab('welcome')}
            className="flex items-center cursor-pointer group"
            title="Go to RITE-OS Welcome Screen"
          >
            <RiteLogo size="md" showText={true} showSubtitle={true} />
          </div>
        </div>

        {/* Live campus clock & study streak stats */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-600 border-x border-slate-200 px-6">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-800">{currentDate}</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-slate-600">{currentTime}</span>
          </div>

          {currentUser?.role !== 'admin' && (
            <div className="flex items-center gap-2" title="Today's focused study time">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-slate-500">Today:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {formatStudyTime(todayStudyMinutes)}
              </span>
            </div>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser?.role !== 'admin' && (
            <button
              onClick={() => onNavigateToTab('pomodoro')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
              <span>Focus Timer</span>
            </button>
          )}

          <button
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">New Task</span>
          </button>

          <button
            onClick={onOpenBackup}
            title="Data backup, export & import"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Backup and Data Management"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Notifications Bell */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              title="Alerts and reminders"
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Alerts and reminders"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Light / Dark Mode Toggle */}
          <LightDarkToggle
            currentTheme={currentTheme}
            onToggle={() => onSelectTheme(toggleThemeMode(currentTheme))}
          />

          {/* Theme Palette Selector */}
          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
          />

          {/* Live Session Token Status & Refresh Action */}
          {session && onRefreshToken && (
            <div className="hidden sm:flex items-center">
              <button
                type="button"
                onClick={() => onRefreshToken()}
                disabled={isRefreshingToken}
                title={`Session Token expires in ${Math.floor(sessionRemainingSec / 60)}m ${sessionRemainingSec % 60}s. Click to refresh token now.`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  sessionRemainingSec <= 180
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-800 animate-pulse hover:bg-amber-500/25'
                    : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
                }`}
              >
                {sessionRemainingSec <= 180 ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span className="font-mono text-[11px]">
                  {Math.floor(sessionRemainingSec / 60)}:{String(sessionRemainingSec % 60).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">·</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800">
                  <RefreshCw className={`w-3 h-3 ${isRefreshingToken ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingToken ? 'Refreshing...' : 'Refresh Token'}</span>
                </span>
              </button>
            </div>
          )}

          {/* User Auth / Profile Pill with Role Display */}
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 sm:pl-2.5 sm:pr-2 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors text-left cursor-pointer border border-slate-200/60"
              >
                <div
                  className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs relative"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {currentUser.name.charAt(0)}
                  <span
                    className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                      currentUser.role === 'teacher'
                        ? 'bg-emerald-500'
                        : currentUser.role === 'admin'
                        ? 'bg-purple-500'
                        : 'bg-indigo-500'
                    }`}
                    title={currentUser.role ? currentUser.role.toUpperCase() : 'STUDENT'}
                  />
                </div>
                <div className="hidden lg:block text-left pr-1 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-[110px]">
                      {currentUser.name}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full leading-tight ${
                        currentUser.role === 'teacher'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentUser.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {currentUser.role || 'student'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                    {currentUser.role === 'teacher'
                      ? currentUser.designation || currentUser.department || 'Faculty'
                      : currentUser.role === 'admin'
                      ? currentUser.adminOffice || 'Administrator'
                      : currentUser.semester || currentUser.major || 'Student'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          currentUser.role === 'teacher'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : currentUser.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {currentUser.role === 'teacher' ? '👨‍🏫 Teacher' : currentUser.role === 'admin' ? '🛡️ Admin' : '🎓 Student'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                    
                    {/* Role specific tags */}
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                      {currentUser.role === 'teacher' && currentUser.department && (
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                          {currentUser.department}
                        </span>
                      )}
                      {currentUser.role === 'admin' && currentUser.adminOffice && (
                        <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                          {currentUser.adminOffice}
                        </span>
                      )}
                      {currentUser.major && currentUser.role === 'student' && (
                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                          {currentUser.major}
                        </span>
                      )}
                      {currentUser.studentId && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          ID: {currentUser.studentId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1 text-xs">
                    {onOpenNotifications && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenNotifications();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Reminders & Alerts</span>
                        </span>
                        {unreadNotificationsCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigateToTab('welcome');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>RITE-OS Welcome Screen</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Switch Account / Role</span>
                    </button>
                  </div>

                  {/* Theme Palette Quick Row in Menu */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Palette className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Theme Palette</span>
                      </span>
                      <span className="font-bold text-slate-800 capitalize text-[11px] font-mono">
                        {currentTheme}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                      {APP_THEMES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onSelectTheme(t.id)}
                          className={`h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            currentTheme === t.id
                              ? 'ring-2 ring-indigo-500 scale-105 border-transparent shadow-xs'
                              : 'border-slate-200 hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: t.bgColor }}
                          title={`${t.name} Palette (${t.type})`}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: t.accentColor }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Session Token Row in Dropdown Menu */}
                  {session && onRefreshToken && (
                    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Session Token</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            sessionRemainingSec <= 180
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {sessionRemainingSec <= 180 ? 'Expiring Soon' : 'Active'} ({Math.floor(sessionRemainingSec / 60)}m)
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isRefreshingToken}
                        onClick={() => {
                          onRefreshToken();
                        }}
                        className="w-full mt-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingToken ? 'animate-spin' : ''}`} />
                        <span>{isRefreshingToken ? 'Refreshing Token...' : 'Refresh Session Token'}</span>
                      </button>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-semibold text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg transition-colors cursor-pointer border border-indigo-200/60"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Student Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
