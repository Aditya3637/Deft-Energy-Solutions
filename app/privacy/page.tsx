import { PublicShell } from "@/components/layout/public-shell";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <PublicShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aligned with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023.
        </p>

        <div className="prose-sm mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <Section title="What we collect">
            Bills and meter data you upload, building and equipment details you add, and account information
            (name, work email, organisation). We collect only what we need to analyse your energy use.
          </Section>
          <Section title="How we use it">
            To extract bill fields, run the loss-analysis engine, and produce savings and compliance insights
            for you. We process personal data only for these stated purposes (purpose limitation).
          </Section>
          <Section title="Consent">
            We process your data on the basis of your consent, given at signup and per data type. You can
            withdraw consent at any time from Settings; we stop the corresponding processing.
          </Section>
          <Section title="Your rights">
            You may access, correct, or erase your data, and raise a grievance — handled within 15 days. A
            self-service data portal lets you download or delete your data.
          </Section>
          <Section title="Retention">
            Bills are retained for 7 years (audit trail); interval data for 3 years; personal data until you
            withdraw consent or close the account.
          </Section>
          <Section title="Security & localisation">
            Data is encrypted in transit and at rest, isolated per organisation, and stored in Indian regions.
            Breaches are notified to the Data Protection Board and affected users within 72 hours.
          </Section>
          <Section title="Contact">
            Data protection queries: privacy@deftenergy.example. (Placeholder for the launch entity / DPO.)
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
