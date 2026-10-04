import React, { useState, useRef, useEffect } from 'react';
import { Subject, Note, SubjectSyllabus, StudentUser } from '../types';
import {
  Sparkles,
  Send,
  X,
  BookOpen,
  FileText,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
  ChevronDown,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface AiCourseworkSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  notes: Note[];
  syllabus: SubjectSyllabus[];
  currentUser: StudentUser | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: string[];
  timestamp: string;
}

export const AiCourseworkSidebar: React.FC<AiCourseworkSidebarProps> = ({
  isOpen,
  onClose,
  subjects,
  notes,
  syllabus,
  currentUser,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Hello ${currentUser?.name || 'there'}! I'm your **RITE-OS AI Academic Assistant**.\n\nI can read your course syllabus modules and personal lecture notes to answer questions, summarize topics, or generate study reviews.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Filter notes and syllabus based on selected subject
  const filteredNotes = selectedSubjectId === 'all'
    ? notes
    : notes.filter((n) => n.subjectId === selectedSubjectId);

  const filteredSyllabus = selectedSubjectId === 'all'
    ? syllabus
    : syllabus.filter((s) => s.subjectId === selectedSubjectId);

  const selectedSubjectObj = subjects.find((s) => s.id === selectedSubjectId);
  const subjectDisplayName = selectedSubjectObj
    ? `${selectedSubjectObj.code} - ${selectedSubjectObj.name}`
    : 'All Enrolled Courses';

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputQuestion).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      // Map notes and syllabus to context payload with subject titles
      const syllabusPayload = filteredSyllabus.map((mod) => {
        const sub = subjects.find((s) => s.id === mod.subjectId);
        return {
          moduleName: mod.moduleName,
          subjectName: sub ? `${sub.code} ${sub.name}` : undefined,
          topics: mod.topics.map((t) => ({ title: t.title, completed: t.completed })),
        };
      });

      const notesPayload = filteredNotes.map((note) => {
        const sub = subjects.find((s) => s.id === note.subjectId);
        return {
          title: note.title,
          subjectName: sub ? `${sub.code} ${sub.name}` : undefined,
          tags: note.tags,
          content: note.content,
        };
      });

      const res = await fetch('/api/ai/ask-coursework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          subjectName: subjectDisplayName,
          syllabusContext: syllabusPayload,
          notesContext: notesPayload,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to fetch AI response');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I could not find an answer for that in your current course material.',
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Sorry, I encountered an issue processing your question: ${err.message || 'Network error'}.\n\nPlease ensure your local notes or syllabus are populated, or try rephrasing.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'assistant',
        text: `Chat cleared! Ask me anything about your syllabus and notes for **${subjectDisplayName}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 flex flex-col antialiased transition-all animate-slideInRight">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white">Coursework AI Assistant</h2>
              <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded-full">
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/80">
              Grounded in your syllabus & personal lecture notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClearChat}
            title="Reset conversation"
            className="p-1.5 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Course Context Picker & Summary Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate w-full cursor-pointer"
          >
            <option value="all">All Enrolled Courses</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code}: {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-500 font-medium">
          <span title={`${filteredNotes.length} notes available`}>
            {filteredNotes.length} Notes
          </span>
          <span>·</span>
          <span title={`${filteredSyllabus.length} syllabus modules`}>
            {filteredSyllabus.length} Modules
          </span>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        {[
          'Summarize my notes',
          'What are the key syllabus topics?',
          'Generate a 3-question quiz',
          'Explain concepts in Unit 1',
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium border border-slate-200/60 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {filteredNotes.length === 0 && filteredSyllabus.length === 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">No course materials found</strong>
              <span>
                You haven't added any notes or syllabus modules yet. The AI assistant can answer general academic concepts, but adding lecture notes will tailor answers directly to your class!
              </span>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } space-y-1`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium px-1">
              <span>{msg.sender === 'user' ? 'You' : 'RITE-OS AI'}</span>
              <span>·</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl text-xs max-w-[90%] shadow-2xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">
                {msg.text}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    Sources: {msg.sources.join(', ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(msg.id, msg.text)}
                    className="hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedMessageId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 w-fit shadow-2xs">
            <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span>Consulting your syllabus & notes with Gemini...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={`Ask about ${selectedSubjectObj?.code || 'your course materials'}...`}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isLoading}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 text-white transition-colors cursor-pointer shadow-xs shrink-0"
          title="Send question"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
