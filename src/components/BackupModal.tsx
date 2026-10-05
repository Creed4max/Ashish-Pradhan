import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage';
import { FirebaseSync } from '../services/firebaseSync';
import { testFirebaseConnection, firebaseConfig } from '../firebase';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertTriangle,
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Server,
  ShieldCheck,
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
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [activeTab, setActiveTab] = useState<'cloud' | 'local'>('cloud');

  useEffect(() => {
    if (!isOpen) return;
    testFirebaseConnection().then((connected) => {
      setCloudStatus(connected ? 'connected' : 'offline');
    });
  }, [isOpen]);

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

  const handlePushToCloud = async () => {
    setIsCloudSyncing(true);
    setImportStatus('Pushing all workspace data to Firebase Firestore...');
    try {
      const res = await FirebaseSync.syncAllToCloud({
        tasks: Storage.getTasks(),
        subjects: Storage.getSubjects(),
        notes: Storage.getNotes(),
        timetable: Storage.getTimetable(),
        user: Storage.getCurrentUser(),
      });
      if (res.success) {
        setImportStatus('Successfully pushed workspace data to Firebase Firestore!');
        setCloudStatus('connected');
      } else {
        setImportStatus(`Cloud sync: ${res.message}`);
      }
    } catch (err) {
      setImportStatus('Failed to sync to Firebase cloud.');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setImportStatus(null), 3500);
    }
  };

  const handlePullFromCloud = async () => {
    setIsCloudSyncing(true);
    setImportStatus('Fetching records from Firebase Firestore...');
    try {
      const [cloudTasks, cloudSubjects, cloudNotes, cloudTimetable] = await Promise.all([
        FirebaseSync.loadTasksFromCloud(),
        FirebaseSync.loadSubjectsFromCloud(),
        FirebaseSync.loadNotesFromCloud(),
        FirebaseSync.loadTimetableFromCloud(),
      ]);

      let importedCount = 0;
      if (cloudTasks && cloudTasks.length > 0) {
        Storage.saveTasks(cloudTasks);
        importedCount += cloudTasks.length;
      }
      if (cloudSubjects && cloudSubjects.length > 0) {
        Storage.saveSubjects(cloudSubjects);
        importedCount += cloudSubjects.length;
      }
      if (cloudNotes && cloudNotes.length > 0) {
        Storage.saveNotes(cloudNotes);
        importedCount += cloudNotes.length;
      }
      if (cloudTimetable && cloudTimetable.length > 0) {
        Storage.saveTimetable(cloudTimetable);
        importedCount += cloudTimetable.length;
      }

      onDataReload();
      setCloudStatus('connected');
      setImportStatus(
        importedCount > 0
          ? `Successfully restored ${importedCount} items from Firebase Firestore!`
          : 'Firebase database connected! No prior cloud items found.'
      );
    } catch (err) {
      setImportStatus('Error fetching from Firebase Firestore.');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setImportStatus(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Cloud Sync & Backup</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Firebase Active
                </span>
              </div>
              <p className="text-xs text-slate-500">Firebase Firestore persistent cloud database & backup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Firebase Cloud Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'local'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Local Backup & JSON</span>
          </button>
        </div>

        {importStatus && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            {isCloudSyncing ? (
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{importStatus}</span>
          </div>
        )}

        {activeTab === 'cloud' ? (
          <div className="space-y-3.5 text-xs">
            {/* Cloud connection card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-amber-500" />
                  <span>Firestore Database Status</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cloudStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : cloudStatus === 'checking'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      cloudStatus === 'connected'
                        ? 'bg-emerald-500'
                        : cloudStatus === 'checking'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-rose-500'
                    }`}
                  />
                  {cloudStatus === 'connected'
                    ? 'Connected & Ready'
                    : cloudStatus === 'checking'
                    ? 'Connecting...'
                    : 'Offline / Disconnected'}
                </span>
              </div>

              <div className="space-y-1 font-mono text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                <div className="flex justify-between">
                  <span className="text-slate-400">Firebase Project:</span>
                  <span className="font-semibold text-slate-700">{firebaseConfig.projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Database ID:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={firebaseConfig.firestoreDatabaseId}>
                    {firebaseConfig.firestoreDatabaseId || '(default)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auth Domain:</span>
                  <span className="font-semibold text-slate-700">{firebaseConfig.authDomain}</span>
                </div>
              </div>
            </div>

            {/* Cloud actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isCloudSyncing}
                onClick={handlePushToCloud}
                className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                    <CloudUpload className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600">Local → Cloud</span>
                </div>
                <h4 className="font-bold text-slate-900">Push to Firebase</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload all tasks, subjects, and notes to Firestore.
                </p>
              </button>

              <button
                type="button"
                disabled={isCloudSyncing}
                onClick={handlePullFromCloud}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                    <CloudDownload className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">Cloud → Local</span>
                </div>
                <h4 className="font-bold text-slate-900">Pull from Firebase</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Download coursework and records from Firestore.
                </p>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Automatic Sync:</strong> When adding or editing tasks and subjects, updates automatically replicate to Firebase Firestore with zero manual effort required.
              </p>
            </div>
          </div>
        ) : (
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
                className="px-3 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg font-semibold shrink-0 transition-colors ml-3 cursor-pointer"
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
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Powered by Firebase Cloud Firestore & Browser LocalStorage
          </p>
        </div>
      </div>
    </div>
  );
};
