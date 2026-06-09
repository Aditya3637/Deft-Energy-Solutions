import { CheckCircle2 } from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "System status" };

const services = [
  { name: "Web application", status: "Operational", uptime: "99.98%" },
  { name: "Bill analysis engine", status: "Operational", uptime: "99.95%" },
  { name: "Notifications (email / SMS / WhatsApp)", status: "Operational", uptime: "99.92%" },
  { name: "Markets & IEX data", status: "Operational", uptime: "99.90%" },
  { name: "API", status: "Operational", uptime: "99.97%" },
];

export default function StatusPage() {
  return (
    <PublicShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">All systems operational</h1>
            <p className="text-sm text-muted-foreground">Live service status and uptime.</p>
          </div>
        </div>

        <Card className="mt-8">
          <CardContent className="divide-y p-0">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-4 px-6 py-4">
                <span className="text-sm font-medium">{s.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{s.uptime}</span>
                  <Badge variant="success">{s.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-muted-foreground">
          Demo status page — wired to real monitoring (Prometheus / uptime checks) at Stage H.
        </p>
      </section>
    </PublicShell>
  );
}
