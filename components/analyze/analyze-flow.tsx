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
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SAMPLE_FIELDS,
  GROUP_ORDER,
  diagnose,
  type ExtractedField,
} from "@/lib/mock/bill";
import {
  formatRupees,
  formatRupeesCompact,
  formatUnit,
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

export function AnalyzeFlow() {
  const [step, setStep] = React.useState<Step>("upload");
  const [fields, setFields] = React.useState<ExtractedField[]>(() =>
    SAMPLE_FIELDS.map((f) => ({ ...f })),
  );

  const start = React.useCallback(() => setStep("extracting"), []);
  const reset = React.useCallback(() => {
    setFields(SAMPLE_FIELDS.map((f) => ({ ...f })));
    setStep("upload");
  }, []);

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
          PDF or photo. We read all 42 fields automatically — no signup needed.
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

const severityVariant = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
} as const;

function ResultStep({
  fields,
  onBack,
  onReset,
}: {
  fields: ExtractedField[];
  onBack: () => void;
  onReset: () => void;
}) {
  const diag = React.useMemo(() => diagnose(fields), [fields]);
  const get = (key: string) => fields.find((f) => f.key === key)?.value ?? "";

  return (
    <div className="space-y-6">
      {/* Headline */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <TrendingDown className="h-4 w-4" />
            Estimated savings
          </div>
          <div className="mt-1 text-4xl font-semibold tracking-tight">
            up to {formatRupeesCompact(diag.annualSaving)}
            <span className="text-lg font-normal text-muted-foreground"> /year</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {get("consumerName")} · {get("discom")} · {get("tariffCategory")} ·
            bill of {formatRupees(Number(get("totalAmountDue")) || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Top action */}
      {diag.top && (
        <Card>
          <CardHeader>
            <CardDescription>Start here — your single biggest win</CardDescription>
            <CardTitle className="text-lg">{diag.top.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{diag.top.detail}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-semibold text-primary">
                {formatRupeesCompact(diag.top.annualSaving)}/yr
              </span>
              <Button asChild>
                <Link href="/login">Save &amp; add to plan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All findings */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          All opportunities ({diag.findings.length})
        </h2>
        {diag.findings.map((f) => (
          <Card key={f.id}>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{f.title}</h3>
                  <Badge variant={severityVariant[f.severity]} className="capitalize">
                    {f.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{f.detail}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold text-primary">
                  {formatRupeesCompact(f.annualSaving)}
                </div>
                <div className="text-xs text-muted-foreground">per year</div>
              </div>
            </CardContent>
          </Card>
        ))}
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
          <Button asChild>
            <Link href="/login">Save this analysis</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
