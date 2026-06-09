import { api } from "@/lib/api";
import { PublicShell } from "@/components/layout/public-shell";
import { AnalyzeFlow } from "@/components/analyze/analyze-flow";

export const metadata = {
  title: "Analyze a bill",
  description:
    "Upload an electricity bill and get an instant diagnosis with quantified savings — no signup.",
};

export default async function AnalyzePage() {
  const sampleFields = await api.bills.sample();
  return (
    <PublicShell>
      <AnalyzeFlow sampleFields={sampleFields} />
    </PublicShell>
  );
}
