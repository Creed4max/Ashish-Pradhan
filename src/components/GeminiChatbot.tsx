import React, { useState, useRef, useEffect } from 'react';
import { StudentUser } from '../types';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RotateCcw,
  Copy,
  Check,
  Cpu,
  Zap,
  GraduationCap,
  ChevronDown,
  Layers,
  MessageSquare,
  Maximize2,
  Minimize2,
  Trash2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export type GeminiModelId = 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';
export type ChatbotRoleId = 'tutor' | 'stem' | 'flash';

export interface ChatbotMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: GeminiModelId;
  roleId?: ChatbotRoleId;
}

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: StudentUser | null;
  initialRoleId?: ChatbotRoleId;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialRoleId = 'tutor',
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatbotRoleId>(initialRoleId);
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3.5-flash');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multi-turn conversation history
  const [messages, setMessages] = useState<ChatbotMessage[]>(() => [
    {
      id: 'init-msg-1',
      role: 'model',
      text: `Hello ${currentUser?.name || 'there'}! I am your **RITE-OS Gemini AI Assistant**.\n\nI can maintain a multi-turn conversation to tutor you through difficult courses, solve STEM & coding problems, or quiz you on key exam topics.\n\nChoose an AI Role and Model above to tailor my system instructions to your study goals!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
      roleId: 'tutor',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to bottom of conversation thread
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Auto-switch default model when role changes if desired
  const handleRoleSelect = (roleId: ChatbotRoleId) => {
    setSelectedRole(roleId);
    if (roleId === 'stem') {
      setSelectedModel('gemini-3.1-pro-preview');
    } else if (roleId === 'flash') {
      setSelectedModel('gemini-3.1-flash-lite');
    } else {
      setSelectedModel('gemini-3.5-flash');
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const text = (textOverride || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: ChatbotMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: selectedModel,
      roleId: selectedRole,
    };

    // Append user message to maintain full conversation thread
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send entire multi-turn thread to backend Gemini endpoint
      const payload = {
        messages: updatedHistory.map((m) => ({
          role: m.role,
          text: m.text,
        })),
        model: selectedModel,
        roleId: selectedRole,
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const modelMessage: ChatbotMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || selectedModel,
        roleId: data.roleId || selectedRole,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatbotMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `**Notice:** Unable to connect to Gemini API (${err.message || 'Network error'}). Please verify connectivity.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        roleId: selectedRole,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'model',
        text: `Conversation history cleared. How can I assist you with your academic work now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        roleId: selectedRole,
      },
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const roleConfigs = {
    tutor: {
      label: 'Academic Tutor',
      desc: 'Coursework explanations & exam prep',
      icon: GraduationCap,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
      activeColor: 'bg-indigo-600 text-white',
      suggestedModel: 'gemini-3.5-flash',
      promptStarters: [
        'Explain Normalization in DBMS with examples',
        'Summarize the key concepts of Process Synchronization in OS',
        'How do I approach studying for my semester end exams?',
      ],
    },
    stem: {
      label: 'STEM & Code Pro',
      desc: 'Complex algorithms, proofs & code',
      icon: Cpu,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
      activeColor: 'bg-purple-600 text-white',
      suggestedModel: 'gemini-3.1-pro-preview',
      promptStarters: [
        'Implement Dijkstra algorithm in TypeScript with Big-O analysis',
        'Prove that any comparison-based sorting requires Ω(n log n)',
        'Debug a memory leak in React useEffect timer cleanup',
      ],
    },
    flash: {
      label: 'Flashcard & Speed',
      desc: 'Rapid high-yield Q&A and definitions',
      icon: Zap,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      activeColor: 'bg-amber-600 text-white',
      suggestedModel: 'gemini-3.1-flash-lite',
      promptStarters: [
        'Quick definition: Virtual Memory vs Paging',
        'Top 3 differences between TCP and UDP',
        'Give me 5 rapid flashcards on Data Structures',
      ],
    },
  };

  const currentRoleConfig = roleConfigs[selectedRole];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 ${
          isExpanded
            ? 'w-full h-full max-w-6xl max-h-[94vh]'
            : 'w-full max-w-3xl h-[85vh] max-h-[800px]'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  RITE-OS Gemini Assistant
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Multi-Turn Chat
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Maintains conversation history with specialized academic roles and dynamic model routing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Reset conversation history"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Restore window size' : 'Expand full screen'}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close chat window"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role & Model Controls Strip */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
          {/* Role selector tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mr-1">
              Role:
            </span>
            {(['tutor', 'stem', 'flash'] as ChatbotRoleId[]).map((rId) => {
              const cfg = roleConfigs[rId];
              const Icon = cfg.icon;
              const isSelected = selectedRole === rId;
              return (
                <button
                  key={rId}
                  type="button"
                  onClick={() => handleRoleSelect(rId)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? cfg.activeColor + ' shadow-xs scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Model selector dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              Gemini Model:
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as GeminiModelId)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex STEM)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                    isUser
                      ? 'bg-indigo-600'
                      : msg.roleId === 'stem'
                      ? 'bg-purple-600'
                      : msg.roleId === 'flash'
                      ? 'bg-amber-600'
                      : 'bg-emerald-600'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl space-y-2 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                  {/* Metadata and Actions */}
                  <div
                    className={`flex items-center justify-between gap-4 pt-1 text-[10px] font-mono border-t ${
                      isUser
                        ? 'border-indigo-500/40 text-indigo-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    <div className="flex items-center gap-2">
                      {msg.modelUsed && !isUser && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {msg.modelUsed}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        title="Copy message text"
                        className="hover:opacity-100 opacity-60 transition-opacity cursor-pointer flex items-center gap-1"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[88%] mr-auto items-center">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-xs flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                <span>Gemini ({selectedModel}) is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
            Suggested:
          </span>
          {currentRoleConfig.promptStarters.map((starter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(starter)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium shrink-0 cursor-pointer truncate max-w-xs transition-colors"
            >
              {starter}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder={`Ask ${currentRoleConfig.label} using ${selectedModel}... (Press Enter to send, Shift+Enter for new line)`}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
