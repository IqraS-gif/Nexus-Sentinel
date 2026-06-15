import { useState, useEffect } from "react";
import { api } from "@/services/api";
import ObservationCard from "@/components/ObservationCard";
import { Cpu, RefreshCw, AlertCircle } from "lucide-react";

export default function ObservationsPage() {
  const [observations, setObservations] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchObservations = async (service: string) => {
    try {
      setLoading(true);
      const data = await api.getObservations(service === "all" ? undefined : service);
      setObservations(data);
      setError(null);
    } catch (err: any) {
      setError("Failed to load observations. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations(selectedService);
  }, [selectedService]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await api.generateObservations();
      await fetchObservations(selectedService);
    } catch (err: any) {
      alert(`Observation generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const services = [
    { value: "all", label: "All Services" },
    { value: "payment", label: "Payment Service" },
    { value: "auth", label: "Auth Service" },
    { value: "database", label: "Database Service" },
    { value: "gateway", label: "Gateway Service" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Consolidated Observations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discovered system operational patterns and recurring behaviors consolidated from memory.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
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
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-lg bg-primary text-foreground hover:bg-blue-600 border border-primary/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Consolidating..." : "Consolidate Patterns"}
          </button>
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
          <span className="text-xs font-mono text-muted-foreground animate-pulse">Running Knowledge Consolidation...</span>
        </div>
      ) : observations.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center max-w-2xl mx-auto">
          <Cpu className="mx-auto h-10 w-10 text-muted-foreground opacity-40 mb-4" />
          <h3 className="text-md font-bold tracking-tight mb-2">No Observations Found</h3>
          <p className="text-sm text-muted-foreground font-mono leading-relaxed mb-6">
            Nexus Sentinel hasn't identified consolidated patterns for this service subset yet. Try resolving incidents or click "Consolidate Patterns" to trigger discovery.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-xs font-mono border border-border bg-card hover:bg-card/80 rounded-lg transition-colors"
          >
            Consolidate Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {observations.map((obs, idx) => (
            <ObservationCard key={idx} obs={obs} />
          ))}
        </div>
      )}
    </div>
  );
}
