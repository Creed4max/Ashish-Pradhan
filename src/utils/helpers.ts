import { DayOfWeek } from '../types';

export function getDayName(date: Date = new Date()): DayOfWeek {
  const days: DayOfWeek[] = ['Sun' as unknown as DayOfWeek, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days[date.getDay()];
  if (day === ('Sun' as unknown as DayOfWeek)) return 'Mon'; // Sunday defaults to Mon for college week
  return day;
}

export function formatTime24To12(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
}

export function isTimeInRange(startTime: string, endTime: string, now: Date = new Date()): boolean {
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export function getTimeUntil(targetTime: string, now: Date = new Date()): number {
  const [tH, tM] = targetTime.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = tH * 60 + tM;
  return targetMinutes - currentMinutes;
}

export function formatMinutesToHuman(minutes: number): string {
  if (minutes < 0) minutes = 0;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getDaysRemaining(dueDate: string): { label: string; isOverdue: boolean; isToday: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate + 'T00:00:00');
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
  } else if (diffDays === 0) {
    return { label: 'Due today', isOverdue: false, isToday: true };
  } else if (diffDays === 1) {
    return { label: 'Tomorrow', isOverdue: false, isToday: false };
  } else {
    return { label: `In ${diffDays} days`, isOverdue: false, isToday: false };
  }
}
