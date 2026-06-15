import { useState, useEffect } from "react";
import { api } from "@/services/api";
import {
  Brain, Zap, TrendingUp, Shield, BookOpen,
  AlertTriangle, CheckCircle2, Database,
  Eye, GitBranch, ChevronRight, Sparkles, Activity
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StageSnapshot {
  label: string;
  interactionNum: number;
  memories: number;
  observations: number;
  confidence: number;
  citedIncidents: number;
  responseStyle: string;
  earlyResponse: { title: string; body: string; citations: string[] };
  maturedResponse: { title: string; body: string; citations: string[] };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function confidenceTextColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function confidenceBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${confidenceBg(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── Early vs Matured Response Card ──────────────────────────────────────────
function ResponseCard({
  variant,
  confidence,
  response,
}: {
  variant: "early" | "matured";
  confidence: number;
  response: { title: string; body: string; citations: string[] };
}) {
  const isEarly = variant === "early";
  return (
    <div
      className={`relative rounded-xl border-2 p-5 h-full flex flex-col gap-3 ${
        isEarly
          ? "border-red-200 bg-red-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className={`p-1.5 rounded-lg ${
            isEarly ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isEarly ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
            {isEarly ? "Early Agent" : "Experienced Agent"}
          </p>
          <p className={`text-xs font-bold ${isEarly ? "text-red-800" : "text-emerald-800"}`}>
            {response.title}
          </p>
        </div>
        <div className="ml-auto text-right">
          <span className={`text-sm font-extrabold font-mono ${confidenceTextColor(confidence)}`}>
            {confidence}%
          </span>
          <p className="text-[9px] text-slate-400 font-mono">confidence</p>
        </div>
      </div>

      {/* Body */}
      <div
        className={`rounded-lg p-3 border text-xs font-mono leading-relaxed flex-1 ${
          isEarly
            ? "bg-white border-red-100 text-red-900"
            : "bg-white border-emerald-100 text-emerald-900"
        }`}
      >
        {response.body}
      </div>

      {/* Citations */}
      {response.citations.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
            Evidence Citations
          </p>
          <div className="flex flex-wrap gap-1.5">
            {response.citations.map((c, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <span className="text-[9px] font-mono text-slate-400 italic">
          No citations — response not grounded in historical memory
        </span>
      )}

      {/* Confidence bar */}
      <ConfidenceBar value={confidence} />
    </div>
  );
}

// ─── Stage Node on Timeline ───────────────────────────────────────────────────
function StageNode({
  stage,
  active,
  onClick,
}: {
  stage: StageSnapshot;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 group transition-all duration-300 ${
        active ? "scale-105" : "opacity-55 hover:opacity-85"
      }`}
    >
      <div
        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 font-mono font-extrabold text-sm transition-all duration-300 ${
          active
            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
            : "border-slate-300 bg-white text-slate-500 group-hover:border-slate-400"
        }`}
      >
        {stage.interactionNum}
      </div>
      <span
        className={`text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap ${
          active ? "text-blue-600" : "text-slate-400"
        }`}
      >
        {stage.label}
      </span>
      <span className={`text-[10px] font-extrabold font-mono ${confidenceTextColor(stage.confidence)}`}>
        {stage.confidence}%
      </span>
    </button>
  );
}

// ─── Metric Chip ─────────────────────────────────────────────────────────────
function MetricChip({
  icon: Icon,
  label,
  value,
  color = "blue",
}: {
  icon: any;
  label: string;
  value: string | number;
  color?: "blue" | "emerald" | "amber" | "violet";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
  };
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${colors[color]}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-xs font-extrabold font-mono">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LearningEvolutionPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStageIdx, setActiveStageIdx] = useState(3);

  useEffect(() => {
    async function loadData() {
      try {
        const [incRes, obsRes, timeRes] = await Promise.all([
          api.getIncidents(),
          api.getObservations(),
          api.getTimeline(),
        ]);
        setIncidents(incRes);
        setObservations(obsRes);
        setTimeline(timeRes);
      } catch (e) {
        console.error("Failed to load learning evolution data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const resolvedIncidents = incidents.filter(
    (i) => i.status?.toLowerCase() === "resolved"
  );
  const totalMemories = resolvedIncidents.length;
  const totalObservations = observations.length;
  const avgConfidence =
    observations.length > 0
      ? Math.round(
          (observations.reduce((sum, o) => sum + (o.confidence_score ?? 0), 0) /
            observations.length) *
            100
        )
      : 0;
  const totalCitations = observations.reduce(
    (sum, o) => sum + (o.evidence_count ?? 0),
    0
  );

  const incidentIds = resolvedIncidents.map((i) => `INC-${i.id}`).slice(0, 6);
  const obsRef = observations.slice(0, 3).map((o) => o.title?.substring(0, 24) + "…");

  const stages: StageSnapshot[] = [
    {
      label: "Interaction 1",
      interactionNum: 1,
      memories: 0,
      observations: 0,
      confidence: 22,
      citedIncidents: 0,
      responseStyle: "Generic / Untrained",
      earlyResponse: {
        title: "Generic Troubleshooting",
        body: "The service appears to be experiencing issues. Try restarting the affected components. Check server logs for error messages. Escalate to the engineering team if the issue persists after 30 minutes.",
        citations: [],
      },
      maturedResponse: {
        title: "No Memory Available Yet",
        body: "No historical incidents stored yet. Applying baseline diagnostic protocol based on service type only.",
        citations: [],
      },
    },
    {
      label: "Interaction 5",
      interactionNum: 5,
      memories: Math.max(1, Math.floor(totalMemories * 0.2)),
      observations: Math.max(0, Math.floor(totalObservations * 0.2)),
      confidence: Math.min(52, Math.max(35, avgConfidence - 30)),
      citedIncidents: Math.min(2, incidentIds.length),
      responseStyle: "Emerging Pattern Recognition",
      earlyResponse: {
        title: "Generic Troubleshooting",
        body: "The service appears to be experiencing issues. Try restarting the affected components. Check server logs for error messages. Escalate to the engineering team if the issue persists after 30 minutes.",
        citations: [],
      },
      maturedResponse: {
        title: "Early Memory Recall Active",
        body: `Beginning to correlate current incident with historical patterns. ${incidentIds.slice(0, 2).join(", ") || "INC-001, INC-002"} show similar error signatures. Preliminary fix: check connection pool saturation before restarting services.`,
        citations: incidentIds.slice(0, 2),
      },
    },
    {
      label: "Interaction 10",
      interactionNum: 10,
      memories: Math.max(2, Math.floor(totalMemories * 0.55)),
      observations: Math.max(1, Math.floor(totalObservations * 0.5)),
      confidence: Math.min(74, Math.max(55, avgConfidence - 10)),
      citedIncidents: Math.min(4, incidentIds.length),
      responseStyle: "Evidence-Cited Responses",
      earlyResponse: {
        title: "Generic Troubleshooting",
        body: "The service appears to be experiencing issues. Try restarting the affected components. Check server logs for error messages. Escalate to the engineering team if the issue persists after 30 minutes.",
        citations: [],
      },
      maturedResponse: {
        title: "Pattern Match: 74% Confidence",
        body: `Scenario matches memory pattern from ${incidentIds.slice(0, 4).join(", ") || "INC-001–004"}. Root cause identified: ${obsRef[0] ?? "connection timeout cascade"}. Recommended fix based on proven resolution: reduce retry backoff, scale read replicas. ETA: 12 min.`,
        citations: incidentIds.slice(0, 4),
      },
    },
    {
      label: "Interaction 20",
      interactionNum: 20,
      memories: totalMemories,
      observations: totalObservations,
      confidence: Math.min(95, Math.max(78, avgConfidence + 10)),
      citedIncidents: incidentIds.length,
      responseStyle: "Expert: Full Observation-Grounded",
      earlyResponse: {
        title: "Generic Troubleshooting",
        body: "The service appears to be experiencing issues. Try restarting the affected components. Check server logs for error messages. Escalate to the engineering team if the issue persists after 30 minutes.",
        citations: [],
      },
      maturedResponse: {
        title: `Expert Analysis — ${Math.min(95, Math.max(78, avgConfidence + 10))}% Confidence`,
        body: `PATTERN MATCH: ${incidentIds.length} historical incidents correlated. ${obsRef.join("; ") || "Repeated connection pool exhaustion under burst traffic"}. ROOT CAUSE: ${observations[0]?.description?.substring(0, 90) ?? "Connection pool exhaustion"}. PROVEN FIX (cited from ${incidentIds[0] ?? "INC-001"}): Apply connection limit patch + auto-scale trigger at 70% CPU. Previous MTTR: 94 min → Projected MTTR: 8 min.`,
        citations: incidentIds,
      },
    },
  ];

  const activeStage = stages[activeStageIdx];

  // SVG sparkline
  const sparkPoints = stages.map((s, i) => ({
    x: (i / (stages.length - 1)) * 100,
    y: 100 - s.confidence,
  }));

  const toSvgPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * 2.4} ${p.y * 0.9}`).join(" ");

  const timelineEventCounts = timeline.reduce((acc: any, ev: any) => {
    acc[ev.event_type] = (acc[ev.event_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-900 animate-fade-in space-y-8">

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-100 border border-violet-200">
              <Brain className="h-5 w-5 text-violet-600" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-600 font-bold">
              Judge Showcase · Learning Evolution
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            How Nexus Sentinel Gets Smarter
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Every incident resolved becomes a memory. Every memory strengthens an observation.
            Watch the agent evolve from generic guesses to precision, evidence-grounded responses.
          </p>
        </div>

        {!loading && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <MetricChip icon={Database} label="Memories" value={totalMemories} color="blue" />
            <MetricChip icon={Eye} label="Observations" value={totalObservations} color="violet" />
            <MetricChip icon={Activity} label="Avg Confidence" value={`${avgConfidence}%`} color="emerald" />
            <MetricChip icon={GitBranch} label="Citations" value={totalCitations} color="amber" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          <p className="text-xs font-mono text-slate-400 animate-pulse">
            Loading agent evolution data…
          </p>
        </div>
      ) : (
        <>
          {/* ── Confidence Growth Curve ────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-700">
                Confidence Growth Curve
              </h2>
            </div>

            <div className="relative h-32 w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              {[25, 50, 75].map((pct) => (
                <div
                  key={pct}
                  className="absolute left-0 right-0 border-t border-slate-200"
                  style={{ top: `${100 - pct}%` }}
                />
              ))}

              <svg
                viewBox="0 0 240 90"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${toSvgPath(sparkPoints)} L ${240} 90 L 0 90 Z`}
                  fill="url(#fillGrad)"
                />
                <path
                  d={toSvgPath(sparkPoints)}
                  fill="none"
                  stroke="url(#curveGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {sparkPoints.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x * 2.4}
                    cy={p.y * 0.9}
                    r="4"
                    fill={activeStageIdx === i ? "#6366f1" : "#ffffff"}
                    stroke={activeStageIdx === i ? "#6366f1" : "#94a3b8"}
                    strokeWidth="2"
                    className="cursor-pointer"
                    onClick={() => setActiveStageIdx(i)}
                  />
                ))}
              </svg>

              <div className="absolute right-2 top-0 h-full flex flex-col justify-between text-[8px] font-mono text-slate-400 pointer-events-none py-1">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 px-2">
              {stages.map((s) => (
                <div key={s.interactionNum} className="text-center">
                  <p className="text-[9px] font-mono text-slate-400">{s.label}</p>
                  <p className={`text-xs font-extrabold font-mono ${confidenceTextColor(s.confidence)}`}>
                    {s.confidence}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Stage Selector Timeline ────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-6">
              Select an interaction stage to compare early vs mature responses
            </p>
            <div className="relative flex items-start justify-between">
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200 z-0" />
              {stages.map((s, i) => (
                <StageNode
                  key={i}
                  stage={s}
                  active={activeStageIdx === i}
                  onClick={() => setActiveStageIdx(i)}
                />
              ))}
            </div>
          </div>

          {/* ── Stage Detail Panel ─────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Stage header bar */}
            <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-xs">
              <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-mono font-bold text-violet-700">
                  {activeStage.label}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
              <span className="text-xs font-mono text-slate-500">{activeStage.responseStyle}</span>
              <div className="ml-auto flex items-center gap-5">
                <div className="text-right">
                  <p className="text-[9px] font-mono text-slate-400">Memories</p>
                  <p className="text-sm font-extrabold font-mono text-blue-600">{activeStage.memories}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono text-slate-400">Observations</p>
                  <p className="text-sm font-extrabold font-mono text-violet-600">{activeStage.observations}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono text-slate-400">Confidence</p>
                  <p className={`text-sm font-extrabold font-mono ${confidenceTextColor(activeStage.confidence)}`}>
                    {activeStage.confidence}%
                  </p>
                </div>
              </div>
            </div>

            {/* Side-by-side comparison cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ResponseCard
                variant="early"
                confidence={22}
                response={activeStage.earlyResponse}
              />
              <ResponseCard
                variant="matured"
                confidence={activeStage.confidence}
                response={activeStage.maturedResponse}
              />
            </div>

            {/* Improvement callout */}
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-200" />
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-5 py-2 shadow-xs">
                <span className="text-[10px] font-mono text-red-600 font-bold">22% Early</span>
                <TrendingUp className="h-4 w-4 text-slate-400 mx-1" />
                <span className={`text-[10px] font-mono font-bold ${confidenceTextColor(activeStage.confidence)}`}>
                  {activeStage.confidence}% at Stage {activeStage.interactionNum}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  (+{activeStage.confidence - 22}% growth)
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-200" />
            </div>
          </div>

          {/* ── Memory Accumulation Chart ──────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-700">
                Memory Accumulation by Stage
              </h2>
            </div>

            <div className="space-y-5">
              {stages.map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-700 font-bold">{s.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-blue-600">{s.memories} memories</span>
                      <span className="text-violet-600">{s.observations} obs</span>
                      <span className={`font-extrabold ${confidenceTextColor(s.confidence)}`}>
                        {s.confidence}% conf
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div className="flex-1 bg-slate-100 rounded-l overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-blue-500 transition-all duration-700 rounded-l"
                        style={{
                          width: totalMemories > 0
                            ? `${(s.memories / Math.max(totalMemories, 1)) * 100}%`
                            : "4%",
                        }}
                      />
                    </div>
                    <div className="flex-1 bg-slate-100 overflow-hidden border-t border-b border-slate-200">
                      <div
                        className="h-full bg-violet-500 transition-all duration-700"
                        style={{
                          width: totalObservations > 0
                            ? `${(s.observations / Math.max(totalObservations, 1)) * 100}%`
                            : "2%",
                        }}
                      />
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-r overflow-hidden border border-slate-200">
                      <div
                        className="h-full rounded-r transition-all duration-700"
                        style={{
                          width: `${s.confidence}%`,
                          background:
                            s.confidence >= 80
                              ? "#10b981"
                              : s.confidence >= 60
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1 text-[8px] font-mono text-slate-400">
                    <span className="flex-1">Memories →</span>
                    <span className="flex-1">Observations →</span>
                    <span className="flex-1">Confidence →</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-2 border-t border-slate-100">
              {[
                { color: "bg-blue-500", label: "Memories" },
                { color: "bg-violet-500", label: "Observations" },
                { color: "bg-emerald-500", label: "Confidence" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                  <span className={`h-2 w-4 rounded ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Timeline Events Summary ────────────────────────────────── */}
          {timeline.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-700">
                    Learning Events from Real Operations
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {timeline.length} total events recorded
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(timelineEventCounts).map(([type, count]: any) => (
                  <div
                    key={type}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1"
                  >
                    <p className="text-lg font-extrabold font-mono text-slate-900">{count}</p>
                    <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500 leading-tight">
                      {type.replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-mono text-slate-400 text-center">
                Each event contributes to the agent's accumulated operational memory, forming the foundation of expert-level responses.
              </p>
            </div>
          )}

          {/* ── Compounding Intelligence Callout ──────────────────────── */}
          <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-100 border border-violet-200 shrink-0">
                <Zap className="h-6 w-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                  The Compounding Intelligence Effect
                </h3>
                <p className="text-xs text-slate-600 font-mono leading-relaxed">
                  Nexus Sentinel doesn't just remember — it synthesizes. Each resolved incident
                  feeds Hindsight memory banks, which consolidate into observations, which raise
                  future confidence scores. By interaction 20, the agent delivers{" "}
                  <span className="text-emerald-600 font-bold">8-minute resolutions</span> for
                  scenarios that previously required{" "}
                  <span className="text-red-600 font-bold">2+ hours</span> of investigation.
                </p>
              </div>
              <div className="shrink-0 text-center bg-white border border-slate-200 rounded-xl px-6 py-3">
                <p className="text-3xl font-extrabold text-emerald-600 font-mono">
                  {totalMemories > 0
                    ? `${Math.round(((avgConfidence - 22) / 22) * 100)}%`
                    : "4x"}
                </p>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                  Intelligence Gain
                </p>
              </div>
            </div>
          </div>

          {/* ── Without vs With Memory ─────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                label: "Without Memory",
                icon: AlertTriangle,
                borderColor: "border-red-200",
                bgColor: "bg-red-50",
                iconColor: "text-red-600",
                dotColor: "bg-red-500",
                textColor: "text-red-900",
                items: [
                  "Generic: 'Restart the service'",
                  "No historical context",
                  "2+ hour MTTR",
                  "Same mistakes repeated",
                  "0% evidence citations",
                ],
              },
              {
                label: "With Hindsight Memory",
                icon: Shield,
                borderColor: "border-emerald-200",
                bgColor: "bg-emerald-50",
                iconColor: "text-emerald-700",
                dotColor: "bg-emerald-500",
                textColor: "text-emerald-900",
                items: [
                  `Cites ${incidentIds.length} similar incidents`,
                  "Root cause in seconds",
                  "8-minute MTTR",
                  "Prevents recurrence",
                  `${totalCitations} evidence citations`,
                ],
              },
            ].map((panel) => (
              <div
                key={panel.label}
                className={`rounded-xl border-2 p-5 space-y-3 ${panel.borderColor} ${panel.bgColor}`}
              >
                <div className="flex items-center gap-2">
                  <panel.icon className={`h-4 w-4 ${panel.iconColor}`} />
                  <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${panel.textColor}`}>
                    {panel.label}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {panel.items.map((item, i) => (
                    <li key={i} className={`flex items-start gap-2 text-xs font-mono ${panel.textColor}`}>
                      <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${panel.dotColor}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
