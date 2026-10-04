import { AppTheme, AppThemeId } from '../types';

export const APP_THEMES: AppTheme[] = [
  {
    id: 'rite',
    name: 'RITE Classic',
    tagline: 'Radhakrishna Institute signature navy & amber gold',
    type: 'light',
    accentColor: '#0b3b60',
    bgColor: '#f8fafc',
    surfaceColor: '#ffffff',
    textColor: '#0f172a',
  },
  {
    id: 'daybreak',
    name: 'Daybreak',
    tagline: 'Clean academic slate with indigo violet accents',
    type: 'light',
    accentColor: '#4f46e5',
    bgColor: '#f8fafc',
    surfaceColor: '#ffffff',
    textColor: '#0f172a',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Deep obsidian night with electric indigo glow',
    type: 'dark',
    accentColor: '#6366f1',
    bgColor: '#090d16',
    surfaceColor: '#111827',
    textColor: '#f8fafc',
  },
  {
    id: 'forest',
    name: 'Forest',
    tagline: 'Botanical spruce & sage with vibrant emerald',
    type: 'dark',
    accentColor: '#10b981',
    bgColor: '#051510',
    surfaceColor: '#0a231b',
    textColor: '#f0fdf4',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    tagline: 'Deep marine abyss with vivid azure & cyan hues',
    type: 'dark',
    accentColor: '#0ea5e9',
    bgColor: '#051323',
    surfaceColor: '#09203a',
    textColor: '#f0f9ff',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    tagline: 'Warm twilight terracotta with golden amber glow',
    type: 'dark',
    accentColor: '#f97316',
    bgColor: '#140d09',
    surfaceColor: '#211510',
    textColor: '#fff7ed',
  },
];

export const getThemeById = (id: AppThemeId): AppTheme => {
  return APP_THEMES.find((t) => t.id === id) || APP_THEMES[0];
};

export const isDarkMode = (themeId: AppThemeId): boolean => {
  return themeId === 'midnight' || themeId === 'forest' || themeId === 'ocean' || themeId === 'sunset';
};

export const toggleThemeMode = (themeId: AppThemeId): AppThemeId => {
  return isDarkMode(themeId) ? (themeId === 'midnight' ? 'rite' : 'daybreak') : 'midnight';
};

export const applyThemeToDocument = (themeId: AppThemeId) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeId);
    if (isDarkMode(themeId)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};
