import React, { useEffect } from 'react';
import { AppThemeId, StudentUser } from '../types';
import { toggleThemeMode, isDarkMode } from '../utils/theme';
import { ThemeSelector } from './ThemeSelector';
import { RiteLogo } from './RiteLogo';
import { CampusBackground } from './CampusBackground';
import {
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  LogIn,
} from 'lucide-react';

interface CampusOsSplashViewProps {
  onEnter: () => void;
  currentTheme?: AppThemeId;
  onSelectTheme?: (theme: AppThemeId) => void;
  currentUser?: StudentUser | null;
}

export const CampusOsSplashView: React.FC<CampusOsSplashViewProps> = ({
  onEnter,
  currentTheme = 'rite',
  onSelectTheme,
}) => {
  const isDark = isDarkMode(currentTheme);

  // Pressing Enter key triggers entering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter]);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-200">
      {/* 2nd Image: High-Fidelity Radhakrishna Institute Campus Architectural Background */}
      <CampusBackground showOverlay={true} />

      {/* Top Header Bar: Light/Dark Mode & Palette Selector on Glassmorphic Pill */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <div className="w-full px-4 sm:px-6 py-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/15 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RiteLogo size="sm" showText={true} showSubtitle={true} />
          </div>

          <div className="flex items-center gap-2.5">
            {onSelectTheme && (
              <>
                {/* Quick Light / Dark Mode Toggle */}
                <button
                  type="button"
                  onClick={() => onSelectTheme(toggleThemeMode(currentTheme))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-white shadow-2xs transition-all cursor-pointer backdrop-blur-xs"
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span className="hidden sm:inline">Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-sky-300 fill-sky-300" />
                      <span className="hidden sm:inline">Dark</span>
                    </>
                  )}
                </button>

                {/* Theme Palette Dropdown */}
                <ThemeSelector
                  currentTheme={currentTheme}
                  onSelectTheme={onSelectTheme}
                />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Focus: Center Stage RITE Logo with Official Crest & Enter Button */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-3xl mx-auto my-auto py-8">
        <div className="w-full max-w-2xl p-6 sm:p-10 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col items-center ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-200">
          {/* Authentic RITE Logo lockup matching logo (2).png */}
          <div className="mb-5 flex items-center justify-center p-4 bg-white/95 rounded-2xl shadow-xl border border-white/40 ring-4 ring-blue-500/20">
            <RiteLogo size="lg" showText={true} showSubtitle={false} showOsBadge={true} />
          </div>

          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] sm:text-xs font-bold text-blue-200 uppercase tracking-widest mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>RADHAKRISHNA INSTITUTE OF TECHNOLOGY & ENGINEERING</span>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm font-semibold text-slate-300 mb-8 tracking-widest uppercase">
            Academic Operating System
          </p>

          {/* DIRECTLY BELOW: THE ENTER BUTTON */}
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              type="button"
              onClick={onEnter}
              className="group relative inline-flex items-center justify-center gap-3.5 px-12 sm:px-16 py-4 sm:py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-black text-xl sm:text-2xl tracking-widest shadow-2xl shadow-blue-950/60 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden ring-4 ring-blue-400/30"
              title="Click Enter to proceed to RITE-OS Login"
            >
              <LogIn className="w-6 h-6 text-blue-200 group-hover:scale-110 transition-transform" />
              <span>ENTER</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />

              {/* Shimmer sweep animation */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform" />
            </button>

            <p className="text-xs text-slate-400 font-medium mt-1">
              Press <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-[11px] text-slate-200 shadow-2xs">Enter ↵</kbd> or click button to proceed to Login
            </p>
          </div>
        </div>
      </main>

      {/* Subtle Glassmorphic Footer */}
      <footer className="relative z-20 w-full py-3.5 text-center text-xs text-slate-300/80 border-t border-white/10 bg-slate-950/60 backdrop-blur-md">
        <p>RITE-OS · Radhakrishna Institute of Technology and Engineering</p>
      </footer>
    </div>
  );
};
