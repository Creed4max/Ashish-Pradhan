import React, { useState } from 'react';
import { Storage } from '../utils/storage';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertTriangle,
  X,
  FileJson,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataReload,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = Storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RITE_OS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = Storage.importAllData(content);
      if (success) {
        setImportStatus('Data imported successfully!');
        onDataReload();
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1500);
      } else {
        setImportStatus('Error: Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    Storage.resetToDefault();
    onDataReload();
    setConfirmReset(false);
    setImportStatus('All workspace data cleared to a clean state!');
    setTimeout(() => {
      setImportStatus(null);
      onClose();
    }, 1500);
  };

  const handleLoadSample = () => {
    Storage.loadSampleCurriculum();
    onDataReload();
    setImportStatus('Sample engineering curriculum loaded!');
    setTimeout(() => {
      setImportStatus(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">RITE-OS Data Management</h2>
              <p className="text-xs text-slate-500">Backup, restore, and transfer your college workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {importStatus && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* Export JSON */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Export Data Backup</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Download your notes, timetable, tasks, CGPA, and coding records as a single JSON file.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg font-semibold shrink-0 transition-colors ml-3"
            >
              Export JSON
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Restore from Backup</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Upload a previously saved JSON file to restore your entire semester data.
              </p>
            </div>
            <label className="px-3 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ml-3">
              Upload JSON
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Clear Workspace Data */}
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-rose-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Clear All Workspace Data</span>
                </h3>
                <p className="text-rose-700/80 mt-0.5">
                  Wipe all subjects, tasks, notes, timetable, and study records back to a completely clean slate.
                </p>
              </div>

              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-semibold shrink-0 transition-colors ml-3 cursor-pointer"
                >
                  Clear Data...
                </button>
              ) : (
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={handleClearAllData}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2 py-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Optional Demo Loader */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-700 block">Want to explore with sample data?</span>
              <span className="text-slate-400 text-[11px]">Load demo engineering subjects and tasks for testing.</span>
            </div>
            <button
              onClick={handleLoadSample}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ml-2"
            >
              Load Demo
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400">
            All data is securely persisted in your browser's LocalStorage.
          </p>
        </div>
      </div>
    </div>
  );
};
