const API_BASE = "http://localhost:8000";

export async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Incidents
  getIncidents: () => request("/api/v1/incidents/"),
  getIncident: (id: number) => request(`/api/v1/incidents/${id}`),
  createIncident: (payload: { title: string; description: string; service: string; severity: string }) =>
    request("/api/v1/incidents/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resolveIncident: (id: number, resolution: string) =>
    request(`/api/v1/incidents/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution }),
    }),

  // Memory Status & Seeding
  getMemoryStatus: () => request("/api/v1/memory/status"),
  seedMemory: () => request("/api/v1/memory/seed", { method: "POST" }),
  retainIncident: (id: number) => request(`/api/v1/memory/retain/${id}`, { method: "POST" }),

  // Recall / Similarity & Reflections
  getSimilarIncidents: (id: number) => request(`/api/v1/incidents/${id}/similar`, { method: "POST" }),
  analyzeIncident: (id: number) => request(`/api/v1/incidents/${id}/analyze`, { method: "POST" }),
  getIncidentReport: (id: number) => request(`/api/v1/incidents/${id}/report`, { method: "POST" }),

  // Observations
  getObservations: (service?: string) =>
    request(service ? `/api/v1/observations/${service}` : "/api/v1/observations/"),
  generateObservations: () => request("/api/v1/observations/generate", { method: "POST" }),

  // Timeline
  getTimeline: (service?: string) =>
    request(service ? `/api/v1/timeline/${service}` : "/api/v1/timeline/"),

  // Copilot
  copilotQuery: (question: string, service?: string) =>
    request("/api/v1/copilot/query", {
      method: "POST",
      body: JSON.stringify({ question, service }),
    }),
  directChat: (system_prompt: string, user_message: string) =>
    request("/api/v1/copilot/direct-chat", {
      method: "POST",
      body: JSON.stringify({ system_prompt, user_message }),
    }),

  // Predictions
  getPredictions: () => request("/api/v1/predictions/"),

  // Detection Intelligence Engine
  detection: {
    getKbStatus: () => request("/api/v1/detection/status-kb"),
    seedKb: () => request("/api/v1/detection/seed-kb", { method: "POST" }),
    getGithubFeed: (limit = 10) => request(`/api/v1/detection/github?limit=${limit}`),
    getLiveStatus: (limit = 15) => request(`/api/v1/detection/live-status?limit=${limit}`),
    analyze: (input: string, source_meta?: Record<string, unknown>) =>
      request("/api/v1/detection/analyze", {
        method: "POST",
        body: JSON.stringify({ input, source_meta }),
      }),
  },
};

