import React, { useState } from 'react';
import { CodingProblem, ProblemDifficulty, ProblemPlatform, ProblemStatus } from '../types';
import {
  Code2,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  RotateCcw,
  Trash2,
  Edit3,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CodingPracticeViewProps {
  problems: CodingProblem[];
  onAddProblem: (problem: Partial<CodingProblem>) => void;
  onUpdateProblem: (id: string, updates: Partial<CodingProblem>) => void;
  onDeleteProblem: (id: string) => void;
}

export const CodingPracticeView: React.FC<CodingPracticeViewProps> = ({
  problems,
  onAddProblem,
  onUpdateProblem,
  onDeleteProblem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<ProblemDifficulty | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProblemStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPlatform, setFormPlatform] = useState<ProblemPlatform>('LeetCode');
  const [formDifficulty, setFormDifficulty] = useState<ProblemDifficulty>('Medium');
  const [formTags, setFormTags] = useState('');
  const [formStatus, setFormStatus] = useState<ProblemStatus>('Todo');
  const [formUrl, setFormUrl] = useState('');
  const [formSolution, setFormSolution] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Counters
  const easyTotal = problems.filter((p) => p.difficulty === 'Easy').length;
  const easySolved = problems.filter((p) => p.difficulty === 'Easy' && p.status === 'Solved').length;

  const medTotal = problems.filter((p) => p.difficulty === 'Medium').length;
  const medSolved = problems.filter((p) => p.difficulty === 'Medium' && p.status === 'Solved').length;

  const hardTotal = problems.filter((p) => p.difficulty === 'Hard').length;
  const hardSolved = problems.filter((p) => p.difficulty === 'Hard' && p.status === 'Solved').length;

  const totalSolved = easySolved + medSolved + hardSolved;

  const openAddModal = () => {
    setEditingProblemId(null);
    setFormTitle('');
    setFormPlatform('LeetCode');
    setFormDifficulty('Medium');
    setFormTags('');
    setFormStatus('Todo');
    setFormUrl('');
    setFormSolution('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (problem: CodingProblem) => {
    setEditingProblemId(problem.id);
    setFormTitle(problem.title);
    setFormPlatform(problem.platform);
    setFormDifficulty(problem.difficulty);
    setFormTags(problem.tags.join(', '));
    setFormStatus(problem.status);
    setFormUrl(problem.url || '');
    setFormSolution(problem.solutionSnippet || '');
    setFormNotes(problem.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingProblemId) {
      onUpdateProblem(editingProblemId, {
        title: formTitle.trim(),
        platform: formPlatform,
        difficulty: formDifficulty,
        tags: parsedTags,
        status: formStatus,
        url: formUrl.trim() || undefined,
        solutionSnippet: formSolution.trim() || undefined,
        notes: formNotes.trim() || undefined,
        solvedAt: formStatus === 'Solved' ? new Date().toISOString().split('T')[0] : undefined,
      });
    } else {
      onAddProblem({
        id: `code-${Date.now()}`,
        title: formTitle.trim(),
        platform: formPlatform,
        difficulty: formDifficulty,
        tags: parsedTags,
        status: formStatus,
        url: formUrl.trim() || undefined,
        solutionSnippet: formSolution.trim() || undefined,
        notes: formNotes.trim() || undefined,
        solvedAt: formStatus === 'Solved' ? new Date().toISOString().split('T')[0] : undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (p: CodingProblem) => {
    const nextStatus: ProblemStatus =
      p.status === 'Todo' ? 'Solved' : p.status === 'Solved' ? 'Revising' : 'Todo';

    onUpdateProblem(p.id, {
      status: nextStatus,
      solvedAt: nextStatus === 'Solved' ? new Date().toISOString().split('T')[0] : p.solvedAt,
    });

    if (nextStatus === 'Solved') {
      try {
        confetti({
          particleCount: 35,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#059669', '#10b981'],
        });
      } catch {
        // ignore
      }
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const filteredProblems = problems.filter((p) => {
    if (difficultyFilter !== 'all' && p.difficulty !== difficultyFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Coding Practice Tracker</h1>
          <p className="text-sm text-slate-500">
            Log competitive programming, LeetCode & college data structures lab problems
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Problem</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Solved */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Solved</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {totalSolved}
            </span>
            <span className="text-xs text-slate-400">/ {problems.length} problems</span>
          </div>
        </div>

        {/* Easy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 block mb-1">Easy Solved</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-600">
              {easySolved}
            </span>
            <span className="text-xs text-slate-400">/ {easyTotal}</span>
          </div>
        </div>

        {/* Medium */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 block mb-1">Medium Solved</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-600">
              {medSolved}
            </span>
            <span className="text-xs text-slate-400">/ {medTotal}</span>
          </div>
        </div>

        {/* Hard */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 block mb-1">Hard Solved</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-rose-600">
              {hardSolved}
            </span>
            <span className="text-xs text-slate-400">/ {hardTotal}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            All ({problems.length})
          </button>
          <button
            onClick={() => setStatusFilter('Solved')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'Solved' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Solved ({totalSolved})
          </button>
          <button
            onClick={() => setStatusFilter('Revising')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'Revising' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Revising
          </button>
          <button
            onClick={() => setStatusFilter('Todo')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'Todo' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Todo
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search problem or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
            />
          </div>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as ProblemDifficulty | 'all')}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Problem Cards List */}
      <div className="space-y-3">
        {filteredProblems.map((problem) => {
          const isExpanded = expandedId === problem.id;

          return (
            <div
              key={problem.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(problem)}
                    className="mt-1 focus:outline-none shrink-0"
                    title={`Click to cycle status: current ${problem.status}`}
                  >
                    {problem.status === 'Solved' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : problem.status === 'Revising' ? (
                      <RotateCcw className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">
                        {problem.title}
                      </h3>

                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          problem.difficulty === 'Easy'
                            ? 'text-emerald-700 bg-emerald-50'
                            : problem.difficulty === 'Medium'
                            ? 'text-amber-700 bg-amber-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}
                      >
                        {problem.difficulty}
                      </span>

                      <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                        {problem.platform}
                      </span>

                      <button
                        onClick={() => handleToggleStatus(problem)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded cursor-pointer ${
                          problem.status === 'Solved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : problem.status === 'Revising'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {problem.status}
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {problem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Problem Notes */}
                    {problem.notes && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {problem.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1 shrink-0">
                  {problem.url && (
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Open problem link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {problem.solutionSnippet && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : problem.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      <span>Code</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(problem)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit problem"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteProblem(problem.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete problem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable Code Snippet */}
              {isExpanded && problem.solutionSnippet && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-mono font-medium">Solution Snippet:</span>
                    <button
                      onClick={() => handleCopyCode(problem.id, problem.solutionSnippet!)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {copiedCodeId === problem.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                    {problem.solutionSnippet}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {filteredProblems.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
            <Code2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No coding problems found</p>
            <p className="text-xs text-slate-400 mt-1">Add problems to maintain your competitive programming streak</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              + Add Question
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Problem Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingProblemId ? 'Edit Coding Problem' : 'Log New Coding Problem'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Keep track of algorithm questions, approach notes and optimal solutions
            </p>

            <form onSubmit={handleSaveProblem} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Problem Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trapping Rain Water"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as ProblemDifficulty)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Platform</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as ProblemPlatform)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LeetCode">LeetCode</option>
                    <option value="Codeforces">Codeforces</option>
                    <option value="HackerRank">HackerRank</option>
                    <option value="GeeksforGeeks">GeeksforGeeks</option>
                    <option value="Lab Assignment">Lab Assignment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProblemStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Todo">Todo</option>
                    <option value="Revising">Revising</option>
                    <option value="Solved">Solved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Topic Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Array, Two Pointers, Stack"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Problem URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://leetcode.com/problems/..."
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Takeaway / Approach Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Use monotonic stack to find next greater element in O(N)..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Optimal Code Solution</label>
                <textarea
                  rows={6}
                  placeholder="Paste your solution code here..."
                  value={formSolution}
                  onChange={(e) => setFormSolution(e.target.value)}
                  className="w-full p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg"
                >
                  {editingProblemId ? 'Save Changes' : 'Add Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
