import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { 
  Database, Search, Cpu, History, FileText
} from "lucide-react";

export default function MemoryExplorerNewPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout Filters
  const [selectedBank, setSelectedBank] = useState("all"); // 'all', 'payment', 'auth', 'database', 'gateway'
  const [activeTab, setActiveTab] = useState<"observations" | "experiences" | "facts">("observations");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
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
      } catch (e) {
        console.error("Failed to load memory data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const banks = [
    { id: "all", name: "All Banks", count: observations.length + incidents.filter(i => i.status?.toLowerCase() === "resolved").length },
    { id: "payment", name: "Payment Bank", count: observations.filter(o => o.service === "payment").length + incidents.filter(i => i.service === "payment" && i.status?.toLowerCase() === "resolved").length },
    { id: "auth", name: "Auth Bank", count: observations.filter(o => o.service === "auth").length + incidents.filter(i => i.service === "auth" && i.status?.toLowerCase() === "resolved").length },
    { id: "database", name: "Database Bank", count: observations.filter(o => o.service === "database").length + incidents.filter(i => i.service === "database" && i.status?.toLowerCase() === "resolved").length },
    { id: "gateway", name: "Gateway Bank", count: observations.filter(o => o.service === "gateway").length + incidents.filter(i => i.service === "gateway" && i.status?.toLowerCase() === "resolved").length },
  ];

  // Resolve source incident context helper
  const getSourceIncidentId = (item: any, type: string) => {
    if (type === "experience") return `INC-${item.id}`;
    if (item.related_incidents && item.related_incidents.length > 0) {
      return `INC-${item.related_incidents[0]}`;
    }
    return "N/A";
  };

  // Filter Observations
  const filteredObservations = observations.filter(obs => {
    const bankMatch = selectedBank === "all" || obs.service === selectedBank;
    const serviceMatch = serviceFilter === "all" || obs.service === serviceFilter;
    const searchMatch = obs.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        obs.description.toLowerCase().includes(searchQuery.toLowerCase());
    return bankMatch && serviceMatch && searchMatch;
  });

  // Filter Experiences
  const filteredExperiences = incidents
    .filter(inc => inc.status?.toLowerCase() === "resolved")
    .filter(inc => {
      const bankMatch = selectedBank === "all" || inc.service === selectedBank;
      const serviceMatch = serviceFilter === "all" || inc.service === serviceFilter;
      const searchMatch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (inc.resolution && inc.resolution.toLowerCase().includes(searchQuery.toLowerCase()));
      return bankMatch && serviceMatch && searchMatch;
    });

  // Filter Facts (timeline Memory Retained events)
  const filteredFacts = timeline
    .filter(ev => ev.event_type === "MEMORY_RETAINED")
    .filter(ev => {
      // Resolve service from related incidents if possible
      let service = "system";
      if (ev.related_incidents && ev.related_incidents.length > 0) {
        const matchedInc = incidents.find(i => i.id === ev.related_incidents[0]);
        if (matchedInc) service = matchedInc.service;
      }
      const bankMatch = selectedBank === "all" || service === selectedBank;
      const serviceMatch = serviceFilter === "all" || service === serviceFilter;
      const searchMatch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ev.description.toLowerCase().includes(searchQuery.toLowerCase());
      return bankMatch && serviceMatch && searchMatch;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-900 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
          <Database className="h-6.5 w-6.5 text-blue-600 animate-pulse" />
          Memory Explorer
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Inspect persistent neural contexts, consolidated pattern observations, and resolved incident experiences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar - All Banks */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
          <h3 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">
            Hindsight Memory Banks
          </h3>
          <nav className="space-y-1">
            {banks.map((b) => {
              const isActive = selectedBank === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBank(b.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors border ${
                    isActive
                      ? "bg-blue-50 border-blue-100 text-blue-700"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="capitalize">{b.name}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isActive ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
                  }`}>
                    {b.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center Panel */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Top Search Bar & Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search retained memory text, resolution keys, or operational patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900 placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Service filter dropdown */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">Service Filter</label>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  <option value="all">All Services</option>
                  <option value="payment">Payment</option>
                  <option value="auth">Auth</option>
                  <option value="database">Database</option>
                  <option value="gateway">Gateway</option>
                </select>
              </div>

              {/* Bank Selector filter */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">Primary Bank Filter</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  <option value="all">All Banks</option>
                  <option value="payment">Payment Bank</option>
                  <option value="auth">Auth Bank</option>
                  <option value="database">Database Bank</option>
                  <option value="gateway">Gateway Bank</option>
                </select>
              </div>
            </div>
          </div>

          {/* Center Tabs */}
          <div className="border-b border-slate-200 flex space-x-6">
            <button
              onClick={() => setActiveTab("observations")}
              className={`pb-2.5 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === "observations"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-950"
              }`}
            >
              Observations ({filteredObservations.length})
            </button>
            <button
              onClick={() => setActiveTab("experiences")}
              className={`pb-2.5 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === "experiences"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-950"
              }`}
            >
              Experiences ({filteredExperiences.length})
            </button>
            <button
              onClick={() => setActiveTab("facts")}
              className={`pb-2.5 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === "facts"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-950"
              }`}
            >
              World Facts ({filteredFacts.length})
            </button>
          </div>

          {/* Memory List Cards */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-[20vh] space-y-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <span className="text-xs font-mono text-slate-400">Syncing vector segments...</span>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Tab 1: Observations */}
              {activeTab === "observations" && (
                filteredObservations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-mono p-4 bg-white border border-slate-200 rounded-lg text-center">No observation cards matched the filter parameters.</p>
                ) : (
                  filteredObservations.map((obs, idx) => (
                    <div key={idx} className="border border-slate-200 bg-white p-5 rounded-xl shadow-xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <Cpu className="h-3 w-3 text-amber-500" />
                            Observation
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Bank: <strong className="text-slate-700 capitalize">{obs.service}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                          <span>Source Incident: <strong className="text-slate-800">{getSourceIncidentId(obs, 'observation')}</strong></span>
                          <span>Confidence: <strong className="text-slate-850">{(obs.confidence_score * 100).toFixed(0)}%</strong></span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{obs.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-mono">{obs.description}</p>
                      </div>

                      {/* Observation Details block */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3.5 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                        <div>Evidence Count: <span className="font-bold text-slate-800">{obs.evidence_count} events</span></div>
                        <div>Trend Strength: <span className="font-bold text-emerald-600">Strengthening</span></div>
                        <div>Related Incidents: <span className="font-bold text-slate-750">
                          {obs.related_incidents?.map((id: number) => `INC-${id}`).join(", ") || "None"}
                        </span></div>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* Tab 2: Experiences */}
              {activeTab === "experiences" && (
                filteredExperiences.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-mono p-4 bg-white border border-slate-200 rounded-lg text-center">No experience cards matched the filter parameters.</p>
                ) : (
                  filteredExperiences.map((inc) => (
                    <div key={inc.id} className="border border-slate-200 bg-white p-5 rounded-xl shadow-xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <History className="h-3 w-3 text-blue-500" />
                            Experience
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Bank: <strong className="text-slate-700 capitalize">{inc.service}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                          <span>Source Incident ID: <strong className="text-slate-800">INC-{inc.id}</strong></span>
                          <span>Confidence: <strong className="text-emerald-600">95%</strong></span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm">{inc.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-mono pl-3 border-l-2 border-slate-100">
                          Fix resolution: "{inc.resolution}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                        <span>Incident Service: <strong className="text-slate-600 capitalize">{inc.service}</strong></span>
                        <span>Date: <strong className="text-slate-600">{new Date(inc.created_at).toLocaleDateString()}</strong></span>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* Tab 3: World Facts */}
              {activeTab === "facts" && (
                filteredFacts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-mono p-4 bg-white border border-slate-200 rounded-lg text-center">No world fact cards matched the filter parameters.</p>
                ) : (
                  filteredFacts.map((fact, idx) => {
                    // Resolve service for display
                    let service = "system";
                    if (fact.related_incidents && fact.related_incidents.length > 0) {
                      const matchedInc = incidents.find(i => i.id === fact.related_incidents[0]);
                      if (matchedInc) service = matchedInc.service;
                    }

                    return (
                      <div key={idx} className="border border-slate-200 bg-white p-5 rounded-xl shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                              <FileText className="h-3 w-3 text-violet-500" />
                              World Fact
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Service: <strong className="text-slate-700 capitalize">{service}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                            <span>Source Incident ID: <strong className="text-slate-800">{getSourceIncidentId(fact, 'fact')}</strong></span>
                            <span>Confidence: <strong className="text-slate-850">{(fact.confidence_score * 100).toFixed(0)}%</strong></span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-sm">{fact.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-mono">{fact.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                          <span>Source bank domain: <strong className="text-slate-600 capitalize">{service}</strong></span>
                          <span>Date: <strong className="text-slate-600">{new Date(fact.timestamp).toLocaleDateString()}</strong></span>
                        </div>
                      </div>
                    );
                  })
                )
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
