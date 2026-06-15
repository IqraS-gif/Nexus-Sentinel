import { FileText, CheckCircle2, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";

export interface ReportProps {
  executive_summary: string;
  root_cause_analysis: string;
  supporting_evidence: string;
  recommended_actions: string;
  risk_assessment: string;
  confidence_explanation: string;
}

export default function ReportCard({ report }: { report: ReportProps }) {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        <div className="flex items-center space-x-2.5 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-md font-bold tracking-tight text-foreground uppercase tracking-wider">
            Executive Summary
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {report.executive_summary}
        </p>
      </div>

      {/* Root Cause Analysis */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        <div className="flex items-center space-x-2.5 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="text-md font-bold tracking-tight text-foreground uppercase tracking-wider">
            Root Cause Analysis
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {report.root_cause_analysis}
        </p>
      </div>

      {/* Recommended Actions */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        <div className="flex items-center space-x-2.5 mb-4">
          <Lightbulb className="h-5 w-5 text-emerald-400" />
          <h3 className="text-md font-bold tracking-tight text-foreground uppercase tracking-wider">
            Recommended Actions
          </h3>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {report.recommended_actions}
        </div>
      </div>

      {/* Grid for Risk & Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center space-x-2.5 mb-4">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
            <h3 className="text-md font-bold tracking-tight text-foreground uppercase tracking-wider">
              Risk Assessment
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {report.risk_assessment}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center space-x-2.5 mb-4">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            <h3 className="text-md font-bold tracking-tight text-foreground uppercase tracking-wider">
              Confidence Explanation
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {report.confidence_explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
