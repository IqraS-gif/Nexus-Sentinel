import React from "react";
import Navbar from "@/components/Navbar";
import { ReactLenis } from "lenis/react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ReactLenis root>
      <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-slate-200 relative">
        {/* Background decorations container - edge-to-edge */}
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

        {/* Top Navigation */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-white/50 py-6 text-center text-xs text-slate-500 font-mono relative z-10">
          Nexus Sentinel © 2026. Built on Hindsight Cloud.
        </footer>
      </div>
    </ReactLenis>
  );
}
