import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Developers" };

const endpoints = [
  { method: "POST", path: "/v1/bills", desc: "Submit a bill for extraction & analysis" },
  { method: "GET", path: "/v1/bills/{id}", desc: "Fetch a bill, its 42 fields and diagnosis" },
  { method: "GET", path: "/v1/buildings", desc: "List buildings in the organisation" },
  { method: "GET", path: "/v1/diagnosis/{billId}", desc: "Run the 58-check loss analysis" },
  { method: "POST", path: "/v1/webhooks", desc: "Register an alert / event webhook" },
];

const methodVariant = { POST: "default", GET: "secondary" } as const;

export default function DevelopersPage() {
  return (
    <PublicShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Developer API</h1>
        <p className="mt-3 text-muted-foreground">
          A REST API to submit bills, read the 42 extracted fields, and pull the loss diagnosis. Authenticate
          with a bearer token; all responses are JSON.
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Authentication</CardTitle>
            <CardDescription>Send your API key as a bearer token.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
{`curl https://api.deftenergy.example/v1/buildings \\
  -H "Authorization: Bearer $DEFT_API_KEY"`}
            </pre>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {endpoints.map((e) => (
              <div key={e.path} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Badge variant={methodVariant[e.method as "POST" | "GET"]} className="w-14 justify-center">{e.method}</Badge>
                <code className="text-sm">{e.path}</code>
                <span className="ml-auto hidden text-xs text-muted-foreground sm:block">{e.desc}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-muted-foreground">
          Demo reference — the live API and full OpenAPI spec ship with the backend at Stage F.
        </p>
      </section>
    </PublicShell>
  );
}
