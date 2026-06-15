import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Link } from "react-router-dom";
import { Terminal, ArrowRight, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";

export default function AnalysisPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const data = await api.getIncidents();
        setIncidents(data);
      } catch (err: any) {
        setError("Failed to retrieve incidents for analysis workspace.");
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Incident Analysis Directory</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select any operational incident below to launch its dedicated Hindsight recall, reflection, and Groq intelligence workspace.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-mono flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center h-[30vh] space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="text-xs font-mono text-muted-foreground animate-pulse">Loading Workspace Directory...</span>
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center">
          <Terminal className="mx-auto h-10 w-10 text-muted-foreground opacity-40 mb-4" />
          <h3 className="text-md font-bold tracking-tight mb-2">No Incidents Available</h3>
          <p className="text-sm text-muted-foreground font-mono leading-relaxed mb-6">
            Please report an incident in the Command Center or run the seeding script to populate incidents for analysis.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase bg-primary text-white hover:bg-blue-600 rounded-lg transition-colors"
          >
            Go to Command Center
          </Link>
        </div>
      ) : (
        <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {incidents.map((incident) => {
              const isResolved = incident.status.toLowerCase() === "resolved";
              return (
                <div 
                  key={incident.id} 
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition-colors gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        #{incident.id}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md border ${
                        incident.severity.toLowerCase() === "critical"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono bg-slate-100 px-2 py-0.5 rounded border border-border">
                        {incident.service}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {incident.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      {incident.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {isResolved ? (
                      <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        RESOLVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-red-500 font-medium animate-pulse">
                        <ShieldAlert className="h-4 w-4 mr-1" />
                        ACTIVE
                      </span>
                    )}

                    <Link
                      to={`/investigate/${incident.id}`}
                      className="inline-flex items-center px-4.5 py-2 text-xs font-mono font-bold tracking-wider uppercase border border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg transition-colors"
                    >
                      Open Workspace <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
