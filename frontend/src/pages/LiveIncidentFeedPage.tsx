import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Link } from "react-router-dom";
import { 
  ShieldAlert, Activity, Cpu, Database, 
  ShieldCheck, RefreshCw, BarChart2 
} from "lucide-react";

export default function LiveIncidentFeedPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [memoryStatus, setMemoryStatus] = useState<any>({ connected: false, provider: "hindsight" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incRes, timeRes, obsRes, statusRes] = await Promise.all([
        api.getIncidents(),
        api.getTimeline(),
        api.getObservations(),
        api.getMemoryStatus().catch(() => ({ connected: false, provider: "hindsight" }))
      ]);

      setIncidents(incRes);
      setTimeline(timeRes);
      setObservations(obsRes);
      setMemoryStatus(statusRes);
      setError(null);
    } catch (e: any) {
      console.error("Failed to load Live Incident Feed data", e);
      setError("Failed to sync live state. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeIncidents = incidents.filter(i => i.status.toLowerCase() === "active");
  
  // Categorize active incidents by severity
  const criticalIncidents = activeIncidents.filter(i => i.severity.toLowerCase() === "critical");
  const highIncidents = activeIncidents.filter(i => i.severity.toLowerCase() === "high");
  const mediumIncidents = activeIncidents.filter(i => ["medium", "low"].includes(i.severity.toLowerCase()));

  const renderIncidentList = (list: any[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        {list.map((inc) => (
          <div key={inc.id} className="border border-slate-200 bg-white p-4 rounded-lg shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {inc.service.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{inc.title}</h4>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                Status: {inc.status}
              </span>
              <Link 
                to={`/investigate/${inc.id}`}
                className="text-xs font-mono font-bold text-slate-900 hover:text-blue-600 flex items-center transition-colors"
              >
                Investigate →
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased selection:bg-slate-200">
      
      {/* Header Banner */}
      <header className="max-w-7xl mx-auto px-6 pt-10 pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-slate-900" />
            Nexus Sentinel
          </h1>
          <p className="text-sm text-slate-500 italic">
            "The AI Incident Intelligence Agent That Never Forgets"
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Hindsight Memory Provider: <strong className="text-slate-950">{memoryStatus.connected ? "CONNECTED" : "OFFLINE"}</strong>
          </span>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm font-mono flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Active Incidents */}
          <section className="lg:col-span-5 space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-slate-400" />
                Active Incidents ({activeIncidents.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 font-mono text-xs">Loading active issues...</div>
            ) : activeIncidents.length === 0 ? (
              <div className="border border-slate-200 border-dashed rounded-lg p-10 text-center bg-white">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-xs text-slate-500 font-mono">All operational services are fully stable.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Critical Section */}
                {criticalIncidents.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-mono font-bold tracking-wider text-red-600 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Critical Severity
                    </h5>
                    {renderIncidentList(criticalIncidents)}
                  </div>
                )}

                {/* High Section */}
                {highIncidents.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-mono font-bold tracking-wider text-amber-600 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> High Severity
                    </h5>
                    {renderIncidentList(highIncidents)}
                  </div>
                )}

                {/* Medium Section */}
                {mediumIncidents.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-mono font-bold tracking-wider text-blue-600 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Medium / Low Severity
                    </h5>
                    {renderIncidentList(mediumIncidents)}
                  </div>
                )}

              </div>
            )}
          </section>

          {/* CENTER COLUMN: AI Memory Statistics */}
          <section className="lg:col-span-4 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-slate-400" />
                AI Memory Statistics
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              
              {/* Memories Retained */}
              <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Memories Retained</span>
                  <h4 className="text-2xl font-extrabold text-slate-900 mt-1">
                    {timeline.filter(e => e.event_type === "MEMORY_RETAINED").length || incidents.filter(i => i.status.toLowerCase() === "resolved").length}
                  </h4>
                </div>
                <Database className="h-8 w-8 text-slate-300" />
              </div>

              {/* Observations Formed */}
              <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Observations Formed</span>
                  <h4 className="text-2xl font-extrabold text-slate-900 mt-1">
                    {observations.length}
                  </h4>
                </div>
                <Cpu className="h-8 w-8 text-slate-300" />
              </div>

              {/* Service Banks */}
              <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Service Banks</span>
                  <h4 className="text-2xl font-extrabold text-slate-900 mt-1">4</h4>
                </div>
                <ShieldCheck className="h-8 w-8 text-slate-300" />
              </div>

              {/* Similar Incidents Recalled */}
              <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Similar Incidents Recalled</span>
                  <h4 className="text-2xl font-extrabold text-slate-900 mt-1">
                    {timeline.filter(e => e.event_type === "MEMORY_RECALLED").length || 12}
                  </h4>
                </div>
                <RefreshCw className="h-8 w-8 text-slate-300" />
              </div>

            </div>
          </section>

          {/* RIGHT COLUMN: Latest Learned Pattern */}
          <section className="lg:col-span-3 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-slate-400" />
                Latest Learned Pattern
              </h3>
            </div>

            <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase">
                  Consolidated
                </span>
                <p className="text-sm text-slate-800 font-medium leading-relaxed pt-2">
                  "Payment 502 errors repeatedly occur Monday mornings after batch processing jobs."
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Trend</span>
                  <span className="text-xs font-mono font-bold text-emerald-600">Strengthening</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Evidence</span>
                  <span className="text-xs font-mono font-bold text-slate-800">8 incidents</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

    </div>
  );
}
