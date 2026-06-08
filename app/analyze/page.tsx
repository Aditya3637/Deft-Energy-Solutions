import { PublicShell } from "@/components/layout/public-shell";
import { AnalyzeFlow } from "@/components/analyze/analyze-flow";

export const metadata = {
  title: "Analyze a bill",
  description:
    "Upload an electricity bill and get an instant diagnosis with quantified savings — no signup.",
};

export default function AnalyzePage() {
  return (
    <PublicShell>
      <AnalyzeFlow />
    </PublicShell>
  );
}
