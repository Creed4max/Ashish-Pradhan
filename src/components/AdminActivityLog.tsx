import React, { useState, useMemo } from 'react';
import {
  Clock,
  Shield,
  UserCheck,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Smartphone,
  Laptop,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export interface ActivityLogItem {
  id: string;
  type: 'login' | 'admin_action';
  action: string;
  actorName: string;
  actorRole: 'admin' | 'teacher' | 'student';
  actorId: string;
  details: string;
  target?: string;
  ipAddress: string;
  device?: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'log-1',
    type: 'login',
    action: 'USER_LOGIN',
    actorName: 'Ashish Kumar',
    actorRole: 'student',
    actorId: '2201289045',
    details: 'Student session authenticated via RITE-OS SSO',
    ipAddress: '192.168.1.108',
    device: 'Chrome on macOS (Campus WiFi)',
    timestamp: 'Just now',
    status: 'success',
  },
  {
    id: 'log-2',
    type: 'admin_action',
    action: 'USER_EDITED',
    actorName: 'Academic Administrator',
    actorRole: 'admin',
    actorId: 'ADM-8800',
    details: 'Updated semester registration and attendance quota',
    target: 'Priyanka Mohapatra (2201289088)',
    ipAddress: '192.168.1.104',
    device: 'Admin Terminal (Registrar Node)',
    timestamp: '4 mins ago',
    status: 'info',
  },
  {
    id: 'log-3',
    type: 'login',
    action: 'USER_LOGIN',
    actorName: 'Dr. Debabrata Swain',
    actorRole: 'teacher',
    actorId: 'FAC-CSE-102',
    details: 'Faculty portal login verified with 2FA token',
    ipAddress: '10.0.4.82',
    device: 'Safari on iPad (Faculty Lounge)',
    timestamp: '12 mins ago',
    status: 'success',
  },
  {
    id: 'log-4',
    type: 'admin_action',
    action: 'BROADCAST_SENT',
    actorName: 'Academic Administrator',
    actorRole: 'admin',
    actorId: 'ADM-8800',
    details: 'Dispatched campus-wide notice: Midterm Examination Schedule',
    target: 'All Students & Faculty (RITE-OS Live)',
    ipAddress: '192.168.1.104',
    device: 'Admin Terminal (Registrar Node)',
    timestamp: '28 mins ago',
    status: 'success',
  },
  {
    id: 'log-5',
    type: 'login',
    action: 'USER_LOGIN',
    actorName: 'Rohan Ray',
    actorRole: 'student',
    actorId: '2201289112',
    details: 'Student portal mobile app login',
    ipAddress: '172.16.22.45',
    device: 'RITE-OS App on Android',
    timestamp: '42 mins ago',
    status: 'success',
  },
  {
    id: 'log-6',
    type: 'admin_action',
    action: 'TIMETABLE_DECONFLICT',
    actorName: 'Academic Administrator',
    actorRole: 'admin',
    actorId: 'ADM-8800',
    details: 'Harmonized 18 room slots across LH-101 and LH-102',
    target: 'Timetable Master Schedule',
    ipAddress: '127.0.0.1',
    device: 'Local Node Deconfliction Service',
    timestamp: '1 hour ago',
    status: 'success',
  },
  {
    id: 'log-7',
    type: 'admin_action',
    action: 'CSV_BULK_IMPORT',
    actorName: 'Academic Administrator',
    actorRole: 'admin',
    actorId: 'ADM-8800',
    details: 'Bulk registered 12 student records via CSV ingestion',
    target: 'Computer Science Dept Batch 2026',
    ipAddress: '192.168.1.104',
    device: 'Admin Terminal',
    timestamp: '2 hours ago',
    status: 'success',
  },
  {
    id: 'log-8',
    type: 'login',
    action: 'LOGIN_ATTEMPT_FLAGGED',
    actorName: 'External Guest',
    actorRole: 'student',
    actorId: 'GUEST-UNVERIFIED',
    details: 'Mismatched PIN credential on student portal login',
    ipAddress: '49.36.120.14',
    device: 'Firefox on Windows',
    timestamp: '3 hours ago',
    status: 'warning',
  },
];

interface AdminActivityLogProps {
  logs: ActivityLogItem[];
  onExportLogs: () => void;
  onRefresh?: () => void;
}

export const AdminActivityLog: React.FC<AdminActivityLogProps> = ({
  logs,
  onExportLogs,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'login' | 'admin_action'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchType = filterType === 'all' || log.type === filterType;
      const matchStatus = filterStatus === 'all' || log.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        log.actorName.toLowerCase().includes(q) ||
        log.actorId.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ipAddress.includes(q) ||
        (log.target && log.target.toLowerCase().includes(q));
      return matchType && matchStatus && matchSearch;
    });
  }, [logs, filterType, filterStatus, searchQuery]);

  const loginCount = useMemo(() => logs.filter((l) => l.type === 'login').length, [logs]);
  const actionCount = useMemo(() => logs.filter((l) => l.type === 'admin_action').length, [logs]);

  return (
    <div className="space-y-5">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged Events</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{logs.length} Records</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">User Login Sessions</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{loginCount} Sessions</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Admin Actions Audited</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{actionCount} Operations</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>System Activity & Authentication Audit Trail</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                Live Auditing
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time telemetry tracking user login timestamps and administrative actions executed in RITE-OS
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Refresh Activity Log"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onExportLogs}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Trail (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {/* Search Box (6 cols) */}
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, action type, IP address, or details..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          {/* Type Filter (3 cols) */}
          <div className="lg:col-span-3 flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {(['all', 'login', 'admin_action'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  filterType === t
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t === 'all' ? 'All Events' : t === 'login' ? 'Logins' : 'Actions'}
              </button>
            ))}
          </div>

          {/* Status Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success / Verified</option>
              <option value="info">Administrative Info</option>
              <option value="warning">Warnings & Flags</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Event & Action</th>
                <th className="py-3 px-4">Actor / User</th>
                <th className="py-3 px-4">Operation Details</th>
                <th className="py-3 px-4">Network & Client</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No activity log entries match your filter.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isLogin = log.type === 'login';
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      {/* Event & Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isLogin
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {isLogin ? <UserCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white block">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              {isLogin ? 'Authentication' : 'Admin Operation'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actor / User */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{log.actorName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{log.actorId}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              log.actorRole === 'admin'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                : log.actorRole === 'teacher'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {log.actorRole}
                          </span>
                        </div>
                      </td>

                      {/* Operation Details */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-xs leading-relaxed">
                          {log.details}
                        </p>
                        {log.target && (
                          <span className="inline-block mt-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                            Target: {log.target}
                          </span>
                        )}
                      </td>

                      {/* Network & Client */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-300 block font-semibold">
                          {log.ipAddress}
                        </span>
                        {log.device && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            {log.device.includes('Android') || log.device.includes('iPhone') ? (
                              <Smartphone className="w-3 h-3 text-slate-400" />
                            ) : (
                              <Laptop className="w-3 h-3 text-slate-400" />
                            )}
                            <span className="truncate max-w-[140px]">{log.device}</span>
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.status === 'success'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : log.status === 'warning'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {log.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {log.status === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          {log.status === 'info' && <Info className="w-3 h-3 text-blue-500" />}
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
