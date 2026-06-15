import type { LucideIcon } from "lucide-react";

interface MemoryStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  borderColor?: string;
}

export default function MemoryStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  borderColor = "border-border"
}: MemoryStatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.2)] ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1.5">
            {value}
          </h3>
        </div>
        <div className={`p-2.5 rounded-lg bg-background border border-border ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {subtitle && (
        <p className="mt-2.5 text-xs text-muted-foreground font-mono">
          {subtitle}
        </p>
      )}
    </div>
  );
}
