import { useState, useEffect } from "react";
import { api } from "@/services/api";
import TimelineEventCard from "@/components/TimelineEventCard";
import { Calendar, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = async (service: string) => {
    try {
      setLoading(true);
      const data = await api.getTimeline(service === "all" ? undefined : service);
      setTimeline(data);
      setError(null);
    } catch (err: any) {
      setError("Failed to load timeline events. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline(selectedService);
  }, [selectedService]);

  const services = [
    { value: "all", label: "All Services" },
    { value: "payment", label: "Payment Service" },
    { value: "auth", label: "Auth Service" },
    { value: "database", label: "Database Service" },
    { value: "gateway", label: "Gateway Service" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Learning Timeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Chronological progression of sentinel operations, memory retention, and reflection checkpoints.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Link
            to="/observations"
            className="inline-flex items-center px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase border border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg transition-colors"
          >
            Discovered Patterns
          </Link>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary text-foreground"
          >
            {services.map((srv) => (
              <option key={srv.value} value={srv.value}>
                {srv.label}
              </option>
            ))}
          </select>
        </div>
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
          <span className="text-xs font-mono text-muted-foreground animate-pulse">Syncing Learning Logs...</span>
        </div>
      ) : timeline.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center max-w-2xl mx-auto">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground opacity-40 mb-4" />
          <h3 className="text-md font-bold tracking-tight mb-2">No Timeline Events</h3>
          <p className="text-sm text-muted-foreground font-mono leading-relaxed">
            There are no learning checkpoint logs recorded. Report and resolve incidents in the Command Center to begin building the learning graph.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 md:pl-8 border-l-2 border-border/60 ml-3 md:ml-4 space-y-8">
          {timeline.slice().reverse().map((ev, idx) => (
            <div key={idx} className="relative">
              {/* Bullet Point */}
              <span className="absolute -left-[32px] md:-left-[41px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background border-2 border-primary shadow-[0_0_12px_rgba(59,130,246,0.3)]" />
              <TimelineEventCard event={ev} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
