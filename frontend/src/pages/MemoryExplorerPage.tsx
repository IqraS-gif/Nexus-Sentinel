import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { 
  Database, Search, Cpu, History, Sparkles,
  FileText, X, ChevronRight, Activity, Shield
} from "lucide-react";

export default function MemoryExplorerPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedType, setSelectedType] = useState("all"); // 'all', 'observation', 'experience', 'reflection', 'fact'

  // Drawer State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const loadData = async () => {
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
      console.error("Failed to load memory explorer data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Prevent background scroll when details drawer is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedItem]);

  // Filter Observations
  const filteredObservations = observations.filter(obs => {
    const matchesService = selectedService === "all" || obs.service === selectedService;
    const matchesSearch = obs.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          obs.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesService && matchesSearch;
  });

  // Filter Experiences (Resolved Incidents)
  const filteredExperiences = incidents
    .filter(inc => inc.status.toLowerCase() === "resolved")
    .filter(inc => {
      const matchesService = selectedService === "all" || inc.service === selectedService;
      const matchesSearch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (inc.resolution && inc.resolution.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesService && matchesSearch;
    });

  // Filter Reflections (Reflection Generated timeline events)
  const filteredReflections = timeline
    .filter(ev => ev.event_type === "REFLECTION_GENERATED")
    .filter(ev => {
      // Find matches across related incidents to check services if selectedService is not 'all'
      if (selectedService !== "all") {
        const hasMatchingServiceIncident = ev.related_incidents?.some((incId: number) => {
          const inc = incidents.find(i => i.id === incId);
          return inc && inc.service === selectedService;
        });
        if (!hasMatchingServiceIncident) return false;
      }
      
      const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ev.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

  // Filter Facts (Memory Retained timeline events)
  const filteredFacts = timeline
    .filter(ev => ev.event_type === "MEMORY_RETAINED")
    .filter(ev => {
      if (selectedService !== "all") {
        const hasMatchingServiceIncident = ev.related_incidents?.some((incId: number) => {
          const inc = incidents.find(i => i.id === incId);
          return inc && inc.service === selectedService;
        });
        if (!hasMatchingServiceIncident) return false;
      }

      const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ev.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

  const handleItemClick = (item: any, type: 'observation' | 'experience' | 'reflection' | 'fact') => {
    setSelectedItem({ ...item, explorerType: type });
  };

  const services = [
    { value: "all", label: "All Services" },
    { value: "payment", label: "Payment Bank" },
    { value: "auth", label: "Auth Bank" },
    { value: "database", label: "Database Bank" },
    { value: "gateway", label: "Gateway Bank" }
  ];

  const types = [
    { value: "all", label: "All Memory Types" },
    { value: "observation", label: "Observations Only" },
    { value: "experience", label: "Experiences Only" },
    { value: "reflection", label: "Reflections Only" },
    { value: "fact", label: "Facts Only" }
  ];

  // Drawer details resolver helpers
  const getDrawerDetails = () => {
    if (!selectedItem) return null;

    let sourceIncident: any = null;
    let supportingMemories: string[] = [];
    let relatedObservations: any[] = [];
    let confidence = selectedItem.confidence_score || 0.85;

    const findIncidents = (ids: number[]) => {
      return incidents.filter(i => ids.includes(i.id));
    };

    if (selectedItem.explorerType === 'observation') {
      const relIds = selectedItem.related_incidents || [];
      const matchedIncidents = findIncidents(relIds);
      sourceIncident = matchedIncidents[0] || null;
      supportingMemories = selectedItem.related_memories || [];
      relatedObservations = [selectedItem];
      confidence = selectedItem.confidence_score;
    } else if (selectedItem.explorerType === 'experience') {
      sourceIncident = selectedItem;
      supportingMemories = selectedItem.resolution ? [selectedItem.resolution] : ["Resolution verified and logged."];
      relatedObservations = observations.filter(o => o.service === selectedItem.service);
      confidence = 0.95; // Experience is direct fact
    } else if (selectedItem.explorerType === 'reflection') {
      const relIds = selectedItem.related_incidents || [];
      const matchedIncidents = findIncidents(relIds);
      sourceIncident = matchedIncidents[0] || null;
      supportingMemories = [
        "Retrieved historical incident fixes for identical trace signatures.",
        selectedItem.description
      ];
      relatedObservations = observations.filter(o => sourceIncident && o.service === sourceIncident.service);
      confidence = selectedItem.confidence_score || 0.85;
    } else if (selectedItem.explorerType === 'fact') {
      const relIds = selectedItem.related_incidents || [];
      const matchedIncidents = findIncidents(relIds);
      sourceIncident = matchedIncidents[0] || null;
      supportingMemories = [selectedItem.description];
      relatedObservations = observations.filter(o => sourceIncident && o.service === sourceIncident.service);
      confidence = selectedItem.confidence_score || 0.90;
    }

    return {
      sourceIncident,
      supportingMemories,
      relatedObservations,
      confidence
    };
  };

  const details = getDrawerDetails();

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto px-4 relative pb-16 text-slate-900">
      
      {/* Header */}
      <div className="border-b-2 border-slate-200 pb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
          <Database className="h-6.5 w-6.5 text-[#00008A] animate-pulse" />
          Memory Explorer
        </h2>
        <p className="text-sm text-black font-semibold mt-1">
          Browse Hindsight persistent memory structures. Filter through system observations, past experiences, intelligence reflections, and factual logs.
        </p>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white border-2 border-slate-200 p-4 rounded-xl shadow-xs">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-black font-bold" />
          <input
            type="text"
            placeholder="Search patterns, experiences, incidents, or facts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-250 rounded-lg text-sm focus:outline-none focus:border-[#00008A] placeholder-slate-600 font-semibold"
          />
        </div>

        {/* Service Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-250 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00008A] cursor-pointer font-bold text-black"
          >
            {services.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-250 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00008A] cursor-pointer font-bold text-black"
          >
            {types.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MEMORY SECTIONS */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-[30vh] space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00008A]" />
          <span className="text-xs font-mono text-black font-extrabold animate-pulse">Syncing Memory Banks...</span>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* SECTION 1: Observations */}
          {(selectedType === "all" || selectedType === "observation") && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b-2 border-slate-200 pb-2">
                <Cpu className="h-4.5 w-4.5 text-amber-600" />
                <h3 className="font-extrabold text-sm text-slate-950 uppercase font-mono tracking-wider">Observations</h3>
              </div>

              {filteredObservations.length === 0 ? (
                <p className="text-xs text-black font-semibold italic font-mono pl-2">No observations matched the filters.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredObservations.map((obs, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleItemClick(obs, 'observation')}
                      className="border-2 border-slate-200 bg-white p-5 rounded-xl hover:border-[#00008A]/50 hover:shadow-[0_0_12px_rgba(0,0,138,0.05)] transition-all cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#00008A] bg-blue-50 border-2 border-blue-100 px-2 py-0.5 rounded uppercase">
                          {obs.service}
                        </span>
                        <span className="text-[10px] font-mono text-black font-bold">
                          {obs.evidence_count} evidence records
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{obs.title}</h4>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t-2 border-slate-100 text-[10px] font-mono text-black font-semibold">
                        <div>Trend: <span className="font-extrabold text-emerald-600">Strengthening</span></div>
                        <div>Confidence: <span className="font-extrabold text-[#00008A]">{(obs.confidence_score * 100).toFixed(0)}%</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: Experiences */}
          {(selectedType === "all" || selectedType === "experience") && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b-2 border-slate-200 pb-2">
                <History className="h-4.5 w-4.5 text-[#00008A]" />
                <h3 className="font-extrabold text-sm text-slate-950 uppercase font-mono tracking-wider">Experiences</h3>
              </div>

              {filteredExperiences.length === 0 ? (
                <p className="text-xs text-black font-semibold italic font-mono pl-2">No experience records found.</p>
              ) : (
                <div className="border-2 border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs divide-y-2 divide-slate-200">
                  {filteredExperiences.map((inc) => (
                    <div 
                      key={inc.id}
                      onClick={() => handleItemClick(inc, 'experience')}
                      className="p-4 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-slate-900">INC-{inc.id.toString().padStart(3, '0')}</span>
                          <span className="text-[10px] font-mono font-bold text-[#00008A] bg-blue-50 border-2 border-blue-100 px-2 py-0.5 rounded uppercase">{inc.service}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{inc.title}</h4>
                        <p className="text-xs text-black font-semibold line-clamp-1">{inc.resolution}</p>
                      </div>
                      <span className="text-[10px] font-mono text-black font-bold shrink-0">
                        {new Date(inc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: Reflections */}
          {(selectedType === "all" || selectedType === "reflection") && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b-2 border-slate-200 pb-2">
                <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                <h3 className="font-extrabold text-sm text-slate-950 uppercase font-mono tracking-wider">Reflections</h3>
              </div>

              {filteredReflections.length === 0 ? (
                <p className="text-xs text-black font-semibold italic font-mono pl-2">No reflection logs found.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredReflections.map((ref, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleItemClick(ref, 'reflection')}
                      className="border-2 border-slate-200 bg-white p-4 rounded-xl shadow-xs hover:border-[#00008A]/50 transition-colors cursor-pointer flex justify-between items-start gap-4"
                    >
                      <div className="space-y-1.5">
                        <h5 className="font-extrabold text-[#00008a] text-xs font-mono flex items-center gap-1.5">
                          <Activity className="h-3 w-3 text-amber-500" />
                          {ref.title}
                        </h5>
                        <p className="text-xs text-black font-mono leading-relaxed line-clamp-2">{ref.description}</p>
                      </div>
                      <span className="text-[10px] font-mono text-black font-bold shrink-0">
                        {(ref.confidence_score * 100).toFixed(0)}% Conf.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: Facts */}
          {(selectedType === "all" || selectedType === "fact") && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b-2 border-slate-200 pb-2">
                <FileText className="h-4.5 w-4.5 text-purple-600" />
                <h3 className="font-extrabold text-sm text-slate-950 uppercase font-mono tracking-wider">Facts</h3>
              </div>

              {filteredFacts.length === 0 ? (
                <p className="text-xs text-black font-semibold italic font-mono pl-2">No fact records found.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredFacts.map((fact, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleItemClick(fact, 'fact')}
                      className="border-2 border-slate-200 bg-white p-4 rounded-xl shadow-xs hover:border-[#00008A]/50 transition-colors cursor-pointer flex justify-between items-start gap-4"
                    >
                      <div className="space-y-1">
                        <h5 className="font-extrabold text-slate-900 text-xs font-mono">{fact.title}</h5>
                        <p className="text-xs text-black font-mono leading-relaxed line-clamp-2">{fact.description}</p>
                      </div>
                      <span className="text-[10px] font-mono text-black font-bold shrink-0">
                        {new Date(fact.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* SLIDE-OVER DRAWER */}
      {selectedItem && details && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/35 backdrop-blur-xs" data-lenis-prevent>
          <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l-2 border-slate-200 p-6 flex flex-col animate-slide-in">
            
            {/* Drawer Header */}
            <div className="flex-shrink-0 flex items-center justify-between border-b-2 border-slate-100 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-[#00008A] animate-pulse" />
                <h3 className="font-extrabold text-slate-950 text-sm sm:text-base uppercase font-mono tracking-wider">
                  {selectedItem.explorerType} Details
                </h3>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-black hover:text-[#00008A] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin" data-lenis-prevent>
              
              {/* Meta details */}
              <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                <h4 className="font-extrabold text-slate-950 text-base">{selectedItem.title}</h4>
                <p className="text-xs text-black leading-relaxed font-mono font-medium">
                  {selectedItem.description || selectedItem.resolution || "Factual record retrieved from bank memory blocks."}
                </p>
              </div>

              {/* Source Incident */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-black font-extrabold tracking-wider block">Source Incident</span>
                {details.sourceIncident ? (
                  <div className="border-2 border-slate-200 bg-white p-3.5 rounded-lg flex items-start gap-3">
                    <Shield className="h-5 w-5 text-[#00008A] shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-900">INC-{details.sourceIncident.id}</span>
                        <span className="text-[10px] font-mono uppercase text-[#00008A] font-bold">{details.sourceIncident.service}</span>
                      </div>
                      <h5 className="font-bold text-slate-950 text-sm">{details.sourceIncident.title}</h5>
                      <p className="text-xs text-black font-semibold line-clamp-2 mt-1">{details.sourceIncident.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-black italic bg-slate-50 border-2 border-slate-200 p-3 rounded-lg font-mono font-semibold">
                    No explicit source incident linked directly. Consolidated across service bank.
                  </div>
                )}
              </div>

              {/* Supporting Memories */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-black font-extrabold tracking-wider block">Supporting Memories</span>
                {details.supportingMemories.length > 0 ? (
                  <div className="space-y-2">
                    {details.supportingMemories.map((mem, i) => (
                      <div key={i} className="bg-slate-50 border-2 border-slate-200 p-3 rounded-lg text-xs font-mono text-black leading-relaxed flex items-start gap-2 font-semibold">
                        <ChevronRight className="h-3.5 w-3.5 text-[#00008A] shrink-0 mt-0.5" />
                        <span>{mem}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-black italic bg-slate-50 border-2 border-slate-200 p-3 rounded-lg font-mono font-semibold">
                    No supporting context items retrieved.
                  </div>
                )}
              </div>

              {/* Related Observations */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-black font-extrabold tracking-wider block">Related Observations</span>
                {details.relatedObservations.length > 0 ? (
                  <div className="space-y-2">
                    {details.relatedObservations.map((obs, i) => (
                      <div key={i} className="border-2 border-slate-200 bg-white p-3 rounded-lg">
                        <h6 className="font-extrabold text-slate-900 text-xs font-mono">{obs.title}</h6>
                        <p className="text-[11px] text-black font-semibold font-mono mt-1 leading-snug">{obs.description}</p>
                        <div className="text-[10px] font-mono text-[#00008A] font-bold mt-1.5">Evidence count: {obs.evidence_count}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-black italic bg-slate-50 border-2 border-slate-200 p-3 rounded-lg font-mono font-semibold">
                    No linked observations detected.
                  </div>
                )}
              </div>

              {/* Confidence Score */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-black font-extrabold tracking-wider block">Confidence Score</span>
                <div className="flex items-center justify-between bg-slate-50 border-2 border-slate-200 p-4 rounded-lg">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-extrabold text-slate-950 font-mono">
                      {(details.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-black font-bold font-mono">evaluation score</span>
                  </div>
                  <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#00008A] h-full rounded-full transition-all" 
                      style={{ width: `${details.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Close CTA */}
            <div className="flex-shrink-0 pt-4 border-t-2 border-slate-100 flex justify-end mt-4">
              <button
                onClick={() => setSelectedItem(null)}
                className="btn-premium-primary px-5 py-2.5 w-full cursor-pointer"
              >
                Close Explorer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

