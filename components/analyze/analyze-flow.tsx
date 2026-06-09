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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { GROUP_ORDER, bills, type ExtractedField } from "@/lib/api/bills";
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

  const start = React.useCallback(() => setStep("extracting"), []);
  const reset = React.useCallback(() => {
    setFields(sampleFields.map((f) => ({ ...f })));
    setStep("upload");
  }, [sampleFields]);

  const updateField = React.useCallback((key: string, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value, confidence: 1 } : f)),
    );
  }, []);

  // Simulated extraction; replaced by real OCR at Stage F.
  React.useEffect(() => {
    if (step !== "extracting") return;
    const t = setTimeout(() => setStep("review"), 1900);
    return () => clearTimeout(t);
  }, [step]);

  const stepIndex = step === "result" ? 2 : step === "review" ? 1 : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Analyze a bill</h1>
        <Stepper current={stepIndex as 0 | 1 | 2} />
      </div>

      {step === "upload" && <UploadStep onStart={start} />}
      {step === "extracting" && <ExtractingStep />}
      {step === "review" && (
        <ReviewStep
          fields={fields}
          onChange={updateField}
          onBack={() => setStep("upload")}
          onNext={() => setStep("result")}
        />
      )}
      {step === "result" && (
        <ResultStep fields={fields} onBack={() => setStep("review")} onReset={reset} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Upload */

function UploadStep({ onStart }: { onStart: () => void }) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

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
          onStart();
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
          onChange={() => onStart()}
        />
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>No bill handy?</span>
        <Button variant="link" className="h-auto p-0" onClick={onStart}>
          Try it with a sample bill
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Preview note: this walkthrough runs on a sample bill. Live extraction
        (digital-PDF parse, DISCOM fetch and VLM OCR with confidence scoring) lands at Stage G —
        see <code>docs/OCR-STRATEGY.md</code>.
      </p>
    </div>
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

/* ---------------------------------------------------------------- Review */

function ReviewStep({
  fields,
  onChange,
  onBack,
  onNext,
}: {
  fields: ExtractedField[];
  onChange: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const lowConfidence = fields.filter((f) => f.confidence < 0.8).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Check the extracted values</h2>
        <p className="text-sm text-muted-foreground">
          We read 42 fields.{" "}
          {lowConfidence > 0
            ? `${lowConfidence} look uncertain — they're flagged below. Correct anything that's off.`
            : "Correct anything that looks off."}
        </p>
      </div>

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
  const { toast } = useToast();
  const get = (key: string) => fields.find((f) => f.key === key)?.value ?? "";

  const onSave = async () => {
    setSaving(true);
    try {
      const r = await bills.create(fields);
      toast(
        r.saved
          ? { title: "Saved to your workspace", description: "Stored and diagnosed on the server." }
          : { title: "Saved to your workspace", description: "Demo mode — connect a backend to persist it." },
      );
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
              <Button asChild>
                <Link href="/app">
                  See it in your dashboard <ArrowRight className="h-4 w-4" />
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
