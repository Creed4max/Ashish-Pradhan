import React, { useState } from 'react';
import { Subject, SubjectSyllabus, TopicItem } from '../types';
import {
  Target,
  CheckCircle2,
  Circle,
  Plus,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudyProgressViewProps {
  subjects: Subject[];
  syllabus: SubjectSyllabus[];
  onToggleTopic: (syllabusId: string, topicId: string) => void;
  onAddTopic: (syllabusId: string, topicTitle: string) => void;
  onAddModule: (subjectId: string, moduleName: string) => void;
}

export const StudyProgressView: React.FC<StudyProgressViewProps> = ({
  subjects,
  syllabus,
  onToggleTopic,
  onAddTopic,
  onAddModule,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [newTopicTitles, setNewTopicTitles] = useState<Record<string, string>>({});
  const [newModuleName, setNewModuleName] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  // Overall math
  let totalAllTopics = 0;
  let completedAllTopics = 0;

  syllabus.forEach((s) => {
    s.topics.forEach((t) => {
      totalAllTopics++;
      if (t.completed) completedAllTopics++;
    });
  });

  const overallPercent = totalAllTopics > 0 ? Math.round((completedAllTopics / totalAllTopics) * 100) : 0;

  const toggleModuleAccordion = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: prev[modId] !== undefined ? !prev[modId] : false, // default open if not toggled
    }));
  };

  const handleTopicCheck = (syllabusId: string, topicId: string, isDone: boolean, subId: string) => {
    onToggleTopic(syllabusId, topicId);
    if (!isDone) {
      // Check if subject is now 100% complete
      const subSyllabi = syllabus.filter((s) => s.subjectId === subId);
      let subTotal = 0;
      let subDone = 0;
      subSyllabi.forEach((s) => {
        s.topics.forEach((t) => {
          subTotal++;
          if (t.completed || t.id === topicId) subDone++;
        });
      });

      if (subDone === subTotal && subTotal > 0) {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleAddTopicSubmit = (sylId: string) => {
    const title = newTopicTitles[sylId]?.trim();
    if (!title) return;
    onAddTopic(sylId, title);
    setNewTopicTitles((prev) => ({ ...prev, [sylId]: '' }));
  };

  const handleAddModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim() || !selectedSubjectId) return;
    onAddModule(selectedSubjectId, newModuleName.trim());
    setNewModuleName('');
    setIsAddingModule(false);
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const currentSubjectModules = syllabus.filter((s) => s.subjectId === selectedSubjectId);

  // Current subject stats
  let currSubTotal = 0;
  let currSubDone = 0;
  currentSubjectModules.forEach((m) => {
    m.topics.forEach((t) => {
      currSubTotal++;
      if (t.completed) currSubDone++;
    });
  });
  const currSubPercent = currSubTotal > 0 ? Math.round((currSubDone / currSubTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Study Progress</h1>
          <p className="text-sm text-slate-500">
            Syllabus completion tracker, topic checklists, and module milestones
          </p>
        </div>

        {/* Global Progress Bar Stat */}
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-center gap-4 shrink-0 min-w-[280px]">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            {overallPercent}%
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Overall Curriculum</span>
              <span className="font-mono text-slate-500">{completedAllTopics}/{totalAllTopics}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subject Select Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {subjects.map((sub) => {
          const subMods = syllabus.filter((s) => s.subjectId === sub.id);
          let total = 0;
          let done = 0;
          subMods.forEach((m) => {
            m.topics.forEach((t) => {
              total++;
              if (t.completed) done++;
            });
          });
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const isSelected = sub.id === selectedSubjectId;

          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-white shadow-xs'
                  : 'border-slate-200/80 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-900">{sub.code}</span>
                <span className="text-xs font-semibold font-mono text-slate-500">{pct}%</span>
              </div>
              <p className="text-xs font-medium text-slate-600 truncate mb-2">{sub.name}</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: sub.color || '#4f46e5' }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Subject Syllabus Card */}
      {currentSubject ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          {/* Active Subject Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: currentSubject.color }}
                >
                  {currentSubject.code}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{currentSubject.name}</h2>
              </div>
              <p className="text-xs text-slate-500">
                Instructor: {currentSubject.instructor} · {currentSubject.credits} Credits · Room: {currentSubject.room || 'TBA'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Course Progress</span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {currSubPercent}% <span className="text-xs font-normal text-slate-400">({currSubDone}/{currSubTotal} topics)</span>
                </span>
              </div>

              <button
                onClick={() => setIsAddingModule(!isAddingModule)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Module</span>
              </button>
            </div>
          </div>

          {/* Add Module inline form */}
          {isAddingModule && (
            <form onSubmit={handleAddModuleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <input
                type="text"
                required
                placeholder="Module Name (e.g. Module 4: Dynamic Programming & Greedy Algorithms)"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Create Module
              </button>
              <button
                type="button"
                onClick={() => setIsAddingModule(false)}
                className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Modules List */}
          <div className="space-y-4">
            {currentSubjectModules.map((module) => {
              const isCollapsed = expandedModules[module.id] === true;
              const modTotal = module.topics.length;
              const modDone = module.topics.filter((t) => t.completed).length;
              const modPct = modTotal > 0 ? Math.round((modDone / modTotal) * 100) : 0;

              return (
                <div key={module.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  {/* Module Header Bar */}
                  <div
                    onClick={() => toggleModuleAccordion(module.id)}
                    className="p-4 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{module.moduleName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {modDone} of {modTotal} topics completed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${modPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 w-10 text-right">
                        {modPct}%
                      </span>
                    </div>
                  </div>

                  {/* Module Topics Checklist */}
                  {!isCollapsed && (
                    <div className="p-4 bg-white divide-y divide-slate-100">
                      {module.topics.map((topic) => (
                        <div
                          key={topic.id}
                          className="py-2.5 flex items-center justify-between gap-3 group"
                        >
                          <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                            <button
                              type="button"
                              onClick={() =>
                                handleTopicCheck(module.id, topic.id, topic.completed, currentSubject.id)
                              }
                              className="focus:outline-none"
                            >
                              {topic.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                              )}
                            </button>
                            <span
                              className={`text-xs font-medium ${
                                topic.completed ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {topic.title}
                            </span>
                          </label>

                          {topic.completed && (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              Mastered
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Add Topic Input */}
                      <div className="pt-3 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="+ Add new topic to this module..."
                          value={newTopicTitles[module.id] || ''}
                          onChange={(e) =>
                            setNewTopicTitles((prev) => ({ ...prev, [module.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTopicSubmit(module.id);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTopicSubmit(module.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Add Topic
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {currentSubjectModules.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No syllabus modules added for this subject yet. Click "+ Add Module" to start tracking!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No Courses Enrolled Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your subjects in Notes or Courses to track your syllabus, module checklists, and exam readiness.
          </p>
        </div>
      )}
    </div>
  );
};
