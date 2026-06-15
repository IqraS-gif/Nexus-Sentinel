import { useState, useEffect } from "react";
import { api } from "@/services/api";
import IncidentCard from "@/components/IncidentCard";
import MemoryStatCard from "@/components/MemoryStatCard";
import TimelineEventCard from "@/components/TimelineEventCard";
import { Activity, BookOpen, Cpu, ShieldAlert, Plus, Server } from "lucide-react";
import { Link } from "react-router-dom";

export default function CommandCenterPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [memoryStatus, setMemoryStatus] = useState<any>({ connected: false, provider: "hindsight" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newService, setNewService] = useState("payment");
  const [newSeverity, setNewSeverity] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

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
      console.error("Failed to load Command Center data", e);
      setError("Failed to fetch operational state. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    try {
      setSubmitting(true);
      await api.createIncident({
        title: newTitle,
        description: newDesc,
        service: newService,
        severity: newSeverity
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      await loadData();
    } catch (err: any) {
      alert(`Failed to report incident: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeed = async () => {
    try {
      setLoading(true);
      await api.seedMemory();
      await loadData();
      alert("Successfully seeded memories!");
    } catch (err: any) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        <span className="text-sm font-mono text-muted-foreground animate-pulse">Syncing Operational State...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Command Center</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time incident response and operational intelligence overview.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSeed}
            className="px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase border border-border bg-card rounded-lg hover:bg-card/80 transition-colors"
          >
            Seed DB & Memories
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-lg bg-primary text-foreground hover:bg-blue-600 border border-primary/50 transition-colors"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Report Incident
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-mono">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MemoryStatCard
          title="Active Incidents"
          value={incidents.filter(i => i.status.toLowerCase() === "active").length}
          subtitle="Awaiting engineering resolve"
          icon={ShieldAlert}
          iconColor="text-red-400"
          borderColor="border-red-500/10 hover:border-red-500/20"
        />
        <Link to="/observations" className="block hover:scale-[1.01] transition-transform">
          <MemoryStatCard
            title="Consolidated Patterns"
            value={observations.length}
            subtitle="Click to view pattern observations"
            icon={Cpu}
            iconColor="text-amber-500"
            borderColor="border-amber-500/10 hover:border-amber-500/20"
          />
        </Link>
        <MemoryStatCard
          title="Operational Timeline"
          value={timeline.length}
          subtitle="Timeline checkpoints recorded"
          icon={Activity}
          iconColor="text-primary"
        />
        <MemoryStatCard
          title="Memory Provider"
          value={memoryStatus.connected ? "Connected" : "Disconnected"}
          subtitle={`Type: ${memoryStatus.provider.toUpperCase()} CLOUD`}
          icon={BookOpen}
          iconColor={memoryStatus.connected ? "text-emerald-400" : "text-red-400"}
          borderColor={memoryStatus.connected ? "border-emerald-500/10" : "border-red-500/10"}
        />
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Incidents Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-md font-bold tracking-tight text-foreground uppercase tracking-wider">
              Active Operational Tickets
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
              Showing {incidents.length} total
            </span>
          </div>
          
          {incidents.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center">
              <Server className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
              <p className="text-sm text-muted-foreground font-mono">
                No active operational incidents reported.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {incidents.map((inc) => (
                <IncidentCard key={inc.id} incident={inc} />
              ))}
            </div>
          )}
        </div>

        {/* Timeline Summary Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-md font-bold tracking-tight text-foreground uppercase tracking-wider">
              Recent Learning Events
            </h3>
            <Link to="/timeline" className="text-xs text-primary hover:underline font-mono">
              View All
            </Link>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono text-center py-6">
                No learning events recorded yet.
              </p>
            ) : (
              timeline.slice(-4).reverse().map((ev, idx) => (
                <TimelineEventCard key={idx} event={ev} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal for Report Incident */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold tracking-tight mb-4">Report Incident</h3>
            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Redis connection pool exhausted"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the failure context, latency metrics, or stack error traces..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Service</label>
                  <select
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="payment">Payment</option>
                    <option value="auth">Auth</option>
                    <option value="database">Database</option>
                    <option value="gateway">Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-mono border border-border bg-background rounded-lg hover:bg-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-mono bg-primary text-foreground rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
