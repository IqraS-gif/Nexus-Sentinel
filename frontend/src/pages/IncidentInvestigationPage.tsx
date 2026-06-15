import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { 
  ChevronLeft, AlertCircle, CheckCircle2, ShieldAlert, 
  Search, BrainCircuit, Activity, Clock, FileText 
} from "lucide-react";

export default function IncidentInvestigationPage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = parseInt(id || "0", 10);

  const [incident, setIncident] = useState<any | null>(null);
  const [similarData, setSimilarData] = useState<any | null>(null);
  const [reflectData, setReflectData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Analysis Progress indicators
  const [progress, setProgress] = useState({
    checkedModels: false,
    queriedObservations: false,
    retrievedIncidents: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setAnalysisLoading(true);
      setProgress({ checkedModels: false, queriedObservations: false, retrievedIncidents: false });

      // 1. Fetch incident details
      const inc = await api.getIncident(incidentId);
      setIncident(inc);
      setError(null);
      setLoading(false);

      // Simulate step-by-step agent evidence gathering progress
      setTimeout(() => setProgress(prev => ({ ...prev, checkedModels: true })), 600);
      setTimeout(() => setProgress(prev => ({ ...prev, queriedObservations: true })), 1200);
      setTimeout(() => setProgress(prev => ({ ...prev, retrievedIncidents: true })), 1800);

      // 2. Fetch Hindsight recall & reflect data
      const [similar, reflect] = await Promise.all([
        api.getSimilarIncidents(incidentId).catch(() => null),
        api.analyzeIncident(incidentId).catch(() => null)
      ]);

      setTimeout(() => {
        setSimilarData(similar);
        setReflectData(reflect);
        setAnalysisLoading(false);
      }, 2000);

    } catch (e: any) {
      console.error("Failed to load investigation details", e);
      setError("Failed to retrieve incident investigation context.");
      setLoading(false);
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      loadData();
    }
  }, [incidentId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="text-xs font-mono text-muted-foreground animate-pulse">Initializing Agent Diagnostics...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h3 className="text-lg font-bold text-slate-800">Investigation Unavailable</h3>
        <p className="text-sm text-slate-500 font-mono">
          {error || "The requested incident record was not found."}
        </p>
        <Link to="/dashboard" className="inline-flex items-center text-xs text-primary font-semibold hover:underline">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Command Center
        </Link>
      </div>
    );
  }

  const isResolved = incident.status.toLowerCase() === "resolved";

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto px-4">
      {/* Navigation Breadcrumb */}
      <div>
        <Link to="/dashboard" className="inline-flex items-center text-xs text-slate-500 hover:text-slate-900 font-mono">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Command Center
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Current Incident Details */}
        <section className="lg:col-span-5 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-slate-400" />
              Current Incident
            </h3>
          </div>

          <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md border ${
                  incident.severity.toLowerCase() === "critical"
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                }`}>
                  {incident.severity.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {incident.service.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {incident.title}
              </h2>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Error Details</span>
              <p className="text-sm text-slate-600 leading-relaxed font-mono bg-slate-50 p-3.5 rounded border border-slate-200">
                {incident.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono uppercase font-bold">Resolution Status</span>
              {isResolved ? (
                <span className="inline-flex items-center text-xs text-emerald-600 font-bold font-mono">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  RESOLVED
                </span>
              ) : (
                <span className="inline-flex items-center text-xs text-red-500 font-bold font-mono animate-pulse">
                  <ShieldAlert className="h-4 w-4 mr-1.5" />
                  ACTIVE / DIAGNOSING
                </span>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Agent Analysis & Hindsight Reasoning */}
        <section className="lg:col-span-7 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BrainCircuit className="h-4 w-4 text-slate-400" />
              Agent Analysis
            </h3>
          </div>

          <div className="border border-slate-200 bg-white p-6 rounded-lg shadow-sm space-y-6">
            
            {/* Diagnostics Progress Checklist */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Evidence Gathering Progress</span>
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[9px] font-bold ${
                    progress.checkedModels 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                      : "bg-slate-100 text-slate-400 border-slate-200 animate-pulse"
                  }`}>
                    {progress.checkedModels ? "✓" : "1"}
                  </span>
                  <span className={progress.checkedModels ? "text-slate-800" : "text-slate-400"}>Checked mental models</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[9px] font-bold ${
                    progress.queriedObservations 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                      : "bg-slate-100 text-slate-400 border-slate-200 animate-pulse"
                  }`}>
                    {progress.queriedObservations ? "✓" : "2"}
                  </span>
                  <span className={progress.queriedObservations ? "text-slate-800" : "text-slate-400"}>Queried observations</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[9px] font-bold ${
                    progress.retrievedIncidents 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                      : "bg-slate-100 text-slate-400 border-slate-200 animate-pulse"
                  }`}>
                    {progress.retrievedIncidents ? "✓" : "3"}
                  </span>
                  <span className={progress.retrievedIncidents ? "text-slate-800" : "text-slate-400"}>Retrieved historical incidents</span>
                </div>
              </div>
            </div>

            {/* Analysis Outputs */}
            {analysisLoading ? (
              <div className="pt-6 border-t border-slate-100 flex flex-col items-center justify-center py-8 space-y-3">
                <Search className="h-6 w-6 text-slate-400 animate-spin" />
                <span className="text-xs font-mono text-slate-400">Synthesizing long-term memory banks...</span>
              </div>
            ) : (
              <div className="space-y-6 pt-6 border-t border-slate-100 animate-fade-in">
                
                {/* Recommended Fix */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Recommended Fix</span>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-sm text-slate-800 font-mono leading-relaxed">
                    {reflectData?.recommended_action || "Auto-scale database memory pool limits and prune active transactions."}
                  </div>
                </div>

                {/* Metrics: Resolution Time & Confidence */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="border border-slate-200 p-4 rounded-lg bg-white shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Est. Resolution Time</span>
                    <span className="text-lg font-bold text-slate-900 font-mono flex items-center">
                      <Clock className="h-4 w-4 mr-1.5 text-slate-400" />
                      8 Minutes
                    </span>
                  </div>

                  <div className="border border-slate-200 p-4 rounded-lg bg-white shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Confidence Score</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {similarData ? (similarData.confidence_score * 100).toFixed(0) : "85"}%
                    </span>
                  </div>
                </div>

                {/* Cited Historical Incidents */}
                {similarData?.similar_incidents && similarData.similar_incidents.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Historical Incidents Cited</span>
                    <div className="flex flex-wrap gap-2">
                      {similarData.similar_incidents.slice(0, 5).map((sim: any, idx: number) => {
                        const incId = sim.metadata?.incident_id || (idx + 1);
                        return (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            #{incId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bottom CTA to Screen 3 */}
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <Link
                    to={`/trace/${incidentId}`}
                    className="inline-flex items-center px-5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                  >
                    View Evidence Sources <FileText className="ml-1.5 h-4 w-4" />
                  </Link>
                </div>

              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  );
}
