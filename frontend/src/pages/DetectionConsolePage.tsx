import { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import {
  Zap, GitBranch, Radio, ClipboardList, CheckCircle2,
  Loader2, AlertTriangle, ShieldAlert, Brain, Database,
  Clock, RefreshCw, ChevronRight, Wifi, WifiOff, ExternalLink,
  MessageSquare, X, Send, Globe
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PipelineStep {
  step: number;
  name: string;
  status: "pending" | "running" | "complete" | "skipped";
  detail?: string;
}

interface SimilarIncident {
  incident_id?: string;
  service?: string;
  incident_type?: string;
  resolution?: string;
  root_cause?: string;
  time_to_resolve_mins?: string;
}

interface IntelligenceResult {
  classification: { service: string; incident_type: string; severity: string; title: string; description: string };
  pipeline_steps: PipelineStep[];
  similar_incidents: SimilarIncident[];
  similar_count: number;
  avg_time_to_resolve_mins: number | null;
  confidence_score: number;
  reasoning: string;
  recommended_action: string;
  alert_level: "new_pattern" | "known_pattern" | "critical_known";
}

interface LiveIncident {
  source: string;
  source_name: string;
  id: string;
  title: string;
  description: string;
  url?: string;
  created_at?: string;
  status?: string;
  impact?: string;
  raw_service?: string;
  labels?: string[];
}

// ─── Example snippets ─────────────────────────────────────────────────────────
const EXAMPLES = [
  {
    label: "CrashLoopBackOff",
    icon: "☸️",
    text: `[ERROR] Pod payment-api-7d9f4b-xkp2q is in CrashLoopBackOff state
[ERROR] Back-off restarting failed container
[WARN]  OOMKilled: container exceeded memory limit of 512Mi
[INFO]  Restart count: 8 in last 10 minutes
Node: prod-worker-node-3 | Namespace: production`,
  },
  {
    label: "Redis Cache Spike",
    icon: "🔴",
    text: `ALERT: Redis cache eviction rate spiked to 45,000 evictions/sec
Metric: redis_evicted_keys > 40000 for 3m
Used memory: 7.8GB / 8GB (97.5%)
maxmemory-policy: allkeys-lru
Service: checkout-service, cart-service affected`,
  },
  {
    label: "Payment 502 Errors",
    icon: "💳",
    text: `502 Bad Gateway errors observed from load balancer on /api/v1/checkout
Error rate: 34% of requests failing
Stripe API response time: > 30000ms (timeout)
DB connections: 188/200 (94% pool utilization)
Started: 2025-06-15 14:23 UTC`,
  },
  {
    label: "CI/CD Disk Full",
    icon: "🏗️",
    text: `Jenkins build pipeline failing on integration tests
ERROR: No space left on device
Disk usage: /var/lib/docker overlay2: 98.7% (189GB/192GB)
Failed builds: nexus-payment-service, nexus-auth-service
Runner: ci-runner-prod-2`,
  },
];

// ─── Alert level config ───────────────────────────────────────────────────────
const ALERT_CONFIG = {
  critical_known: { label: "Critical Known Pattern", color: "text-red-700", bg: "bg-red-50 border-2 border-red-200", icon: ShieldAlert },
  known_pattern: { label: "Known Pattern", color: "text-orange-700", bg: "bg-orange-50 border-2 border-orange-200", icon: Brain },
  new_pattern: { label: "New Pattern", color: "text-[#00008A]", bg: "bg-[#00FFFF]/10 border-2 border-[#00FFFF]/30", icon: Zap },
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "text-red-700 bg-red-50 border-2 border-red-200",
  high: "text-orange-700 bg-orange-50 border-2 border-orange-200",
  medium: "text-amber-700 bg-amber-50 border-2 border-amber-200",
  low: "text-emerald-700 bg-emerald-50 border-2 border-emerald-200",
};

// ─── Pipeline Step Indicator ─────────────────────────────────────────────────
function StepRow({ step, index }: { step: PipelineStep; index: number }) {
  const icons = [Zap, Database, Brain, RefreshCw];
  const Icon = icons[index] ?? Zap;
  return (
    <div className={`flex items-start gap-3 py-3 px-4 rounded-lg transition-all duration-300 ${
      step.status === "complete" ? "bg-emerald-50 border border-emerald-250 text-emerald-800" :
      step.status === "running" ? "bg-orange-50 border border-orange-250 text-orange-800 animate-pulse" :
      step.status === "skipped" ? "bg-slate-100 border border-slate-200 opacity-60 text-slate-400" :
      "bg-slate-50 border border-slate-100 opacity-40 text-slate-400"
    }`}>
      <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
        step.status === "complete" ? "bg-emerald-100 text-emerald-600" :
        step.status === "running" ? "bg-orange-100 text-orange-600" :
        "bg-slate-200 text-slate-500"
      }`}>
        {step.status === "complete" ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        ) : step.status === "running" ? (
          <Loader2 className="h-3.5 w-3.5 text-orange-600 animate-spin" />
        ) : (
          <Icon className="h-3 w-3 text-slate-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
            step.status === "complete" ? "text-emerald-700" :
            step.status === "running" ? "text-orange-700" :
            "text-slate-500"
          }`}>
            Step {step.step} — {step.name}
          </span>
        </div>
        {step.detail && (
          <p className="text-xs text-slate-650 mt-0.5 leading-relaxed">{step.detail}</p>
        )}
      </div>
    </div>
  );
}

