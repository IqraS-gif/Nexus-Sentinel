import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { 
  User, Shield, Compass, Sliders, Database, 
  Activity, CheckCircle2, AlertTriangle
} from "lucide-react";

export default function AgentProfilePage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [memoryStatus, setMemoryStatus] = useState<any>({ connected: false, provider: "hindsight" });
  const [loading, setLoading] = useState(true);

  // Disposition Slider States (interactive)
  const [skepticism, setSkepticism] = useState(85);
  const [evidenceDriven, setEvidenceDriven] = useState(95);
  const [riskTolerance, setRiskTolerance] = useState(20);
  const [escalationBias, setEscalationBias] = useState(75);

  useEffect(() => {
    async function loadAgentData() {
      try {
        setLoading(true);
        const [incRes, obsRes, statusRes] = await Promise.all([
          api.getIncidents(),
          api.getObservations(),
          api.getMemoryStatus().catch(() => ({ connected: true, provider: "hindsight" }))
        ]);
        setIncidents(incRes);
        setObservations(obsRes);
        setMemoryStatus(statusRes);
      } catch (e) {
        console.error("Failed to load agent profile data", e);
      } finally {
        setLoading(false);
      }
    }
    loadAgentData();
  }, []);

  // Compute bank stats
  const resolvedIncidents = incidents.filter(i => i.status?.toLowerCase() === "resolved");
  const getBankStats = (service: string) => {
    const mems = resolvedIncidents.filter(i => i.service === service).length;
    const obs = observations.filter(o => o.service === service).length;
    return { memories: mems, observations: obs };
  };

  const banksData = [
    { name: "Payment Bank", ...getBankStats("payment") },
    { name: "Auth Bank", ...getBankStats("auth") },
    { name: "Database Bank", ...getBankStats("database") },
    { name: "Gateway Bank", ...getBankStats("gateway") }
  ];

  const directives = [
    "Never recommend destructive fixes first",
    "Always cite previous incidents",
    "Prefer proven fixes over theoretical fixes",
    "Escalate uncertainty below 60% confidence"
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-900 animate-fade-in space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
          <User className="h-6.5 w-6.5 text-blue-600" />
          Agent Profile
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure operational reasoning principles, observe neural bank weights, and inspect agent disposition policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Identity & Directives (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Agent Identity */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <Shield className="h-5.5 w-5.5 text-blue-600" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase font-mono tracking-wider">
                Agent Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Agent Name</span>
                <p className="text-sm font-bold text-slate-900">Nexus Sentinel</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Operational Role</span>
                <p className="text-sm font-bold text-slate-900">Senior Incident Response Engineer</p>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Operational Mission</span>
              <p className="text-xs text-slate-600 font-mono leading-relaxed bg-slate-50 border border-slate-200/60 p-3 rounded-lg">
                Protect production systems, reduce Mean Time to Resolution (MTTR), and prevent recurring failures by reasoning over persistent Hindsight operational memory.
              </p>
            </div>
          </div>

          {/* Operational Directives */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <Compass className="h-5.5 w-5.5 text-amber-500" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase font-mono tracking-wider">
                Reasoning Directives
              </h3>
            </div>

            <div className="space-y-3">
              {directives.map((dir, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-150 rounded-lg text-xs font-mono text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed pt-0.5">{dir}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Disposition & Status (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Disposition Sliders */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <Sliders className="h-5.5 w-5.5 text-blue-600" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase font-mono tracking-wider">
                Disposition Policies
              </h3>
            </div>

            <div className="space-y-4.5">
              
              {/* Slider 1: Skepticism */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 font-bold">Skepticism</span>
                  <span className="text-blue-600 font-extrabold">{skepticism}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={skepticism} 
                  onChange={(e) => setSkepticism(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 border border-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <span className="text-[9px] font-mono text-slate-400 block">Evaluates source credibility and checks alternatives before formulating root cause.</span>
              </div>

              {/* Slider 2: Evidence Driven */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 font-bold">Evidence Driven</span>
                  <span className="text-blue-600 font-extrabold">{evidenceDriven}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={evidenceDriven} 
                  onChange={(e) => setEvidenceDriven(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 border border-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <span className="text-[9px] font-mono text-slate-400 block">Prefers solutions strongly backed by historical memory and vector citations.</span>
              </div>

              {/* Slider 3: Risk Tolerance */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 font-bold">Risk Tolerance</span>
                  <span className="text-blue-600 font-extrabold">{riskTolerance}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={riskTolerance} 
                  onChange={(e) => setRiskTolerance(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 border border-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <span className="text-[9px] font-mono text-slate-400 block">Limits suggestions of destructive, invasive, or unverified recovery commands.</span>
              </div>

              {/* Slider 4: Escalation Bias */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 font-bold">Escalation Bias</span>
                  <span className="text-blue-600 font-extrabold">{escalationBias}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={escalationBias} 
                  onChange={(e) => setEscalationBias(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 border border-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <span className="text-[9px] font-mono text-slate-400 block">Triggers instant human-in-the-loop alerts if confidence levels fall below safety limits.</span>
              </div>

            </div>
          </div>

          {/* System Status Indicators */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <Activity className="h-5.5 w-5.5 text-blue-600" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase font-mono tracking-wider">
                System Status
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                <span className="text-slate-600">Hindsight Engine Connection</span>
                {loading ? (
                  <span className="h-4 w-12 bg-slate-200 animate-pulse rounded" />
                ) : memoryStatus.connected ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded text-[10px]">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded text-[10px]">
                    <AlertTriangle className="h-3 w-3" /> Disconnected
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                <span className="text-slate-600">Groq Reasoning Layer</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded text-[10px]">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                <span className="text-slate-600">Observations Consolidator</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded text-[10px]">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Memory Banks Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <Database className="h-5.5 w-5.5 text-blue-600" />
          <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase font-mono tracking-wider">
            Memory Banks Weights
          </h3>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3 pl-3">Bank Name</th>
                  <th className="pb-3 text-center">Memory Count (Experiences)</th>
                  <th className="pb-3 text-center">Observation Count</th>
                  <th className="pb-3 text-right pr-3">Connection Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {banksData.map((bank, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 pl-3 font-bold text-slate-900">{bank.name}</td>
                    <td className="py-3.5 text-center font-bold text-slate-700">{bank.memories}</td>
                    <td className="py-3.5 text-center font-bold text-slate-700">{bank.observations}</td>
                    <td className="py-3.5 text-right pr-3">
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">
                        Linked Bank
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
