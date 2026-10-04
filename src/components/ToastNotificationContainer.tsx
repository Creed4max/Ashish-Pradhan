import React from 'react';
import { AppNotification } from '../types';
import { CheckSquare, Calendar, Clock, Bell, X, ArrowRight } from 'lucide-react';

interface ToastNotificationContainerProps {
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ToastNotificationContainer: React.FC<ToastNotificationContainerProps> = ({
  toasts,
  onDismiss,
  onNavigateTab,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isTask = toast.type === 'task_deadline';
        const isClassNow = toast.type === 'class_now';
        const isClassSoon = toast.type === 'class_starting';

        const borderColor = isClassNow
          ? 'border-emerald-500/80 bg-emerald-50/95 text-emerald-950 shadow-emerald-500/20'
          : isTask
          ? 'border-amber-500/80 bg-amber-50/95 text-amber-950 shadow-amber-500/20'
          : 'border-indigo-500/80 bg-indigo-50/95 text-indigo-950 shadow-indigo-500/20';

        const iconBg = isClassNow
          ? 'bg-emerald-600 text-white'
          : isTask
          ? 'bg-amber-600 text-white'
          : 'bg-indigo-600 text-white';

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-top-4 ${borderColor}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${iconBg}`}>
                {isClassNow ? (
                  <Clock className="w-4 h-4 animate-spin text-white" />
                ) : isClassSoon ? (
                  <Calendar className="w-4 h-4 text-white" />
                ) : isTask ? (
                  <CheckSquare className="w-4 h-4 text-white" />
                ) : (
                  <Bell className="w-4 h-4 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-xs font-bold truncate">
                    {toast.title}
                  </h4>
                  <span className="text-[10px] font-semibold opacity-60 shrink-0">
                    Just now
                  </span>
                </div>
                <p className="text-xs opacity-90 line-clamp-2 leading-relaxed">
                  {toast.message}
                </p>

                {toast.actionTab && (
                  <button
                    type="button"
                    onClick={() => {
                      if (toast.actionTab) {
                        onNavigateTab(toast.actionTab);
                      }
                      onDismiss(toast.id);
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-black/10 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>View in {toast.actionTab === 'tasks' ? 'Tasks' : 'Timetable'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
