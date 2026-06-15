import { AlertCircle, History, BookOpen, BrainCircuit, Lightbulb, TrendingUp } from "lucide-react";

export interface TimelineEventProps {
  event_type: "INCIDENT_CREATED" | "MEMORY_RETAINED" | "MEMORY_RECALLED" | "REFLECTION_GENERATED" | "OBSERVATION_CREATED" | "OBSERVATION_STRENGTHENED" | string;
  timestamp: string;
  title: string;
  description: string;
  confidence_score: number;
  related_incidents: number[];
}

export default function TimelineEventCard({ event }: { event: TimelineEventProps }) {
  const getEventIcon = () => {
    switch (event.event_type) {
      case "INCIDENT_CREATED":
        return <AlertCircle className="h-4.5 w-4.5 text-red-400" />;
      case "MEMORY_RETAINED":
        return <BookOpen className="h-4.5 w-4.5 text-emerald-400" />;
      case "MEMORY_RECALLED":
        return <History className="h-4.5 w-4.5 text-blue-400" />;
      case "REFLECTION_GENERATED":
        return <BrainCircuit className="h-4.5 w-4.5 text-violet-400" />;
      case "OBSERVATION_CREATED":
        return <Lightbulb className="h-4.5 w-4.5 text-yellow-400" />;
      case "OBSERVATION_STRENGTHENED":
        return <TrendingUp className="h-4.5 w-4.5 text-amber-500" />;
      default:
        return <History className="h-4.5 w-4.5 text-zinc-400" />;
    }
  };

  const getEventBorderClass = () => {
    switch (event.event_type) {
      case "INCIDENT_CREATED":
        return "border-red-500/20";
      case "MEMORY_RETAINED":
        return "border-emerald-500/20";
      case "MEMORY_RECALLED":
        return "border-blue-500/20";
      case "REFLECTION_GENERATED":
        return "border-violet-500/20";
      case "OBSERVATION_CREATED":
        return "border-yellow-500/20";
      case "OBSERVATION_STRENGTHENED":
        return "border-amber-500/20";
      default:
        return "border-border";
    }
  };

  return (
    <div className={`relative flex flex-col md:flex-row md:items-start space-y-2.5 md:space-y-0 md:space-x-5 border bg-card p-5 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.15)] ${getEventBorderClass()}`}>
      {/* Icon Badge */}
      <div className="flex items-center space-x-3 md:block">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-background border border-border">
          {getEventIcon()}
        </div>
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground bg-background border border-border px-2 py-0.5 rounded md:hidden">
          {event.event_type.replace("_", " ")}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <span className="hidden md:inline-block text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground bg-background border border-border px-2 py-0.5 rounded">
              {event.event_type.replace("_", " ")}
            </span>
            <h4 className="text-sm font-bold tracking-tight text-foreground">
              {event.title}
            </h4>
          </div>
          <span className="text-xs font-mono text-muted-foreground mt-1 sm:mt-0">
            {new Date(event.timestamp).toLocaleString()}
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {event.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-border/50 text-xs">
          <span className="text-muted-foreground font-mono">
            Confidence: <strong className="text-foreground">{(event.confidence_score * 100).toFixed(0)}%</strong>
          </span>
          {event.related_incidents && event.related_incidents.length > 0 && (
            <div className="flex items-center space-x-1.5 font-mono text-muted-foreground">
              <span>Related:</span>
              {event.related_incidents.map((id) => (
                <span key={id} className="px-1.5 py-0.2 bg-background border border-border text-primary rounded text-[10px]">
                  #{id}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
