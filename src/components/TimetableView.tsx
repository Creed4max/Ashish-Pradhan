import React, { useState, useEffect } from 'react';
import { Subject, TimetableSlot, DayOfWeek, StudentUser } from '../types';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  User,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';
import { formatTime24To12, isTimeInRange, getTimeUntil } from '../utils/helpers';

interface TimetableViewProps {
  timetable: TimetableSlot[];
  subjects: Subject[];
  currentUser?: StudentUser | null;
  isReadOnly?: boolean;
  onAddSlot: (slot: Partial<TimetableSlot>) => void;
  onUpdateSlot: (slotId: string, updates: Partial<TimetableSlot>) => void;
  onDeleteSlot: (slotId: string) => void;
}

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TimetableView: React.FC<TimetableViewProps> = ({
  timetable,
  subjects,
  currentUser,
  isReadOnly,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
}) => {
  const readOnly = isReadOnly !== undefined ? isReadOnly : currentUser?.role === 'student';
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Mon');
  const [viewMode, setViewMode] = useState<'daily' | 'grid'>('daily');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Slot modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [formDay, setFormDay] = useState<DayOfWeek>('Mon');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || '');
  const [formRoom, setFormRoom] = useState('Hall A');
  const [formType, setFormType] = useState<'Lecture' | 'Lab' | 'Tutorial'>('Lecture');
  const [formInstructor, setFormInstructor] = useState('');

  // Update current time every 15s to keep active class indicator fresh
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Determine current day of week
  const actualDays: DayOfWeek[] = ['Mon', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayActualDay = actualDays[currentTime.getDay()];

  // Auto-select today on first load
  useEffect(() => {
    setSelectedDay(todayActualDay);
  }, [todayActualDay]);

  // Current active class for today
  const activeClassNow = timetable.find(
    (slot) => slot.day === todayActualDay && isTimeInRange(slot.startTime, slot.endTime, currentTime)
  );

  const openAddModal = (day: DayOfWeek = selectedDay) => {
    if (readOnly) return;
    setEditingSlotId(null);
    setFormDay(day);
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormSubjectId(subjects[0]?.id || '');
    setFormRoom('Hall A');
    setFormType('Lecture');
    setFormInstructor('');
    setIsModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    if (readOnly) return;
    setEditingSlotId(slot.id);
    setFormDay(slot.day);
    setFormStartTime(slot.startTime);
    setFormEndTime(slot.endTime);
    setFormSubjectId(slot.subjectId);
    setFormRoom(slot.room);
    setFormType(slot.type);
    setFormInstructor(slot.instructor || '');
    setIsModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!formStartTime || !formEndTime) return;

    if (editingSlotId) {
      onUpdateSlot(editingSlotId, {
        day: formDay,
        startTime: formStartTime,
        endTime: formEndTime,
        subjectId: formSubjectId,
        room: formRoom,
        type: formType,
        instructor: formInstructor,
      });
    } else {
      onAddSlot({
        day: formDay,
        startTime: formStartTime,
        endTime: formEndTime,
        subjectId: formSubjectId,
        room: formRoom,
        type: formType,
        instructor: formInstructor,
      });
    }

    setIsModalOpen(false);
  };

  const daySlots = timetable
    .filter((slot) => slot.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">College Timetable</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              Monday – Saturday
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time schedule with live class tracking and room directions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Day View</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Week Grid</span>
            </button>
          </div>

          {!readOnly ? (
            <button
              onClick={() => openAddModal(selectedDay)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs font-semibold text-indigo-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Campus Timetable · Synchronized (View Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Active Class Card (If currently running today) */}
      {activeClassNow && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-base border border-white/30">
              LIVE
            </div>
            <div>
              <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                <span>Current Class in Session · {activeClassNow.day}</span>
              </div>
              {(() => {
                const sub = subjects.find((s) => s.id === activeClassNow.subjectId);
                return (
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    {sub ? sub.name : activeClassNow.subjectId} ({sub?.code})
                  </h2>
                );
              })()}
              <div className="flex items-center gap-3 text-xs text-emerald-100 mt-1">
                <span className="font-mono font-medium">
                  {formatTime24To12(activeClassNow.startTime)} – {formatTime24To12(activeClassNow.endTime)}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeClassNow.room}
                </span>
                <span>·</span>
                <span>{activeClassNow.type}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl text-center self-start md:self-auto">
            <span className="text-xs text-emerald-100 block">Time Remaining</span>
            <span className="text-xl font-bold font-mono text-white">
              {Math.max(0, getTimeUntil(activeClassNow.endTime, currentTime))} mins
            </span>
          </div>
        </div>
      )}

      {/* Daily View Mode */}
      {viewMode === 'daily' ? (
        <div className="space-y-4">
          {/* Day Tabs (Mon - Sat) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DAYS.map((day) => {
              const isToday = day === todayActualDay;
              const isSelected = day === selectedDay;
              const count = timetable.filter((t) => t.day === day).length;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold">{day}</span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slots Timeline for Selected Day */}
          <div className="space-y-3">
            {daySlots.map((slot) => {
              const sub = subjects.find((s) => s.id === slot.subjectId);
              const isActive =
                selectedDay === todayActualDay &&
                isTimeInRange(slot.startTime, slot.endTime, currentTime);

              return (
                <div
                  key={slot.id}
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    isActive
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Time Block */}
                      <div className="text-center w-28 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-sm font-bold text-slate-900 font-mono block">
                          {formatTime24To12(slot.startTime)}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          to {formatTime24To12(slot.endTime)}
                        </span>
                      </div>

                      {/* Accent line */}
                      <div
                        className="w-1.5 h-12 rounded-full hidden sm:block shrink-0"
                        style={{ backgroundColor: sub?.color || '#4f46e5' }}
                      />

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">
                            {sub ? sub.name : slot.subjectId}
                          </h3>
                          <span className="text-xs font-mono font-semibold text-slate-500">
                            ({sub?.code})
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              slot.type === 'Lab'
                                ? 'bg-purple-50 text-purple-700'
                                : slot.type === 'Tutorial'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {slot.type}
                          </span>
                          {isActive && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded animate-pulse">
                              Happening Now
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {slot.room}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {slot.instructor || sub?.instructor || 'Staff'}
                          </span>
                          {sub?.credits && (
                            <>
                              <span>·</span>
                              <span>{sub.credits} Credits</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions (Enabled for Teachers/Admins, disabled for Students / readOnly) */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => !readOnly && openEditModal(slot)}
                        disabled={readOnly}
                        className={`p-2 rounded-lg transition-colors ${
                          readOnly
                            ? 'text-slate-300 cursor-not-allowed opacity-40'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer'
                        }`}
                        title={readOnly ? 'Timetable editing disabled for students' : 'Edit slot'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => !readOnly && onDeleteSlot(slot.id)}
                        disabled={readOnly}
                        className={`p-2 rounded-lg transition-colors ${
                          readOnly
                            ? 'text-slate-300 cursor-not-allowed opacity-40'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                        }`}
                        title={readOnly ? 'Timetable deletion disabled for students' : 'Delete slot'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {daySlots.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No classes scheduled on {selectedDay}</p>
                <p className="text-xs text-slate-400 mt-1">Enjoy your study and project time</p>
                {!readOnly && (
                  <button
                    onClick={() => openAddModal(selectedDay)}
                    className="mt-4 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    + Add Class for {selectedDay}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Week Grid View */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs overflow-x-auto">
          <div className="grid grid-cols-6 gap-3 min-w-[760px]">
            {DAYS.map((day) => {
              const slots = timetable
                .filter((s) => s.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = day === todayActualDay;

              return (
                <div key={day} className="space-y-3">
                  <div
                    className={`p-3 rounded-xl text-center border ${
                      isToday
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider block">{day}</span>
                    <span className="text-[11px] opacity-75">{slots.length} classes</span>
                  </div>

                  <div className="space-y-2">
                    {slots.map((s) => {
                      const sub = subjects.find((sub) => sub.id === s.subjectId);
                      const isActive =
                        day === todayActualDay &&
                        isTimeInRange(s.startTime, s.endTime, currentTime);

                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            if (!readOnly) {
                              openEditModal(s);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            !readOnly ? 'cursor-pointer hover:border-indigo-400' : ''
                          } ${
                            isActive
                              ? 'border-emerald-500 bg-emerald-50 shadow-xs ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                            <span>{s.startTime}</span>
                            <span className="font-semibold text-slate-700">{s.room}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {sub?.code || s.subjectId}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{sub?.name}</p>
                          <span
                            className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: `${sub?.color || '#4f46e5'}15`,
                              color: sub?.color || '#4f46e5',
                            }}
                          >
                            {s.type}
                          </span>
                        </div>
                      );
                    })}

                    {slots.length === 0 && (
                      <div className="p-3 text-center text-slate-400 text-xs italic">
                        No classes
                      </div>
                    )}

                    {currentUser?.role !== 'student' && (
                      <button
                        onClick={() => openAddModal(day)}
                        className="w-full py-2 text-center text-xs text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-dashed border-slate-200 transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingSlotId ? 'Edit Timetable Slot' : 'Schedule New Class'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter day, timing, and classroom details
            </p>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Day of Week *
                  </label>
                  <select
                    disabled={readOnly}
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class Type *
                  </label>
                  <select
                    disabled={readOnly}
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'Lecture' | 'Lab' | 'Tutorial')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab Session</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    disabled={readOnly}
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    disabled={readOnly}
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  disabled={readOnly}
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {subjects.length === 0 && (
                    <option value="">General Class</option>
                  )}
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room / Lab *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={readOnly}
                    placeholder="e.g. Hall A or Lab 302"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instructor (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    placeholder="e.g. Prof. Alan Turing"
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={readOnly}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editingSlotId ? 'Save Changes' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
