import React from 'react';
import { StudentUser } from '../types';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Calendar,
  BookOpen,
  Calculator,
  Timer,
  Code2,
  Target,
  Sparkles,
  Flame,
  Shield,
  Zap,
  HardDrive,
  Github,
  Play,
  Layers,
  ChevronRight,
  LogIn,
} from 'lucide-react';

interface LandingPageViewProps {
  onLaunchApp: (tab?: string) => void;
  onOpenLogin?: () => void;
  currentUser?: StudentUser | null;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onLaunchApp,
  onOpenLogin,
  currentUser,
}) => {
  const features = [
    {
      id: 'tasks',
      title: 'Assignment & Task Manager',
      description: 'Prioritize coursework, track pending lab submissions, and get real-time countdowns for assignment deadlines.',
      icon: CheckCircle2,
      color: '#4f46e5',
      badge: 'Deadlines & Priorities',
    },
    {
      id: 'timetable',
      title: 'Live College Timetable',
      description: 'Monday to Saturday class schedules with automatic current class detection, room locations, and time remaining.',
      icon: Calendar,
      color: '#059669',
      badge: 'Active Class Detection',
    },
    {
      id: 'notes',
      title: 'Subject Notes & Cheatsheets',
      description: 'Course-specific markdown notebooks for formulas, lecture key takeaways, and quick revision exports.',
      icon: BookOpen,
      color: '#0284c7',
      badge: 'Markdown Supported',
    },
    {
      id: 'cgpa',
      title: 'SGPA & CGPA Calculator',
      description: 'Credit-weighted semester GPA calculations, 10-point and 4.0 scales, and target SGPA goal forecaster.',
      icon: Calculator,
      color: '#d97706',
      badge: 'Target Planner',
    },
    {
      id: 'progress',
      title: 'Curriculum Progress Tracker',
      description: 'Module-by-module syllabus checklists with completion percentages across all enrolled engineering subjects.',
      icon: Target,
      color: '#9333ea',
      badge: 'Syllabus Milestones',
    },
    {
      id: 'pomodoro',
      title: 'Pomodoro Study Station',
      description: '25-minute deep focus intervals with native synthesized ambient audio (Rain, White Noise, Alpha Beats) and session logging.',
      icon: Timer,
      color: '#e11d48',
      badge: 'Web Audio Ambient',
    },
    {
      id: 'coding',
      title: 'Coding Practice Logger',
      description: 'Track LeetCode and competitive programming questions by difficulty (Easy, Medium, Hard) with solution code snippets.',
      icon: Code2,
      color: '#10b981',
      badge: 'LeetCode & Labs',
    },
  ];

  const roadmapDays = [
    { day: 'Day 1', title: 'Landing Page & Nav', desc: 'Sleek brand identity, design constitution, and responsive routing.' },
    { day: 'Day 2', title: 'Student Dashboard', desc: 'At-a-glance metrics, today’s tasks, and weekly study time charts.' },
    { day: 'Day 3', title: 'Task Manager', desc: 'Assignment tracking, urgency countdowns, and priority filtering.' },
    { day: 'Day 4', title: 'CGPA Calculator', desc: 'Credit-weighted SGPA math, grading scales, and target simulator.' },
    { day: 'Day 5', title: 'College Timetable', desc: 'Mon–Sat grid with real-time active lecture detection.' },
    { day: 'Day 6', title: 'Pomodoro & Syllabus', desc: 'Ambient focus audio, session logging, and topic checklists.' },
    { day: 'Day 7', title: 'LocalStorage & Deploy', desc: 'JSON backup export, offline persistence, and deployment ready.' },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 text-center max-w-4xl mx-auto px-4">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>CampusOS v1.2 · Personal College Productivity Suite</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 font-normal">Offline-First & Local</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Your college life,{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 bg-clip-text text-transparent">
            organized.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The all-in-one personal operating system designed for students. Manage course schedules, assignment deadlines, syllabus milestones, SGPA predictions, coding problems, and focused study sessions.
        </p>

        {/* User state banner if logged in */}
        {currentUser && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
            <span
              className="w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {currentUser.name.charAt(0)}
            </span>
            <span>Logged in as <strong>{currentUser.name}</strong> ({currentUser.major})</span>
            <button
              onClick={() => onLaunchApp('dashboard')}
              className="ml-2 underline font-bold hover:text-emerald-950 cursor-pointer"
            >
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onLaunchApp('dashboard')}
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Launch Student Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => (onOpenLogin ? onOpenLogin() : onLaunchApp('login'))}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-indigo-50/70 text-indigo-700 border border-indigo-200 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <LogIn className="w-4 h-4 text-indigo-600" />
            <span>RITE-OS Login</span>
          </button>

          <button
            onClick={() => onLaunchApp('pomodoro')}
            className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
            <span>Pomodoro</span>
          </button>
        </div>

        {/* Feature quick bullets */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Zero Setup Required
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
            100% Client-Side LocalStorage
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Exportable JSON Backups
          </span>
        </div>

        {/* Interactive Dashboard Mockup Preview Card */}
        <div className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xl text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-mono text-slate-400">campusos.local / dashboard</span>
            </div>
            <button
              onClick={() => onLaunchApp('dashboard')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Open live app</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Tasks</span>
              <span className="text-xl font-bold font-mono text-slate-900">5</span>
              <span className="text-[11px] text-slate-500 block">3 due today</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Courses</span>
              <span className="text-xl font-bold font-mono text-slate-900">6</span>
              <span className="text-[11px] text-slate-500 block">Active term</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Syllabus Progress</span>
              <span className="text-xl font-bold font-mono text-sky-600">72%</span>
              <span className="text-[11px] text-slate-500 block">31/43 topics</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Today's Focus</span>
              <span className="text-xl font-bold font-mono text-amber-600">2h 35m</span>
              <span className="text-[11px] text-slate-500 block">3 sessions logged</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-slate-900">Live Timetable:</span>
              <span className="text-slate-600">CS201 Data Structures & Algorithms · Lab 302</span>
            </div>
            <span className="font-mono text-emerald-800 font-semibold bg-white/80 px-2 py-0.5 rounded">
              Active Now
            </span>
          </div>
        </div>
      </section>

      {/* 7 Core Modules Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2 block">
            Everything in One Single Website
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for everyday college productivity
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            No bloated setups. Every tool is tuned specifically for college course schedules, engineering labs, exam preparation, and coding practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                onClick={() => onLaunchApp(feat.id)}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-400 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${feat.color}15`, color: feat.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>Open {feat.title.split(' ')[0]}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7-Day College Challenge Roadmap */}
      <section className="max-w-5xl mx-auto px-4 bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-1">
            Student Development Roadmap
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            The 7-Day College Build Challenge
          </h2>
          <p className="text-xs text-slate-300 mt-2">
            Engineered modularly from scratch using modern React, TypeScript, Tailwind CSS & LocalStorage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roadmapDays.map((item, index) => (
            <div
              key={item.day}
              className={`p-4 rounded-2xl border ${
                index === 0
                  ? 'bg-indigo-950/60 border-indigo-500/50'
                  : 'bg-slate-800/60 border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-indigo-400">{item.day}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <span>All 7 phases completed and operational in this release.</span>
          <button
            onClick={() => onLaunchApp('dashboard')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>Launch Completed Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Why CampusOS Comparison */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Why use CampusOS over generic tools?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Standard note and calendar apps don't understand college course credits or LeetCode practice.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-indigo-600 font-bold">CampusOS</th>
                <th className="py-3 px-4 text-slate-500">Generic Spreadsheets / Notion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Live Class Tracking</td>
                <td className="py-3 px-4 text-emerald-600 font-semibold">✓ Real-time clock & room highlight</td>
                <td className="py-3 px-4 text-slate-400">✗ Static text table</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">SGPA & CGPA Planner</td>
                <td className="py-3 px-4 text-emerald-600 font-semibold">✓ Automated credit math & goal forecast</td>
                <td className="py-3 px-4 text-slate-400">✗ Manual formula writing</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Pomodoro with Ambient Audio</td>
                <td className="py-3 px-4 text-emerald-600 font-semibold">✓ Rain / White Noise / 10Hz Alpha Waves</td>
                <td className="py-3 px-4 text-slate-400">✗ None (needs external app)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Coding Practice Tracker</td>
                <td className="py-3 px-4 text-emerald-600 font-semibold">✓ Easy / Medium / Hard stats & code snippets</td>
                <td className="py-3 px-4 text-slate-400">✗ Clunky formatting</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Privacy & Data Portability</td>
                <td className="py-3 px-4 text-emerald-600 font-semibold">✓ 100% LocalStorage + 1-Click JSON Backup</td>
                <td className="py-3 px-4 text-slate-400">Cloud account required</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Call to Action Footer Card */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl p-8 sm:p-12 shadow-lg">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to organize your semester?
          </h2>
          <p className="mt-3 text-sm text-indigo-100 max-w-lg mx-auto leading-relaxed">
            Jump right into your personal college workspace. No account needed, pre-loaded with realistic coursework to get you started immediately.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onLaunchApp('dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-indigo-900 hover:bg-slate-100 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => (onOpenLogin ? onOpenLogin() : onLaunchApp('login'))}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-900/60 hover:bg-indigo-900 text-white border border-indigo-400/40 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Student Sign In / Register</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
