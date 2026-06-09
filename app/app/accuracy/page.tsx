import type { ReactNode } from "react";
import { Gauge, ScanLine, ListChecks, PencilLine, Wand2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { corrections, fieldLabel, type AccuracyBucket } from "@/lib/api/corrections";

export const metadata = { title: "Extraction accuracy" };

/** Accuracy → colour band. <85 needs work, <95 watch, ≥95 good. */
function band(pct: number | null): { bar: string; text: string } {
  if (pct == null) return { bar: "bg-muted", text: "text-muted-foreground" };
  if (pct < 85) return { bar: "bg-destructive", text: "text-destructive" };
  if (pct < 95) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-success", text: "text-success" };
}

function pctLabel(pct: number | null): string {
  return pct == null ? "—" : `${pct.toFixed(1)}%`;
}

/** Labelled horizontal accuracy bar, with an optional footer line. */
function AccuracyRow({
  label,
  meta,
  pct,
  footer,
}: {
  label: string;
  meta: string;
  pct: number | null;
  footer?: ReactNode;
}) {
  const b = band(pct);
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium">{label}</span>
        <span className={`shrink-0 text-sm font-semibold tabular-nums ${b.text}`}>
          {pctLabel(pct)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${pct ?? 0}%` }} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
      </div>
      {footer ? <div className="mt-1.5">{footer}</div> : null}
    </div>
  );
}

/** "+N.N pts" lift in accuracy from applying a template (templated − untemplated). */
function lift(t: AccuracyBucket, u: AccuracyBucket): number | null {
  if (t.accuracyPct == null || u.accuracyPct == null) return null;
  return Math.round((t.accuracyPct - u.accuracyPct) * 10) / 10;
}

/** Per-DISCOM with/without-template comparison footer (only when both exist). */
function TemplateFooter({ t, u }: { t: AccuracyBucket; u: AccuracyBucket }) {
  if (t.samples === 0 || u.samples === 0) return null;
  const l = lift(t, u);
  return (
    <p className="text-xs text-muted-foreground">
      template {pctLabel(t.accuracyPct)} ({t.samples}) · without {pctLabel(u.accuracyPct)} ({u.samples})
      {l != null && (
        <span className={l >= 0 ? "ml-1 font-medium text-success" : "ml-1 font-medium text-destructive"}>
          {l >= 0 ? `+${l}` : l} pts
        </span>
      )}
    </p>
  );
}

export default async function AccuracyPage() {
  const a = await corrections.accuracy();
  const empty = a.window === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extraction accuracy"
        description="Measured from reviewed bills — every field a user corrects feeds this, per DISCOM and per field. Accuracy = 1 − corrections ÷ times the field was read."
      />

      {empty ? (
        <Card>
          <CardHeader>
            <CardTitle>No reviewed extractions yet</CardTitle>
            <CardDescription>
              As people upload or fetch bills and confirm the values on the review screen, their
              corrections are captured here — and this becomes a live, per-DISCOM accuracy view instead
              of a marketing claim.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Overall accuracy"
              value={pctLabel(a.overallAccuracyPct)}
              hint={`across ${a.fieldsSeen.toLocaleString("en-IN")} field reads`}
              icon={Gauge}
              tone={
                a.overallAccuracyPct != null && a.overallAccuracyPct < 85
                  ? "warning"
                  : "success"
              }
            />
            <StatCard label="Bills reviewed" value={a.window.toLocaleString("en-IN")} hint="recent window" icon={ScanLine} />
            <StatCard label="Fields checked" value={a.fieldsSeen.toLocaleString("en-IN")} icon={ListChecks} />
            <StatCard label="Corrections" value={a.corrections.toLocaleString("en-IN")} hint="user edits captured" icon={PencilLine} />
          </div>

          {a.templated.samples > 0 && a.untemplated.samples > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  Do per-DISCOM templates help?
                </CardTitle>
                <CardDescription>
                  Accuracy with a DISCOM template applied vs. without.{" "}
                  {(() => {
                    const l = lift(a.templated, a.untemplated);
                    return l == null ? null : (
                      <span className={l >= 0 ? "font-medium text-success" : "font-medium text-destructive"}>
                        {l >= 0 ? `+${l}` : l} pts overall
                      </span>
                    );
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                <AccuracyRow
                  label="With template"
                  meta={`${a.templated.samples} bill${a.templated.samples === 1 ? "" : "s"}`}
                  pct={a.templated.accuracyPct}
                />
                <AccuracyRow
                  label="Without template"
                  meta={`${a.untemplated.samples} bill${a.untemplated.samples === 1 ? "" : "s"}`}
                  pct={a.untemplated.accuracyPct}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Accuracy by DISCOM</CardTitle>
              <CardDescription>
                Where extraction is strong vs. where it needs per-DISCOM templates. Sorted by volume;
                template vs. without shown where both exist.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {a.byDiscom.map((d) => (
                <AccuracyRow
                  key={d.discom}
                  label={d.discom}
                  meta={`${d.samples} bill${d.samples === 1 ? "" : "s"}`}
                  pct={d.accuracyPct}
                  footer={<TemplateFooter t={d.templated} u={d.untemplated} />}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hardest fields</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Most-corrected fields first — the priority list for prompt tuning and per-DISCOM templates.</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-warning" /> &lt;95%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> &lt;85%
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {a.byField.map((f) => (
                <AccuracyRow
                  key={f.fieldKey}
                  label={fieldLabel(f.fieldKey)}
                  meta={`${f.corrected}/${f.seen} corrected`}
                  pct={f.accuracyPct}
                />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
