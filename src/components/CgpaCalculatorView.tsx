import React, { useState } from 'react';
import { Semester, CourseGrade } from '../types';
import {
  Calculator,
  Plus,
  Trash2,
  Award,
  Sparkles,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CgpaCalculatorViewProps {
  semesters: Semester[];
  onUpdateSemesters: (semesters: Semester[]) => void;
}

// 10-Point Scale (Standard UGC / IIT / NIT style)
const GRADE_POINTS_10: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0,
};

// 4-Point Scale (US / Global GPA style)
const GRADE_POINTS_4: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D': 1.0,
  'F': 0.0,
};

export const CgpaCalculatorView: React.FC<CgpaCalculatorViewProps> = ({
  semesters,
  onUpdateSemesters,
}) => {
  const [scaleType, setScaleType] = useState<'10' | '4'>('10');
  const [activeSemId, setActiveSemId] = useState<string>(semesters[0]?.id || '');
  const [targetCgpa, setTargetCgpa] = useState<string>('9.0');
  const [nextSemCredits, setNextSemCredits] = useState<number>(20);

  const gradeMap = scaleType === '10' ? GRADE_POINTS_10 : GRADE_POINTS_4;
  const gradeOptions = Object.keys(gradeMap);

  // Helper to calculate SGPA for a semester
  const calculateSgpa = (courses: CourseGrade[]): { sgpa: number; totalCredits: number; earnedPoints: number } => {
    let totalCredits = 0;
    let earnedPoints = 0;

    courses.forEach((c) => {
      const cr = Number(c.credits) || 0;
      const gp = gradeMap[c.grade] !== undefined ? gradeMap[c.grade] : c.gradePoint;
      totalCredits += cr;
      earnedPoints += cr * gp;
    });

    const sgpa = totalCredits > 0 ? earnedPoints / totalCredits : 0;
    return { sgpa: Math.round(sgpa * 100) / 100, totalCredits, earnedPoints };
  };

  // Cumulative CGPA calculation
  let cumulativeCredits = 0;
  let cumulativeQualityPoints = 0;

  semesters.forEach((sem) => {
    const { totalCredits, earnedPoints } = calculateSgpa(sem.courses);
    cumulativeCredits += totalCredits;
    cumulativeQualityPoints += earnedPoints;
  });

  const cumulativeCgpa =
    cumulativeCredits > 0
      ? Math.round((cumulativeQualityPoints / cumulativeCredits) * 100) / 100
      : 0;

  // Add course to active semester
  const handleAddCourse = (semId: string) => {
    const updated = semesters.map((sem) => {
      if (sem.id !== semId) return sem;
      const newCourse: CourseGrade = {
        id: `course-${Date.now()}`,
        code: `CS${sem.courses.length + 1}01`,
        name: 'New Course Subject',
        credits: 4,
        grade: scaleType === '10' ? 'A+' : 'A',
        gradePoint: scaleType === '10' ? 9 : 4.0,
      };
      return {
        ...sem,
        courses: [...sem.courses, newCourse],
      };
    });
    onUpdateSemesters(updated);
  };

  // Update course in semester
  const handleUpdateCourse = (
    semId: string,
    courseId: string,
    field: keyof CourseGrade,
    value: string | number
  ) => {
    const updated = semesters.map((sem) => {
      if (sem.id !== semId) return sem;
      return {
        ...sem,
        courses: sem.courses.map((c) => {
          if (c.id !== courseId) return c;
          const updatedCourse = { ...c, [field]: value };
          if (field === 'grade') {
            updatedCourse.gradePoint = gradeMap[value as string] || 0;
          }
          return updatedCourse;
        }),
      };
    });
    onUpdateSemesters(updated);
  };

  // Remove course from semester
  const handleRemoveCourse = (semId: string, courseId: string) => {
    const updated = semesters.map((sem) => {
      if (sem.id !== semId) return sem;
      return {
        ...sem,
        courses: sem.courses.filter((c) => c.id !== courseId),
      };
    });
    onUpdateSemesters(updated);
  };

  // Add new semester
  const handleAddSemester = () => {
    const newSem: Semester = {
      id: `sem-${Date.now()}`,
      semesterName: `Semester ${semesters.length + 1}`,
      courses: [
        {
          id: `c-init-1`,
          code: `CS${semesters.length + 1}01`,
          name: 'Core Course 1',
          credits: 4,
          grade: scaleType === '10' ? 'A+' : 'A',
          gradePoint: scaleType === '10' ? 9 : 4.0,
        },
        {
          id: `c-init-2`,
          code: `CS${semesters.length + 1}02`,
          name: 'Core Course 2',
          credits: 4,
          grade: scaleType === '10' ? 'A' : 'A-',
          gradePoint: scaleType === '10' ? 8 : 3.7,
        },
      ],
    };
    onUpdateSemesters([...semesters, newSem]);
    setActiveSemId(newSem.id);
  };

  // Target CGPA calculation:
  // Target = (cumulativeQualityPoints + nextCredits * ReqSGPA) / (cumulativeCredits + nextCredits)
  // ReqSGPA = (Target * (cumulativeCredits + nextCredits) - cumulativeQualityPoints) / nextCredits
  const targetNum = parseFloat(targetCgpa);
  let requiredNextSgpa: number | null = null;
  if (!isNaN(targetNum) && targetNum > 0 && nextSemCredits > 0) {
    const reqPoints = targetNum * (cumulativeCredits + nextSemCredits) - cumulativeQualityPoints;
    requiredNextSgpa = Math.round((reqPoints / nextSemCredits) * 100) / 100;
  }

  const activeSemester = semesters.find((s) => s.id === activeSemId) || semesters[0];
  const activeSgpaData = activeSemester ? calculateSgpa(activeSemester.courses) : { sgpa: 0, totalCredits: 0 };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SGPA / CGPA Calculator</h1>
          <p className="text-sm text-slate-500">
            Automated GPA computation, credit-weighted scoring, and target CGPA planner
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Scale switch */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setScaleType('10')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                scaleType === '10' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              10-Point Scale
            </button>
            <button
              onClick={() => setScaleType('4')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                scaleType === '4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              4.0 Scale
            </button>
          </div>

          <button
            onClick={handleAddSemester}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Semester</span>
          </button>
        </div>
      </div>

      {/* Global GPA Dashboard Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cumulative CGPA */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-1">
              Cumulative CGPA
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-mono tracking-tight">
                {cumulativeCgpa.toFixed(2)}
              </span>
              <span className="text-xs text-indigo-300">/ {scaleType === '10' ? '10.0' : '4.0'}</span>
            </div>
            <p className="text-xs text-indigo-200 mt-2">
              Across {semesters.length} semesters ({cumulativeCredits} credits earned)
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Award className="w-7 h-7 text-amber-400" />
          </div>
        </div>

        {/* Active Semester SGPA */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {activeSemester ? `${activeSemester.semesterName} SGPA` : 'Semester SGPA'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
                {activeSgpaData.sgpa.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/ {scaleType === '10' ? '10.0' : '4.0'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {activeSgpaData.totalCredits} semester credits
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

        {/* Standing / Distinction */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Academic Standing
            </span>
            <span className="text-2xl font-bold text-emerald-600 tracking-tight block">
              {cumulativeCgpa >= (scaleType === '10' ? 8.5 : 3.5)
                ? 'First Class with Distinction'
                : cumulativeCgpa >= (scaleType === '10' ? 7.0 : 3.0)
                ? 'First Class'
                : 'Good Standing'}
            </span>
            <p className="text-xs text-slate-500 mt-2">
              Eligible for Honors & Research Electives
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Main Semester Table & Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Semester Courses Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          {/* Semester Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
            {semesters.map((sem) => {
              const { sgpa } = calculateSgpa(sem.courses);
              const isSelected = sem.id === activeSemId;

              return (
                <button
                  key={sem.id}
                  onClick={() => setActiveSemId(sem.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{sem.semesterName}</span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-slate-800 text-indigo-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {sgpa.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          {activeSemester ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeSemester.semesterName} Courses</h3>
                  <p className="text-xs text-slate-500">
                    Adjust credits and grades to dynamically preview your SGPA
                  </p>
                </div>

                <button
                  onClick={() => handleAddCourse(activeSemester.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Course</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Course Code</th>
                      <th className="py-2.5 px-3">Course Title</th>
                      <th className="py-2.5 px-3 w-24">Credits</th>
                      <th className="py-2.5 px-3 w-28">Grade</th>
                      <th className="py-2.5 px-3 w-24 text-right">Points</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSemester.courses.map((course) => {
                      const gp = gradeMap[course.grade] !== undefined ? gradeMap[course.grade] : course.gradePoint;

                      return (
                        <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={course.code}
                              onChange={(e) =>
                                handleUpdateCourse(activeSemester.id, course.id, 'code', e.target.value)
                              }
                              className="w-24 bg-transparent font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 px-1 py-0.5 rounded uppercase"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={course.name}
                              onChange={(e) =>
                                handleUpdateCourse(activeSemester.id, course.id, 'name', e.target.value)
                              }
                              className="w-full bg-transparent text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 px-1 py-0.5 rounded"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={course.credits}
                              onChange={(e) =>
                                handleUpdateCourse(
                                  activeSemester.id,
                                  course.id,
                                  'credits',
                                  Number(e.target.value)
                                )
                              }
                              className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={course.grade}
                              onChange={(e) =>
                                handleUpdateCourse(activeSemester.id, course.id, 'grade', e.target.value)
                              }
                              className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {gradeOptions.map((g) => (
                                <option key={g} value={g}>
                                  {g} ({gradeMap[g]})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {(course.credits * gp).toFixed(1)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleRemoveCourse(activeSemester.id, course.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 font-bold text-slate-900">
                      <td colSpan={2} className="py-3 px-3">
                        Total Semester Credits: {activeSgpaData.totalCredits}
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-right">
                        Calculated SGPA:
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-600 text-sm">
                        {activeSgpaData.sgpa.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No semesters added yet. Click "+ Add Semester" above to start calculating your SGPA and CGPA.
            </div>
          )}
        </div>

        {/* Right Column: Target CGPA Planner Tool (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Target CGPA Planner</h3>
                <p className="text-xs text-slate-500">Goal forecasting tool</p>
              </div>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Desired Target CGPA:
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max={scaleType === '10' ? '10' : '4.0'}
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expected Next Semester Credits:
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={nextSemCredits}
                  onChange={(e) => setNextSemCredits(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Result Box */}
              {requiredNextSgpa !== null && (
                <div
                  className={`p-4 rounded-xl border ${
                    requiredNextSgpa > (scaleType === '10' ? 10 : 4.0)
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : requiredNextSgpa <= 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider block mb-1">
                    Required Next Semester SGPA
                  </span>
                  <div className="text-2xl font-bold font-mono">
                    {requiredNextSgpa > (scaleType === '10' ? 10 : 4.0)
                      ? `> ${scaleType === '10' ? '10.0' : '4.0'} (Mathematically unreachable in 1 semester)`
                      : requiredNextSgpa <= 0
                      ? '0.0 (Target already secured!)'
                      : requiredNextSgpa.toFixed(2)}
                  </div>
                  <p className="text-[11px] mt-2 opacity-80 leading-relaxed">
                    {requiredNextSgpa > (scaleType === '10' ? 10 : 4.0)
                      ? 'Tip: Spread this goal over two upcoming semesters to make it attainable.'
                      : `Scoring ${requiredNextSgpa.toFixed(2)} in your next ${nextSemCredits} credits will raise your CGPA to ${targetCgpa}.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Grading Scale Reference */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-xs">
            <h4 className="font-bold text-slate-900 mb-2">Grading System ({scaleType === '10' ? '10-Point' : '4.0-Point'})</h4>
            <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono">
              {Object.entries(gradeMap).map(([grade, pt]) => (
                <div key={grade} className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="font-semibold text-slate-800">{grade}:</span>
                  <span>{pt.toFixed(1)} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
