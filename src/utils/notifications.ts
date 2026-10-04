import { Task, TimetableSlot, Subject, AppNotification, NotificationSettings, DayOfWeek } from '../types';

let audioCtx: AudioContext | null = null;

/**
 * Play a soothing, crystal-clear notification chime using Web Audio API
 */
export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // First harmonic tone (D5 ~ 587.33 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second chime tone (A5 ~ 880 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.55);
  } catch (e) {
    // Audio might be blocked by browser autoplay policy before user interaction
    console.debug('Notification audio playback deferred:', e);
  }
};

/**
 * Request native browser notification permission
 */
export const requestBrowserNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show a native system notification if permitted
 */
export const showSystemNotification = (title: string, body: string, icon = '🎓') => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `campusos-${Date.now()}`,
      });
    }
  } catch (e) {
    console.debug('System notification error:', e);
  }
};

const DAY_NAMES: DayOfWeek[] = ['Mon', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
};

/**
 * Engine to evaluate tasks and timetable slots for approaching reminders
 */
export const evaluateReminders = (
  tasks: Task[],
  timetable: TimetableSlot[],
  subjects: Subject[],
  settings: NotificationSettings,
  recentNotifications: AppNotification[],
  onTriggerAlert: (notif: AppNotification) => void
) => {
  if (!settings.enabled) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayDay = DAY_NAMES[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const subjectsMap = new Map(subjects.map((s) => [s.id, s]));

  // Helper to check if an alert for this key was triggered within the last cooldown period
  const hasRecentAlert = (relatedId: string, alertType: string, cooldownMinutes = 60) => {
    const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();
    return recentNotifications.some(
      (n) => n.relatedId === relatedId && n.type === alertType && n.timestamp >= cutoff
    );
  };

  // 1. Evaluate Tasks for Upcoming Deadlines
  tasks.forEach((task) => {
    if (task.status === 'completed') return;

    const subject = subjectsMap.get(task.subjectId);
    const subjectName = subject ? subject.name : 'Academic';

    if (task.dueDate === todayStr) {
      // Due Today Alert
      if (!hasRecentAlert(task.id, 'task_deadline', 180)) {
        const notif: AppNotification = {
          id: `notif-task-${task.id}-${Date.now()}`,
          type: 'task_deadline',
          title: `Deadline Today: ${task.title}`,
          message: `Subject: ${subjectName} · Priority: ${task.priority.toUpperCase()}`,
          timestamp: new Date().toISOString(),
          read: false,
          relatedId: task.id,
          actionTab: 'tasks',
          urgent: task.priority === 'high',
        };
        onTriggerAlert(notif);
      }
    } else if (task.dueDate < todayStr) {
      // Overdue Alert
      if (!hasRecentAlert(task.id, 'task_deadline', 360)) {
        const notif: AppNotification = {
          id: `notif-task-overdue-${task.id}-${Date.now()}`,
          type: 'task_deadline',
          title: `Overdue Task: ${task.title}`,
          message: `Was due on ${task.dueDate} · ${subjectName}`,
          timestamp: new Date().toISOString(),
          read: false,
          relatedId: task.id,
          actionTab: 'tasks',
          urgent: true,
        };
        onTriggerAlert(notif);
      }
    }
  });

  // 2. Evaluate Timetable Slots for Today
  const todaySlots = timetable.filter((slot) => slot.day === todayDay);

  todaySlots.forEach((slot) => {
    const startMin = parseTimeToMinutes(slot.startTime);
    const endMin = parseTimeToMinutes(slot.endTime);
    const diff = startMin - currentMinutes;
    const subject = subjectsMap.get(slot.subjectId);
    const subjectTitle = subject ? `${subject.code} - ${subject.name}` : 'Course Class';
    const roomInfo = slot.room ? `Room ${slot.room}` : 'Main Hall';

    // A. Upcoming class alert (e.g. 5 to 15 minutes before)
    if (diff > 0 && diff <= settings.classAlertMinutesBefore) {
      if (!hasRecentAlert(slot.id, 'class_starting', 30)) {
        const notif: AppNotification = {
          id: `notif-slot-upcoming-${slot.id}-${Date.now()}`,
          type: 'class_starting',
          title: `Class Starting in ${diff} min${diff === 1 ? '' : 's'}!`,
          message: `${subjectTitle} starts at ${slot.startTime} (${roomInfo})`,
          timestamp: new Date().toISOString(),
          read: false,
          relatedId: slot.id,
          actionTab: 'timetable',
          urgent: false,
        };
        onTriggerAlert(notif);
      }
    }

    // B. Class Starting Now / Just Begun (within first 3 minutes of start time)
    if (diff <= 0 && diff >= -3 && currentMinutes <= endMin) {
      if (!hasRecentAlert(slot.id, 'class_now', 45)) {
        const notif: AppNotification = {
          id: `notif-slot-now-${slot.id}-${Date.now()}`,
          type: 'class_now',
          title: `Class Starting Now: ${subjectTitle}`,
          message: `${slot.type} in session at ${roomInfo} (${slot.startTime} - ${slot.endTime})`,
          timestamp: new Date().toISOString(),
          read: false,
          relatedId: slot.id,
          actionTab: 'timetable',
          urgent: true,
        };
        onTriggerAlert(notif);
      }
    }
  });
};
