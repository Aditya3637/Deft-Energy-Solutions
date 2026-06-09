import { PublicShell } from "@/components/layout/public-shell";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <PublicShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">The agreement for using Deft Energy Solutions.</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <Section title="1. The service">
            Deft Energy analyses electricity bills and energy data to surface savings, compliance and
            reporting insights. Features vary by plan.
          </Section>
          <Section title="2. Estimates, not guarantees">
            Savings and loss figures are estimates derived from the data provided and standard methodologies.
            They are not a guarantee of realised savings. Always confirm regulatory and contractual actions
            with your DISCOM and advisors.
          </Section>
          <Section title="3. Your data & accuracy">
            You are responsible for the accuracy of the bills and details you upload. Automated extraction may
            be imperfect; you confirm extracted values before acting on them.
          </Section>
          <Section title="4. Acceptable use">
            Do not misuse the platform, attempt to breach security, or upload data you are not authorised to
            share.
          </Section>
          <Section title="5. Fees">
            Paid plans are billed per the pricing in effect. Taxes apply as per Indian law.
          </Section>
          <Section title="6. Liability">
            To the extent permitted by law, Deft Energy is not liable for indirect or consequential losses
            arising from use of the estimates or the platform.
          </Section>
          <Section title="7. Changes">
            We may update these terms; material changes will be notified. Continued use constitutes acceptance.
          </Section>
        </div>
      </article>
    </PublicShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1">{children}</p>
    </section>
  );
}
