import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Task, Subject, Note, StudentUser, TimetableSlot } from '../types';

/**
 * Cloud persistence service integrating Firebase Firestore with the application state.
 * Employs defensive payload formatting and standard Firestore error handling.
 */
export const FirebaseSync = {
  // --- Tasks Sync ---
  async saveTaskToCloud(task: Task): Promise<void> {
    const path = `tasks/${task.id}`;
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await setDoc(
        taskRef,
        {
          id: task.id,
          subjectId: task.subjectId || '',
          title: task.title || 'Untitled Task',
          description: task.description || '',
          dueDate: task.dueDate || '',
          priority: task.priority || 'medium',
          status: task.status || 'pending',
          type: task.type || 'assignment',
          category: task.category || 'Homework',
          tags: Array.isArray(task.tags) ? task.tags : [],
          completedAt: task.completedAt || null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Failed to save task to Firebase:', err);
      // If permission or auth error, throw standardized error
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  },

  async syncAllTasksToCloud(tasks: Task[]): Promise<void> {
    if (!tasks || tasks.length === 0) return;
    const path = 'tasks';
    try {
      const batch = writeBatch(db);
      tasks.forEach((task, index) => {
        const taskRef = doc(db, 'tasks', task.id);
        batch.set(
          taskRef,
          {
            id: task.id,
            subjectId: task.subjectId || '',
            title: task.title || 'Untitled Task',
            description: task.description || '',
            dueDate: task.dueDate || '',
            priority: task.priority || 'medium',
            status: task.status || 'pending',
            type: task.type || 'assignment',
            category: task.category || 'Homework',
            tags: Array.isArray(task.tags) ? task.tags : [],
            completedAt: task.completedAt || null,
            orderIndex: index,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });
      await batch.commit();
    } catch (err) {
      console.warn('Failed to batch sync tasks to Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  },

  async loadTasksFromCloud(): Promise<Task[] | null> {
    const path = 'tasks';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      if (querySnapshot.empty) return null;
      const loaded: Task[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        loaded.push({
          id: data.id || d.id,
          subjectId: data.subjectId || '',
          title: data.title || '',
          description: data.description || '',
          dueDate: data.dueDate || '',
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          type: data.type || 'assignment',
          category: data.category || 'Homework',
          tags: Array.isArray(data.tags) ? data.tags : [],
          completedAt: data.completedAt || undefined,
        });
      });
      return loaded;
    } catch (err) {
      console.warn('Failed to load tasks from Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      return null;
    }
  },

  async deleteTaskFromCloud(taskId: string): Promise<void> {
    const path = `tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      console.warn('Failed to delete task from Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  },

  // Real-time snapshot listener for tasks
  subscribeTasks(
    onUpdate: (tasks: Task[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = 'tasks';
    const unsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const cloudTasks: Task[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          cloudTasks.push({
            id: data.id || d.id,
            subjectId: data.subjectId || '',
            title: data.title || '',
            description: data.description || '',
            dueDate: data.dueDate || '',
            priority: data.priority || 'medium',
            status: data.status || 'pending',
            type: data.type || 'assignment',
            category: data.category || 'Homework',
            tags: Array.isArray(data.tags) ? data.tags : [],
            completedAt: data.completedAt || undefined,
          });
        });
        if (cloudTasks.length > 0) {
          onUpdate(cloudTasks);
        }
      },
      (error) => {
        console.warn('Tasks onSnapshot listener error:', error);
        if (onError) onError(error);
        if (error.message.includes('permission') || error.message.includes('insufficient')) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      }
    );
    return unsub;
  },

  // --- User Profile Sync ---
  async syncUserToCloud(user: StudentUser): Promise<void> {
    const path = `users/${user.id}`;
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(
        userRef,
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || user.major || '',
          semester: user.semester || 1,
          avatarColor: user.avatarColor || '#4f46e5',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Failed to sync user to Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  },

  // --- Subjects Sync ---
  async syncSubjectsToCloud(subjects: Subject[]): Promise<void> {
    if (!subjects || subjects.length === 0) return;
    const path = 'subjects';
    try {
      const batch = writeBatch(db);
      subjects.forEach((s) => {
        const sRef = doc(db, 'subjects', s.id);
        batch.set(
          sRef,
          {
            id: s.id,
            code: s.code || '',
            name: s.name || '',
            color: s.color || '#4f46e5',
            credits: s.credits || 3,
            faculty: s.instructor || '',
            room: s.room || '',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });
      await batch.commit();
    } catch (err) {
      console.warn('Failed to sync subjects to Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  },

  async loadSubjectsFromCloud(): Promise<Subject[] | null> {
    const path = 'subjects';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      if (querySnapshot.empty) return null;
      const loaded: Subject[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        loaded.push({
          id: data.id || d.id,
          code: data.code || '',
          name: data.name || '',
          color: data.color || '#4f46e5',
          credits: data.credits || 3,
          instructor: data.faculty || data.instructor || '',
          room: data.room || '',
        });
      });
      return loaded;
    } catch (err) {
      console.warn('Failed to load subjects from Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      return null;
    }
  },

  // --- Notes Sync ---
  async syncNotesToCloud(notes: Note[]): Promise<void> {
    if (!notes || notes.length === 0) return;
    const path = 'notes';
    try {
      const batch = writeBatch(db);
      notes.forEach((n) => {
        const nRef = doc(db, 'notes', n.id);
        batch.set(
          nRef,
          {
            id: n.id,
            subjectId: n.subjectId || '',
            title: n.title || 'Untitled Note',
            content: n.content || '',
            tags: Array.isArray(n.tags) ? n.tags.join(',') : (n.tags || ''),
            date: n.createdAt || new Date().toISOString(),
            isPinned: Boolean(n.isPinned),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });
      await batch.commit();
    } catch (err) {
      console.warn('Failed to sync notes to Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  },

  async loadNotesFromCloud(): Promise<Note[] | null> {
    const path = 'notes';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      if (querySnapshot.empty) return null;
      const loaded: Note[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        loaded.push({
          id: data.id || d.id,
          subjectId: data.subjectId || '',
          title: data.title || '',
          content: data.content || '',
          tags: typeof data.tags === 'string' ? data.tags.split(',').filter(Boolean) : (data.tags || []),
          createdAt: data.date || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          isPinned: Boolean(data.isPinned),
        });
      });
      return loaded;
    } catch (err) {
      console.warn('Failed to load notes from Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      return null;
    }
  },

  // --- Timetable Sync ---
  async syncTimetableToCloud(slots: TimetableSlot[]): Promise<void> {
    if (!slots || slots.length === 0) return;
    const path = 'timetable';
    try {
      const batch = writeBatch(db);
      slots.forEach((s) => {
        const sRef = doc(db, 'timetable', s.id);
        batch.set(
          sRef,
          {
            id: s.id,
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            subjectId: s.subjectId,
            room: s.room || '',
            type: s.type || 'Lecture',
            instructor: s.instructor || '',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });
      await batch.commit();
    } catch (err) {
      console.warn('Failed to sync timetable to Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  },

  async loadTimetableFromCloud(): Promise<TimetableSlot[] | null> {
    const path = 'timetable';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      if (querySnapshot.empty) return null;
      const loaded: TimetableSlot[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        loaded.push({
          id: data.id || d.id,
          day: data.day || 'Mon',
          startTime: data.startTime || '09:00',
          endTime: data.endTime || '10:00',
          subjectId: data.subjectId || '',
          room: data.room || '',
          type: data.type || 'Lecture',
          instructor: data.instructor || '',
        });
      });
      return loaded;
    } catch (err) {
      console.warn('Failed to load timetable from Firebase:', err);
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      return null;
    }
  },

  // Full workspace sync
  async syncAllToCloud(data: {
    tasks?: Task[];
    subjects?: Subject[];
    notes?: Note[];
    timetable?: TimetableSlot[];
    user?: StudentUser | null;
  }): Promise<{ success: boolean; message: string }> {
    try {
      if (data.tasks && data.tasks.length > 0) {
        await FirebaseSync.syncAllTasksToCloud(data.tasks);
      }
      if (data.subjects && data.subjects.length > 0) {
        await FirebaseSync.syncSubjectsToCloud(data.subjects);
      }
      if (data.notes && data.notes.length > 0) {
        await FirebaseSync.syncNotesToCloud(data.notes);
      }
      if (data.timetable && data.timetable.length > 0) {
        await FirebaseSync.syncTimetableToCloud(data.timetable);
      }
      if (data.user) {
        await FirebaseSync.syncUserToCloud(data.user);
      }
      return { success: true, message: 'All workspace collections successfully synchronized to Firebase!' };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Cloud synchronization failed',
      };
    }
  },
};
