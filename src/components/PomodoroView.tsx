import React, { useState, useEffect, useRef } from 'react';
import { Subject, PomodoroSettings, StudySession } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings2,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  CloudRain,
  Radio,
  Waves,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface PomodoroViewProps {
  subjects: Subject[];
  settings: PomodoroSettings;
  studySessions: StudySession[];
  onUpdateSettings: (settings: PomodoroSettings) => void;
  onLogStudySession: (session: StudySession) => void;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  subjects,
  settings,
  studySessions,
  onUpdateSettings,
  onLogStudySession,
}) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [ambientSound, setAmbientSound] = useState<'off' | 'rain' | 'whitenoise' | 'binaural'>('off');

  // Custom Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customWork, setCustomWork] = useState(settings.workDuration);
  const [customShortBreak, setCustomShortBreak] = useState(settings.shortBreakDuration);
  const [customLongBreak, setCustomLongBreak] = useState(settings.longBreakDuration);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timer when mode changes
  useEffect(() => {
    setIsRunning(false);
    if (mode === 'work') {
      setTimeLeft(settings.workDuration * 60);
    } else if (mode === 'shortBreak') {
      setTimeLeft(settings.shortBreakDuration * 60);
    } else {
      setTimeLeft(settings.longBreakDuration * 60);
    }
  }, [mode, settings]);

  // Main countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (mode === 'work') {
      soundManager.playChime('workEnd');
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      // Log study session
      const now = new Date();
      const session: StudySession = {
        id: `sess-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        durationMinutes: settings.workDuration,
        subjectId: selectedSubjectId,
        timestamp: now.toISOString(),
      };
      onLogStudySession(session);

      const nextCount = completedSessionsCount + 1;
      setCompletedSessionsCount(nextCount);

      if (nextCount % settings.cyclesBeforeLongBreak === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      soundManager.playChime('breakEnd');
      setMode('work');
    }
  };

  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setTimeLeft(settings.workDuration * 60);
    } else if (mode === 'shortBreak') {
      setTimeLeft(settings.shortBreakDuration * 60);
    } else {
      setTimeLeft(settings.longBreakDuration * 60);
    }
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setMode('shortBreak');
    } else {
      setMode('work');
    }
  };

  const handleAmbientChange = (type: 'off' | 'rain' | 'whitenoise' | 'binaural') => {
    setAmbientSound(type);
    soundManager.setAmbientSound(type, 0.15);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PomodoroSettings = {
      ...settings,
      workDuration: Math.max(1, Number(customWork)),
      shortBreakDuration: Math.max(1, Number(customShortBreak)),
      longBreakDuration: Math.max(1, Number(customLongBreak)),
    };
    onUpdateSettings(updated);
    setIsSettingsOpen(false);
  };

  // Format mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Progress percentage
  const totalSeconds =
    (mode === 'work'
      ? settings.workDuration
      : mode === 'shortBreak'
      ? settings.shortBreakDuration
      : settings.longBreakDuration) * 60;
  const progressPercent = Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100);

  // Today's total minutes
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = studySessions.filter((s) => s.date === todayStr);
  const todayMinutes = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pomodoro Study Timer</h1>
          <p className="text-sm text-slate-500">
            Deep focus intervals with audio cues, subject session logging & ambient soundscapes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Timer Settings</span>
          </button>
        </div>
      </div>

      {/* Main Focus Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Timer Box (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setMode('work')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                mode === 'work' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Study Focus ({settings.workDuration}m)
            </button>
            <button
              onClick={() => setMode('shortBreak')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                mode === 'shortBreak' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Short Break ({settings.shortBreakDuration}m)
            </button>
            <button
              onClick={() => setMode('longBreak')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                mode === 'longBreak' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Long Break ({settings.longBreakDuration}m)
            </button>
          </div>

          {/* Subject Link Selector */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Studying for:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {subjects.length === 0 && (
                <option value="">General Study</option>
              )}
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Big Digital Timer Display with circular track */}
          <div className="relative py-6 flex flex-col items-center justify-center">
            <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-slate-900 select-none">
              {formattedTime}
            </div>

            <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {mode === 'work' ? 'Stay in the zone · No distractions' : 'Rest your eyes & hydrate'}
            </div>

            {/* Linear Progress Indicator */}
            <div className="w-64 max-w-full bg-slate-100 h-2.5 rounded-full mt-6 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  mode === 'work' ? 'bg-indigo-600' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Timer Primary Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Reset timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleTogglePlay}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center gap-2 transition-all ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-slate-900 hover:bg-indigo-600'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause Focus</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Focus Session</span>
                </>
              )}
            </button>

            <button
              onClick={handleSkip}
              className="p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Skip to next phase"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Ambient Soundscapes Switcher (Pure Web Audio Synthesis!) */}
          <div className="pt-6 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center justify-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Synthesized Ambient Study Audio</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <button
                onClick={() => handleAmbientChange('off')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  ambientSound === 'off'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mute
              </button>
              <button
                onClick={() => handleAmbientChange('rain')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  ambientSound === 'rain'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Soft Rain</span>
              </button>
              <button
                onClick={() => handleAmbientChange('whitenoise')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  ambientSound === 'whitenoise'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                <span>Pink / White Noise</span>
              </button>
              <button
                onClick={() => handleAmbientChange('binaural')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  ambientSound === 'binaural'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Alpha Brainwaves (10Hz)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Focus Stats & Session Log (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Daily Streak Stat Card */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider block mb-1">
                Study Time Today
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono tracking-tight">
                  {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-2">
                {todaySessions.length} focus sessions completed today
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Flame className="w-8 h-8 fill-white text-white" />
            </div>
          </div>

          {/* Today's Completed Sessions Log */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Today's Focus Log</h3>
              <span className="text-xs font-mono text-slate-500">{todaySessions.length} entries</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {todaySessions.map((sess) => {
                const sub = subjects.find((s) => s.id === sess.subjectId);
                const timeStr = new Date(sess.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={sess.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {sub ? `${sub.code}: ${sub.name}` : 'General Study'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{timeStr}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      +{sess.durationMinutes}m
                    </span>
                  </div>
                );
              })}

              {todaySessions.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No sessions recorded today yet. Press "Start Focus Session" above!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Pomodoro Settings</h2>
            <p className="text-xs text-slate-500 mb-4">Customize intervals to match your study habits</p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Study Focus Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customWork}
                  onChange={(e) => setCustomWork(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Short Break Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={customShortBreak}
                  onChange={(e) => setCustomShortBreak(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Long Break Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customLongBreak}
                  onChange={(e) => setCustomLongBreak(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg"
                >
                  Save Durations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
