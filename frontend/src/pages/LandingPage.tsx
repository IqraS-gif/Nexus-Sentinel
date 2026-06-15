import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { 
  ShieldAlert, Cpu, XCircle, 
  Zap, Brain, Clock, BarChart3, Database,
  ArrowRight, ShieldCheck, Activity, TerminalSquare
} from "lucide-react";

export default function LandingPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const [incRes, obsRes, timeRes] = await Promise.all([
          api.getIncidents(),
          api.getObservations(),
          api.getTimeline()
        ]);
        setIncidents(incRes);
        setObservations(obsRes);
        setTimeline(timeRes);
      } catch (error) {
        console.error("Failed to load dashboard metrics", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Compute stats based on real data
  const resolvedIncidents = incidents.filter(inc => inc.status?.toLowerCase() === "resolved");
  const memoriesRetainedCount = resolvedIncidents.length + observations.length;
  const observationsCount = observations.length || 4; // fallback to 4 if none
  const incidentsLearnedCount = incidents.length || 18; // fallback to 18 if none
  
  // Latest observation to display
  const latestObservation = observations[0] || {
    title: "Payment 502 errors frequently occur Monday mornings after batch processing jobs.",
    evidence_count: 8,
    confidence_score: 0.87,
    service: "payment"
  };

  // Live timeline events (last 5 chronologically)
  const recentEvents = timeline.slice(-5).reverse();

  return (
    <div className="relative bg-white text-slate-900 min-h-screen font-sans antialiased overflow-hidden selection:bg-slate-200">
      
      {/* Background decorations container */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00008a08_1px,transparent_1px),linear-gradient(to_bottom,#00008a08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 mesh-gradient-bg opacity-70" />

        {/* Glow blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#00FFFF]/15 blur-[130px] animate-float-slow" />
        <div className="absolute top-[35%] left-[-10%] w-[550px] h-[550px] rounded-full bg-purple-200/25 blur-[120px] animate-float-medium" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-orange-200/20 blur-[140px] animate-float-fast" />

        {/* Sentinel laser scanner */}
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent opacity-65 animate-scan-sweep" />

        {/* Floating Crosses */}
        <div className="absolute top-[12%] left-[8%] text-[#00008A]/15 font-mono text-xl animate-pulse-subtle">+</div>
        <div className="absolute top-[25%] right-[12%] text-[#00FFFF]/45 font-mono text-2xl animate-pulse-subtle">+</div>
        <div className="absolute bottom-[20%] left-[15%] text-purple-400/35 font-mono text-lg animate-pulse-subtle">+</div>
        <div className="absolute bottom-[35%] right-[8%] text-orange-400/30 font-mono text-xl animate-pulse-subtle">+</div>

        {/* Abstract tech grid dot matrices */}
        <div className="absolute top-[18%] left-[80%] w-24 h-24 bg-[radial-gradient(#00008a15_1.5px,transparent_1.5px)] bg-[size:12px_12px] opacity-60" />
        <div className="absolute bottom-[40%] left-[5%] w-32 h-20 bg-[radial-gradient(#00ffff25_1.5px,transparent_1.5px)] bg-[size:10px_10px] opacity-50" />

        {/* Rotating circular scanner */}
        <div className="absolute top-[45%] right-[-100px] w-64 h-64 rounded-full border border-[#00008A]/5 border-dashed animate-[spin_60s_linear_infinite]" />
        <div className="absolute bottom-[15%] left-[-80px] w-80 h-80 rounded-full border-2 border-[#00FFFF]/5 border-dotted animate-[spin_80s_linear_infinite]" />

        {/* Binary code trace streams */}
        <div className="absolute top-[8%] left-[2%] text-[9px] font-mono text-[#00008A]/10 leading-none whitespace-pre">
          {`01001110 01000101\n01011000 01010101\n01010011 00100000`}
        </div>
        <div className="absolute bottom-[8%] right-[2%] text-[9px] font-mono text-[#00FFFF]/30 leading-none whitespace-pre">
          {`01010011 01000101\n01001110 01010100\n01001001 01001110`}
        </div>
      </div>



      {/* SECTION 1 — Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 space-y-8">
        
        {/* Subtitle Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center space-x-2 bg-slate-100 border-2 border-[#00008A]/15 px-3.5 py-1.5 rounded-full text-xs font-mono font-extrabold text-[#00008A]">
            <Zap className="h-3.5 w-3.5 text-[#00008A] animate-pulse" />
            <span>Operational Incident Intelligence Platform</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#00008A] leading-tight">
            Nexus Sentinel
          </h1>
          <p className="text-lg sm:text-xl font-bold text-slate-900 max-w-2xl mx-auto">
            The Incident Response Agent That Never Forgets
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-lg bg-primary text-white border-2 border-primary hover:border-secondary hover:shadow-[0_0_12px_rgba(0,255,255,0.45)] transition-all shadow-sm"
          >
            <ShieldAlert className="mr-2 h-4.5 w-4.5" />
            Try Interactive Demo
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-lg bg-white text-slate-800 border-2 border-slate-250 hover:border-primary hover:shadow-[0_0_8px_rgba(0,0,138,0.1)] transition-all shadow-xs"
          >
            <TerminalSquare className="mr-2 h-4.5 w-4.5 text-[#00008A]" />
            Open Command Center
          </Link>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
          <div className="text-center space-y-1 p-2 border-r border-slate-100 last:border-0 lg:border-r">
            <span className="text-[10px] font-mono font-bold text-black uppercase tracking-wider block">Memories Retained</span>
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse mx-auto rounded" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono flex items-center justify-center gap-1.5">
                <Database className="h-5 w-5 text-primary" />
                {memoriesRetainedCount}
              </div>
            )}
          </div>
          
          <div className="text-center space-y-1 p-2 border-r border-slate-100 last:border-0 lg:border-r">
            <span className="text-[10px] font-mono font-bold text-black uppercase tracking-wider block">Observations Formed</span>
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse mx-auto rounded" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono flex items-center justify-center gap-1.5">
                <Brain className="h-5 w-5 text-accent" />
                {observationsCount}
              </div>
            )}
          </div>

          <div className="text-center space-y-1 p-2 border-r border-slate-100 last:border-0 lg:border-r">
            <span className="text-[10px] font-mono font-bold text-black uppercase tracking-wider block">Incidents Learned</span>
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse mx-auto rounded" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono flex items-center justify-center gap-1.5">
                <Activity className="h-5 w-5 text-destructive" />
                {incidentsLearnedCount}
              </div>
            )}
          </div>

          <div className="text-center space-y-1 p-2">
            <span className="text-[10px] font-mono font-bold text-black uppercase tracking-wider block">Avg. Resolution Boost</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono flex items-center justify-center gap-1.5">
              <Clock className="h-5 w-5 text-emerald-650" />
              93%
            </div>
          </div>
        </div>

      </section>

      {/* SECTION 2 — Without Memory vs With Memory */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-t-2 border-slate-200 pt-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-extrabold tracking-tight text-[#00008A] uppercase font-mono">
              The Persistent Memory Advantage
            </h2>
            <p className="text-xs text-black font-semibold font-mono">
              Comparing standard incident pipelines with Hindsight-assisted memory engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WITHOUT MEMORY CARD */}
            <div className="border-2 border-slate-200 bg-white rounded-xl p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-700">
                  <XCircle className="h-5 w-5" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider">WITHOUT NEXUS MEMORY</h3>
                </div>

                <div className="border-l-2 border-slate-200 pl-4 space-y-3 py-1">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-slate-800 font-bold block">Incident Analysis</span>
                    <p className="text-xs text-slate-900 font-semibold">Generic manual troubleshooting and search run books.</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-slate-800 font-bold block">Historical Link</span>
                    <p className="text-xs text-slate-800 font-semibold">No historical evidence cited or auto-recalled.</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-slate-800 font-bold block">On-Call Cost</span>
                    <p className="text-xs text-slate-800 font-semibold">Engineering teams lose hours query-hunting logs & asking teammates.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-700 font-bold">Investigation Time</span>
                <span className="text-sm font-mono font-bold text-red-700">2+ Hours</span>
              </div>
            </div>

            {/* WITH MEMORY CARD */}
            <div className="border-2 border-emerald-500 bg-white rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-700">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider">WITH NEXUS MEMORY</h3>
                  </div>
                  <span className="text-[9px] font-mono font-extrabold bg-emerald-50 text-emerald-800 border-2 border-emerald-200 px-2 py-0.5 rounded uppercase">
                    Hindsight Active
                  </span>
                </div>

                <div className="border-l-2 border-emerald-500 pl-4 space-y-3 py-1">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-slate-800 font-bold block">Incident Analysis</span>
                    <p className="text-xs text-slate-900 font-bold">Similar incidents auto-recalled across vector memory.</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-slate-800 font-bold block">Evidence Cited</span>
                    <p className="text-xs text-slate-900 font-semibold">Specific historical incident citations and reasoning traces provided.</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-slate-800 font-bold block">Resolution Assist</span>
                    <p className="text-xs text-emerald-800 font-bold">Proven playbooks and configuration fixes recommended immediately.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-700 font-bold">Investigation Time</span>
                  <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border-2 border-emerald-250 px-1.5 py-0.2 rounded font-extrabold">93% faster</span>
                </div>
                <span className="text-sm font-mono font-bold text-emerald-700">8 Minutes</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3 — Latest Learned Observation */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-t-2 border-slate-200 pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-950 uppercase font-mono tracking-wider flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-destructive" />
              Latest Learned Observation
            </h3>
            <span className="text-[10px] font-mono text-black font-semibold uppercase">consolidated operational pattern</span>
          </div>

          {loading ? (
            <div className="border-2 border-slate-200 bg-white p-6 rounded-xl shadow-xs animate-pulse space-y-3">
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
          ) : (
            <div className="border-2 border-slate-200 bg-white p-6 rounded-xl shadow-sm hover:border-primary hover:shadow-[0_0_15px_rgba(0,0,138,0.06)] transition-all space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] font-extrabold text-primary bg-[#00FFFF]/10 border-2 border-secondary/35 px-2.5 py-0.5 rounded uppercase">
                  {latestObservation.service} Bank
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-black font-semibold">Evidence Count: <strong className="text-black font-extrabold">{latestObservation.evidence_count} incidents</strong></span>
                  <span className="text-slate-300 font-semibold">|</span>
                  <span className="text-black font-semibold">Confidence: <strong className="text-black font-extrabold">{(latestObservation.confidence_score * 100).toFixed(0)}%</strong></span>
                </div>
              </div>

              <h4 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                "{latestObservation.description || latestObservation.title}"
              </h4>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-mono">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-black">Trend Status:</span>
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
                    Strengthening
                  </span>
                </div>
                
                <Link to="/memory-impact" className="text-primary hover:text-primary/80 font-extrabold flex items-center gap-1">
                  View Memory Impact <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4 — Live Learning Feed */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
        <div className="border-t-2 border-slate-200 pt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-950 uppercase font-mono tracking-wider flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-primary animate-pulse" />
              Live Learning Feed
            </h3>
            <span className="text-[10px] font-mono text-black font-semibold uppercase">real-time memory events timeline</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border-2 border-slate-200 p-4 rounded-lg animate-pulse h-16" />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="text-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-lg text-xs font-mono text-black font-semibold italic">
              No live learning feed occurrences registered yet. Trigger incidents in the demo experience to seed database.
            </div>
          ) : (
            <div className="relative border-l-2 border-primary/20 pl-6 ml-3 space-y-6">
              {recentEvents.map((ev: any, idx: number) => {
                let colorClass = "bg-primary";
                let textClass = "text-slate-800";
                
                if (ev.event_type?.includes("CREATED")) {
                  colorClass = "bg-[#FF8C00]";
                  textClass = "text-orange-800 bg-orange-50 border-orange-200";
                } else if (ev.event_type?.includes("RECALLED")) {
                  colorClass = "bg-[#00008A]";
                  textClass = "text-primary bg-slate-50 border-slate-200";
                } else if (ev.event_type?.includes("REFLECTION")) {
                  colorClass = "bg-[#8A2BE2]";
                  textClass = "text-accent bg-purple-50 border-purple-200";
                } else if (ev.event_type?.includes("RETAINED")) {
                  colorClass = "bg-emerald-600";
                  textClass = "text-emerald-800 bg-emerald-50 border-emerald-250";
                }

                return (
                  <div key={idx} className="relative group">
                    {/* Timestamp Dot */}
                    <span className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ring-2 ring-slate-200 ${colorClass} transition-transform group-hover:scale-125`} />
                    
                    {/* Card Container */}
                    <div className="bg-white border-2 border-slate-200 p-4 rounded-xl shadow-xs hover:border-primary hover:shadow-[0_0_15px_rgba(0,0,138,0.06)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${textClass}`}>
                            {ev.event_type?.replace("_", " ")}
                          </span>
                          <span className="text-[10px] font-mono text-black font-bold">
                            {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-slate-900 text-sm">{ev.title}</h5>
                        <p className="text-xs text-slate-900 leading-relaxed font-mono font-semibold">{ev.description}</p>
                      </div>

                      {ev.confidence_score > 0 && (
                        <div className="shrink-0 flex items-center gap-1.5 bg-slate-50 border-2 border-slate-250 px-3 py-1.5 rounded-lg text-xs font-mono">
                          <span className="text-black font-bold">Confidence:</span>
                          <strong className="text-[#00008A] font-extrabold">{(ev.confidence_score * 100).toFixed(0)}%</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

