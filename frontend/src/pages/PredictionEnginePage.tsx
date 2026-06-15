import { useState, useEffect } from "react";
import { api } from "@/services/api";
import {
  TrendingUp, Clock, Zap, Layers,
  CheckCircle2, Play, RefreshCw,
  AlertCircle, ChevronDown, ChevronUp, Server
} from "lucide-react";

interface Prediction {
  title: string;
  probability: number;
  expected_time: string;
  service: string;
  evidence_count: number;
  supporting_observations: string[];
  recommended_action: string;
  severity: "critical" | "warning" | "info";
}

export default function PredictionEnginePage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [mitigatingIndex, setMitigatingIndex] = useState<number | null>(null);
  const [mitigationProgress, setMitigationProgress] = useState<string>("");
  const [mitigationSuccess, setMitigationSuccess] = useState<boolean>(false);
  const [mitigatedPredictions, setMitigatedPredictions] = useState<Record<number, boolean>>({});

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPredictions();
      setPredictions(data);
    } catch (e) {
      console.error("Failed to load predictions", e);
      setError("Unable to communicate with the prediction forecasting engine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleMitigate = (idx: number, pred: Prediction) => {
    setMitigatingIndex(idx);
    setMitigationSuccess(false);
    setMitigationProgress("Initializing Hindsight memory traceback...");

    // Sequence of simulated actions to show agent capability
    setTimeout(() => {
      setMitigationProgress(`Inspecting bank evidence for '${pred.service}'...`);
      setTimeout(() => {
        setMitigationProgress("Applying recommended preventative playbook: " + pred.recommended_action.slice(0, 45) + "...");
        setTimeout(() => {
          setMitigationProgress("Verifying system health metrics...");
          setTimeout(() => {
            setMitigationSuccess(true);
            setMitigatedPredictions(prev => ({ ...prev, [idx]: true }));
            setMitigatingIndex(null);
          }, 800);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const getSeverityStyles = (severity: string, isMitigated: boolean) => {
    if (isMitigated) {
      return {
        bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
        pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
        borderTop: "border-emerald-500",
        text: "text-emerald-600"
      };
    }
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-50 border-red-200 text-red-800",
          pill: "bg-red-100 text-red-800 border-red-200",
          borderTop: "border-red-500",
          text: "text-red-600"
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          pill: "bg-amber-100 text-amber-800 border-amber-200",
          borderTop: "border-amber-500",
          text: "text-amber-600"
        };
      default:
        return {
          bg: "bg-blue-50 border-blue-200 text-blue-800",
          pill: "bg-blue-100 text-blue-800 border-blue-200",
          borderTop: "border-blue-500",
          text: "text-blue-600"
        };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Prediction Engine
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Anticipate system failures, scale resources, and run automated playbooks based on Hindsight memory signals.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-accent text-foreground transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Forecasts
        </button>
      </div>

      {/* Top Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Risk Vectors Tracked</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-foreground">{predictions.length}</span>
            <span className="text-xs text-primary font-medium">Active</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Highest Probability</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-destructive">
              {predictions.length > 0 ? Math.max(...predictions.map(p => p.probability)) : 0}%
            </span>
            <span className="text-xs text-destructive font-medium">Critical</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Mitigated Risks Today</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600">
              {Object.keys(mitigatedPredictions).length}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Auto-healed</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Hindsight Accuracy</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-indigo-600">94.8%</span>
            <span className="text-xs text-muted-foreground font-medium">Feedback loop</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: Live Prediction Cards */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Enterprise Risk Forecast Feed
            </h2>
            <span className="text-xs text-muted-foreground font-mono">Real-time telemetry</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 bg-card border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-center">
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={fetchPredictions}
                className="mt-4 px-4 py-1.5 text-xs font-semibold bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all"
              >
                Retry Connection
              </button>
            </div>
          ) : predictions.length === 0 ? (
            <div className="p-8 bg-card border border-border rounded-xl text-center text-muted-foreground">
              No active anomalies identified. System is highly stable.
            </div>
          ) : (
            <div className="space-y-5">
              {predictions.map((pred, idx) => {
                const isMitigated = mitigatedPredictions[idx];
                const prob = isMitigated ? 8 : pred.probability;
                const styles = getSeverityStyles(pred.severity, isMitigated);
                
                return (
                  <div
                    key={idx}
                    className="relative bg-card border border-border rounded-xl p-6 transition-all duration-300 hover:shadow-sm overflow-hidden"
                  >
                    {/* Top Accent Strip */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isMitigated ? 'from-emerald-500 to-teal-500' : pred.severity === 'critical' ? 'from-red-500 to-rose-600' : pred.severity === 'warning' ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-indigo-500'}`} />

                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <span className={`text-[10px] font-mono font-extrabold px-3 py-1 rounded-full border tracking-wide uppercase ${styles.pill}`}>
                        {isMitigated ? "MITIGATED" : pred.severity.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <Server className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Bank: {pred.service.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-5">
                      <h3 className="text-lg font-bold text-foreground leading-snug">
                        {pred.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        Expected: {pred.expected_time}
                      </p>
                    </div>

                    {/* Probability & Evidence dials */}
                    <div className="grid grid-cols-2 gap-6 py-4 border-t border-b border-border my-4 bg-muted/30 px-4 rounded-lg">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-muted-foreground block font-bold">Failure Probability</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-2xl font-extrabold font-mono ${isMitigated ? 'text-emerald-600' : pred.severity === 'critical' ? 'text-destructive' : 'text-amber-600'}`}>
                            {prob}%
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">confidence</span>
                        </div>
                        {/* Mini Progress Bar */}
                        <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isMitigated ? 'bg-emerald-500' : pred.severity === 'critical' ? 'bg-destructive' : 'bg-amber-500'}`}
                            style={{ width: `${prob}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-muted-foreground block font-bold">Historical Evidence</span>
                        <span className="text-2xl font-extrabold text-foreground font-mono">{pred.evidence_count}</span>
                        <span className="text-xs text-muted-foreground ml-1.5 font-medium">resolved events</span>
                      </div>
                    </div>

                    {/* Expandable Supporting Observations */}
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all font-mono py-1"
                      >
                        {expandedIndex === idx ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span>{expandedIndex === idx ? "Hide" : "Show"} Supporting Observations ({pred.supporting_observations.length})</span>
                      </button>

                      {expandedIndex === idx && (
                        <div className="mt-3 space-y-2.5 p-3.5 bg-muted/40 rounded-lg border border-border animate-fade-in">
                          {pred.supporting_observations.map((obs, oIdx) => (
                            <div key={oIdx} className="flex gap-2.5 items-start text-xs text-muted-foreground leading-relaxed font-mono">
                              <span className="text-muted-foreground select-none">↳</span>
                              <p>{obs}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preventative Action Card Section */}
                    <div className="mt-5 space-y-3 pt-4 border-t border-border">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground font-bold block">Recommended Preventative Action</span>
                      <div className="text-xs text-foreground font-mono bg-muted/50 border border-border p-4 rounded-lg leading-relaxed relative overflow-hidden group">
                        {pred.recommended_action}
                      </div>

                      {/* Interactive Playbook Mitigate Trigger */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {isMitigated ? "Playbook executed successfully" : "Manual review advised before auto-scaling"}
                        </span>
                        {isMitigated ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold font-mono bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>System Restored</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleMitigate(idx, pred)}
                            disabled={mitigatingIndex !== null}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/95 disabled:opacity-50 text-primary-foreground font-mono text-xs rounded-lg font-semibold transition-all shadow-sm active:scale-95"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            Execute Proactive Playbook
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: High-quality SRE comparison & Interactive mitigation logger */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Mitigation Pipeline Logs */}
          {mitigatingIndex !== null && (
            <div className="bg-card border border-primary/30 rounded-xl p-5 shadow-md space-y-4 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-pulse" />
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary animate-spin" />
                Mitigation Action Console
              </h3>
              <div className="bg-muted border border-border p-3.5 rounded-lg font-mono text-[11px] text-foreground space-y-2 h-36 overflow-y-auto">
                <div className="text-primary">[SYSTEM] Triggering proactive auto-scale daemon</div>
                <div className="text-muted-foreground">{mitigationProgress}</div>
                {mitigationSuccess && (
                  <div className="text-emerald-600 font-bold">[SUCCESS] Service risk mitigated. Risk metric: 8%</div>
                )}
              </div>
            </div>
          )}

          {/* Traditional SRE vs. Memory-Backed SRE */}
          <div className="border border-border bg-card rounded-xl p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Operational Efficiency comparison
              </h3>
            </div>

            <div className="space-y-6">
              {/* Traditional */}
              <div className="bg-muted/30 border border-border p-4.5 rounded-lg space-y-4">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <h4 className="font-bold text-xs uppercase font-mono tracking-wider">Traditional Reactive Ops</h4>
                </div>
                
                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed font-mono">
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground opacity-60">00:00</span>
                    <p>Failure occurs. Alerts trigger checkout timeouts.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground opacity-60">00:15</span>
                    <p>On-call page triggers. Engineer opens laptop.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground opacity-60">01:00</span>
                    <p>Sifting through Kibana, hunting connection pool leak.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground opacity-60">02:10</span>
                    <p>Playbook applied. System recovery completes.</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground">DOWNTIME IMPACT</span>
                  <span className="font-bold text-muted-foreground">2h 10m (High Cost)</span>
                </div>
              </div>

              {/* Hindsight Predictive */}
              <div className="border border-primary/20 bg-primary/5 p-4.5 rounded-lg space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <h4 className="font-bold text-xs uppercase font-mono tracking-wider">Sentinel Forecasting</h4>
                  </div>
                  <Zap className="h-4.5 w-4.5 text-primary animate-pulse" />
                </div>
                
                <div className="space-y-2 text-xs text-foreground leading-relaxed font-mono">
                  <div className="flex items-start gap-2">
                    <span className="text-primary">T-12h</span>
                    <p>Hindsight identifies recurring pool saturation patterns.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">T-8h</span>
                    <p>Risk probability rises to 87% based on temporal signals.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">T-30m</span>
                    <p>Playbook auto-scales Redis connections & flushes pool.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600">00:00</span>
                    <p className="text-emerald-700">Peak traffic load handled without single timeout.</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-center text-xs font-mono">
                  <span className="text-primary">DOWNTIME IMPACT</span>
                  <span className="font-bold text-emerald-600">0 Minutes (Zero Outage)</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