// ─── Incident Card (for GitHub/Status tabs) ───────────────────────────────────
function IncidentCard({ inc, onAnalyze, loading }: { inc: LiveIncident; onAnalyze: (text: string, meta: object) => void; loading: boolean }) {
  const impactColor = inc.impact === "major" || inc.status === "investigating"
    ? "border-red-200 bg-red-50 text-red-700"
    : inc.impact === "minor"
    ? "border-orange-200 bg-orange-50 text-orange-850"
    : "border-slate-250 bg-white text-slate-700";

  const analyzeText = `${inc.title}\n${inc.description}`;

  return (
    <div className={`border-2 rounded-xl p-4 space-y-3 transition-all hover:scale-[1.01] hover:border-[#00008A]/30 ${impactColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
              {inc.source_name}
            </span>
            {inc.impact && inc.impact !== "none" && (
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border-2 ${
                inc.impact === "major" ? "text-red-700 bg-red-50 border-red-250" :
                inc.impact === "minor" ? "text-orange-700 bg-orange-50 border-orange-250" :
                "text-slate-655 bg-slate-50 border-slate-200"
              }`}>
                {inc.impact}
              </span>
            )}
            {inc.labels?.slice(0, 2).map(l => (
              <span key={l} className="text-[10px] font-mono text-slate-655 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                {l}
              </span>
            ))}
          </div>
          <h4 className="text-sm font-bold text-slate-900 hover:text-primary transition-colors leading-snug">
            {inc.title}
          </h4>
          {inc.description && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              {inc.description}
            </p>
          )}
        </div>
        {inc.url && (
          <a href={inc.url} target="_blank" rel="noopener noreferrer"
            className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-[#00008A]/5 transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <button
        onClick={() => onAnalyze(analyzeText, { source: inc.source, source_name: inc.source_name, id: inc.id })}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold
          bg-primary text-white border-2 border-primary hover:border-secondary hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
        Analyze with Nexus Sentinel
      </button>
    </div>
  );
}

// ─── Chat Markdown Renderer ──────────────────────────────────────────────────
function ChatMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let olItems: string[] = [];
  let ulItems: string[] = [];

  const flushOl = (key: string) => {
    if (olItems.length) {
      elements.push(
        <ol key={key} className="list-decimal list-outside ml-4 space-y-1 my-1.5">
          {olItems.map((item, i) => (
            <li key={i} className="text-xs text-slate-200 leading-relaxed pl-1">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>
      );
      olItems = [];
    }
  };
  const flushUl = (key: string) => {
    if (ulItems.length) {
      elements.push(
        <ul key={key} className="list-disc list-outside ml-4 space-y-1 my-1.5">
          {ulItems.map((item, i) => (
            <li key={i} className="text-xs text-slate-200 leading-relaxed pl-1">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      );
      ulItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const key = `l${idx}`;
    const trimmed = line.trim();

    // Numbered list: "1. " or "1) "
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (olMatch) {
      flushUl(key + "u");
      olItems.push(olMatch[2]);
      return;
    }

    // Bullet list: "- " or "• " or "* "
    const ulMatch = trimmed.match(/^[-•*]\s+(.+)/);
    if (ulMatch) {
      flushOl(key + "o");
      ulItems.push(ulMatch[1]);
      return;
    }

    // Flush pending lists before any non-list line
    flushOl(key + "fo");
    flushUl(key + "fu");

    if (trimmed === "") {
      elements.push(<div key={key} className="h-1.5" />);
    } else {
      elements.push(
        <p key={key} className="text-xs text-slate-200 leading-relaxed">
          <InlineMarkdown text={trimmed} />
        </p>
      );
    }
  });

  flushOl("end-o");
  flushUl("end-u");

  return <div className="space-y-0.5">{elements}</div>;
}

function InlineMarkdown({ text }: { text: string }) {
  // Parse **bold**, *italic*, `code` inline
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] !== undefined)
      parts.push(<strong key={m.index} className="font-bold text-white">{m[2]}</strong>);
    else if (m[3] !== undefined)
      parts.push(<em key={m.index} className="italic text-slate-300">{m[3]}</em>);
    else if (m[4] !== undefined)
      parts.push(
        <code key={m.index} className="font-mono text-amber-400 bg-amber-950/30 px-1 py-0.5 rounded text-[10px]">
          {m[4]}
        </code>
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

// ─── Incident Result Chat Drawer ────────────────────────────────────────────
function IncidentResultChat({
  result,
  onClose,
}: {
  result: IntelligenceResult;
  onClose: () => void;
}) {
  const buildContext = () => {
    const c = result.classification;
    const simList = result.similar_incidents
      .map(
        (si, i) =>
          `  [${i + 1}] ID:${si.incident_id ?? "?"} | Service:${si.service} | Type:${si.incident_type} | TTR:${si.time_to_resolve_mins ?? "?"}m | Fix: ${si.resolution ?? "N/A"}`
      )
      .join("\n");
    return [
      `=== INCIDENT ANALYSIS RESULT ==`,
      `Title       : ${c.title}`,
      `Service     : ${c.service}`,
      `Type        : ${c.incident_type}`,
      `Severity    : ${c.severity}`,
      `Alert Level : ${result.alert_level}`,
      `Confidence  : ${Math.round(result.confidence_score * 100)}%`,
      `Similar KB  : ${result.similar_count} historical incidents found`,
      result.avg_time_to_resolve_mins ? `Avg TTR     : ${result.avg_time_to_resolve_mins} mins` : "",
      ``,
      `Reasoning   : ${result.reasoning}`,
      `Recommended : ${result.recommended_action}`,
      result.similar_incidents.length > 0 ? `\nTop Similar Incidents:\n${simList}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `I have the full analysis in context — ${result.similar_count} similar historical incidents, ${Math.round(result.confidence_score * 100)}% confidence. Ask me anything about this incident: root cause, resolution steps, blast radius, or cross-incident patterns.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    const q = input.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setThinking(true);
    try {
      const ctx = buildContext();
      const systemPrompt = `You are a senior DevOps incident analyst with access to the following incident analysis result. Answer questions SPECIFICALLY using the data provided below — do not give generic answers. Reference actual incident IDs, TTR values, fixes, and patterns from the data.

${ctx}`;
      const res = await api.directChat(systemPrompt, q);
      const answer = res?.answer ?? "No response received.";
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Could not reach the copilot. Make sure the backend is running." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const alertCfg = ALERT_CONFIG[result.alert_level] ?? ALERT_CONFIG.new_pattern;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 flex flex-col w-full max-w-xl bg-white border-l-2 border-[#00008A] shadow-2xl"
        style={{ animation: "slideInRight 0.25s ease-out" }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b-2 border-slate-200 shrink-0 ${alertCfg.bg}`}>
          <alertCfg.icon className={`h-5 w-5 shrink-0 ${alertCfg.color}`} />
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-extrabold font-mono uppercase tracking-wider ${alertCfg.color}`}>
              {alertCfg.label} — Chat
            </div>
            <div className="text-[10px] text-slate-600 font-mono truncate">
              {result.classification.title}
            </div>
          </div>
          <span className={`text-lg font-extrabold font-mono ${alertCfg.color}`}>
            {Math.round(result.confidence_score * 100)}%
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#00008A] hover:bg-[#00008A]/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Context summary strip */}
        <div className="shrink-0 border-b-2 border-slate-150 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-[9px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">
              {result.classification.service}
            </span>
            <span className="text-[9px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">
              {result.classification.incident_type}
            </span>
            <span className="text-[9px] font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border-2 border-orange-200 uppercase">
              {result.similar_count} similar found
            </span>
            {result.avg_time_to_resolve_mins && (
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border-2 border-emerald-250 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> Avg TTR {result.avg_time_to_resolve_mins}m
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-600 font-mono leading-relaxed line-clamp-2">
            {result.reasoning}
          </p>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === "assistant"
                    ? "bg-[#00008A]/10 text-[#00008A] border border-[#00008A]/20"
                    : "bg-[#8A2BE2]/10 text-[#8A2BE2] border border-[#8A2BE2]/20"
                }`}
              >
                {msg.role === "assistant" ? <Brain className="h-3.5 w-3.5" /> : "U"}
              </div>
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 border-2 ${
                  msg.role === "assistant"
                    ? "bg-slate-50 border-slate-200 text-slate-800 rounded-tl-sm text-xs leading-relaxed"
                    : "bg-primary text-white border-primary rounded-tr-sm text-xs leading-relaxed"
                }`}
              >
                {msg.role === "assistant" ? <ChatMarkdown text={msg.text} /> : msg.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[#00008A]/10 border border-[#00008A]/20">
                <Brain className="h-3.5 w-3.5 text-[#00008A]" />
              </div>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 text-[#00008A] animate-spin" />
                <span className="text-xs text-slate-500 font-mono">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        <div className="shrink-0 px-4 pb-2 flex flex-wrap gap-1.5">
          {[
            "How do I fix this?",
            "What caused this?",
            "Blast radius?",
            "Show me similar fixes",
            "Steps to prevent recurrence",
          ].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="text-[10px] font-mono text-slate-600 bg-white border-2 border-slate-200 hover:border-[#00FFFF] hover:text-[#00008A] hover:shadow-[0_0_8px_rgba(0,255,255,0.4)] px-2.5 py-1 rounded-full transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 focus-within:border-[#00008A] transition-colors">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about this incident..."
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 font-mono focus:outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || thinking}
              className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Global Chat Drawer ──────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

function GlobalStatusChat({
  incidents,
  onClose,
}: {
  incidents: LiveIncident[];
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `I have context on ${incidents.length} live status incidents from Stripe, Cloudflare, AWS and other providers. Ask me anything — root causes, blast radius, recommended actions, or cross-incident patterns.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    const q = input.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setThinking(true);
    try {
      // Build a rich context string from all live incidents
      const ctx = incidents
        .map(
          (inc, i) =>
            `[${i + 1}] [${inc.source_name}] ${inc.title}${
              inc.description ? " — " + inc.description : ""
            }${
              inc.status ? " | status: " + inc.status : ""
            }${
              inc.impact && inc.impact !== "none" ? " | impact: " + inc.impact : ""
            }`
        )
        .join("\n");
      const enrichedQuestion = `You are a DevOps incident analyst. Here are the current live status-page incidents:\n${ctx}\n\nUser question: ${q}`;
      const res = await api.copilotQuery(enrichedQuestion);
      const answer =
        typeof res === "string"
          ? res
          : res?.answer ?? res?.response ?? res?.result ?? JSON.stringify(res);
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Could not reach the copilot. Make sure the backend is running." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="relative z-10 flex flex-col w-full max-w-xl bg-white border-l-2 border-[#00008A] shadow-2xl"
        style={{ animation: "slideInRight 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-650" />
            <span className="text-sm font-extrabold font-mono uppercase tracking-wider text-[#00008A]">
              Global Incident Chat
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            {incidents.length} live issues
          </span>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-[#00008A] hover:bg-[#00008A]/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live issues summary strip */}
        <div className="shrink-0 border-b-2 border-slate-150 bg-slate-50 px-4 py-3 max-h-40 overflow-y-auto">
          <p className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-2">
            Current Issues in Context
          </p>
          <div className="space-y-1.5">
            {incidents.length === 0 ? (
              <p className="text-xs text-slate-550 font-mono italic">No incidents fetched yet — refresh the Status Pages tab.</p>
            ) : (
              incidents.map((inc, i) => (
                <div key={inc.id} className="flex items-start gap-2">
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5 w-4 shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-250 uppercase">
                        {inc.source_name}
                      </span>
                      {inc.impact && inc.impact !== "none" && (
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border-2 ${
                          inc.impact === "major" ? "text-red-700 bg-red-50 border-red-200" :
                          inc.impact === "minor" ? "text-orange-700 bg-orange-50 border-orange-200" :
                          "text-slate-600 bg-slate-50 border-slate-200"
                        }`}>{inc.impact}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-700 leading-snug mt-0.5 line-clamp-1">{inc.title}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === "assistant"
                    ? "bg-[#00008A]/10 text-[#00008A] border border-[#00008A]/20"
                    : "bg-[#8A2BE2]/10 text-[#8A2BE2] border border-[#8A2BE2]/20"
                }`}
              >
                {msg.role === "assistant" ? <Brain className="h-3.5 w-3.5" /> : "U"}
              </div>
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 border-2 ${
                  msg.role === "assistant"
                    ? "bg-slate-50 border-slate-200 text-slate-800 rounded-tl-sm text-xs leading-relaxed"
                    : "bg-primary text-white border-primary rounded-tr-sm text-xs leading-relaxed"
                }`}
              >
                {msg.role === "assistant" ? <ChatMarkdown text={msg.text} /> : msg.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[#00008A]/10 border border-[#00008A]/20">
                <Brain className="h-3.5 w-3.5 text-[#00008A]" />
              </div>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 text-[#00008A] animate-spin" />
                <span className="text-xs text-slate-550 font-mono">Analyzing incidents...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        <div className="shrink-0 px-4 pb-2 flex flex-wrap gap-1.5">
          {[
            "What's the highest impact issue?",
            "Any Cloudflare outages?",
            "Summarize all issues",
            "Which services are degraded?",
          ].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="text-[10px] font-mono text-slate-600 bg-white border-2 border-slate-200 hover:border-[#00FFFF] hover:text-[#00008A] hover:shadow-[0_0_8px_rgba(0,255,255,0.4)] px-2.5 py-1 rounded-full transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 focus-within:border-[#00008A] transition-colors">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about these incidents..."
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 font-mono focus:outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || thinking}
              className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DetectionConsolePage() {
  const [activeTab, setActiveTab] = useState<"github" | "status" | "raw">("raw");
  const [rawInput, setRawInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [liveSteps, setLiveSteps] = useState<PipelineStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Live feed data
  const [githubFeed, setGithubFeed] = useState<LiveIncident[]>([]);
  const [statusFeed, setStatusFeed] = useState<LiveIncident[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // KB status
  const [kbStatus, setKbStatus] = useState<{ seeded?: boolean; status?: string } | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Global Chat
  const [chatOpen, setChatOpen] = useState(false);

  // Result Chat
  const [resultChatOpen, setResultChatOpen] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.detection.getKbStatus().then(setKbStatus).catch(() => setKbStatus({ status: "error" }));
  }, []);

  const loadFeed = async (tab: "github" | "status") => {
    setFeedLoading(true);
    try {
      if (tab === "github") {
        const data = await api.detection.getGithubFeed(10);
        setGithubFeed(data.incidents || []);
      } else {
        const data = await api.detection.getLiveStatus(15);
        setStatusFeed(data.incidents || []);
      }
    } catch (e: any) {
      console.error("Feed load failed:", e);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "github") loadFeed("github");
    if (activeTab === "status") loadFeed("status");
  }, [activeTab]);

  const handleSeedKb = async () => {
    setSeeding(true);
    try {
      const res = await api.detection.seedKb();
      setKbStatus({ seeded: true, status: "ready", ...res });
    } catch (e: any) {
      setError("KB seeding failed: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const runPipeline = async (inputText: string, sourceMeta?: object) => {
    if (!inputText.trim() || inputText.trim().length < 5) return;
    setAnalyzing(true);
    setResult(null);
    setError(null);

    // Animate steps
    const steps: PipelineStep[] = [
      { step: 1, name: "CLASSIFY", status: "running" },
      { step: 2, name: "RECALL", status: "pending" },
      { step: 3, name: "REFLECT", status: "pending" },
    ];
    setLiveSteps([...steps]);

    try {
      // Step 1 visual
      await new Promise(r => setTimeout(r, 400));
      steps[0] = { ...steps[0], status: "running" };
      setLiveSteps([...steps]);

      const data: IntelligenceResult = await api.detection.analyze(inputText, sourceMeta);

      // Animate each step completing
      for (let i = 0; i < data.pipeline_steps.length; i++) {
        const s = data.pipeline_steps[i];
        steps[i] = { ...s, status: "running" };
        setLiveSteps([...steps]);
        await new Promise(r => setTimeout(r, 500 + i * 300));
        steps[i] = { ...s, status: s.status === "skipped" ? "skipped" : "complete" };
        setLiveSteps([...steps]);
      }

      await new Promise(r => setTimeout(r, 300));
      setResult(data);

      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      setError(e.message || "Pipeline failed. Check backend connection.");
      setLiveSteps([]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeRaw = () => runPipeline(rawInput);

  const alertCfg = result ? ALERT_CONFIG[result.alert_level] ?? ALERT_CONFIG.new_pattern : null;

  return (
    <div className="bg-white text-slate-900 rounded-3xl border-2 border-[#00008A] shadow-2xl overflow-hidden font-sans antialiased">

      {/* ── Header ── */}
      <header className="border-b-2 border-slate-200 bg-slate-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500 animate-pulse" />
              <h1 className="text-lg font-extrabold tracking-tight text-[#00008A] font-mono uppercase">
                Detection Intelligence Console
              </h1>
            </div>
            <p className="text-xs text-black font-semibold font-mono">
              Paste logs · fetch live incidents · detect DevOps issues with 502-incident historical memory
            </p>
          </div>

          {/* KB Status */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-mono font-bold ${
              kbStatus?.seeded
                ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <Database className="h-3.5 w-3.5" />
              <span>
                {kbStatus?.seeded ? "502 incidents loaded" : kbStatus?.status === "error" ? "KB offline" : "KB not seeded"}
              </span>
              {kbStatus?.seeded
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                : <WifiOff className="h-3.5 w-3.5 text-slate-400" />}
            </div>
            {!kbStatus?.seeded && (
              <button
                onClick={handleSeedKb}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                  bg-[#FF8C00] text-white border-2 border-[#FF8C00] hover:bg-[#FF8C00]/90 hover:border-[#00FFFF] hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50"
              >
                {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <Database className="h-3.5 w-3.5 text-white" />}
                {seeding ? "Seeding..." : "Seed KB"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 text-sm font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── LEFT: Input Panel ── */}
          <div className="space-y-6">

            {/* Tab switcher */}
            <div className="flex gap-1 bg-slate-100 border-2 border-slate-200 rounded-xl p-1">
              {[
                { key: "raw", label: "Raw Input", icon: ClipboardList },
                { key: "github", label: "GitHub Live", icon: GitBranch },
                { key: "status", label: "Status Pages", icon: Radio },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                    activeTab === key
                      ? "bg-primary text-white border-2 border-primary shadow-sm"
                      : "text-slate-500 hover:text-primary hover:bg-[#00008A]/5 border-2 border-transparent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* ── RAW INPUT TAB ── */}
            {activeTab === "raw" && (
              <div className="space-y-5">
                {/* Example snippets */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                    Quick Examples
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex.label}
                        onClick={() => setRawInput(ex.text)}
                        className="text-left px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-secondary hover:bg-white hover:shadow-[0_0_8px_rgba(0,255,255,0.4)] transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{ex.icon}</span>
                          <span className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">
                            {ex.label}
                          </span>
                          <ChevronRight className="h-3 w-3 text-slate-500 ml-auto" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                    Input — Logs · Metrics · Natural Language · JSON Alert
                  </span>
                  <textarea
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder="Paste your logs, error messages, metrics snapshot, or just describe the problem in plain English..."
                    rows={10}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-800
                      placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-secondary/35
                      resize-none transition-all"
                  />
                </div>

                <button
                  onClick={handleAnalyzeRaw}
                  disabled={analyzing || !rawInput.trim()}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm
                    bg-primary text-white border-2 border-primary hover:border-secondary hover:shadow-[0_0_12px_rgba(0,255,255,0.4)] transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/10 hover:shadow-primary/20"
                >
                  {analyzing ? (
                    <><Loader2 className="h-4 w-4 animate-spin text-white" /> Analyzing...</>
                  ) : (
                    <><Zap className="h-4 w-4 text-secondary" /> Detect &amp; Analyze</>
                  )}
                </button>
              </div>
            )}

            {/* ── GITHUB TAB ── */}
            {activeTab === "github" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                    Live GitHub Issues &amp; CI Failures
                  </span>
                  <button onClick={() => loadFeed("github")} disabled={feedLoading}
                    className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-primary transition-colors">
                    <RefreshCw className={`h-3 w-3 ${feedLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                {feedLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 rounded-xl bg-slate-50 border-2 border-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : githubFeed.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <GitBranch className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-mono">No issues fetched. Add GITHUB_TOKEN to .env for better results.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {githubFeed.map(inc => (
                      <IncidentCard key={inc.id} inc={inc} onAnalyze={(t, m) => runPipeline(t, m)} loading={analyzing} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STATUS PAGES TAB ── */}
            {activeTab === "status" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                    Live Status — GitHub · Cloudflare · Heroku · Atlassian
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => loadFeed("status")} disabled={feedLoading}
                      className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-primary transition-colors">
                      <RefreshCw className={`h-3 w-3 ${feedLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Info bar + Global Chat button */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 text-[10px] font-mono text-emerald-700 bg-emerald-50 border-2 border-emerald-250 rounded-lg px-3 py-2">
                    <Wifi className="h-3 w-3 text-emerald-600" />
                    Public feeds · No API key required · Real production incidents
                  </div>
                  <button
                    id="global-chat-btn"
                    onClick={() => setChatOpen(true)}
                    disabled={feedLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider
                      bg-accent text-white border-2 border-accent hover:border-secondary hover:shadow-[0_0_12px_rgba(0,255,255,0.45)]
                      disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat Issues
                  </button>
                </div>

                {feedLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-24 rounded-xl bg-slate-50 border-2 border-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {statusFeed.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <Radio className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-mono">No live status incidents fetched yet.</p>
                      </div>
                    ) : (
                      statusFeed.map(inc => (
                        <IncidentCard key={inc.id} inc={inc} onAnalyze={(t, m) => runPipeline(t, m)} loading={analyzing} />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Global Chat Drawer */}
            {chatOpen && (
              <GlobalStatusChat incidents={statusFeed} onClose={() => setChatOpen(false)} />
            )}
          </div>

          {/* ── RIGHT: Pipeline + Result Panel ── */}
          <div className="space-y-6">

            {/* Pipeline Visualizer */}
            {(analyzing || liveSteps.length > 0) && (
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden animate-fade-in">
                <div className="px-5 py-4 border-b-2 border-slate-250 bg-slate-100/60 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00008A]">
                    Intelligence Pipeline
                  </span>
                  {analyzing && (
                    <span className="ml-auto text-[10px] font-mono text-orange-600 animate-pulse font-bold">Running...</span>
                  )}
                </div>
                <div className="p-4 space-y-2.5">
                  {liveSteps.map((step, i) => (
                    <StepRow key={step.step} step={step} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Intelligence Result */}
            {result && !analyzing && (
              <div ref={resultRef} className="space-y-4 animate-in fade-in duration-500">

                {/* Alert Level Banner */}
                {alertCfg && (
                  <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 ${alertCfg.bg}`}>
                    <alertCfg.icon className={`h-5 w-5 shrink-0 ${alertCfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-extrabold ${alertCfg.color}`}>{alertCfg.label}</div>
                      <div className="text-xs text-slate-600 font-mono font-semibold">
                        {result.similar_count > 0
                          ? `${result.similar_count} similar incidents found in historical knowledge base`
                          : "No historical matches found — first occurrence"}
                      </div>
                    </div>
                    <div className={`text-2xl font-extrabold font-mono ${alertCfg.color}`}>
                      {Math.round(result.confidence_score * 100)}%
                    </div>
                    <button
                      id="result-chat-btn"
                      onClick={() => setResultChatOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider
                        bg-white border-2 border-slate-200 hover:border-[#00FFFF] hover:text-[#00008A] hover:shadow-[0_0_8px_rgba(0,255,255,0.45)] text-slate-700
                        transition-all shrink-0`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      Chat Issues
                    </button>
                  </div>
                )}

                {/* Result Chat Drawer */}
                {resultChatOpen && result && (
                  <IncidentResultChat result={result} onClose={() => setResultChatOpen(false)} />
                )}

                {/* Classification */}
                <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b-2 border-slate-200 bg-slate-50">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                      Classification
                    </span>
                  </div>
                  <div className="px-5 py-4 space-y-3.5">
                    <h3 className="font-bold text-[#00008A] text-base leading-snug">
                      {result.classification.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 border-2 border-primary/20 px-2.5 py-1 rounded-full uppercase">
                        {result.classification.service}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 border-2 border-slate-200 px-2.5 py-1 rounded-full uppercase">
                        {result.classification.incident_type}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${SEVERITY_COLOR[result.classification.severity] ?? SEVERITY_COLOR.medium}`}>
                        {result.classification.severity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b-2 border-slate-200 bg-slate-50 flex items-center gap-2">
                    <Brain className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                      Recommended Action
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-slate-900 leading-relaxed font-bold">{result.recommended_action}</p>
                    {result.reasoning && (
                      <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3">
                        {result.reasoning}
                      </p>
                    )}
                  </div>
                </div>

                {/* Similar Historical Incidents */}
                {result.similar_incidents.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                          Historical Matches from KB
                        </span>
                      </div>
                      {result.avg_time_to_resolve_mins && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 bg-emerald-50 border-2 border-emerald-250 px-2.5 py-1 rounded-full font-bold">
                          <Clock className="h-3 w-3 text-emerald-650" />
                          Avg TTR: {result.avg_time_to_resolve_mins} mins
                        </div>
                      )}
                    </div>
                    <div className="divide-y divide-slate-200">
                      {result.similar_incidents.map((si, i) => (
                        <div key={si.incident_id ?? i} className="px-5 py-3 space-y-1 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-[#00008A]">{si.incident_id}</span>
                            <span className="text-[10px] font-mono text-black font-semibold">{si.service}</span>
                            {si.incident_type && (
                              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                                {si.incident_type}
                              </span>
                            )}
                            {si.time_to_resolve_mins && (
                              <span className="ml-auto text-[10px] font-mono text-emerald-700 flex items-center gap-1 font-bold">
                                <Clock className="h-2.5 w-2.5 text-emerald-600" />{si.time_to_resolve_mins}m
                               </span>
                            )}
                          </div>
                          {si.resolution && (
                            <p className="text-xs text-black leading-relaxed font-medium">
                              <span className="text-emerald-700 font-bold">Fix: </span>{si.resolution}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset button */}
                <button
                  onClick={() => { setResult(null); setLiveSteps([]); setRawInput(""); }}
                  className="w-full py-2.5 rounded-xl text-xs font-mono text-slate-700 border-2 border-slate-200
                    hover:text-[#00008A] hover:border-[#00008A] hover:bg-slate-50 transition-all bg-white font-bold"
                >
                  ← New Detection
                </button>
              </div>
            )}

            {/* Empty state */}
            {!analyzing && !result && liveSteps.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl space-y-4 px-8 text-center bg-slate-50/50">
                <div className="w-16 h-16 rounded-2xl bg-[#00FFFF]/10 border-2 border-[#00FFFF]/30 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-[#00008A]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-[#00008A] text-sm uppercase tracking-wider font-mono">Ready to Detect</h3>
                  <p className="text-xs text-black leading-relaxed max-w-xs font-medium">
                    Paste logs or fetch a live incident, then click{" "}
                    <span className="text-primary font-bold">Detect &amp; Analyze</span>.
                    {kbStatus?.seeded
                      ? " Nexus Sentinel will search 502 historical incidents to find similar patterns."
                      : " Seed the KB first to enable historical pattern matching."}
                  </p>
                </div>
                {!kbStatus?.seeded && (
                  <button onClick={handleSeedKb} disabled={seeding}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold
                      bg-primary text-white border-2 border-primary hover:border-secondary hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all">
                    {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <Database className="h-3.5 w-3.5 text-white" />}
                    {seeding ? "Seeding 502 incidents..." : "Seed Knowledge Base"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
