import { PublicShell } from "@/components/layout/public-shell";
import { RoiCalculator } from "@/components/app/roi-calculator";

export const metadata = {
  title: "ROI calculator",
  description: "Estimate payback, IRR and NPV for any energy-efficiency measure — free, no signup.",
};

export default function PublicRoiPage() {
  return (
    <PublicShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">ROI calculator</h1>
          <p className="mt-3 text-muted-foreground">
            See the payback, IRR and NPV of any efficiency measure. Prefill a recommended retrofit, or enter
            your own numbers — no signup needed.
          </p>
        </div>
        <RoiCalculator />
      </section>
    </PublicShell>
  );
}
