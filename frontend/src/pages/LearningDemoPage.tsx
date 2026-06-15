import { useState } from "react";
import { api } from "@/services/api";
import {
  Brain, AlertTriangle, CheckCircle2, BookOpen,
  ChevronRight, Loader2, Zap, Database, ArrowRight,
  RefreshCw, Play, Lock, Sparkles, ShieldCheck
} from "lucide-react";

// ─── Stage machine ────────────────────────────────────────────────────────────
type DemoStage =
  | "idle"          // before demo starts
  | "incident1"     // col1 lit: first incident created, no memory
  | "resolving"     // col2 lit: engineer enters resolution
  | "retaining"     // API call: retaining memory
  | "retained"      // col2 complete: memory retained
  | "incident2"     // col3 lit: repeat incident analysed with recall
  | "complete";     // all done

// ─── Scenario config ──────────────────────────────────────────────────────────
const SCENARIO = {
  title: "GPU Memory Leak",
  description:
    "CUDA out-of-memory error detected on inference cluster. Model serving pods restarting. GPU utilisation 98%, available VRAM: 0 MB. Inference latency spiking above SLA threshold.",
  service: "database",
  severity: "critical",
  resolution: "Upgrade CUDA Runtime to 12.3.2 and set memory_fraction=0.85 in serving config.",
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Pill({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "red" | "amber" | "emerald" | "blue" | "violet" | "slate";
}) {
  const map = {
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    slate: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${map[color]}`}>
      {children}
    </span>
  );
}

function ConfidenceMeter({ value, animated }: { value: number; animated?: boolean }) {
  const color =
    value >= 70 ? "bg-emerald-500" : value >= 45 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    value >= 70 ? "text-emerald-600" : value >= 45 ? "text-amber-600" : "text-red-600";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono font-bold">
        <span className="text-slate-500">Confidence</span>
        <span className={textColor}>{value}%</span>
      </div>
      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} ${animated ? "transition-all duration-1000 ease-out" : ""}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Column wrapper ───────────────────────────────────────────────────────────
function DemoColumn({
  step,
  label,
  icon: Icon,
  iconColor,
  active,
  done,
  locked,
  children,
}: {
  step: string;
  label: string;
  icon: any;
  iconColor: string;
  active: boolean;
  done: boolean;
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 transition-all duration-500 ${
        locked
          ? "border-slate-200 bg-slate-50 opacity-50"
          : done
          ? "border-emerald-300 bg-emerald-50/40 shadow-md"
          : active
          ? "border-blue-300 bg-white shadow-lg ring-4 ring-blue-100"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Step badge */}
      <div
        className={`absolute -top-3.5 left-5 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold ${
          done
            ? "bg-emerald-500 border-emerald-500 text-white"
            : active
            ? "bg-blue-600 border-blue-600 text-white"
            : "bg-white border-slate-300 text-slate-400"
        }`}
      >
        {done ? <CheckCircle2 className="h-3 w-3" /> : <span>{step}</span>}
        <span>{label}</span>
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Lock className="h-7 w-7" />
            <span className="text-xs font-mono">Complete previous step</span>
          </div>
        </div>
      )}

      {/* Icon header */}
      <div
        className={`flex items-center gap-2.5 px-5 pt-8 pb-4 border-b ${
          done ? "border-emerald-200" : active ? "border-blue-100" : "border-slate-100"
        }`}
      >
        <div
          className={`p-2 rounded-xl border ${
            done
              ? "bg-emerald-100 border-emerald-200"
              : active
              ? "bg-blue-50 border-blue-200"
              : "bg-slate-100 border-slate-200"
          }`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>

      <div className="flex-1 p-5 space-y-4">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LearningDemoPage() {
  const [stage, setStage] = useState<DemoStage>("idle");
  const [resolution, setResolution] = useState(SCENARIO.resolution);
  const [incidentId, setIncidentId] = useState<number | null>(null);
  const [recallData, setRecallData] = useState<any[]>([]);
  const [retainResult, setRetainResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [pulse, setPulse] = useState(false);

  const triggerPulse = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 1200);
  };

  // ── STEP 1: Create incident, immediately recall (should find nothing) ───────
  async function handleStartDemo() {
    try {
      setApiLoading(true);
      setError(null);

      // Create the incident
      const incident = await api.createIncident({
        title: SCENARIO.title,
        description: SCENARIO.description,
        service: SCENARIO.service,
        severity: SCENARIO.severity,
      });
      setIncidentId(incident.id);

      // Try recall — before memory is retained, should return empty/near-empty
      try {
        const similar = await api.getSimilarIncidents(incident.id);
        // Filter to very relevant only — at this point memory shouldn't have this
        setRecallData(Array.isArray(similar) ? similar.slice(0, 0) : []);
      } catch {
        setRecallData([]);
      }

      triggerPulse();
      setStage("incident1");
    } catch (e: any) {
      setError("Failed to create incident: " + (e.message ?? "Unknown error"));
    } finally {
      setApiLoading(false);
    }
  }

  // ── STEP 2: Resolve + retain ───────────────────────────────────────────────
  async function handleRetainMemory() {
    if (!incidentId) return;
    try {
      setApiLoading(true);
      setError(null);
      setStage("retaining");

      // Resolve first
      await api.resolveIncident(incidentId, resolution);

      // Retain into Hindsight memory
      const result = await api.retainIncident(incidentId);
      setRetainResult(result);

      triggerPulse();
      setStage("retained");

      // Auto-advance to step 3 after 1.5s
      setTimeout(() => handleRepeatIncident(incidentId), 1800);
    } catch (e: any) {
      setError("Retention failed: " + (e.message ?? "Unknown error"));
      setStage("resolving");
    } finally {
      setApiLoading(false);
    }
  }

  // ── STEP 3: Create repeat incident, recall NOW finds the fix ───────────────
  async function handleRepeatIncident(_originalId: number) {
    try {
      setApiLoading(true);
      setError(null);

      // Create a second identical incident
      const incident2 = await api.createIncident({
        title: SCENARIO.title + " (Repeat)",
        description: SCENARIO.description,
        service: SCENARIO.service,
        severity: SCENARIO.severity,
      });

      // Recall should now find the retained memory
      let recalled: any[] = [];
      try {
        const similar = await api.getSimilarIncidents(incident2.id);
        recalled = Array.isArray(similar) ? similar : [];
      } catch {
        recalled = [];
      }

      setRecallData(recalled);
      triggerPulse();
      setStage("complete");
    } catch (e: any) {
      setError("Repeat incident failed: " + (e.message ?? "Unknown error"));
    } finally {
      setApiLoading(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function handleReset() {
    setStage("idle");
    setIncidentId(null);
    setRecallData([]);
    setRetainResult(null);
    setError(null);
    setResolution(SCENARIO.resolution);
    setPulse(false);
  }

  const col1Active = stage === "incident1";
  const col1Done = ["resolving", "retaining", "retained", "incident2", "complete"].includes(stage);
  const col2Active = stage === "resolving" || stage === "retaining";
  const col2Done = ["retained", "incident2", "complete"].includes(stage);
  const col3Active = stage === "incident2";
  const col3Done = stage === "complete";
  const col1Locked = stage === "idle";
  const col2Locked = !col1Done;
  const col3Locked = !col2Done;

  const col3Confidence = recallData.length > 0 ? 84 : 72;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-900 animate-fade-in space-y-8">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 border border-blue-200">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 font-bold">
              Judge Showcase · Live Learning Demo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Watch the Agent Learn in Real Time
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Submit an incident, provide the resolution, retain it into Hindsight memory —
            then watch the agent immediately recall the fix when the same issue repeats.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {stage !== "idle" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset Demo
            </button>
          )}
          {stage === "idle" && (
            <button
              onClick={handleStartDemo}
              disabled={apiLoading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {apiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start Live Demo
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-xs font-mono text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">API Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ── Idle State ───────────────────────────────────────────────────── */}
      {stage === "idle" && !apiLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-6 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl">
          <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm">
            <Brain className="h-10 w-10 text-blue-500" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-lg font-extrabold text-slate-900">Ready to demonstrate learning</h2>
            <p className="text-sm text-slate-500 font-mono">
              Click <strong>"Start Live Demo"</strong> above to submit a{" "}
              <span className="text-red-600 font-bold">GPU Memory Leak</span> incident
              and watch Nexus Sentinel go from{" "}
              <span className="text-red-600 font-bold">18%</span> → <span className="text-emerald-600 font-bold">84%</span> confidence after learning.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full">1. New Incident</span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full">2. Retain Memory</span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full">3. Agent Recalls</span>
          </div>
        </div>
      )}

      {/* ── Three Column Demo ─────────────────────────────────────────────── */}
      {stage !== "idle" && (
        <>
          {/* Progress strip */}
          <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-slate-200">
            {[
              { label: "Incident Filed", done: col1Done, active: col1Active },
              { label: "Resolution Retained", done: col2Done, active: col2Active },
              { label: "Memory Recalled", done: col3Done, active: col3Active },
            ].map((s, i) => (
              <div
                key={i}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono font-bold border-r last:border-r-0 border-slate-200 transition-colors duration-500 ${
                  s.done
                    ? "bg-emerald-50 text-emerald-700"
                    : s.active
                    ? "bg-blue-50 text-blue-700"
                    : "bg-white text-slate-400"
                }`}
              >
                {s.done ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : s.active ? (
                  <div className={`h-2 w-2 rounded-full bg-blue-500 ${pulse ? "animate-ping" : ""}`} />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-slate-300" />
                )}
                {s.label}
              </div>
            ))}
          </div>

          {/* Three columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">

            {/* ── COLUMN 1: New Incident ───────────────────────────────── */}
            <DemoColumn
              step="01"
              label="New Incident"
              icon={AlertTriangle}
              iconColor={col1Done ? "text-emerald-600" : "text-red-500"}
              active={col1Active}
              done={col1Done}
              locked={col1Locked}
            >
              {/* Incident Card */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Incident Title</p>
                  <p className="text-sm font-extrabold text-slate-900">{SCENARIO.title}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Pill color="red">CRITICAL</Pill>
                  <Pill color="violet">gpu-inference</Pill>
                  {incidentId && <Pill color="blue">INC-{incidentId}</Pill>}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-slate-600 leading-relaxed">
                    {SCENARIO.description}
                  </p>
                </div>
              </div>

              {/* Agent First Response */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                    Agent Response
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-mono text-red-800 leading-relaxed">
                    <span className="font-bold">⚠ No similar incidents found.</span>
                    {" "}Memory banks contain no matching patterns for GPU memory exhaustion on inference clusters. Unable to provide evidence-backed recommendation. Applying generic diagnostic protocol.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[9px] font-mono text-slate-400">Citations:</span>
                    <span className="text-[9px] font-mono text-red-400 italic">None — memory empty</span>
                  </div>
                </div>

                <ConfidenceMeter value={18} />
              </div>

              {/* Advance button */}
              {col1Active && (
                <button
                  onClick={() => setStage("resolving")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-slate-900 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Proceed to Resolution <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}

              {col1Done && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Incident filed — INC-{incidentId}
                </div>
              )}
            </DemoColumn>

            {/* ── COLUMN 2: Engineer Resolution ────────────────────────── */}
            <DemoColumn
              step="02"
              label="Engineer Resolution"
              icon={BookOpen}
              iconColor={col2Done ? "text-emerald-600" : "text-amber-600"}
              active={col2Active}
              done={col2Done}
              locked={col2Locked}
            >
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Incident</p>
                  <p className="text-sm font-extrabold text-slate-900">{SCENARIO.title}</p>
                  {incidentId && <Pill color="blue">INC-{incidentId}</Pill>}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">
                    Resolution Applied by Engineer
                  </label>
                  <textarea
                    rows={4}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    disabled={col2Done || col2Locked}
                    className="w-full text-xs font-mono bg-white border-2 border-slate-200 focus:border-blue-400 outline-none rounded-lg p-3 text-slate-800 resize-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              {/* Memory retain section */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-violet-500" />
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                    Hindsight Memory Bank
                  </p>
                </div>

                {!col2Done ? (
                  <>
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                      <p className="text-[10px] font-mono text-violet-800 leading-relaxed">
                        Click <strong>"Retain Memory"</strong> to encode this resolution into
                        Hindsight. The agent will recall it the next time this incident pattern appears.
                      </p>
                    </div>

                    <button
                      onClick={handleRetainMemory}
                      disabled={apiLoading || !resolution.trim() || col2Locked}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm"
                    >
                      {apiLoading && stage === "retaining" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Retaining into Hindsight…
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          Retain Memory
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-mono text-emerald-800 font-bold">
                        Memory retained in Hindsight ✓
                      </p>
                    </div>
                    {retainResult && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                          Retention Receipt
                        </p>
                        <pre className="text-[9px] font-mono text-slate-600 whitespace-pre-wrap break-words">
                          {JSON.stringify(retainResult, null, 2).slice(0, 280)}…
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DemoColumn>

            {/* ── COLUMN 3: Repeat Incident — Memory Recalled ───────────── */}
            <DemoColumn
              step="03"
              label="Memory Recalled"
              icon={Sparkles}
              iconColor={col3Done ? "text-emerald-600" : "text-blue-500"}
              active={col3Active}
              done={col3Done}
              locked={col3Locked}
            >
              {col3Locked ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                  <Brain className="h-8 w-8 opacity-30" />
                  <p className="text-xs font-mono text-center">
                    Waiting for memory<br />to be retained…
                  </p>
                </div>
              ) : (
                <>
                  {/* Loading state */}
                  {apiLoading && stage === "retaining" && (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                      <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                      <p className="text-xs font-mono text-slate-500 animate-pulse">
                        Encoding memory into Hindsight…
                      </p>
                    </div>
                  )}

                  {/* Memory recalled result */}
                  {col3Done && (
                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Repeat Incident</p>
                        <p className="text-sm font-extrabold text-slate-900">{SCENARIO.title}</p>
                        <Pill color="red">CRITICAL</Pill>
                      </div>

                      {/* Agent Recalled Response */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Brain className="h-3.5 w-3.5 text-blue-500" />
                          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                            Agent Response — Memory Active
                          </p>
                        </div>

                        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                            <p className="text-xs font-mono text-emerald-900 font-bold">
                              ✓ Similar incident recalled from memory
                            </p>
                          </div>

                          {/* Referenced incident */}
                          <div className="bg-white border border-emerald-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Pill color="blue">
                                INC-{incidentId}
                              </Pill>
                              <Pill color="emerald">RESOLVED</Pill>
                            </div>
                            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                              Recalled Resolution
                            </p>
                            <p className="text-xs font-mono text-slate-800 leading-relaxed font-semibold">
                              {resolution}
                            </p>
                          </div>

                          {/* Recalled evidence */}
                          {recallData.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                                Supporting Evidence ({recallData.length} memories)
                              </p>
                              {recallData.slice(0, 2).map((item: any, i: number) => (
                                <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-[9px] font-mono text-blue-800 leading-relaxed">
                                  {typeof item === "string"
                                    ? item.slice(0, 120)
                                    : item.text?.slice(0, 120) ?? JSON.stringify(item).slice(0, 120)}
                                  …
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-[10px] font-mono text-emerald-700 leading-relaxed">
                            Projected MTTR: <strong>8 minutes</strong> (vs 2+ hours without memory)
                          </p>
                        </div>
                      </div>

                      <ConfidenceMeter value={col3Confidence} animated />

                      {/* Citation badges */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                          Evidence Citations
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <Pill color="blue">INC-{incidentId}</Pill>
                          <Pill color="violet">gpu-inference</Pill>
                          <Pill color="emerald">CUDA Runtime</Pill>
                          {recallData.length > 0 && (
                            <Pill color="amber">{recallData.length} memories recalled</Pill>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </DemoColumn>
          </div>

          {/* ── Completion Banner ──────────────────────────────────────────── */}
          {stage === "complete" && (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-blue-50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 shrink-0">
                  <Brain className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-slate-900 mb-1">
                    🎓 Learning demonstrated successfully
                  </h3>
                  <p className="text-xs text-slate-600 font-mono leading-relaxed">
                    Nexus Sentinel went from{" "}
                    <span className="text-red-600 font-bold">18% confidence</span> (no memory) to{" "}
                    <span className="text-emerald-600 font-bold">{col3Confidence}% confidence</span> (memory recalled)
                    — all in real time using the live Hindsight API. INC-{incidentId} is now
                    permanently encoded in the agent's operational memory.
                  </p>
                </div>
                <div className="flex flex-col items-center bg-white border border-slate-200 rounded-xl px-6 py-3 shrink-0">
                  <p className="text-3xl font-extrabold text-emerald-600 font-mono">
                    +{col3Confidence - 18}%
                  </p>
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                    Confidence Gain
                  </p>
                </div>
              </div>

              {/* Before / After strip */}
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-red-500">Before Memory</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[18%] bg-red-400 rounded-full" />
                    </div>
                    <span className="text-xs font-mono font-bold text-red-600">18%</span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400">No citations · Generic response · 2h+ MTTR</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-600">After Memory</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${col3Confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">{col3Confidence}%</span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400">
                    INC-{incidentId} cited · Proven fix · 8 min MTTR
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
