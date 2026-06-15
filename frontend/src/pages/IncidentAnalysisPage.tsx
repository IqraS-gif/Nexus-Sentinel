import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { 
  AlertCircle, CheckCircle2, ChevronLeft, Sparkles, 
  HelpCircle, Info, CheckSquare, ShieldCheck, ChevronDown, ChevronUp 
} from "lucide-react";

export default function IncidentAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = parseInt(id || "0", 10);

  const [incident, setIncident] = useState<any | null>(null);
  const [similarData, setSimilarData] = useState<any | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolution Form State
  const [resolutionText, setResolutionText] = useState("");
  const [resolving, setResolving] = useState(false);

  // Collapsible state for raw memories
  const [showRawMemories, setShowRawMemories] = useState(false);

  const formatEvidenceText = (text: string) => {
    if (!text) return "";
    const index = text.indexOf("[{");
    if (index !== -1) {
      return text.substring(0, index).trim();
    }
    return text;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const inc = await api.getIncident(incidentId);
      setIncident(inc);

      if (inc.status.toLowerCase() === "resolved") {
        const [sim, rep] = await Promise.all([
          api.getSimilarIncidents(incidentId).catch(() => null),
          api.getIncidentReport(incidentId).catch(() => null)
        ]);
        setSimilarData(sim);
        setReportData(rep);
      }
      setError(null);
    } catch (e: any) {
      console.error("Failed to load analysis Workspace", e);
      setError("Failed to load incident workspace details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      loadData();
    }
  }, [incidentId]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionText.trim()) return;
    try {
      setResolving(true);
      // 1. Resolve incident in database
      await api.resolveIncident(incidentId, resolutionText);
      // 2. Retain incident in Hindsight long-term memory
      await api.retainIncident(incidentId);
      
      setResolutionText("");
      await loadData();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setReportLoading(true);
      const rep = await api.getIncidentReport(incidentId);
      setReportData(rep);
    } catch (err: any) {
      alert(`Report compilation failed: ${err.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="text-xs font-mono text-muted-foreground animate-pulse">Retrieving Executive Summary...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h3 className="text-lg font-bold text-slate-800">Report Unavailable</h3>
        <p className="text-sm text-slate-500 font-mono">
          {error || "The requested incident record was not found."}
        </p>
        <Link to="/analysis" className="inline-flex items-center text-xs text-primary font-semibold hover:underline">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Incident Directory
        </Link>
      </div>
    );
  }

  const isResolved = incident.status.toLowerCase() === "resolved";
  const report = reportData?.report;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto px-4">
      {/* Navigation Breadcrumb */}
      <div>
        <Link to="/analysis" className="inline-flex items-center text-xs text-slate-500 hover:text-slate-900 font-mono">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Incident Directory
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md border ${
                incident.severity.toLowerCase() === "critical"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              }`}>
                {incident.severity.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-border">
                {incident.service.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {incident.title}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {incident.description}
            </p>
          </div>

          <div className="flex-shrink-0">
            {isResolved ? (
              <span className="inline-flex items-center px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                RESOLVED
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase rounded-full bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                <AlertCircle className="h-4 w-4 mr-1.5" />
                ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RESOLUTION FLOW FOR ACTIVE INCIDENTS */}
      {!isResolved && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-100 pb-3">
            <HelpCircle className="h-5 w-5 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Resolve and Document Resolution
            </h3>
          </div>
          <form onSubmit={handleResolve} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 mb-1.5">
                Resolution Action Plan
              </label>
              <textarea
                required
                rows={4}
                placeholder="Specify the exact steps taken to fix the issue. This resolution content will be retained in the domain memory bank to assist in future failovers..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-slate-900 resize-none placeholder-slate-400"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={resolving}
                className="px-5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {resolving ? "Saving to Hindsight..." : "Resolve Incident"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONVERSATIONAL INTELLIGENCE REPORT (HERO SECTION) */}
      {isResolved && (
        <div className="space-y-8">
          
          {/* Missing report view */}
          {!report && !reportLoading && (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
              <Sparkles className="mx-auto h-8 w-8 text-slate-400 mb-3" />
              <h3 className="text-md font-bold text-slate-800 mb-1">Intelligence Report Not Compiled</h3>
              <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
                Generate a conversational report synthesized from past incidents and active memory collections.
              </p>
              <button
                onClick={handleGenerateReport}
                className="px-5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
              >
                Compile Report
              </button>
            </div>
          )}

          {/* Loading view */}
          {reportLoading && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="text-xs font-mono text-slate-500 animate-pulse">Generating Conversational Report...</span>
            </div>
          )}

          {/* Redesigned Report Layout */}
          {report && (
            <div className="space-y-6">
              
              {/* WHAT HAPPENED */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-slate-800">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                  <h3 className="font-bold text-base">What Happened?</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {report.executive_summary}
                </p>
              </div>

              {/* WHY DID IT HAPPEN */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-slate-800">
                  <Info className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-base">Why Did It Happen?</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {report.root_cause_analysis}
                </p>
              </div>

              {/* WHAT SHOULD WE DO NEXT */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-slate-800">
                  <CheckSquare className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-bold text-base">What Should We Do Next?</h3>
                </div>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 border border-slate-100 p-4 rounded-lg">
                  {report.recommended_actions}
                </div>
              </div>

              {/* HOW CONFIDENT ARE WE */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-slate-800">
                  <ShieldCheck className="h-5 w-5 text-violet-500" />
                  <h3 className="font-bold text-base">How Confident Are We?</h3>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 bg-slate-50 border border-slate-100 p-4 rounded-lg">
                  <div className="flex items-baseline space-x-1.5 shrink-0">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {similarData ? (similarData.confidence_score * 100).toFixed(0) : "75"}%
                    </span>
                    <span className="text-xs text-slate-500 font-mono">confidence</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {report.confidence_explanation || "Our confidence score aligns directly with semantic queries and incident logs stored in Hindsight."}
                  </p>
                </div>
              </div>

              {/* WHAT SIMILAR INCIDENTS WERE FOUND (SECONDARY) */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-slate-800">
                  <Sparkles className="h-5 w-5 text-slate-500" />
                  <h3 className="font-bold text-base">What Similar Incidents Were Found?</h3>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed">
                  {formatEvidenceText(report.supporting_evidence)}
                </p>

                {/* Collapsible raw memory list */}
                {similarData?.similar_incidents && similarData.similar_incidents.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setShowRawMemories(!showRawMemories)}
                      className="flex items-center space-x-1 text-xs font-mono text-slate-500 hover:text-slate-900 font-semibold focus:outline-none"
                    >
                      {showRawMemories ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          <span>Hide raw memory records</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          <span>View {similarData.similar_incidents.length} raw memory records</span>
                        </>
                      )}
                    </button>

                    {showRawMemories && (
                      <div className="mt-3 space-y-2.5 animate-fade-in">
                        {similarData.similar_incidents.map((sim: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-xs font-mono text-slate-600 leading-relaxed"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-blue-600">Type: {sim.type.toUpperCase()}</span>
                              {sim.metadata?.incident_id && (
                                <span className="text-[10px] text-slate-400">ID: #{sim.metadata.incident_id}</span>
                              )}
                            </div>
                            {sim.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
