import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { RosterMember } from './AdminDashboardView';

interface AdminCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportUsers: (newUsers: RosterMember[]) => void;
  existingIdentifiers: string[];
}

const SAMPLE_CSV = `Name,Role,Department,Identifier,Email,Designation,Attendance,StudyHoursWeek
Ankit Pattnaik,student,Computer Science & Engineering,2201289210,ankit.cse@riteindia.edu.in,Semester 5,95.0,27.5
Dr. Debabrata Swain,hod,Computer Science & Engineering,HOD-CSE-101,d.swain@riteindia.edu.in,Head of Department & Professor,98.5,42.0
Dr. Rakesh Ranjan,teacher,Electronics & Communication,FAC-ECE-305,r.ranjan@riteindia.edu.in,Assistant Professor,97.5,38.0
Bidulata Samal,student,Mechanical Engineering,2201289222,bidulata.me@riteindia.edu.in,Semester 3,89.2,21.0
Prof. Manoranjan Pradhan,teacher,Computer Science & Engineering,FAC-CSE-212,m.pradhan@riteindia.edu.in,Associate Professor,96.0,36.0
Lipsa Das,student,Civil Engineering,2201289235,lipsa.ce@riteindia.edu.in,Semester 5,93.4,25.0`;

export const AdminCsvImportModal: React.FC<AdminCsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportUsers,
  existingIdentifiers,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedUsers, setParsedUsers] = useState<RosterMember[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const parseCsvText = (text: string) => {
    setCsvContent(text);
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setParseErrors(['CSV file must include at least a header row and one user row.']);
      setParsedUsers([]);
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const nameIdx = header.findIndex((h) => h.includes('name'));
    const roleIdx = header.findIndex((h) => h.includes('role'));
    const deptIdx = header.findIndex((h) => h.includes('dept') || h.includes('department'));
    const idIdx = header.findIndex((h) => h.includes('id') || h.includes('roll') || h.includes('code') || h.includes('identifier'));
    const emailIdx = header.findIndex((h) => h.includes('email'));
    const desigIdx = header.findIndex((h) => h.includes('desig') || h.includes('semester'));
    const attIdx = header.findIndex((h) => h.includes('att') || h.includes('attendance'));
    const studyIdx = header.findIndex((h) => h.includes('study') || h.includes('hours'));

    if (nameIdx === -1 || roleIdx === -1 || idIdx === -1) {
      setParseErrors(['Missing required columns. Header must have at least "Name", "Role", and "Identifier" / "Roll".']);
      setParsedUsers([]);
      return;
    }

    const results: RosterMember[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Split by comma ignoring commas inside quotes
      const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const cleanRow = row.map((v) => v.trim().replace(/^["']|["']$/g, ''));

      const name = cleanRow[nameIdx] || '';
      const rawRole = (cleanRow[roleIdx] || '').toLowerCase();
      const role: 'student' | 'teacher' | 'hod' =
        rawRole.includes('hod') || rawRole.includes('head')
          ? 'hod'
          : rawRole.includes('teach') || rawRole.includes('fac') || rawRole.includes('prof')
          ? 'teacher'
          : 'student';
      const identifier = cleanRow[idIdx] || '';
      const department = (deptIdx !== -1 && cleanRow[deptIdx]) ? cleanRow[deptIdx] : 'Computer Science & Engineering';
      const email = (emailIdx !== -1 && cleanRow[emailIdx])
        ? cleanRow[emailIdx]
        : `${name.toLowerCase().replace(/\s+/g, '.')}.${role === 'student' ? 'stu' : role === 'hod' ? 'hod' : 'fac'}@riteindia.edu.in`;
      const semesterOrDesignation =
        (desigIdx !== -1 && cleanRow[desigIdx])
          ? cleanRow[desigIdx]
          : role === 'student'
          ? 'Semester 1'
          : role === 'hod'
          ? 'Head of Department & Professor'
          : 'Assistant Professor';
      const attendanceRate = (attIdx !== -1 && !isNaN(parseFloat(cleanRow[attIdx]))) ? parseFloat(cleanRow[attIdx]) : 92.0;
      const studyHoursWeek = (studyIdx !== -1 && !isNaN(parseFloat(cleanRow[studyIdx]))) ? parseFloat(cleanRow[studyIdx]) : (role === 'student' ? 24.0 : 36.0);

      if (!name || !identifier) {
        errors.push(`Row ${i + 1}: Skipped due to missing name or identifier.`);
        continue;
      }

      results.push({
        id: `csv-usr-${Date.now()}-${i}`,
        name,
        role,
        department,
        rollOrCode: identifier,
        email,
        semesterOrDesignation,
        status: 'active',
        attendanceRate,
        studyHoursWeek,
        tasksCompleted: role === 'student' ? 15 : 25,
        joinedDate: 'Oct 2026',
      });
    }

    setParseErrors(errors);
    setParsedUsers(results);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCsvText(content);
    };
    reader.readAsText(selected);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'RITE_User_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = () => {
    let finalUsers = parsedUsers;
    if (skipDuplicates) {
      finalUsers = parsedUsers.filter((u) => !existingIdentifiers.includes(u.rollOrCode));
    }
    if (finalUsers.length === 0) {
      setParseErrors(['No valid new users to import (all records already exist or are duplicates).']);
      return;
    }
    onImportUsers(finalUsers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Bulk CSV User Import</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-bold">
                  Students & Teachers
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a structured CSV file to register multiple academic accounts instantly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone & Download Template */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Upload CSV File</span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Formatted CSV Template</span>
            </button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) {
                setFile(dropped);
                const reader = new FileReader();
                reader.onload = (ev) => parseCsvText(ev.target?.result as string);
                reader.readAsText(dropped);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              {file ? file.name : 'Click to select CSV or drag and drop file here'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports .csv formatted with Name, Role, Department, Roll/ID, Email, Designation
            </p>
          </div>
        </div>

        {/* Or Quick Load Sample Button */}
        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Want to test bulk import right now?</span>
          </div>
          <button
            type="button"
            onClick={() => parseCsvText(SAMPLE_CSV)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors shadow-2xs"
          >
            Load Sample CSV Data
          </button>
        </div>

        {/* Parse Errors or Warnings */}
        {parseErrors.length > 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Import Warnings ({parseErrors.length})</span>
            </div>
            {parseErrors.map((err, idx) => (
              <p key={idx} className="text-[11px] text-rose-700 dark:text-rose-400">• {err}</p>
            ))}
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedUsers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-white">
                Parsed Users Preview ({parsedUsers.length} ready to import)
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span>Skip existing roll/code duplicates</span>
              </label>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Identifier</th>
                    <th className="py-2 px-3">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'hod'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'teacher'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.role === 'hod' ? 'HOD' : u.role}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono">{u.rollOrCode}</td>
                      <td className="py-2 px-3 text-slate-500">{u.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedUsers.length === 0}
            onClick={handleConfirmImport}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Import ({parsedUsers.length}) Users</span>
          </button>
        </div>
      </div>
    </div>
  );
};
