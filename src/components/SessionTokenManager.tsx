import React, { useState, useEffect } from 'react';
import { AuthSession, StudentUser } from '../types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Clock,
  KeyRound,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SessionTokenManagerProps {
  session: AuthSession | null;
  currentUser: StudentUser | null;
  onRefreshToken: () => Promise<void>;
  onSignOut: () => void;
  isRefreshing?: boolean;
}

export const SessionTokenManager: React.FC<SessionTokenManagerProps> = ({
  session,
  currentUser,
  onRefreshToken,
  onSignOut,
  isRefreshing = false,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (!session?.expiresAt) return 900;
    return Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  });

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [justRefreshedNotice, setJustRefreshedNotice] = useState(false);

  // Update countdown every second
  useEffect(() => {
    if (!session?.expiresAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      // Auto-refresh when 45 seconds remain, before the session actually expires
      if (remaining <= 45 && remaining > 0 && !hasAutoRefreshed && !isRefreshing) {
        setHasAutoRefreshed(true);
        onRefreshToken().then(() => {
          setHasAutoRefreshed(false);
          setIsBannerDismissed(false);
          setJustRefreshedNotice(true);
          setTimeout(() => setJustRefreshedNotice(false), 4000);
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.expiresAt, hasAutoRefreshed, isRefreshing, onRefreshToken]);

  // When session updates (after refresh), reset dismissal & auto-refresh flag
  useEffect(() => {
    setIsBannerDismissed(false);
    setHasAutoRefreshed(false);
  }, [session?.accessToken]);

  if (!currentUser || !session) return null;

  const isExpiringSoon = secondsRemaining <= 180 && secondsRemaining > 0; // <= 3 minutes
  const isExpired = secondsRemaining === 0;

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleManualRefresh = async () => {
    await onRefreshToken();
    setJustRefreshedNotice(true);
    setTimeout(() => setJustRefreshedNotice(false), 4000);
  };

  const simulateExpiringSoon = () => {
    // Allows instant testing of the expiring soon state
    if (session) {
      session.expiresAt = Date.now() + 50 * 1000;
      setSecondsRemaining(50);
      setIsBannerDismissed(false);
    }
  };

  return (
    <>
      {/* ================= FLOATING EXPIRING SOON WARNING BANNER ================= */}
      {isExpiringSoon && !isBannerDismissed && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-amber-500/80 ring-4 ring-amber-500/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Security Alert
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Expires in {formatCountdown(secondsRemaining)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    Session Will Expire Soon
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Your student session is approaching expiration. Refresh your token now to remain signed in and preserve active coursework progress.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-refreshing in {Math.min(secondsRemaining, 45)}s</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Details
                </button>
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={handleManualRefresh}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh Token Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SESSION EXPIRED OVERLAY MODAL ================= */}
      {isExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Session Expired
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Your security session has expired. Use your refresh token to instantly renew your session or sign in again.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                disabled={isRefreshing}
                onClick={handleManualRefresh}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Renewing Session...' : 'Renew Session with Refresh Token'}</span>
              </button>

              <button
                type="button"
                onClick={onSignOut}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign Out & Return to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOKEN DETAILS & MANUAL REFRESH MODAL ================= */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Authentication Session & Tokens
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live session duration and security token renewal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success notification banner if recently refreshed */}
            {justRefreshedNotice && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Session token refreshed successfully! 15 minutes added to session.</span>
              </div>
            )}

            {/* Countdown card */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Session Expiration Countdown
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`text-2xl font-mono font-extrabold ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                    {formatCountdown(secondsRemaining)}
                  </span>
                  <span className="text-xs text-slate-500">remaining</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isExpiringSoon
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                  <span>{isExpiringSoon ? 'Expiring Soon' : 'Session Active'}</span>
                </span>
              </div>
            </div>

            {/* Token Snippets */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Access Token (Bearer)
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all select-all border border-slate-200 dark:border-slate-700">
                  {session.accessToken}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Refresh Token
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all select-all border border-slate-200 dark:border-slate-700">
                  {session.refreshToken}
                </div>
              </div>
            </div>

            {/* Simulation test action */}
            <div className="mt-4 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Want to test the "Session Expiring Soon" state?
              </span>
              <button
                type="button"
                onClick={simulateExpiringSoon}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                Set to 50s
              </button>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                disabled={isRefreshing}
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing Token...' : 'Refresh Token Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
