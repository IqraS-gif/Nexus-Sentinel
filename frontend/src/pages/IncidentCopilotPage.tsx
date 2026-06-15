import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import {
  Brain, Send, Loader2, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Zap, Database, Eye,
  Shield, BookOpen, Sparkles, RotateCcw, Copy, Check,
  Plus, Trash2, MessageCircle, Clock
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CopilotResponse {
  question: string;
  answer: string;
  root_cause_analysis: string;
  recommended_actions: string;
  risk_assessment: string;
  confidence_score: number;
  supporting_incidents: number[];
  supporting_memories: { id: string; text: string; type: string; metadata?: any }[];
  observations_used: { title: string; description: string; evidence_count: number }[];
  recall_results: { text: string; type: string; bank_id: string }[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: CopilotResponse;
  timestamp: string;
  loading?: boolean;
  error?: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = "nexus_copilot_sessions";

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(sessions));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function newSession(): ChatSession {
  return {
    id: Date.now().toString(),
    title: "New Chat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

// ─── Suggested questions ──────────────────────────────────────────────────────
const SUGGESTED = [
  { label: "Payment failures", q: "Why are payment requests failing?", service: "payment" },
  { label: "Auth errors", q: "What is causing authentication timeouts?", service: "auth" },
  { label: "DB slowdown", q: "Why is the database responding slowly?", service: "database" },
  { label: "Seen before?", q: "Have we seen this kind of incident before?", service: undefined },
  { label: "What to do?", q: "What should I do to resolve the current incident?", service: undefined },
  { label: "Gateway drops", q: "Why is the gateway dropping connections?", service: "gateway" },
];

// ─── Confidence Badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const { text, bg, ring } =
    pct >= 75
      ? { text: "text-emerald-700", bg: "bg-emerald-100", ring: "ring-emerald-200" }
      : pct >= 50
      ? { text: "text-amber-700", bg: "bg-amber-100", ring: "ring-amber-200" }
      : { text: "text-red-700", bg: "bg-red-100", ring: "ring-red-200" };
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ring-1 ${bg} ${ring}`}>
      <Shield className={`h-3 w-3 ${text}`} />
      <span className={`text-[10px] font-extrabold font-mono ${text}`}>{pct}% confidence</span>
      <div className="w-14 h-1 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Expandable Evidence Section ──────────────────────────────────────────────
function EvidenceSection({
  title, count, icon: Icon, iconColor, children, defaultOpen = false,
}: {
  title: string; count: number; icon: any; iconColor: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          <span className="text-xs font-bold text-slate-700">{title}</span>
          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-mono font-bold rounded-full">
            {count}
          </span>
        </div>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && <div className="p-4 space-y-2 border-t border-slate-200">{children}</div>}
    </div>
  );
}

// ─── Answer bubble ────────────────────────────────────────────────────────────
function AnswerBubble({ msg }: { msg: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const r = msg.response;

  function handleCopy() {
    if (!r) return;
    navigator.clipboard.writeText(
      `Answer: ${r.answer}\n\nRoot Cause: ${r.root_cause_analysis}\n\nRecommended Actions: ${r.recommended_actions}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-blue-100">
              <Brain className="h-3 w-3 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-blue-800">Incident Intelligence Copilot</span>
          </div>
          <div className="flex items-center gap-2">
            {r && <ConfidenceBadge score={r.confidence_score} />}
            <button onClick={handleCopy} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {r?.answer && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">Answer</p>
              <p className="text-sm text-slate-800 leading-relaxed">{r.answer}</p>
            </div>
          )}
          {r?.root_cause_analysis && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-700">Root Cause</p>
              </div>
              <p className="text-xs text-amber-900 font-mono leading-relaxed">{r.root_cause_analysis}</p>
            </div>
          )}
          {r?.recommended_actions && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-700">Recommended Actions</p>
              </div>
              <p className="text-xs text-emerald-900 font-mono leading-relaxed whitespace-pre-line">{r.recommended_actions}</p>
            </div>
          )}
          {r?.risk_assessment && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-red-500" />
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-red-600">Risk Assessment</p>
              </div>
              <p className="text-xs text-red-900 font-mono leading-relaxed">{r.risk_assessment}</p>
            </div>
          )}
        </div>
      </div>

      {r && (
        <div className="space-y-1.5 pl-1">
          <EvidenceSection title="Supporting Incidents" count={r.supporting_incidents.length} icon={Zap} iconColor="text-blue-500" defaultOpen={r.supporting_incidents.length > 0}>
            <div className="flex flex-wrap gap-2">
              {r.supporting_incidents.map((id) => (
                <span key={id} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold rounded-lg">INC-{id}</span>
              ))}
            </div>
          </EvidenceSection>
          <EvidenceSection title="Supporting Memories from Hindsight" count={r.supporting_memories.length} icon={Database} iconColor="text-violet-500">
            <div className="space-y-2">
              {r.supporting_memories.slice(0, 4).map((mem, i) => (
                <div key={i} className="bg-violet-50 border border-violet-100 rounded-lg p-2.5 space-y-1">
                  <span className="text-[9px] font-mono font-bold text-violet-500 uppercase">{mem.type || "memory"}</span>
                  <p className="text-[10px] font-mono text-slate-700 leading-relaxed line-clamp-3">{mem.text}</p>
                </div>
              ))}
            </div>
          </EvidenceSection>
          <EvidenceSection title="Observations Used" count={r.observations_used.length} icon={Eye} iconColor="text-amber-500">
            <div className="space-y-2">
              {r.observations_used.map((obs, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-amber-900">{obs.title}</p>
                    <span className="text-[9px] font-mono text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">{obs.evidence_count} evidence</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-600 leading-relaxed line-clamp-2">{obs.description}</p>
                </div>
              ))}
            </div>
          </EvidenceSection>
          <EvidenceSection title="Raw Memory Recall" count={r.recall_results.length} icon={BookOpen} iconColor="text-slate-400">
            <div className="space-y-2">
              {r.recall_results.slice(0, 3).map((rec, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
                  <div className="flex gap-2 text-[9px] font-mono text-slate-400">
                    <span>{rec.bank_id}</span><span>·</span><span>{rec.type}</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-600 leading-relaxed line-clamp-3">{rec.text}</p>
                </div>
              ))}
            </div>
          </EvidenceSection>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Session Item ─────────────────────────────────────────────────────
function SessionItem({
  session, active, onClick, onDelete,
}: {
  session: ChatSession; active: boolean; onClick: () => void; onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const date = new Date(session.updatedAt);
  const timeStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
        active
          ? "bg-blue-50 border border-blue-200"
          : "hover:bg-slate-100 border border-transparent"
      }`}
      onClick={onClick}
    >
      <MessageCircle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${active ? "text-blue-500" : "text-slate-400"}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${active ? "text-blue-800" : "text-slate-700"}`}>
          {session.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="h-2.5 w-2.5 text-slate-300" />
          <span className="text-[9px] font-mono text-slate-400">{timeStr}</span>
          <span className="text-[9px] font-mono text-slate-400">· {session.messages.filter(m => m.role === "user").length}q</span>
        </div>
      </div>
      {hover && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded-lg hover:bg-red-100 text-slate-300 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IncidentCopilotPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [activeId, setActiveId] = useState<string>(() => {
    const s = loadSessions();
    return s.length > 0 ? s[0].id : newSession().id;
  });
  const [input, setInput] = useState("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Ensure there's always at least one session
  useEffect(() => {
    if (sessions.length === 0) {
      const s = newSession();
      setSessions([s]);
      setActiveId(s.id);
    }
  }, [sessions.length]);

  // Persist whenever sessions change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeId]);

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0];
  const messages = activeSession?.messages ?? [];

  function updateSession(id: string, updater: (s: ChatSession) => ChatSession) {
    setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }

  function createNewChat() {
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setInput("");
    inputRef.current?.focus();
  }

  function deleteSession(id: string) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = newSession();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  const handleSubmit = useCallback(async (question?: string, service?: string) => {
    const q = (question ?? input).trim();
    if (!q || isLoading || !activeId) return;
    const svc = service ?? (selectedService || undefined);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: q,
      timestamp: new Date().toISOString(),
    };
    const loadingMsgId = Date.now().toString() + "-loading";
    const loadingMsg: ChatMessage = {
      id: loadingMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      loading: true,
    };

    // Derive title from first question
    updateSession(activeId, (s) => ({
      ...s,
      title: s.messages.length === 0 ? q.slice(0, 42) + (q.length > 42 ? "…" : "") : s.title,
      updatedAt: new Date().toISOString(),
      messages: [...s.messages, userMsg, loadingMsg],
    }));
    setInput("");
    setIsLoading(true);

    try {
      const result = await api.copilotQuery(q, svc);
      const assistantMsg: ChatMessage = {
        id: loadingMsgId,
        role: "assistant",
        content: result.answer,
        response: result,
        timestamp: new Date().toISOString(),
      };
      updateSession(activeId, (s) => ({
        ...s,
        updatedAt: new Date().toISOString(),
        messages: s.messages.map((m) => (m.id === loadingMsgId ? assistantMsg : m)),
      }));
    } catch (e: any) {
      updateSession(activeId, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === loadingMsgId
            ? { ...m, loading: false, error: e.message ?? "Failed to get response." }
            : m
        ),
      }));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, activeId, selectedService]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }

  const isEmpty = messages.length === 0;

  // Group sessions by date for the sidebar
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const grouped: { label: string; sessions: ChatSession[] }[] = [];
  const todaySessions = sessions.filter(s => new Date(s.updatedAt).toDateString() === today);
  const yesterdaySessions = sessions.filter(s => new Date(s.updatedAt).toDateString() === yesterday);
  const olderSessions = sessions.filter(s => {
    const d = new Date(s.updatedAt).toDateString();
    return d !== today && d !== yesterday;
  });
  if (todaySessions.length) grouped.push({ label: "Today", sessions: todaySessions });
  if (yesterdaySessions.length) grouped.push({ label: "Yesterday", sessions: yesterdaySessions });
  if (olderSessions.length) grouped.push({ label: "Older", sessions: olderSessions });

  return (
    /*
     * position: fixed locks the copilot panel to the screen regardless of
     * the Layout's padding/footer/Lenis scroll wrapper.
     * top: 56px = navbar h-14 height.
     * z-index: 40 sits above the layout content but below the navbar (z-50).
     */
    <div
      className="fixed left-0 right-0 bottom-0 flex bg-white"
      style={{ top: "56px", zIndex: 40 }}>

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-slate-200 bg-slate-50 overflow-hidden">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900">Copilot</span>
          </div>
          <button
            onClick={createNewChat}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
          {sessions.length === 0 ? (
            <p className="text-[10px] font-mono text-slate-400 text-center py-4">No chats yet</p>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 px-3 pb-1">
                  {group.label}
                </p>
                {group.sessions.map((s) => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    active={s.id === activeId}
                    onClick={() => setActiveId(s.id)}
                    onDelete={() => deleteSession(s.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-slate-200 px-3 py-3 bg-white">
          <p className="text-[9px] font-mono text-slate-400 leading-relaxed">
            Chats saved locally.<br />
            Memory-backed · Groq-powered
          </p>
        </div>
      </aside>

      {/* ── MAIN CHAT AREA ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">

        {/* Chat header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 truncate max-w-xs">
              {activeSession?.title === "New Chat" ? "Incident Intelligence Copilot" : activeSession?.title}
            </h1>
            <p className="text-[9px] font-mono text-slate-400">
              Memory-backed · Hindsight recall · Groq-powered reasoning
            </p>
          </div>
          {!isEmpty && (
            <button
              onClick={createNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-400 rounded-lg transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> New Chat
            </button>
          )}
        </div>

        {/* Messages — THIS is the only scrollable area */}
        {/* data-lenis-prevent stops ReactLenis from capturing scroll here */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" data-lenis-prevent>

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full gap-5 py-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100">
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-center space-y-1.5 max-w-sm">
                <h2 className="text-sm font-extrabold text-slate-900">Ask anything about your incidents</h2>
                <p className="text-xs text-slate-500 font-mono leading-relaxed">
                  Recalls Hindsight memories, retrieves observations, reflects on patterns,
                  and uses Groq to provide structured answers with full evidence citations.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
                {SUGGESTED.map((s) => (
                  <button
                    key={s.q}
                    onClick={() => handleSubmit(s.q, s.service)}
                    className="flex items-center gap-2 px-3 py-2 text-left text-xs font-medium bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all text-slate-600 hover:text-blue-700 group"
                  >
                    <Zap className="h-3 w-3 text-slate-300 group-hover:text-blue-400 shrink-0" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <div className="max-w-[65%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className="text-[9px] font-mono text-blue-200 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ) : msg.loading ? (
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs max-w-xs">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-slate-500">Recalling memories…</p>
                    <div className="flex gap-1.5">
                      {["Hindsight", "Reflect", "Groq"].map((step, i) => (
                        <span key={step} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 animate-pulse"
                          style={{ animationDelay: `${i * 200}ms` }}>{step}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : msg.error ? (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-800 mb-0.5">Copilot Error</p>
                    <p className="text-[10px] font-mono text-red-700">{msg.error}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-2xl">
                  <AnswerBubble msg={msg} />
                  <p className="text-[9px] font-mono text-slate-400 mt-1 pl-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* ── Input Area — pinned to bottom ──────────────────────────── */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 space-y-2">
          {/* Service filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 mr-1">Bank:</span>
            {["", "payment", "auth", "database", "gateway"].map((svc) => (
              <button
                key={svc}
                onClick={() => setSelectedService(svc)}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-lg border transition-colors ${
                  selectedService === svc
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {svc === "" ? "All" : svc}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div className="flex items-end gap-3 bg-white border-2 border-slate-200 focus-within:border-blue-400 rounded-2xl px-4 py-2.5 transition-colors">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask: Why are payment requests failing? Have we seen this before? What should I do?"
              className="flex-1 resize-none text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none font-medium leading-relaxed"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shrink-0"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>

          <p className="text-[9px] font-mono text-slate-400 text-center">
            ↵ Enter to send · Shift+Enter for new line · Every answer is grounded in Hindsight memory
          </p>
        </div>
      </div>
    </div>
  );
}
