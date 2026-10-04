import React, { useState } from 'react';
import { AppNotification, NotificationSettings } from '../types';
import {
  Bell,
  CheckSquare,
  Calendar,
  Clock,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { playNotificationSound, requestBrowserNotificationPermission } from '../utils/notifications';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onTriggerTestNotification: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  settings,
  onUpdateSettings,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onTriggerTestNotification,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<'all' | 'tasks' | 'classes'>('all');
  const [showSettings, setShowSettings] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'tasks') return n.type === 'task_deadline';
    if (filter === 'classes') return n.type === 'class_starting' || n.type === 'class_now';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggleSound = () => {
    const nextVal = !settings.sound;
    onUpdateSettings({ ...settings, sound: nextVal });
    if (nextVal) {
      playNotificationSound();
    }
  };

  const handleToggleBrowser = async () => {
    if (!settings.browserNotifications) {
      const granted = await requestBrowserNotificationPermission();
      onUpdateSettings({ ...settings, browserNotifications: granted });
    } else {
      onUpdateSettings({ ...settings, browserNotifications: false });
    }
  };

  const formatRelativeTime = (isoStr: string) => {
    try {
      const diffMs = Date.now() - new Date(isoStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Alerts & Reminders</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Live timetable & task deadline reminders
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Bar: Controls, Test Alert & Settings */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showSettings
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{showSettings ? 'Hide Settings' : 'Settings'}</span>
            </button>

            <button
              type="button"
              onClick={onTriggerTestNotification}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Trigger a test reminder chime and alert"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Test Alert</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Clear notification history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Notification Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 animate-in slide-in-from-top-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Notification Preferences
            </h4>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2.5">
                {settings.sound ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800">Alert Sound</p>
                  <p className="text-[11px] text-slate-500">Play pleasant audio chime for reminders</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.sound ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.sound ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Desktop Notification Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Browser Alerts</p>
                  <p className="text-[11px] text-slate-500">Display desktop push popups</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleBrowser}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.browserNotifications ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.browserNotifications ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Lead Time Threshold */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Class Starting Alert Lead Time
              </label>
              <select
                value={settings.classAlertMinutesBefore}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    classAlertMinutesBefore: parseInt(e.target.value, 10) || 15,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5 minutes before lecture</option>
                <option value={10}>10 minutes before lecture</option>
                <option value={15}>15 minutes before lecture</option>
                <option value={20}>20 minutes before lecture</option>
              </select>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('tasks')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              filter === 'tasks'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tasks ({notifications.filter((n) => n.type === 'task_deadline').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('classes')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              filter === 'classes'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Timetable ({notifications.filter((n) => n.type === 'class_starting' || n.type === 'class_now').length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">All Caught Up!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No reminders pending. You'll receive automatic alerts as upcoming class times approach or task deadlines near.
              </p>
              <button
                type="button"
                onClick={onTriggerTestNotification}
                className="mt-4 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate a Class & Task Alert</span>
              </button>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isClassNow = n.type === 'class_now';
              const isClassSoon = n.type === 'class_starting';
              const isTask = n.type === 'task_deadline';

              return (
                <div
                  key={n.id}
                  onClick={() => onMarkAsRead(n.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    n.read
                      ? 'bg-white border-slate-200/70 opacity-80'
                      : 'bg-slate-50/90 border-indigo-200/90 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        isClassNow
                          ? 'bg-emerald-600 text-white'
                          : isClassSoon
                          ? 'bg-indigo-600 text-white'
                          : isTask
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {isClassNow ? (
                        <Clock className="w-4 h-4" />
                      ) : isClassSoon ? (
                        <Calendar className="w-4 h-4" />
                      ) : isTask ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          {formatRelativeTime(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between">
                        {n.actionTab ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (n.actionTab) {
                                onNavigateTab(n.actionTab);
                              }
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            <span>Open {n.actionTab === 'tasks' ? 'Tasks' : 'Timetable'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : <div />}

                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Unread" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400">
          RITE-OS Notification Engine · Automatic 30s Sync
        </div>
      </div>
    </div>
  );
};
