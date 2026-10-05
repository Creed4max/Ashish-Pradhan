import React, { useState, useEffect } from 'react';
import { StudentUser } from '../types';
import {
  googleSignIn,
  googleSignOut,
  getWorkspaceAccessToken,
  initWorkspaceAuth,
  listGmailMessages,
  sendGmailMessage,
  createGoogleMeetSpace,
  getStoredMeetSpaces,
  deleteMeetSpace,
  GmailEmailMessage,
  GoogleMeetRecord,
} from '../services/googleWorkspace';
import {
  Mail,
  Video,
  Send,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Inbox,
  Clock,
  User,
  ShieldCheck,
  ChevronRight,
  LogOut,
  KeyRound,
} from 'lucide-react';

interface GoogleWorkspacePanelProps {
  currentUser?: StudentUser | null;
  initialTab?: 'gmail' | 'meet';
  onTriggerAlert?: (alert: any) => void;
  prefilledMeetDepartment?: string;
}

export const GoogleWorkspacePanel: React.FC<GoogleWorkspacePanelProps> = ({
  currentUser,
  initialTab = 'gmail',
  onTriggerAlert,
  prefilledMeetDepartment = 'Computer Science & Engineering',
}) => {
  const [activeTab, setActiveTab] = useState<'gmail' | 'meet'>(initialTab);
  const [isConnected, setIsConnected] = useState<boolean>(Boolean(getWorkspaceAccessToken()));
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Gmail states
  const [messages, setMessages] = useState<GmailEmailMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<GmailEmailMessage | null>(null);

  // Compose states
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Explicit confirmation dialog for sending email (MANDATORY per skill)
  const [showConfirmSendDialog, setShowConfirmSendDialog] = useState(false);

  // Google Meet states
  const [meetSpaces, setMeetSpaces] = useState<GoogleMeetRecord[]>(() => getStoredMeetSpaces());
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [newMeetTopic, setNewMeetTopic] = useState('');
  const [newMeetDept, setNewMeetDept] = useState(prefilledMeetDepartment);
  const [createdMeetNotice, setCreatedMeetNotice] = useState<GoogleMeetRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Init auth listener
  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (user, token) => {
        setIsConnected(true);
        setGoogleUser(user);
        setAuthError(null);
      },
      () => {
        setIsConnected(false);
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Gmail messages
  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const data = await listGmailMessages(15, searchQuery);
      setMessages(data);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [isConnected]);

  // Handle Google Sign In
  const handleGoogleConnect = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setIsConnected(true);
        setGoogleUser(res.user);
        loadMessages();
        if (onTriggerAlert) {
          onTriggerAlert({
            id: `google-connect-${Date.now()}`,
            type: 'system',
            title: 'Google Workspace Connected',
            message: `Signed in as ${res.user.email}. Gmail and Google Meet are active.`,
            timestamp: new Date().toISOString(),
            read: false,
            urgent: false,
          });
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Workspace connection was cancelled or interrupted.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Google Sign Out
  const handleGoogleDisconnect = async () => {
    await googleSignOut();
    setIsConnected(false);
    setGoogleUser(null);
    setSelectedMessage(null);
  };

  // Step 1 of Sending: Open Confirmation Dialog (MANDATORY per skill)
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      return;
    }
    setShowConfirmSendDialog(true);
  };

  // Step 2 of Sending: User Confirmed Send
  const handleConfirmedSend = async () => {
    setShowConfirmSendDialog(false);
    setIsSending(true);

    try {
      const res = await sendGmailMessage({
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        body: composeBody.trim(),
      });

      if (res.success) {
        setShowComposeModal(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');

        if (onTriggerAlert) {
          onTriggerAlert({
            id: `email-sent-${Date.now()}`,
            type: 'system',
            title: 'Email Dispatched via Gmail',
            message: `Message "${composeSubject}" successfully sent to ${composeTo}.`,
            timestamp: new Date().toISOString(),
            read: false,
            urgent: false,
          });
        }

        loadMessages();
      }
    } catch (err: any) {
      alert(`Error sending email: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Create Google Meet Space
  const handleCreateMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingMeet(true);

    try {
      const topic = newMeetTopic.trim() || 'Department Academic Review & Faculty Sync';
      const record = await createGoogleMeetSpace({
        topic,
        department: newMeetDept,
        hostName: currentUser?.name || googleUser?.displayName || 'Faculty Host',
        hostEmail: currentUser?.email || googleUser?.email || 'faculty@riteindia.edu.in',
      });

      setMeetSpaces(getStoredMeetSpaces());
      setCreatedMeetNotice(record);
      setNewMeetTopic('');

      if (onTriggerAlert) {
        onTriggerAlert({
          id: `meet-created-${Date.now()}`,
          type: 'system',
          title: 'Google Meet Space Created',
          message: `Meeting "${record.topic}" is live: ${record.meetingUri}`,
          timestamp: new Date().toISOString(),
          read: false,
          urgent: false,
        });
      }
    } catch (err: any) {
      console.error('Failed to create Google Meet space:', err);
    } finally {
      setIsCreatingMeet(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeleteMeet = (id: string) => {
    deleteMeetSpace(id);
    setMeetSpaces(getStoredMeetSpaces());
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & Service Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>OFFICIAL GOOGLE WORKSPACE SUITE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Gmail & Google Meet Hub</span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
              Read and send institutional emails with Gmail, dispatch passcodes to faculty candidates,
              and schedule instant virtual lecture rooms and department reviews with Google Meet.
            </p>
          </div>

          {/* Connection Status Pill / Google Auth */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {isConnected ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Connected to Google</span>
                  <span className="text-[11px] text-indigo-200 font-mono">
                    {googleUser?.email || currentUser?.email || 'Google Workspace Active'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white cursor-pointer ml-1"
                  title="Disconnect Google Workspace"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Official "Sign in with Google" button style as required by Skill */}
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isSigningIn}
                  className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs sm:text-sm shadow-md transition-all cursor-pointer border border-slate-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isSigningIn ? 'Connecting...' : 'Connect with Google Workspace'}</span>
                </button>
                <span className="text-[10px] text-slate-300 block text-center">
                  Enables live Gmail & Google Meet APIs
                </span>
              </div>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{authError}</span>
          </div>
        )}

        {/* Tab Navigation: Gmail vs Google Meet */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gmail'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Mail className="w-4 h-4 text-rose-500" />
            <span>Gmail Messages & Dispatcher</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">
              {messages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('meet')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'meet'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Video className="w-4 h-4 text-emerald-400" />
            <span>Google Meet Virtual Rooms</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
              {meetSpaces.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GMAIL VIEW */}
      {/* ========================================================= */}
      {activeTab === 'gmail' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadMessages()}
                placeholder="Search institutional emails..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={loadMessages}
                disabled={isLoadingMessages}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 cursor-pointer transition-colors"
                title="Refresh Inbox"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowComposeModal(true);
                  setComposeTo('');
                  setComposeSubject('');
                  setComposeBody('');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Compose Email</span>
              </button>
            </div>
          </div>

          {/* Master-Detail Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Messages List (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Inbox className="w-4 h-4 text-indigo-500" />
                  <span>Institutional Mailbox</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {messages.length} messages
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[540px] overflow-y-auto">
                {isLoadingMessages ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                    <p className="text-xs">Fetching Gmail messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No emails found in mailbox.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`p-3.5 transition-colors cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold truncate ${msg.unread ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                            {msg.from.split('<')[0].replace(/"/g, '') || msg.from}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(msg.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h5 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {msg.subject}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {msg.snippet}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Message Details Reader (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs p-6 space-y-5">
              {selectedMessage ? (
                <>
                  <div className="border-b border-slate-100 dark:border-slate-700 pb-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {selectedMessage.subject}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowComposeModal(true);
                          setComposeTo(selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from);
                          setComposeSubject(`Re: ${selectedMessage.subject}`);
                          setComposeBody(`\n\n--- On ${selectedMessage.date}, ${selectedMessage.from} wrote:\n> ${selectedMessage.snippet}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {selectedMessage.from.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {selectedMessage.from}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            To: {selectedMessage.to}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px]">
                        {new Date(selectedMessage.date).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[180px]">
                    {selectedMessage.bodyText || selectedMessage.snippet}
                  </div>

                  {/* Quick Action Footer */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowComposeModal(true);
                        setComposeTo(selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from);
                        setComposeSubject(`Re: ${selectedMessage.subject}`);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reply to Sender
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('meet');
                        setNewMeetTopic(`Follow-up on: ${selectedMessage.subject}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Start Google Meet on this Topic</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-24 text-center text-slate-400 space-y-2">
                  <Mail className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold">Select an email to view contents</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: GOOGLE MEET VIEW */}
      {/* ========================================================= */}
      {activeTab === 'meet' && (
        <div className="space-y-6">
          {/* Create Instant Space Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Schedule / Launch Google Meet Space
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Creates an official Google Meet conference URL for lecture reviews, viva exams, and faculty coordination.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateMeet} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
              <div className="sm:col-span-6 space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Conference Topic / Meeting Agenda <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMeetTopic}
                  onChange={(e) => setNewMeetTopic(e.target.value)}
                  placeholder="e.g. CSE Faculty Scheme Review or CS201 Lab Doubts"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Department
                </label>
                <select
                  value={newMeetDept}
                  onChange={(e) => setNewMeetDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Management Studies (MBA)">Management Studies (MBA)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={isCreatingMeet}
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>{isCreatingMeet ? 'Generating...' : 'Create Meet Space'}</span>
                </button>
              </div>
            </form>

            {createdMeetNotice && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">Google Meet Conference Ready!</span>
                  </div>
                  <p className="font-mono text-emerald-700 dark:text-emerald-300">
                    {createdMeetNotice.meetingUri}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(createdMeetNotice.meetingUri, 'banner')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold hover:bg-emerald-300 cursor-pointer"
                  >
                    {copiedId === 'banner' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'banner' ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={createdMeetNotice.meetingUri}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                  >
                    <span>Join Meeting</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Active / Stored Google Meet Spaces Roster */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Departmental Google Meet Spaces</span>
              <span className="text-xs text-slate-400 font-normal">
                {meetSpaces.length} conferences recorded
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetSpaces.map((space) => {
                const isCopied = copiedId === space.id;
                return (
                  <div
                    key={space.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <Video className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {space.department || 'Academic Department'}
                            </span>
                            <h5 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                              {space.topic}
                            </h5>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMeet(space.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remove Conference"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-mono text-xs flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="truncate">{space.meetingUri}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(space.meetingUri, space.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer shrink-0 ml-2"
                          title="Copy Link"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Host: {space.hostName}</span>
                        <span>{new Date(space.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('gmail');
                          setShowComposeModal(true);
                          setComposeSubject(`Google Meet Invitation: ${space.topic}`);
                          setComposeBody(
                            `Hello,\n\nYou are invited to join the official department conference on Google Meet:\n\nTopic: ${space.topic}\nDepartment: ${space.department}\nJoin Link: ${space.meetingUri}\n\nPlease join promptly at the scheduled time.\n\nWarm regards,\n${space.hostName}`
                          );
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Link via Gmail</span>
                      </button>

                      <a
                        href={space.meetingUri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <span>Join Meet</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COMPOSE EMAIL MODAL */}
      {/* ========================================================= */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Compose Institutional Email (Gmail)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span className="font-semibold">Quick Templates:</span>
              <button
                type="button"
                onClick={() => {
                  setComposeSubject('Department Faculty Coordination Meeting Notice');
                  setComposeBody(
                    'Dear Faculty Colleagues,\n\nPlease join our upcoming departmental academic review on syllabus coverage and student assessments.\n\nWarm regards,\nOffice of Academic Governance'
                  );
                }}
                className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold hover:underline cursor-pointer"
              >
                Faculty Notice
              </button>
              <button
                type="button"
                onClick={() => {
                  setComposeSubject('Institutional Authorization Pass: Faculty Teacher ID');
                  setComposeBody(
                    'Dear Instructor,\n\nYour institutional authorization pass code has been generated. Use this pass during registration to create your Teacher ID and open your faculty workspace.\n\nPasscode: FAC-PASS-884102\n\nBest regards,\nRadhakrishna Institute of Technology & Engineering'
                  );
                }}
                className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold hover:underline cursor-pointer"
              >
                Passcode Dispatch
              </button>
            </div>

            <form onSubmit={handleInitiateSend} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Institutional Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="e.g. colleague@riteindia.edu.in"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Line <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="e.g. Semester 5 Curriculum Plan"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Message Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Review & Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MANDATORY EXPLICIT CONFIRMATION DIALOG FOR SENDING EMAIL */}
      {/* ========================================================= */}
      {showConfirmSendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Sending Email via Gmail
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Explicit user confirmation required before message dispatch.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Recipient:</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">{composeTo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Subject:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{composeSubject}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Preview:</span>
                <p className="text-slate-600 dark:text-slate-300 line-clamp-2 italic">"{composeBody}"</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmSendDialog(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel / Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmedSend}
                disabled={isSending}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Yes, Send Email</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
