import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/layouts/Layout";
import LandingPage from "@/pages/LandingPage";
import LiveIncidentFeedPage from "@/pages/LiveIncidentFeedPage";
import CommandCenterPage from "@/pages/CommandCenterPage";
import IncidentAnalysisPage from "@/pages/IncidentAnalysisPage";
import IncidentInvestigationPage from "@/pages/IncidentInvestigationPage";
import EvidenceTracePage from "@/pages/EvidenceTracePage";
import AnalysisPage from "@/pages/AnalysisPage";
import TimelinePage from "@/pages/TimelinePage";
import ObservationsPage from "@/pages/ObservationsPage";
import DemoExperiencePage from "@/pages/DemoExperiencePage";
import PredictionEnginePage from "@/pages/PredictionEnginePage";
import MemoryImpactPage from "@/pages/MemoryImpactPage";
import MemoryExplorerPage from "@/pages/MemoryExplorerPage";
import MemoryExplorerNewPage from "@/pages/MemoryExplorerNewPage";
import AgentProfilePage from "@/pages/AgentProfilePage";
import LearningEvolutionPage from "@/pages/LearningEvolutionPage";
import LearningDemoPage from "@/pages/LearningDemoPage";
import IncidentCopilotPage from "@/pages/IncidentCopilotPage";
import DetectionConsolePage from "@/pages/DetectionConsolePage";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<LiveIncidentFeedPage />} />
          <Route path="/command-center" element={<CommandCenterPage />} />
          <Route path="/investigate/:id" element={<IncidentInvestigationPage />} />
          <Route path="/trace/:id" element={<EvidenceTracePage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/incidents/:id" element={<IncidentAnalysisPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/observations" element={<ObservationsPage />} />
          <Route path="/demo" element={<DemoExperiencePage />} />
          <Route path="/prediction" element={<PredictionEnginePage />} />
          <Route path="/prediction-engine" element={<PredictionEnginePage />} />
          <Route path="/memory-impact" element={<MemoryImpactPage />} />
          <Route path="/memory" element={<MemoryExplorerPage />} />
          <Route path="/detect" element={<DetectionConsolePage />} />
          <Route path="/memory-explorer" element={<MemoryExplorerNewPage />} />
          <Route path="/agent-profile" element={<AgentProfilePage />} />
          <Route path="/learning-evolution" element={<LearningEvolutionPage />} />
          <Route path="/learning-demo" element={<LearningDemoPage />} />
          <Route path="/copilot" element={<IncidentCopilotPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
