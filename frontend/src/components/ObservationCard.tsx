import { Cpu, Award, FileText, CheckCircle } from "lucide-react";

export interface ObservationProps {
  title: string;
  description: string;
  evidence_count: number;
  confidence_score: number;
  related_incidents: number[];
  related_memories: string[];
  service: string;
}

export default function ObservationCard({ obs }: { obs: ObservationProps }) {
  return (
    <div className="relative group overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:border-primary/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-mono bg-background px-2.5 py-1 rounded-md border border-border">
            {obs.service.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center text-xs text-muted-foreground font-mono bg-background px-2.5 py-1 rounded-md border border-border">
            <Award className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            {(obs.confidence_score * 100).toFixed(0)}% Conf
          </span>
          <span className="flex items-center text-xs text-muted-foreground font-mono bg-background px-2.5 py-1 rounded-md border border-border">
            <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
            {obs.evidence_count} Case{obs.evidence_count !== 1 && "s"}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-base font-bold tracking-tight text-foreground leading-snug">
          {obs.title}
        </h4>
        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          {obs.description}
        </p>
      </div>

      {obs.related_incidents && obs.related_incidents.length > 0 && (
        <div className="mt-5">
          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Linked Database Incidents
          </span>
          <div className="flex flex-wrap gap-1.5">
            {obs.related_incidents.map((id) => (
              <span
                key={id}
                className="px-2 py-0.5 text-xs font-mono bg-background text-primary border border-border rounded hover:border-primary/30 transition-colors"
              >
                #{id}
              </span>
            ))}
          </div>
        </div>
      )}

      {obs.related_memories && obs.related_memories.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border">
          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">
            Supporting Recollections
          </span>
          <ul className="space-y-2">
            {obs.related_memories.map((mem, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex items-start space-x-2 leading-relaxed">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{mem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
