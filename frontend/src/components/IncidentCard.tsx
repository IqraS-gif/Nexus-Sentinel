import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react";

export interface IncidentProps {
  id: number;
  title: string;
  description: string;
  service: string;
  severity: "low" | "medium" | "high" | "critical" | string;
  status: "active" | "resolved" | string;
  created_at: string;
}

export default function IncidentCard({ incident }: { incident: IncidentProps }) {
  const isResolved = incident.status.toLowerCase() === "resolved";

  const getSeverityStyles = () => {
    switch (incident.severity.toLowerCase()) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "medium":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-xl border border-border bg-card hover:bg-card/80 p-5 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <span className={`px-2 py-0.5 text-xs font-mono font-semibold rounded-md border ${getSeverityStyles()}`}>
            {incident.severity.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground font-mono bg-background px-2 py-0.5 rounded border border-border">
            {incident.service}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {isResolved ? (
            <span className="flex items-center text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-4.5 w-4.5 mr-1" />
              RESOLVED
            </span>
          ) : (
            <span className="flex items-center text-xs text-red-400 font-medium animate-pulse">
              <AlertCircle className="h-4.5 w-4.5 mr-1" />
              ACTIVE
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-md font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
          {incident.title}
        </h4>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {incident.description}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-1.5 font-mono">
          <Clock className="h-3.5 w-3.5" />
          <span>{new Date(incident.created_at).toLocaleString()}</span>
        </div>

        <Link
          to={`/incidents/${incident.id}`}
          className="flex items-center font-semibold text-primary hover:text-blue-400 hover:underline"
        >
          Analysis Workspace
          <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
