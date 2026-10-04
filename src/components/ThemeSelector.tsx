import React, { useState, useRef, useEffect } from 'react';
import { AppThemeId } from '../types';
import { APP_THEMES, getThemeById, isDarkMode } from '../utils/theme';
import {
  Palette,
  Check,
  ChevronDown,
  Sparkles,
  Moon,
  Sun,
  Flame,
  Droplets,
  GraduationCap,
} from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: AppThemeId;
  onSelectTheme: (theme: AppThemeId) => void;
  className?: string;
}

export const LightDarkToggle: React.FC<{
  currentTheme: AppThemeId;
  onToggle: () => void;
  className?: string;
}> = ({ currentTheme, onToggle, className = '' }) => {
  const isDark = isDarkMode(currentTheme);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 group ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-500 fill-amber-400 transition-transform group-hover:rotate-45" />
          <span className="hidden md:inline text-xs font-semibold text-slate-700">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-slate-600 transition-transform group-hover:-rotate-12" />
          <span className="hidden md:inline text-xs font-semibold text-slate-700">Dark</span>
        </>
      )}
    </button>
  );
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeThemeObj = getThemeById(currentTheme);
  const isDark = isDarkMode(currentTheme);

  // Get theme-specific representative icon
  const getThemeIcon = (themeId: AppThemeId) => {
    switch (themeId) {
      case 'rite':
        return GraduationCap;
      case 'midnight':
        return Moon;
      case 'forest':
        return Sparkles;
      case 'ocean':
        return Droplets;
      case 'sunset':
        return Flame;
      case 'daybreak':
      default:
        return Sun;
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-100/80 text-slate-700 transition-all text-xs font-semibold cursor-pointer shadow-2xs group"
        title={`Current Theme: ${activeThemeObj.name}. Click to change color palette.`}
        aria-label="Select color theme palette"
        aria-expanded={isOpen}
      >
        <div className="relative flex items-center justify-center">
          <Palette className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full ring-1 ring-white"
            style={{ backgroundColor: activeThemeObj.accentColor }}
          />
        </div>

        <span className="hidden sm:inline font-medium text-slate-800">
          {activeThemeObj.name}
        </span>

        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-600' : ''
          }`}
        />
      </button>

      {/* Theme Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-2 pt-1 pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                <span>Appearance & Themes</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Toggle light / dark mode or select a palette
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
              {APP_THEMES.length} palettes
            </span>
          </div>

          {/* Quick Light / Dark Mode Toggle Buttons */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3">
            <button
              type="button"
              onClick={() => onSelectTheme('daybreak')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isDark
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Light Mode</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTheme(isDark ? currentTheme : 'midnight')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-500 fill-indigo-400" />
              <span>Dark Mode</span>
            </button>
          </div>

          {/* Palette List */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
              Color Palettes
            </div>
            {APP_THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              const Icon = getThemeIcon(theme.id);

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? 'border-indigo-600/70 bg-indigo-50/40 ring-1 ring-indigo-500/20 shadow-2xs'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Swatch preview tile with icon */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs border border-black/10 shrink-0 relative overflow-hidden"
                      style={{ backgroundColor: theme.bgColor }}
                    >
                      <Icon className="w-4 h-4" style={{ color: theme.accentColor }} />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {theme.name}
                        </span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase tracking-wider bg-slate-100 text-slate-500 font-mono">
                          {theme.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                        {theme.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {isSelected ? (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: theme.accentColor }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 group-hover:border-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick cycle footer */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 px-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Instant live preview</span>
            <button
              type="button"
              onClick={() => {
                const currentIndex = APP_THEMES.findIndex((t) => t.id === currentTheme);
                const nextIndex = (currentIndex + 1) % APP_THEMES.length;
                onSelectTheme(APP_THEMES[nextIndex].id);
              }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              Cycle Next Palette →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
