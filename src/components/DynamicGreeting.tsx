import React, { useEffect, useState } from 'react';
import { StudentUser } from '../types';
import {
  Sun,
  SunMedium,
  Sunset,
  Moon,
  Play,
  Calendar,
  Sparkles,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface DynamicGreetingProps {
  currentUser?: StudentUser | null;
  onNavigateTab: (tab: string) => void;
  pendingTasksCount?: number;
  todayStudyMinutes?: number;
}

export const DynamicGreeting: React.FC<DynamicGreetingProps> = ({
  currentUser,
  onNavigateTab,
  pendingTasksCount = 0,
  todayStudyMinutes = 0,
}) => {
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [formattedDate, setFormattedDate] = useState(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  );

  // Keep hour updated
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setFormattedDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Compute Greeting Details based on time of day
  const getGreetingData = (hour: number) => {
    if (hour >= 4 && hour < 12) {
      return {
        greeting: 'Good morning',
        icon: Sun,
        iconColor: 'text-amber-500 fill-amber-400',
        badge: 'Morning Focus',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        tip: 'Start strong with today’s priority assignments and review lecture notes.',
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: 'Good afternoon',
        icon: SunMedium,
        iconColor: 'text-orange-500 fill-orange-400',
        badge: 'Afternoon Session',
        badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
        tip: 'Keep the study momentum going. Perfect time for coding practice or lab tasks.',
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        greeting: 'Good evening',
        icon: Sunset,
        iconColor: 'text-indigo-500 fill-indigo-400',
        badge: 'Evening Review',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        tip: 'Review topics covered today, close pending tasks, and prep for tomorrow’s classes.',
      };
    } else {
      return {
        greeting: 'Working late',
        icon: Moon,
        iconColor: 'text-violet-400 fill-violet-300',
        badge: 'Night Owl Mode',
        badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
        tip: 'Late night deep focus. Remember to take short Pomodoro breaks and rest well.',
      };
    }
  };

  const greetingInfo = getGreetingData(currentHour);
  const GreetingIcon = greetingInfo.icon;

  // Extract first name or full display name
  const displayName = currentUser?.name
    ? currentUser.name.split(' ')[0]
    : 'Student';

  const userMajor = currentUser?.major || '';
  const userSemester = currentUser?.semester || '';

  return (
    <div className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
      {/* Subtle ambient gradient overlay */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-br from-indigo-100/40 via-sky-50/20 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Side: Avatar, Time-based Greeting & User Info */}
        <div className="flex items-start sm:items-center gap-4">
          {/* Student Avatar / Time Icon */}
          <div className="relative shrink-0">
            {currentUser?.avatarColor ? (
              <div
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl text-white font-extrabold text-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {displayName.charAt(0)}
              </div>
            ) : (
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <GreetingIcon className={`w-7 h-7 ${greetingInfo.iconColor}`} />
              </div>
            )}

            {/* Time icon micro-badge attached to avatar */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center">
              <GreetingIcon className={`w-3.5 h-3.5 ${greetingInfo.iconColor}`} />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {greetingInfo.greeting},{' '}
                <span className="text-indigo-600 font-black">{displayName}</span>
              </h1>

              {/* Role Badge */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  currentUser?.role === 'teacher'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentUser?.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {currentUser?.role === 'teacher' ? (
                  <>
                    <span>👨‍🏫</span>
                    <span>{currentUser.designation || 'Faculty Member'}</span>
                  </>
                ) : currentUser?.role === 'admin' ? (
                  <>
                    <span>🛡️</span>
                    <span>{currentUser.adminOffice || 'Administrator'}</span>
                  </>
                ) : (
                  <>
                    <span>🎓</span>
                    <span>Student</span>
                  </>
                )}
              </span>

              {/* Time of Day Session Badge */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${greetingInfo.badgeColor}`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{greetingInfo.badge}</span>
              </span>

              {/* Term Active Status */}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Term Active</span>
              </span>
            </div>

            {/* Date & Course Details */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formattedDate}
              </span>
              {userMajor && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600 font-medium">{userMajor}</span>
                </>
              )}
              {userSemester && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.2 rounded font-mono text-[11px]">
                    {userSemester}
                  </span>
                </>
              )}
            </div>

            {/* Contextual Time-of-Day Daily Tip */}
            <p className="text-xs text-slate-400 mt-2 font-sans line-clamp-1 hidden sm:block">
              💡 {greetingInfo.tip}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action CTA Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            onClick={() => onNavigateTab('pomodoro')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Study Session</span>
          </button>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
            <span>Tasks ({pendingTasksCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
