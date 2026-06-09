"use client";

import * as React from "react";
import Link from "next/link";
import {
  UploadCloud,
  Camera,
  FileText,
  ArrowRight,
  ArrowLeft,
  TrendingDown,
  Sparkles,
  RotateCcw,
  ChevronDown,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  Search,
  ListChecks,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { GROUP_ORDER, bills, type ExtractedField, type PlanLimit } from "@/lib/api/bills";
import { UpgradePrompt } from "@/components/app/upgrade-prompt";
import { tasks } from "@/lib/api/tasks";
import { extract } from "@/lib/api/extract";
import { billfetch, type Biller } from "@/lib/api/billfetch";
import { corrections } from "@/lib/api/corrections";
import { arithmeticChecks, type BillCheck } from "@/lib/bill-checks";
import { useToast } from "@/components/ui/toast";
import { fullDiagnose } from "@/lib/diagnosis";
import { TOTAL_CHECKS, CATEGORIES, DATA_NEED_LABELS } from "@/lib/loss-taxonomy";
import {
  formatRupees,
  formatRupeesCompact,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Stepper } from "@/components/analyze/stepper";

type Step = "upload" | "extracting" | "review" | "result";

const EXTRACT_MESSAGES = [
  "Reading meter and consumer details…",
  "Extracting tariff, demand and energy…",
  "Checking power factor and time-of-day…",
];

export function AnalyzeFlow({ sampleFields }: { sampleFields: ExtractedField[] }) {
  const [step, setStep] = React.useState<Step>("upload");
  const [fields, setFields] = React.useState<ExtractedField[]>(() =>
    sampleFields.map((f) => ({ ...f })),
  );
  // Set when extraction fell back to the sample (no backend / unreadable file).
  const [notice, setNotice] = React.useState<string | null>(null);
  // Pristine extracted values + context, for the corrections-capture loop.
  const origin = React.useRef<{
    originalFields: ExtractedField[];
    provider: string;
    model: string;
    source: string;
    templateApplied: string;
  } | null>(null);

  // Stage G: upload the chosen file to the real extraction endpoint. A null
  // file ("try the sample") and any backend failure both fall back to the
  // sample bill, so the walkthrough always completes.
  const runExtract = React.useCallback(
    async (file: File | null, discomHint?: string) => {
      setStep("extracting");
      const out = await extract.fromFile(file, discomHint);
      setFields(out.fields.map((f) => ({ ...f })));
      origin.current = {
        originalFields: out.fields.map((f) => ({ ...f })),
        provider: out.live ? out.provider ?? "unknown" : "sample",
        model: out.model ?? "",
        source: out.live ? out.source ?? "vision" : "sample",
        templateApplied: out.templateApplied ?? "",
      };
      const tmpl = out.live && out.templateApplied ? ` ${out.templateApplied} template applied.` : "";
      setNotice(
        !out.live
          ? out.note ?? null
          : out.source === "pdf-text"
            ? `Read directly from the PDF's text layer — no OCR needed.${tmpl}`
            : tmpl.trim() || null,
      );
      setStep("review");
    },
    [],
  );

  // BBPS / DISCOM-portal fetch (Stage G). Lands on the same review screen; the
  // panel handles its own loading/errors and only calls this on success.
  const onFetched = React.useCallback(
    (fetched: ExtractedField[], note: string, ctx?: { provider: string; source: string }) => {
      setFields(fetched.map((f) => ({ ...f })));
      origin.current = {
        originalFields: fetched.map((f) => ({ ...f })),
        provider: ctx?.provider ?? "bbps",
        model: "",
        source: ctx?.source ?? "bbps-demo",
        templateApplied: "",
      };
      setNotice(note);
      setStep("review");
    },
    [],
  );

  const reset = React.useCallback(() => {
    setFields(sampleFields.map((f) => ({ ...f })));
    setNotice(null);
    origin.current = null;
    setStep("upload");
  }, [sampleFields]);

  const updateField = React.useCallback((key: string, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value, confidence: 1 } : f)),
    );
  }, []);

  // Review → result: log how the user corrected the extraction (training data
  // + accuracy signal). Fire-and-forget; never blocks. Skipped for the sample.
  const goToResult = React.useCallback(() => {
    const o = origin.current;
    if (o && o.source !== "sample") {
      const norm = (s: string) => s.replace(/[₹,\s]/g, "").trim().toLowerCase();
      const byKey = new Map(fields.map((f) => [f.key, f.value]));
      const items = o.originalFields
        .map((of) => {
          const final = byKey.get(of.key) ?? "";
          return {
            fieldKey: of.key,
            extracted: of.value,
            extractedConfidence: of.confidence,
            final,
            corrected: norm(of.value) !== norm(final),
          };
        })
        .filter((it) => it.extracted !== "" || it.final !== "");
      void corrections.submit({
        provider: o.provider,
        model: o.model,
        source: o.source,
        discom: fields.find((f) => f.key === "discom")?.value?.trim() || undefined,
        templateApplied: o.templateApplied || undefined,
        fieldsTotal: o.originalFields.length,
        fieldsFound: o.originalFields.filter((f) => f.value.trim() !== "").length,
        corrections: items,
      });
    }
    setStep("result");
  }, [fields]);

  const stepIndex = step === "result" ? 2 : step === "review" ? 1 : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Analyze a bill</h1>
        <Stepper current={stepIndex as 0 | 1 | 2} />
      </div>

      {step === "upload" && (
        <div className="space-y-6">
          <UploadStep onPick={runExtract} />
          <FetchPanel onFetched={onFetched} />
        </div>
      )}
      {step === "extracting" && <ExtractingStep />}
      {step === "review" && (
        <ReviewStep
          fields={fields}
          notice={notice}
          onChange={updateField}
          onBack={() => setStep("upload")}
          onNext={goToResult}
        />
      )}
      {step === "result" && (
        <ResultStep fields={fields} onBack={() => setStep("review")} onReset={reset} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Upload */

function UploadStep({
  onPick,
}: {
  onPick: (file: File | null, discomHint?: string) => void;
}) {
  const [dragging, setDragging] = React.useState(false);
  const [hint, setHint] = React.useState("");
  const [billers, setBillers] = React.useState<Biller[] | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pick = (file: File | null) => onPick(file, hint || undefined);

  React.useEffect(() => {
    let alive = true;
    billfetch.billers().then((r) => alive && setBillers(r.billers));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold">Drop your electricity bill here</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          PDF or photo. We extract the 42 fields, flag anything uncertain for you to
          confirm, and never need a signup to show you the result.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => inputRef.current?.click()}>
            <FileText className="h-4 w-4" /> Browse files
          </Button>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <Camera className="h-4 w-4" /> Take a photo
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          capture="environment"
          className="sr-only"
          aria-label="Upload a bill"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <Label htmlFor="hint-discom" className="text-xs text-muted-foreground">
          Electricity board (optional — improves accuracy)
        </Label>
        <select
          id="hint-discom"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Auto-detect</option>
          {billers?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.discom}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>No bill handy?</span>
        <Button variant="link" className="h-auto p-0" onClick={() => onPick(null)}>
          Try it with a sample bill
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Upload a real bill (PDF or photo) and we read it with vision OCR, scoring
        each field&rsquo;s confidence so you only confirm what&rsquo;s uncertain. No live
        backend? We fall back to a sample bill — see <code>docs/OCR-STRATEGY.md</code>.
      </p>
    </div>
  );
}

/* ------------------------------------------------------- Fetch (BBPS) */

function FetchPanel({
  onFetched,
}: {
  onFetched: (
    fields: ExtractedField[],
    note: string,
    ctx?: { provider: string; source: string },
  ) => void;
}) {
  const [billers, setBillers] = React.useState<Biller[] | null>(null);
  const [billerId, setBillerId] = React.useState("");
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    billfetch.billers().then((r) => {
      if (!alive) return;
      setBillers(r.billers);
      if (r.billers[0]) setBillerId(r.billers[0].id);
    });
    return () => {
      alive = false;
    };
  }, []);

  const biller = billers?.find((b) => b.id === billerId);
  const canSubmit =
    !!biller && biller.params.every((p) => (values[p.name] ?? "").trim().length > 0);

  const submit = async () => {
    if (!biller || loading) return;
    setLoading(true);
    setError(null);
    const out = await billfetch.fetch(biller.id, values);
    setLoading(false);
    if (out.ok) onFetched(out.fields, out.note, { provider: out.provider, source: out.source });
    else setError(out.note);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-primary" />
          Or fetch it from your provider
        </CardTitle>
        <CardDescription>
          Pull the latest bill summary by consumer number via BBPS — no upload needed. Best for a quick
          check; upload the full bill for the complete 58-check diagnosis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="discom" className="text-muted-foreground">
              Electricity board (DISCOM)
            </Label>
            <select
              id="discom"
              value={billerId}
              onChange={(e) => {
                setBillerId(e.target.value);
                setValues({});
                setError(null);
              }}
              disabled={!billers}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {!billers && <option>Loading…</option>}
              {billers?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.discom} — {b.state}
                </option>
              ))}
            </select>
          </div>

          {biller?.params.map((p) => (
            <div key={p.name} className="space-y-1.5">
              <Label htmlFor={p.name} className="text-muted-foreground">
                {p.label}
              </Label>
              <Input
                id={p.name}
                inputMode="numeric"
                placeholder={p.placeholder}
                value={values[p.name] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [p.name]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="text-muted-foreground">{error}</span>
          </div>
        )}

        <Button onClick={submit} disabled={!canSubmit || loading}>
          <Search className="h-4 w-4" />
          {loading ? "Fetching…" : "Fetch my bill"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------ Extracting */

function ExtractingStep() {
  const [msg, setMsg] = React.useState(0);
  React.useEffect(() => {
    const i = setInterval(
      () => setMsg((m) => (m + 1) % EXTRACT_MESSAGES.length),
      650,
    );
    return () => clearInterval(i);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Reading your bill…
        </CardTitle>
        <CardDescription aria-live="polite">{EXTRACT_MESSAGES[msg]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------- Sanity checks */

function SanityChecks({ checks }: { checks: BillCheck[] }) {
  if (checks.length === 0) return null;
  const warn = checks.filter((c) => c.status === "warn");
  const info = checks.filter((c) => c.status === "info");
  const okCount = checks.filter((c) => c.status === "ok").length;

  const flagged: BillCheck[] = [...warn, ...info];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {warn.length > 0 ? (
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          )}
          Quick checks
        </CardTitle>
        <CardDescription>
          {warn.length > 0
            ? `${warn.length} value${warn.length > 1 ? "s" : ""} to double-check before continuing.`
            : "The numbers on this bill add up."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {flagged.map((c) => {
          const isWarn = c.status === "warn";
          return (
            <div
              key={c.id}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
                isWarn
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-border bg-muted/40",
              )}
            >
              {isWarn ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <span className="font-medium">{c.label}.</span>{" "}
                <span className="text-muted-foreground">{c.detail}</span>
              </div>
            </div>
          );
        })}
        {okCount > 0 && (
          <p className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            {okCount} consistency check{okCount > 1 ? "s" : ""} passed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------------- Review */

function ReviewStep({
  fields,
  notice,
  onChange,
  onBack,
  onNext,
}: {
  fields: ExtractedField[];
  notice: string | null;
  onChange: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const filled = fields.filter((f) => f.value.trim().length > 0);
  const lowConfidence = filled.filter((f) => f.confidence < 0.8).length;
  const missing = fields.length - filled.length;
  // Re-runs on every edit (fields is state) — live data-quality feedback.
  const checks = React.useMemo(() => arithmeticChecks(fields), [fields]);

  return (
    <div className="space-y-6">
      {notice && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {notice}
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold">Check the extracted values</h2>
        <p className="text-sm text-muted-foreground">
          We read {filled.length} of {fields.length} fields.{" "}
          {lowConfidence > 0
            ? `${lowConfidence} look uncertain — they're flagged below. `
            : ""}
          {missing > 0
            ? `${missing} weren't found — fill any that apply. `
            : ""}
          Correct anything that looks off.
        </p>
      </div>

      <SanityChecks checks={checks} />

      {GROUP_ORDER.map((group) => {
        const groupFields = fields.filter((f) => f.group === group);
        if (groupFields.length === 0) return null;
        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-base">{group}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {groupFields.map((f) => {
                const flagged = f.confidence < 0.8;
                return (
                  <div key={f.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={f.key} className="text-muted-foreground">
                        {f.label}
                        {f.unit ? (
                          <span className="ml-1 text-xs">({f.unit})</span>
                        ) : null}
                      </Label>
                      {flagged && (
                        <Badge variant="warning" className="text-[10px]">
                          Check
                        </Badge>
                      )}
                    </div>
                    <Input
                      id={f.key}
                      value={f.value}
                      aria-invalid={flagged || undefined}
                      onChange={(e) => onChange(f.key, e.target.value)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          See my savings <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Result */

function ResultStep({
  fields,
  onBack,
  onReset,
}: {
  fields: ExtractedField[];
  onBack: () => void;
  onReset: () => void;
}) {
  const diag = React.useMemo(() => fullDiagnose(fields), [fields]);
  const [showAll, setShowAll] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [taskAdded, setTaskAdded] = React.useState(false);
  const [limit, setLimit] = React.useState<PlanLimit | null>(null);
  const { toast } = useToast();
  const get = (key: string) => fields.find((f) => f.key === key)?.value ?? "";

  // "Act on it" — turn the top recoverable finding into a real task.
  const onAddTask = async () => {
    const top = diag.top[0];
    if (!top || taskAdded) return;
    setTaskAdded(true);
    const r = await tasks.create({
      title: top.check.name,
      building: get("consumerName") || get("discom") || "Portfolio",
      savingsInr: top.annualINR,
      priority: "HIGH",
      source: "DIAGNOSIS",
    });
    toast(
      r.created
        ? { title: "Added to your tasks", description: "Find it under Tasks." }
        : { title: "Added to your tasks", description: "Demo mode — connect a backend to persist it." },
    );
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const r = await bills.create(fields);
      if (r.limitReached) {
        setLimit(r.limit ?? {});
        toast({ title: "Plan limit reached", description: r.limit?.reason ?? "Upgrade to save more bills." });
      } else {
        setLimit(null);
        toast(
          r.saved
            ? { title: "Saved to your workspace", description: "Stored and diagnosed on the server." }
            : { title: "Saved to your workspace", description: "Demo mode — connect a backend to persist it." },
        );
      }
    } catch {
      toast({ title: "Couldn't save", description: "The backend isn't reachable right now." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Headline — what you're overpaying NOW (recoverable) */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <TrendingDown className="h-4 w-4" />
            You&apos;re overpaying about
          </div>
          <div className="mt-1 text-4xl font-semibold tracking-tight">
            {formatRupeesCompact(diag.recoverableINR)}
            <span className="text-lg font-normal text-muted-foreground"> /year</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {get("consumerName")} · {get("discom")} ·{" "}
            bill of {formatRupees(Number(get("totalAmountDue")) || 0)}
          </p>
          {diag.opportunityINR > 0 && (
            <p className="mt-2 text-sm font-medium text-foreground">
              + up to {formatRupeesCompact(diag.opportunityINR)}/yr from bigger moves (open access, solar…)
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            We ran all {TOTAL_CHECKS} loss checks on this bill —{" "}
            <span className="font-medium text-foreground">{diag.recoverable.length} you can recover now</span>,{" "}
            {diag.opportunities.length} bigger moves, {diag.counts.needsData} need more data,{" "}
            {diag.counts.healthy} clear.
          </p>
        </CardContent>
      </Card>

      {/* Top fix */}
      {diag.top[0] && (
        <Card>
          <CardHeader>
            <CardDescription>Start here — your single biggest recoverable loss</CardDescription>
            <CardTitle className="text-lg">{diag.top[0].check.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {diag.top[0].note ? (
              <p className="text-sm text-muted-foreground">{diag.top[0].note}.</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-semibold text-primary">
                {formatRupeesCompact(diag.top[0].annualINR ?? 0)}/yr
              </span>
              <Button onClick={onAddTask} disabled={taskAdded}>
                {taskAdded ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Added to tasks
                  </>
                ) : (
                  <>
                    <ListChecks className="h-4 w-4" /> Add to my tasks
                  </>
                )}
              </Button>
              <Button asChild variant="outline">
                <Link href="/app/tasks">
                  View tasks <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recoverable — money leaking now, plain ₹ list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What you can recover ({diag.recoverable.length})
        </h2>
        {diag.recoverable.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 pt-6 text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-success" />
              No billing leaks found from this bill — your charges look clean.
            </CardContent>
          </Card>
        ) : (
          diag.recoverable.map((r) => (
            <Card key={r.check.id}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <h3 className="font-medium">{r.check.name}</h3>
                  {r.note ? <p className="mt-1 text-sm text-muted-foreground">{r.note}</p> : null}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold text-primary">{formatRupeesCompact(r.annualINR ?? 0)}</div>
                  <div className="text-xs text-muted-foreground">per year</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bigger moves — opportunities that need a decision (progressive asks) */}
      {diag.opportunities.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Bigger moves
          </h2>
          {diag.opportunities.map((r) => (
            <Card key={r.check.id}>
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium">{r.check.name}</h3>
                  {r.note ? <p className="mt-1 text-sm text-muted-foreground">{r.note}</p> : null}
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <div className="font-semibold text-primary">~{formatRupeesCompact(r.annualINR ?? 0)}/yr</div>
                    <div className="text-xs text-muted-foreground">potential</div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/app/markets">Explore</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unlock more — what data is missing */}
      {diag.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Unlock more savings
            </CardTitle>
            <CardDescription>
              {diag.counts.needsData} checks need more than a single bill. Add data to estimate them.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {diag.gaps.map((g) => (
              <div key={g.need} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm">Add {g.label}</span>
                <Badge variant="secondary">+{g.checks.length} checks</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conversion — let us recover it for you (the paid / managed funnel) */}
      {diag.recoverableINR > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Want us to recover this for you?</h3>
              <p className="text-sm text-muted-foreground">
                Our team files the corrections, tracks the savings, and only succeeds when you do.
              </p>
            </div>
            <Button asChild>
              <Link href="/login">Talk to an advisor</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All 58 checks — technicalities, hidden by default */}
      <div>
        <Button
          variant="ghost"
          className="w-full justify-between"
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
        >
          <span>{showAll ? "Hide" : "Show"} all {TOTAL_CHECKS} checks</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showAll && "rotate-180")} />
        </Button>
        {showAll && (
          <div className="mt-3 space-y-4">
            {CATEGORIES.map((cat) => {
              const rows = diag.results.filter((r) => r.check.category === cat.n);
              return (
                <Card key={cat.n}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{cat.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y py-0">
                    {rows.map((r) => (
                      <div key={r.check.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className={cn(r.status === "needs_data" && "text-muted-foreground")}>
                          {r.check.name}
                        </span>
                        <span className="shrink-0 text-right text-xs">
                          {r.status === "loss" ? (
                            <span className="font-semibold text-primary">
                              {formatRupeesCompact(r.annualINR ?? 0)}/yr
                            </span>
                          ) : r.status === "healthy" ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Needs {r.check.needs[0] ? DATA_NEED_LABELS[r.check.needs[0]] : "data"}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {limit && <UpgradePrompt limit={limit} onDismiss={() => setLimit(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Edit values
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4" /> Analyze another
          </Button>
          <Button variant="outline" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save to workspace"}
          </Button>
          <Button asChild>
            <Link href="/app">
              Open your dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
