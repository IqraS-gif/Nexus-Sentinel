import { Link } from "react-router-dom";
import { 
  Zap, ShieldCheck, ArrowRight, 
  ShieldAlert, BookOpen, TrendingDown 
} from "lucide-react";

export default function MemoryImpactPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto px-4 pb-16 text-slate-900">
      
      {/* Header */}
      <div className="border-b-2 border-slate-200 pb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
          <BookOpen className="h-6.5 w-6.5 text-emerald-600" />
          Memory Impact Dashboard
        </h2>
        <p className="text-sm text-black font-semibold mt-1">
          Quantifying the operational savings and business velocity enabled by long-term persistent memory.
        </p>
      </div>

      {/* Main Side-by-Side Comparison Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT PANEL: Without Nexus Memory */}
        <div className="border-2 border-slate-200 bg-slate-50/50 rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-xs">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-slate-900">
              <ShieldAlert className="h-5 w-5 text-red-650" />
              <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider">WITHOUT NEXUS MEMORY</h3>
            </div>

            <div className="space-y-1 bg-white border-2 border-slate-200 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-black font-extrabold block">Alert Triggered</span>
              <h4 className="font-bold text-sm text-slate-800">Payment Service 502 Errors</h4>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-mono uppercase text-black font-extrabold block">Manual Engineer Actions</span>
              <ul className="space-y-2.5 font-mono text-xs text-black font-semibold">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  1. Search logs (grep, parsing logs)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  2. Search wiki documentation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  3. Ask teammates on Slack
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  4. Escalate to secondary on-call
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-slate-200 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] font-mono uppercase text-black font-bold block">Res. Time</span>
                <span className="text-sm font-mono font-extrabold text-slate-950">2 Hours</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-black font-bold block">MTTR</span>
                <span className="text-sm font-mono font-extrabold text-slate-950">120 Min</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-black font-bold block">Confidence</span>
                <span className="text-sm font-mono font-extrabold text-red-700">Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: With Nexus Memory (Positive Green) */}
        <div className="border-2 border-emerald-500 bg-white rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-700 font-extrabold">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider">WITH NEXUS MEMORY</h3>
              </div>
              <Zap className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-1 bg-emerald-50/70 border-2 border-emerald-200 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">Alert Triggered</span>
              <h4 className="font-bold text-sm text-slate-900">Payment Service 502 Errors</h4>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-black font-extrabold block">Memory Recall</span>
                  <span className="text-xs font-mono font-bold text-slate-950">8 similar incidents</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-black font-extrabold block">Known Fix</span>
                  <span className="text-xs font-mono font-bold text-emerald-700">Scale Redis Pool to 150</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-black font-extrabold block">Supporting Citations</span>
                <div className="flex gap-2">
                  {["INC-047", "INC-058", "INC-071"].map((inc) => (
                    <span key={inc} className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-[#00008A] border-2 border-blue-200 rounded font-bold">
                      {inc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-slate-100 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] font-mono uppercase text-black font-bold block">Res. Time</span>
                <span className="text-sm font-mono font-extrabold text-emerald-700">8 Minutes</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-black font-bold block">MTTR</span>
                <span className="text-sm font-mono font-extrabold text-emerald-700">8 Min</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-black font-bold block">Confidence</span>
                <span className="text-sm font-mono font-extrabold text-emerald-700">87%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* METRIC GRID BANNER */}
      <section className="border-2 border-slate-200 bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-black mb-6 flex items-center gap-1.5">
          <TrendingDown className="h-4 w-4 text-emerald-600 animate-pulse" />
          Aggregate Value Metrics
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-black font-bold block">MTTR Reduction</span>
            <h4 className="text-3xl font-extrabold text-emerald-600 font-mono">93%</h4>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-black font-bold block">Incidents Reused</span>
            <h4 className="text-3xl font-extrabold text-slate-900 font-mono">72</h4>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-black font-bold block">Patterns Learned</span>
            <h4 className="text-3xl font-extrabold text-slate-900 font-mono">59</h4>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-black font-bold block">Memory Banks</span>
            <h4 className="text-3xl font-extrabold text-slate-900 font-mono">4</h4>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <div className="flex justify-center pt-4">
        <Link
          to="/memory-explorer"
          className="btn-premium-primary inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all duration-300"
        >
          Explore Memory Explorer <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}

