import { useState } from "react";
import { api } from "@/services/api";
import ReportCard from "@/components/ReportCard";
import { 
  PlayCircle, AlertTriangle, MemoryStick as MemoryIcon, History, 
  BrainCircuit, Sparkles, ChevronRight, CheckCircle2, RefreshCw 
} from "lucide-react";

export default function DemoExperiencePage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [demoIncident, setDemoIncident] = useState<any | null>(null);
  const [retainedData, setRetainedData] = useState<any | null>(null);
  const [recalledData, setRecalledData] = useState<any | null>(null);
  const [reflectedData, setReflectedData] = useState<any | null>(null);
  const [observationsData, setObservationsData] = useState<any | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);

  const steps = [
    { number: 1, label: "Incident Creation", icon: AlertTriangle },
    { number: 2, label: "Memory Retention", icon: MemoryIcon },
    { number: 3, label: "Memory Recall", icon: History },
    { number: 4, label: "Reflection", icon: BrainCircuit },
    { number: 5, label: "Observation Formation", icon: RefreshCw },
    { number: 6, label: "Intelligence Report", icon: Sparkles }
  ];

  // Action Handlers
  const handleStep1 = async () => {
    try {
      setLoading(true);
      const res = await api.createIncident({
        title: "Database connection spike on auth service",
        description: "Postgres connection pool exhausted on pg_bouncer during login spike. Response times degraded to >5000ms.",
        service: "database",
        severity: "critical"
      });
      setDemoIncident(res);
      setCurrentStep(2);
    } catch (err: any) {
      alert(`Failed to create incident: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!demoIncident) return;
    try {
      setLoading(true);
      // Resolve the incident first
      await api.resolveIncident(
        demoIncident.id, 
        "Scaled pg_bouncer max_client_conn limit from 100 to 500 and recycled auth-service instances."
      );
      // Retain in Hindsight long term memory bank
      const res = await api.retainIncident(demoIncident.id);
      setRetainedData(res);
      setCurrentStep(3);
    } catch (err: any) {
      alert(`Memory retention failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (!demoIncident) return;
    try {
      setLoading(true);
      const res = await api.getSimilarIncidents(demoIncident.id);
      setRecalledData(res);
      setCurrentStep(4);
    } catch (err: any) {
      alert(`Memory recall failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStep4 = async () => {
    if (!demoIncident) return;
    try {
      setLoading(true);
      const res = await api.analyzeIncident(demoIncident.id);
      setReflectedData(res);
      setCurrentStep(5);
    } catch (err: any) {
      alert(`Reflection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStep5 = async () => {
    try {
      setLoading(true);
      const res = await api.generateObservations();
      setObservationsData(res);
      setCurrentStep(6);
    } catch (err: any) {
      alert(`Observation consolidation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStep6 = async () => {
    if (!demoIncident) return;
    try {
      setLoading(true);
      const res = await api.getIncidentReport(demoIncident.id);
      setReportData(res);
    } catch (err: any) {
      alert(`Report compilation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setDemoIncident(null);
    setRetainedData(null);
    setRecalledData(null);
    setReflectedData(null);
    setObservationsData(null);
    setReportData(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Interactive Learning Journey</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Experience how Nexus Sentinel builds long-term operational memory, recalls past experiences, and refines recommendations.
          </p>
        </div>
        {(currentStep > 1 || demoIncident) && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase border border-border bg-card rounded-lg hover:bg-card/85 transition-colors"
          >
            Reset Flow
          </button>
        )}
      </div>

      {/* Progress Wizard Header */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.number;
          const isCompleted = currentStep > s.number;
          return (
            <div 
              key={s.number}
              className={`p-3.5 border rounded-xl flex flex-col items-center justify-center text-center space-y-2 transition-all duration-300 ${
                isActive 
                  ? "bg-primary/10 border-primary text-foreground" 
                  : isCompleted
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                  : "bg-card border-border text-muted-foreground opacity-60"
              }`}
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-background border border-border">
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className="text-[10px] font-mono tracking-wider font-bold uppercase">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.3)]">
        {loading && (
          <div className="flex flex-col justify-center items-center h-[200px] space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="text-xs font-mono text-muted-foreground animate-pulse">Running Backend Operation...</span>
          </div>
        )}

        {!loading && currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Step 1: Simulate Live System Disruption</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-mono">
              In real production, Prometheus or an engineer fires an incident event. In this step, we will POST a new critical incident payload to the database. This represents the starting point of our learning loop.
            </p>
            <div className="border border-border bg-background rounded-lg p-4 font-mono text-xs text-muted-foreground">
              <span className="text-emerald-400 font-semibold">POST</span> /api/v1/incidents/
              <pre className="mt-2 text-foreground overflow-x-auto">
{`{
  "title": "Database connection spike on auth service",
  "description": "Postgres connection pool exhausted on pg_bouncer during login spike. Response times degraded to >5000ms.",
  "service": "database",
  "severity": "critical"
}`}
              </pre>
            </div>
            <button
              onClick={handleStep1}
              className="inline-flex items-center px-5 py-3 text-xs font-mono font-bold tracking-wider uppercase rounded-lg bg-primary text-foreground hover:bg-blue-600 border border-primary/50 transition-colors"
            >
              <PlayCircle className="mr-2 h-4 w-4" /> Trigger Incident Event
            </button>
          </div>
        )}

        {!loading && currentStep === 2 && demoIncident && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <MemoryIcon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Step 2: Memory Retention</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-mono">
              An engineer resolves the incident and writes down the resolution. The Incident Service then commits the incident metadata and resolution to Hindsight's vector database as a long-term memory bank fact.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border bg-background rounded-lg p-4 font-mono text-xs">
                <span className="text-muted-foreground block mb-2 font-semibold">Created Incident JSON:</span>
                <pre className="text-foreground overflow-x-auto">{JSON.stringify(demoIncident, null, 2)}</pre>
              </div>
              <div className="border border-border bg-background rounded-lg p-4 font-mono text-xs">
                <span className="text-muted-foreground block mb-2 font-semibold">Retain Endpoint Payload:</span>
                <span className="text-emerald-400">POST</span> /api/v1/memory/retain/{demoIncident.id}
                <pre className="mt-2 text-foreground overflow-x-auto">
{`{
  "resolution": "Scaled pg_bouncer max_client_conn limit from 100 to 500 and recycled auth-service instances."
}`}
                </pre>
              </div>
            </div>
            <button
              onClick={handleStep2}
              className="inline-flex items-center px-5 py-3 text-xs font-mono font-bold tracking-wider uppercase rounded-lg bg-emerald-500 text-foreground hover:bg-emerald-600 border border-emerald-500/50 transition-colors"
            >
              Resolve & Retain in Memory <ChevronRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                <History className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Step 3: Memory Recall</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-mono">
              When an incident is active, we ask Hindsight Cloud to recall similar experiences from our memory banks. Here, we fetch structured evidence of past incidents matching the context.
            </p>
            <div className="border border-border bg-background rounded-lg p-4 font-mono text-xs">
              <span className="text-emerald-400">POST</span> /api/v1/incidents/{demoIncident?.id}/similar
              {retainedData && (
                <div className="mt-3 text-emerald-400">
                  Memory Retention Success: {JSON.stringify(retainedData)}
                </div>
              )}
            </div>
            <button
              onClick={handleStep3}
              className="inline-flex items-center px-5 py-3 text-xs font-mono font-bold tracking-wider uppercase rounded-lg bg-blue-500 text-foreground hover:bg-blue-600 border border-blue-500/50 transition-colors"
            >
              Query Hindsight Similarities <ChevronRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && currentStep === 4 && recalledData && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Step 4: Reflection</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-mono">
              Using the recalled similar memories, Nexus Sentinel runs a reflection operation (`client.reflect()`) to generate deep reasoning and a recommended action with confidence scores.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border bg-background rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[250px]">
                <span className="text-muted-foreground block mb-2 font-semibold">Recalled Evidence Response:</span>
                <pre className="text-foreground">{JSON.stringify(recalledData, null, 2)}</pre>
              </div>
              <div className="border border-border bg-background rounded-lg p-4 font-mono text-xs">
                <span className="text-muted-foreground block mb-2 font-semibold">Reflection Request:</span>
                <span className="text-emerald-400">POST</span> /api/v1/incidents/{demoIncident?.id}/analyze
              </div>
            </div>
            <button
              onClick={handleStep4}
              className="inline-flex items-center px-5 py-3 text-xs font-mono font-bold tracking-wider uppercase rounded-lg bg-violet-500 text-foreground hover:bg-violet-600 border border-violet-500/50 transition-colors"
            >
              Analyze & Reflect <ChevronRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && currentStep === 5 && reflectedData && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Step 5: Observation Formation</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-mono">
              Over time, multiple recollections compile into high-confidence long-term system observations. We query Hindsight database to consolidate similar patterns and register recurring observations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border bg-background rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[250px]">
                <span className="text-muted-foreground block mb-2 font-semibold">Reflection Reasoning Output:</span>
                <pre className="text-foreground">{JSON.stringify(reflectedData, null, 2)}</pre>
              </div>
              <div className="border border-border bg-background rounded-lg p-4 font-mono text-xs">
                <span className="text-muted-foreground block mb-2 font-semibold">Consolidation Request:</span>
                <span className="text-emerald-400">POST</span> /api/v1/observations/generate
              </div>
            </div>
            <button
              onClick={handleStep5}
              className="inline-flex items-center px-5 py-3 text-xs font-mono font-bold tracking-wider uppercase rounded-lg bg-amber-500 text-foreground hover:bg-amber-600 border border-amber-500/50 transition-colors"
            >
              Consolidate Observations <ChevronRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && currentStep === 6 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Step 6: Intelligence Report</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-mono">
              Finally, we feed the raw incident metadata, recalled experiences, reflection reasoning, and consolidated observations into Groq. Groq builds a structured, executive-grade analysis with root cause assessments.
            </p>
            <div className="border border-border bg-background rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[200px]">
              <span className="text-muted-foreground block mb-2 font-semibold">Observations Formed:</span>
              <pre className="text-foreground">{JSON.stringify(observationsData, null, 2)}</pre>
            </div>
            
            {reportData ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-mono flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <span>Interactive learning journey completed! The full incident intelligence report is displayed below:</span>
                </div>
                <ReportCard report={reportData.report} />
              </div>
            ) : (
              <button
                onClick={handleStep6}
                className="inline-flex items-center px-5 py-3 text-xs font-mono font-bold tracking-wider uppercase rounded-lg bg-primary text-foreground hover:bg-blue-600 border border-primary/50 transition-colors"
              >
                Compile Executive Report
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
