import { Activity, Shield, AlertTriangle, Cpu } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Sentinel Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time incident intelligence and persistent memory state.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "System Status", value: "Healthy", desc: "All systems operational", icon: Shield, color: "text-emerald-500" },
          { label: "Active Incidents", value: "0", desc: "No active critical issues", icon: AlertTriangle, color: "text-amber-500" },
          { label: "Memory Nodes", value: "1,248", desc: "Persistent context active", icon: Cpu, color: "text-violet-500" },
          { label: "Analysis Queue", value: "Idle", desc: "No pending jobs", icon: Activity, color: "text-sky-500" },
        ].map((card, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-zinc-400">{card.label}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <p className="text-xs text-zinc-500 mt-1">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Main section grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Recent Incident Logs</h2>
          <div className="h-[200px] flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
            No recent incidents recorded in this session.
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Memory Accumulation</h2>
          <div className="h-[200px] flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
            No memories loaded yet. Connect Hindsight in Phase 2.
          </div>
        </div>
      </div>
    </div>
  );
}
